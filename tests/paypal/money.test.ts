import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { toSnapshot, type RawDispute } from "../../src/lib/paypal/disputes";
import { computeCaseMoney, fetchCaseMoney, moneyMayBeStated, sellerFundMovements } from "../../src/lib/paypal/money";
import { getCapture, type Capture } from "../../src/lib/paypal/orders";
import { mockPayPal } from "./helpers";

afterEach(() => vi.unstubAllGlobals());

// Real resolved chargeback (PP-R-ADC-10194432, $12.00): HOLD_PLACED $11.20, then HOLD_RELEASED $11.20.
const raw = JSON.parse(readFileSync(join(__dirname, "fixtures/snad-resolved-with-payout.json"), "utf8")) as RawDispute;
const resolved = toSnapshot(raw);
const fm = (raw as unknown as { fund_movements: Record<string, unknown>[] }).fund_movements;
const usd = (value: string) => ({ currency_code: "USD", value });
const capture = (over: Partial<Capture> = {}): Capture => ({
  id: "2UN05916MP311444Y",
  status: "COMPLETED",
  amount: usd("12.00"),
  sellerReceivable: { gross: usd("12.00"), fee: usd("0.80"), net: usd("11.20") },
  ...over,
});
const AT = "2026-10-25T12:00:00.000Z";
const withRaw = (patch: Record<string, unknown>) => toSnapshot({ ...raw, ...patch } as RawDispute);

describe("computeCaseMoney", () => {
  it("resolved with payout: hold placed and released → seller keeps the net", () => {
    expect(computeCaseMoney(resolved, capture(), AT)).toEqual({
      gross: usd("12.00"),
      fee: usd("0.80"),
      net: usd("11.20"),
      kept: usd("11.20"),
      source: "paypal_fund_movements",
      at: AT,
      captureId: "2UN05916MP311444Y",
      movements: [
        { type: "DEBIT", reason: "HOLD_PLACED", amount: usd("11.20"), at: "2026-10-25T02:36:34.000Z" },
        { type: "CREDIT", reason: "HOLD_RELEASED", amount: usd("11.20"), at: "2026-10-25T02:48:04.000Z" },
      ],
    });
  });

  it("a hold that is never released comes off what the seller keeps", () => {
    const s = withRaw({ fund_movements: [fm[0]] });
    expect(computeCaseMoney(s, capture(), AT)?.kept).toEqual(usd("0.00"));
  });

  it("ignores the buyer's movements", () => {
    const s = withRaw({ fund_movements: [...fm, { party: "PAYER", type: "CREDIT", amount: usd("12.00"), initiated_time: "2026-10-25T02:50:00.000Z" }] });
    expect(computeCaseMoney(s, capture(), AT)?.kept).toEqual(usd("11.20"));
  });

  it.each([
    ["the dispute isn't resolved", withRaw({ status: "UNDER_REVIEW" }), capture()],
    ["PayPal lists no fund movements", withRaw({ fund_movements: undefined }), capture()],
    ["only the buyer has movements", withRaw({ fund_movements: [{ party: "PAYER", type: "CREDIT", amount: usd("12.00") }] }), capture()],
    ["a movement type is unknown", withRaw({ fund_movements: [{ party: "RECEIVER", type: "ADJUSTMENT", amount: usd("1.00") }] }), capture()],
    ["the capture has no fee breakdown", resolved, capture({ sellerReceivable: undefined })],
    ["the capture was refunded", resolved, capture({ status: "PARTIALLY_REFUNDED" })],
    ["the capture isn't the disputed one", resolved, capture({ id: "OTHER" })],
    ["currencies differ", resolved, capture({ sellerReceivable: { gross: usd("12.00"), fee: usd("0.80"), net: { currency_code: "EUR", value: "11.20" } } })],
    ["gross − fee ≠ net", resolved, capture({ sellerReceivable: { gross: usd("12.00"), fee: usd("0.80"), net: usd("11.00") } })],
    ["the capture couldn't be read", resolved, null],
  ])("null when %s", (_why, snap, cap) => {
    expect(computeCaseMoney(snap, cap, AT)).toBeNull();
  });

  it("sellerFundMovements / moneyMayBeStated", () => {
    expect(sellerFundMovements({})).toBeNull();
    expect(sellerFundMovements(null)).toBeNull();
    expect(moneyMayBeStated(resolved)).toBe(true);
    expect(moneyMayBeStated(withRaw({ status: "UNDER_REVIEW" }))).toBe(false);
    expect(moneyMayBeStated(withRaw({ fund_movements: [] }))).toBe(false);
  });
});

describe("fetchCaseMoney", () => {
  it("reads the capture's seller_receivable_breakdown", async () => {
    const { calls } = mockPayPal((c) =>
      c.path === "/v2/payments/captures/2UN05916MP311444Y"
        ? {
            json: {
              id: "2UN05916MP311444Y",
              status: "COMPLETED",
              amount: usd("12.00"),
              seller_receivable_breakdown: { gross_amount: usd("12.00"), paypal_fee: usd("0.80"), net_amount: usd("11.20") },
            },
          }
        : undefined,
    );
    expect((await getCapture("2UN05916MP311444Y")).sellerReceivable).toEqual({ gross: usd("12.00"), fee: usd("0.80"), net: usd("11.20") });
    const m = await fetchCaseMoney(resolved);
    expect(m).toMatchObject({ gross: usd("12.00"), fee: usd("0.80"), net: usd("11.20"), kept: usd("11.20"), source: "paypal_fund_movements" });
    expect(Date.parse(m!.at)).not.toBeNaN();
    expect(calls).toHaveLength(2);
  });

  it("makes no PayPal call when the dispute states no movements", async () => {
    const { calls } = mockPayPal(() => undefined);
    expect(await fetchCaseMoney(withRaw({ fund_movements: undefined }))).toBeNull();
    expect(calls).toHaveLength(0);
  });
});
