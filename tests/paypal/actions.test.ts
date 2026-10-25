import { afterEach, describe, expect, it, vi } from "vitest";
import { acceptClaim, makeOffer, provideEvidence, sendMessage } from "../../src/lib/paypal/disputes";
import { RefundBlockedError, refundCapture } from "../../src/lib/paypal/refunds";
import { addTracking } from "../../src/lib/paypal/tracking";
import { PayPalError } from "../../src/lib/paypal/client";
import { mockPayPal } from "./helpers";

afterEach(() => vi.unstubAllGlobals());

const capture = (status = "COMPLETED") => ({ id: "CAP1", status, amount: { currency_code: "USD", value: "33.95" } });
const dispute = (status: string) => ({
  dispute_id: "PP-R-AAA-1",
  status,
  reason: "MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
  dispute_amount: { currency_code: "USD", value: "33.95" },
  create_time: "2026-10-25T00:00:00Z",
  update_time: "2026-10-25T00:00:00Z",
});

describe("refundCapture", () => {
  it("refuses when the capture has an open dispute and never calls refund", async () => {
    const { calls } = mockPayPal((c) => {
      if (c.path.startsWith("/v1/customer/disputes?")) return { json: { items: [dispute("RESOLVED"), dispute("WAITING_FOR_SELLER_RESPONSE")] } };
      if (c.path === "/v2/payments/captures/CAP1") return { json: capture() };
    });
    const err = await refundCapture("CAP1").catch((e) => e);
    expect(err).toBeInstanceOf(RefundBlockedError);
    expect(err.disputeId).toBe("PP-R-AAA-1");
    expect(calls[0].path).toContain("disputed_transaction_id=CAP1");
    expect(calls.some((c) => c.path.endsWith("/refund"))).toBe(false);
  });

  it("refuses when the capture is not refundable", async () => {
    mockPayPal((c) => {
      if (c.path.startsWith("/v1/customer/disputes?")) return { json: { items: [] } };
      if (c.path === "/v2/payments/captures/CAP1") return { json: capture("REFUNDED") };
    });
    await expect(refundCapture("CAP1")).rejects.toThrow(/capture status is REFUNDED/);
  });

  it("refuses amounts above the capture", async () => {
    mockPayPal((c) => {
      if (c.path.startsWith("/v1/customer/disputes?")) return { json: { items: [] } };
      if (c.path === "/v2/payments/captures/CAP1") return { json: capture() };
    });
    await expect(refundCapture("CAP1", { currency_code: "USD", value: "50.00" })).rejects.toBeInstanceOf(RefundBlockedError);
  });

  it("refunds when every dispute on the capture is resolved", async () => {
    const { calls } = mockPayPal((c) => {
      if (c.path.startsWith("/v1/customer/disputes?")) return { json: { items: [dispute("RESOLVED")] } };
      if (c.path === "/v2/payments/captures/CAP1") return { json: capture() };
      if (c.path === "/v2/payments/captures/CAP1/refund") return { status: 201, json: { id: "RF1", status: "COMPLETED" } };
    });
    const r = await refundCapture("CAP1", { currency_code: "USD", value: "10.00" }, { note: "Sorry!" });
    expect(r).toMatchObject({ refundId: "RF1", status: "COMPLETED", httpStatus: 201 });
    const refund = calls.find((c) => c.path.endsWith("/refund"))!;
    expect(JSON.parse(String(refund.body))).toEqual({ amount: { currency_code: "USD", value: "10.00" }, note_to_payer: "Sorry!" });
    expect(refund.headers.get("paypal-request-id")).toMatch(/^cc-refund-CAP1-/);
  });
});

describe("dispute actions", () => {
  it("provideEvidence sends multipart input + files and retries the spurious 400", async () => {
    let n = 0;
    const { calls } = mockPayPal(() => (++n === 1 ? { status: 400, json: { name: "INVALID_REQUEST" } } : { json: {} }));
    const r = await provideEvidence("PP-R-AAA-1", {
      evidences: [{ evidenceType: "PROOF_OF_FULFILLMENT", notes: "Delivered", trackingInfo: [{ carrierName: "USPS", trackingNumber: "9400111899" }] }],
      files: [{ name: "evidence.pdf", bytes: new Uint8Array([37, 80, 68, 70]), contentType: "application/pdf" }],
    });
    expect(r.status).toBe(200);
    expect(calls).toHaveLength(2);
    const form = calls[1].body as FormData;
    expect(calls[1].path).toBe("/v1/customer/disputes/PP-R-AAA-1/provide-evidence");
    expect(JSON.parse(await (form.get("input") as Blob).text())).toEqual({
      evidences: [{ evidence_type: "PROOF_OF_FULFILLMENT", notes: "Delivered", evidence_info: { tracking_info: [{ carrier_name: "USPS", tracking_number: "9400111899" }] } }],
    });
    expect((form.get("file1") as File).name).toBe("evidence.pdf");
  });

  it("provideEvidence rejects oversize uploads and unsupported types before calling PayPal", async () => {
    const { calls } = mockPayPal(() => ({ json: {} }));
    const ev = [{ evidenceType: "OTHER" as const }];
    await expect(provideEvidence("X", { evidences: ev, files: [{ name: "a.pdf", bytes: new Uint8Array(4_600_000), contentType: "application/pdf" }] })).rejects.toThrow(/limit/);
    await expect(provideEvidence("X", { evidences: ev, files: [{ name: "a.txt", bytes: new Uint8Array(3), contentType: "text/plain" }] })).rejects.toThrow(/not accepted/);
    expect(calls).toHaveLength(0);
  });

  it("makeOffer, sendMessage and acceptClaim send PayPal's body shapes", async () => {
    const { calls } = mockPayPal(() => ({ json: {} }));
    await makeOffer("D1", { offerType: "REFUND", amount: { currency_code: "USD", value: "5.00" }, note: "Half back" });
    await sendMessage("D1", "Hello");
    await acceptClaim("D1", { note: "Sorry", refundAmount: { currency_code: "USD", value: "12.00" } });
    expect(calls.map((c) => [c.path, JSON.parse(String(c.body))])).toEqual([
      ["/v1/customer/disputes/D1/make-offer", { note: "Half back", offer_type: "REFUND", offer_amount: { currency_code: "USD", value: "5.00" } }],
      ["/v1/customer/disputes/D1/send-message", { message: "Hello" }],
      ["/v1/customer/disputes/D1/accept-claim", { note: "Sorry", accept_claim_type: "REFUND", refund_amount: { currency_code: "USD", value: "12.00" } }],
    ]);
    await expect(makeOffer("D1", { offerType: "REFUND", note: "x" })).rejects.toThrow(/needs an amount/);
  });

  it("422 on a chargeback surfaces as PayPalError with the issue", async () => {
    mockPayPal(() => ({ status: 422, json: { name: "UNPROCESSABLE_ENTITY", details: [{ issue: "ACTION_NOT_ALLOWED_IN_CURRENT_DISPUTE_STATE" }] } }));
    const err = await sendMessage("D1", "hi").catch((e) => e);
    expect(err).toBeInstanceOf(PayPalError);
    expect(err.issue).toBe("ACTION_NOT_ALLOWED_IN_CURRENT_DISPUTE_STATE");
  });

  it("addTracking turns a 200 with only errors into PayPalError", async () => {
    mockPayPal(() => ({ json: { tracker_identifiers: [], errors: [{ name: "INVALID_REQUEST", details: [{ issue: "INVALID_TRACKING_NUMBER" }] }] } }));
    await expect(addTracking("CAP1", { carrier: "USPS", trackingNumber: "x", status: "SHIPPED" })).rejects.toMatchObject({ issue: "INVALID_TRACKING_NUMBER" });
  });
});
