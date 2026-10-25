import { afterEach, describe, expect, it, vi } from "vitest";
import { openTestDispute } from "../../src/lib/paypal/testDispute";
import { mockPayPal } from "./helpers";

afterEach(() => vi.unstubAllGlobals());

describe("openTestDispute (demo-prep overrides)", () => {
  it("one fixed item, free shipping, Mastercard 4853: order and chargeback carry exactly $412.00", async () => {
    const { calls } = mockPayPal((c) => {
      if (c.path === "/v2/checkout/orders")
        return {
          json: {
            id: "ORD1",
            status: "COMPLETED",
            purchase_units: [{ payee: { merchant_id: "M1" }, payments: { captures: [{ id: "CAP1", status: "COMPLETED", amount: { currency_code: "USD", value: "412.00" } }] } }],
          },
        };
      if (c.path === "/v1/shipping/trackers-batch") return { json: { tracker_identifiers: [{ transaction_id: "CAP1" }] } };
      if (c.path === "/v2/customer-support/process-chargeback") return { json: { dispute_id: "PP-R-OLY-1" } };
    });
    const r = await openTestDispute({
      scenario: "not_as_described",
      items: [{ name: "Olympus OM-1n body, chrome", quantity: 1, unitAmount: { currency_code: "USD", value: "412.00" } }],
      shippingFee: null,
      reasonCode: "4853",
      cardBrand: "MASTERCARD",
      shopName: "Northlight Camera Exchange",
    });
    expect(r).toMatchObject({ disputeId: "PP-R-OLY-1", captureId: "CAP1", amount: { value: "412.00" }, reasonCode: "4853" });
    expect(r.order.items).toEqual([{ name: "Olympus OM-1n body, chrome", quantity: 1, unitAmount: { currency_code: "USD", value: "412.00" } }]);

    const pu = JSON.parse(calls.find((c) => c.path === "/v2/checkout/orders")!.body as string).purchase_units[0];
    expect(pu.amount).toEqual({ currency_code: "USD", value: "412.00", breakdown: { item_total: { currency_code: "USD", value: "412.00" } } });
    expect(pu.items).toHaveLength(1);
    expect(pu.description).toMatch(/^Northlight Camera Exchange order NOR-/);

    const cb = JSON.parse(calls.find((c) => c.path === "/v2/customer-support/process-chargeback")!.body as string);
    expect(cb.instrument.card_brand).toBe("MASTERCARD");
    expect(cb.dispute.processor_info.reason_code).toBe("4853");
    expect(cb.dispute.amount).toEqual({ currency_code: "USD", value: "412.00" });

    const tr = JSON.parse(calls.find((c) => c.path === "/v1/shipping/trackers-batch")!.body as string);
    expect(tr.trackers[0]).toMatchObject({ transaction_id: "CAP1", carrier: "USPS", status: "DELIVERED" });
  });
});
