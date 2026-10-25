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
    const { calls } = mockPayPal((c) => {
      if (c.path.endsWith("/provide-evidence")) return ++n === 1 ? { status: 400, json: { name: "INVALID_REQUEST" } } : { json: {} };
    });
    const r = await provideEvidence("PP-R-AAA-1", {
      evidences: [{ evidenceType: "PROOF_OF_FULFILLMENT", notes: "Delivered" }],
      files: [{ name: "evidence.pdf", bytes: new Uint8Array([37, 80, 68, 70]), contentType: "application/pdf" }],
    });
    expect(r.status).toBe(200);
    expect(calls).toHaveLength(2);
    const form = calls[1].body as FormData;
    expect(calls[1].path).toBe("/v1/customer/disputes/PP-R-AAA-1/provide-evidence");
    expect(JSON.parse(await (form.get("input") as Blob).text())).toEqual({ evidences: [{ evidence_type: "PROOF_OF_FULFILLMENT", notes: "Delivered" }] });
    expect((form.get("file1") as File).name).toBe("evidence.pdf");
  });

  it("provideEvidence with tracking puts a DELIVERED tracker back after PayPal rewrites it as SHIPPED", async () => {
    let submitted = false;
    const tracker = (status: string, shipment_date: string) => ({ trackers: [{ transaction_id: "CAP1", tracking_number: "9400111899", carrier: "USPS", status, shipment_date }] });
    const { calls } = mockPayPal((c) => {
      if (c.path === "/v1/customer/disputes/PP-R-AAA-1" && c.method === "GET") return { json: { ...dispute("WAITING_FOR_SELLER_RESPONSE"), disputed_transactions: [{ seller_transaction_id: "CAP1" }] } };
      if (c.path.startsWith("/v1/shipping/trackers?")) return { json: submitted ? tracker("SHIPPED", "2026-10-24") : tracker("DELIVERED", "2026-10-25") };
      if (c.path.endsWith("/provide-evidence")) { submitted = true; return { json: {} }; }
      if (c.method === "PUT" && c.path === "/v1/shipping/trackers/CAP1-9400111899") return { status: 204 };
    });
    const r = await provideEvidence("PP-R-AAA-1", {
      evidences: [{ evidenceType: "PROOF_OF_FULFILLMENT", trackingInfo: [{ carrierName: "USPS", trackingNumber: "9400111899" }] }],
      files: [],
    });
    expect(r.trackingRestored).toEqual(["9400111899"]);
    expect(r.trackingRestoreError).toBeUndefined();
    const put = calls.find((c) => c.method === "PUT")!;
    expect(JSON.parse(String(put.body))).toEqual({ transaction_id: "CAP1", tracking_number: "9400111899", status: "DELIVERED", carrier: "USPS", shipment_date: "2026-10-25" });
    const form = calls.find((c) => c.path.endsWith("/provide-evidence"))!.body as FormData;
    expect(JSON.parse(await (form.get("input") as Blob).text()).evidences[0].evidence_info).toEqual({ tracking_info: [{ carrier_name: "USPS", tracking_number: "9400111899" }] });
  });

  it("provideEvidence still succeeds when the tracker restore fails", async () => {
    mockPayPal((c) => {
      if (c.path.endsWith("/provide-evidence")) return { json: {} };
      // dispute GET and tracker reads fall through to 404
    });
    const r = await provideEvidence("PP-R-AAA-1", {
      evidences: [{ evidenceType: "PROOF_OF_FULFILLMENT", trackingInfo: [{ carrierName: "USPS", trackingNumber: "1" }] }],
      files: [],
    });
    expect(r.status).toBe(200);
    expect(r.trackingRestoreError).toMatch(/could not read trackers/);
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
