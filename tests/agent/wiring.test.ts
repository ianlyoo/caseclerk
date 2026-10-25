import { describe, expect, it, vi } from "vitest";

// The repo isn't exercised here (and its `@/` imports need a vitest alias that main lacks).
vi.mock("../../src/lib/db", () => ({ getDb: vi.fn() }));

vi.mock("../../src/lib/paypal", async (orig) => ({
  ...(await orig<typeof import("../../src/lib/paypal")>()),
  getCapture: vi.fn(async (id: string) => ({ id, status: "COMPLETED", amount: { value: "24.00", currency_code: "USD" }, orderId: "7BH16977J78904017", createTime: "2026-10-25T12:00:00Z" })),
  getOrder: vi.fn(async (id: string) => ({
    id,
    status: "COMPLETED",
    purchase_units: [{ items: [{ name: "Dripper", quantity: "1", unit_amount: { value: "24.00", currency_code: "USD" } }], payments: { captures: [{ id: "3BC39279NJ1093335", status: "COMPLETED" }] } }],
  })),
  getTracking: vi.fn(async () => [{ captureId: "3BC39279NJ1093335", trackingNumber: "9400111", carrier: "USPS", status: "DELIVERED", lastUpdated: "2026-10-22T10:00:00Z", trackingUrl: "https://tools.usps.com/x" }]),
}));

const { livePaypal } = await import("../../src/lib/agent/wiring");

describe("live wiring over W1's PayPal module", () => {
  it("maps capture + order to order facts with the charged amount", async () => {
    const o = await livePaypal({ transactionSearch: false }).getOrderForCapture("3BC39279NJ1093335");
    expect(o).toMatchObject({ orderId: "7BH16977J78904017", captureId: "3BC39279NJ1093335", amountCharged: { value: "24.00" }, items: [{ name: "Dripper", quantity: 1 }] });
  });

  it("maps trackers and marks delivery", async () => {
    const t = await livePaypal({ transactionSearch: false }).getTracking("3BC39279NJ1093335");
    expect(t).toEqual([{ carrier: "USPS", trackingNumber: "9400111", status: "DELIVERED", deliveredAt: "2026-10-22T10:00:00Z", trackingUrl: "https://tools.usps.com/x" }]);
  });

  it("offers search_transactions only when enabled", () => {
    expect(livePaypal({ transactionSearch: false }).searchTransactions).toBeUndefined();
    expect(livePaypal({ transactionSearch: true }).searchTransactions).toBeTypeOf("function");
  });
});
