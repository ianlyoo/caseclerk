import { afterEach, describe, expect, it, vi } from "vitest";
import { NotEnabledError, PayPalError, paypalFetch } from "../../src/lib/paypal/client";
import { searchTransactions } from "../../src/lib/paypal/transactions";
import { mockPayPal } from "./helpers";

afterEach(() => vi.unstubAllGlobals());

describe("paypalFetch", () => {
  it("returns status, debug id and json", async () => {
    mockPayPal(() => ({ json: { ok: 1 } }));
    const r = await paypalFetch("/v1/x");
    expect(r).toEqual({ status: 200, debugId: "dbg-1", json: { ok: 1 } });
  });

  it("retries 5xx and 429, then succeeds", async () => {
    let n = 0;
    const { calls } = mockPayPal(() => (++n === 1 ? { status: 503 } : n === 2 ? { status: 429, headers: { "retry-after": "0" } } : { json: { ok: true } }));
    const r = await paypalFetch("/v1/x");
    expect(r.json).toEqual({ ok: true });
    expect(calls).toHaveLength(3);
  });

  it("throws PayPalError with status, debug id and issue after retries run out", async () => {
    const { calls } = mockPayPal(() => ({ status: 500, json: { name: "INTERNAL_SERVER_ERROR" } }));
    const err = await paypalFetch("/v1/x").catch((e) => e);
    expect(err).toBeInstanceOf(PayPalError);
    expect(err.status).toBe(500);
    expect(err.debugId).toBe("dbg-4");
    expect(calls).toHaveLength(4);
  });

  it("does not retry a 422 and exposes the issue", async () => {
    const { calls } = mockPayPal(() => ({
      status: 422,
      json: { name: "UNPROCESSABLE_ENTITY", debug_id: "abc", details: [{ issue: "ACTION_NOT_ALLOWED_IN_CURRENT_DISPUTE_STATE" }] },
    }));
    const err: PayPalError = await paypalFetch("/v1/x", { method: "POST", body: "{}", retryOn400: true }).catch((e) => e);
    expect(err.status).toBe(422);
    expect(err.issue).toBe("ACTION_NOT_ALLOWED_IN_CURRENT_DISPUTE_STATE");
    expect(err.message).toContain("debug_id dbg-1");
    expect(calls).toHaveLength(1);
  });

  it("retries the sandbox's spurious 400 only when asked", async () => {
    let n = 0;
    const { calls } = mockPayPal(() => (++n === 1 ? { status: 400, json: { name: "INVALID_REQUEST", details: [{ issue: "MISSING_OR_INVALID_REQUEST_BODY" }] } } : { json: {} }));
    await paypalFetch("/v1/customer/disputes/X/adjudicate", { method: "POST", body: "{}", retryOn400: true });
    expect(calls).toHaveLength(2);

    n = 0;
    const m = mockPayPal(() => (++n === 1 ? { status: 400, json: { name: "INVALID_REQUEST" } } : { json: {} }));
    await expect(paypalFetch("/v1/x", { method: "POST", body: "{}" })).rejects.toMatchObject({ status: 400, errorName: "INVALID_REQUEST" });
    expect(m.calls).toHaveLength(1);
  });

  it("refreshes the token once on 401", async () => {
    let n = 0;
    const { calls } = mockPayPal(() => (++n === 1 ? { status: 401 } : { json: { ok: 1 } }));
    expect((await paypalFetch("/v1/x")).json).toEqual({ ok: 1 });
    expect(calls).toHaveLength(2);
  });

  it("sets JSON content type and PayPal-Request-Id", async () => {
    const { calls } = mockPayPal(() => ({ json: {} }));
    await paypalFetch("/v1/x", { method: "POST", body: "{}", requestId: "req-1" });
    expect(calls[0].headers.get("content-type")).toBe("application/json");
    expect(calls[0].headers.get("paypal-request-id")).toBe("req-1");
    expect(calls[0].headers.get("authorization")).toBe("Bearer tok");
  });

  it("refuses a non-sandbox API base", async () => {
    mockPayPal(() => ({ json: {} }));
    process.env.PAYPAL_API_BASE = "https://api-m.paypal.com";
    await expect(paypalFetch("/v1/x")).rejects.toThrow(/not the sandbox/);
    delete process.env.PAYPAL_API_BASE;
  });
});

describe("searchTransactions", () => {
  it("throws NotEnabledError on 403 NOT_AUTHORIZED", async () => {
    mockPayPal(() => ({ status: 403, json: { name: "NOT_AUTHORIZED", message: "Authorization failed due to insufficient permissions." } }));
    const err = await searchTransactions({ transactionId: "2UN05916MP311444Y" }).catch((e) => e);
    expect(err).toBeInstanceOf(NotEnabledError);
    expect(err.feature).toBe("Transaction Search");
    expect(err.status).toBe(403);
  });

  it("maps transaction details and sends a date window", async () => {
    const { calls } = mockPayPal(() => ({
      json: {
        transaction_details: [
          {
            transaction_info: { transaction_id: "T1", transaction_event_code: "T0006", transaction_status: "S", transaction_amount: { currency_code: "USD", value: "33.95" } },
            payer_info: { country_code: "US" },
            cart_info: { item_details: [{ item_name: "Mug", item_quantity: "1", item_unit_price: { currency_code: "USD", value: "28.00" } }] },
          },
        ],
      },
    }));
    const r = await searchTransactions({ transactionId: "T1" });
    expect(r[0]).toMatchObject({ transactionId: "T1", eventCode: "T0006", payerCountry: "US", items: [{ name: "Mug", quantity: "1" }] });
    expect(calls[0].path).toMatch(/start_date=.*end_date=.*transaction_id=T1/);
  });

  it("rejects ranges over 31 days", async () => {
    mockPayPal(() => ({ json: {} }));
    await expect(searchTransactions({ dateRange: { start: "2026-08-01T00:00:00Z", end: "2026-10-01T00:00:00Z" } })).rejects.toThrow(/31 days/);
  });
});
