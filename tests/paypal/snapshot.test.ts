import { describe, expect, it } from "vitest";
import { allowed, toSnapshot, type RawDispute } from "../../src/lib/paypal/disputes";
import waiting from "./fixtures/snad-waiting-for-seller.json";
import resolved from "./fixtures/snad-resolved-with-payout.json";
import inr from "./fixtures/inr-chargeback.json";

// Fixtures are real sandbox disputes (2026-10-25) fetched by scripts/fetch-dispute-fixture.ts, PII replaced.
describe("toSnapshot (real sandbox payloads)", () => {
  it("maps a chargeback waiting for the seller", () => {
    const s = toSnapshot(waiting as RawDispute);
    expect(s).toMatchObject({
      id: "PP-R-LSA-10194438",
      reason: "MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED",
      status: "WAITING_FOR_SELLER_RESPONSE",
      stage: "CHARGEBACK",
      channel: "EXTERNAL",
      amount: { currency_code: "USD", value: "12.00" },
      sellerResponseDueDate: "2026-11-04T04:59:59.000Z",
      requestedEvidence: ["PROOF_OF_FULFILLMENT", "PROOF_OF_REFUND", "OTHER"],
      allowed: ["provide_evidence", "accept_claim"],
      messages: [],
    });
    expect(s.sellerTransactionId).toMatch(/^[A-Z0-9]{17}$/);
    expect(s.buyerTransactionId).toMatch(/^[A-Z0-9]{17}$/);
    expect(s.outcome).toBeUndefined();
    expect(s.createTime < s.updateTime).toBe(true);
    expect(s.raw).toBe(waiting);
  });

  it("maps a resolved chargeback (RESOLVED_WITH_PAYOUT) with no actions left", () => {
    const s = toSnapshot(resolved as RawDispute);
    expect(s.status).toBe("RESOLVED");
    expect(s.outcome).toBe("RESOLVED_WITH_PAYOUT");
    expect(s.allowed).toEqual([]);
    expect(s.requestedEvidence).toBeUndefined();
    expect(s.sellerTransactionId).toBe("2UN05916MP311444Y");
  });

  it("maps an item-not-received chargeback (Visa 13.1)", () => {
    const s = toSnapshot(inr as RawDispute);
    expect(s.reason).toBe("MERCHANDISE_OR_SERVICE_NOT_RECEIVED");
    expect(s.stage).toBe("CHARGEBACK");
    expect((s.raw as RawDispute).external_reason_code).toBe("13.1");
  });

  it("maps messages and buyer due date, and unknown statuses to OTHER", () => {
    const raw = {
      ...(waiting as RawDispute),
      status: "SOMETHING_NEW",
      buyer_response_due_date: "2026-11-01T00:00:00.000Z",
      messages: [
        { posted_by: "BUYER", time_posted: "2026-10-25T04:00:00.000Z", content: "Where is my order?" },
        { posted_by: "SELLER", time_posted: "2026-10-25T05:00:00.000Z", content: "It was delivered on 10/24." },
      ],
    } as RawDispute;
    const s = toSnapshot(raw);
    expect(s.status).toBe("OTHER");
    expect(s.buyerResponseDueDate).toBe("2026-11-01T00:00:00.000Z");
    expect(s.messages).toEqual([
      { postedBy: "BUYER", at: "2026-10-25T04:00:00.000Z", content: "Where is my order?" },
      { postedBy: "SELLER", at: "2026-10-25T05:00:00.000Z", content: "It was delivered on 10/24." },
    ]);
  });
});

describe("allowed", () => {
  it("keeps only known action rels, in a stable order", () => {
    const links = ["self", "adjudicate", "provide_evidence", "unknown_rel", "require_evidence", "send_message"].map((rel) => ({ rel, href: "x" }));
    expect(allowed({ links })).toEqual(["send_message", "provide_evidence", "require_evidence", "adjudicate"]);
    expect(allowed({})).toEqual([]);
  });
});
