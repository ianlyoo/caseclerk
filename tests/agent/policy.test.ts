import { describe, expect, it } from "vitest";
import { policyGate } from "../../src/lib/agent/policy";
import { DEFAULT_POLICY, type DisputeLinkRel, type SellerPolicy } from "../../src/lib/types";

const ALL: DisputeLinkRel[] = ["send_message", "make_offer", "provide_evidence", "accept_claim", "acknowledge_return_item"];
const policy: SellerPolicy = { ...DEFAULT_POLICY, autoRefundMaxUsd: 15, approvalAboveUsd: 50, dryRun: false };

describe("policyGate", () => {
  it("blocks an action PayPal doesn't currently allow, even in dry run", () => {
    expect(policyGate({ kind: "send_message" }, policy, ["provide_evidence", "accept_claim"]).outcome).toBe("blocked");
    expect(policyGate({ kind: "make_offer", amountUsd: 1 }, { ...policy, dryRun: true }, []).outcome).toBe("blocked");
  });

  it("never lets the agent run sandbox simulators", () => {
    expect(policyGate({ kind: "adjudicate" }, policy, ["adjudicate"]).outcome).toBe("blocked");
    expect(policyGate({ kind: "require_evidence" }, policy, ["require_evidence"]).outcome).toBe("blocked");
  });

  it("dry run proposes instead of executing", () => {
    expect(policyGate({ kind: "provide_evidence" }, { ...policy, dryRun: true }, ALL).outcome).toBe("proposed");
    expect(policyGate({ kind: "accept_claim", amountUsd: 5 }, { ...policy, dryRun: true }, ALL).outcome).toBe("proposed");
  });

  it("executes non-money actions", () => {
    expect(policyGate({ kind: "provide_evidence" }, policy, ALL).outcome).toBe("execute");
    expect(policyGate({ kind: "send_message" }, policy, ALL).outcome).toBe("execute");
  });

  it("auto-executes refunds at exactly the auto limit, queues a cent above", () => {
    expect(policyGate({ kind: "accept_claim", amountUsd: 15 }, policy, ALL).outcome).toBe("execute");
    expect(policyGate({ kind: "accept_claim", amountUsd: 15.01 }, policy, ALL).outcome).toBe("awaiting_approval");
  });

  it("queues money actions above the approval threshold", () => {
    const r = policyGate({ kind: "make_offer", amountUsd: 50.01 }, policy, ALL);
    expect(r.outcome).toBe("awaiting_approval");
    expect(r.reason).toContain("$50");
    // Equal to the threshold but above the auto limit: still waits.
    expect(policyGate({ kind: "make_offer", amountUsd: 50 }, policy, ALL).outcome).toBe("awaiting_approval");
  });

  it("uses the stricter limit when approvalAbove is below autoRefundMax", () => {
    const p = { ...policy, autoRefundMaxUsd: 100, approvalAboveUsd: 20 };
    expect(policyGate({ kind: "accept_claim", amountUsd: 20 }, p, ALL).outcome).toBe("execute");
    expect(policyGate({ kind: "accept_claim", amountUsd: 21 }, p, ALL).outcome).toBe("awaiting_approval");
  });

  it("asks for approval when a money amount is missing or invalid", () => {
    expect(policyGate({ kind: "accept_claim", amountUsd: Number.NaN }, policy, ALL).outcome).toBe("awaiting_approval");
    expect(policyGate({ kind: "make_offer", amountUsd: -1 }, policy, ALL).outcome).toBe("awaiting_approval");
  });

  it("treats a zero-amount replacement offer as auto", () => {
    expect(policyGate({ kind: "make_offer", amountUsd: 0 }, policy, ALL).outcome).toBe("execute");
  });

  it("refund_capture isn't link-gated but is money-gated", () => {
    expect(policyGate({ kind: "refund_capture", amountUsd: 10 }, policy, []).outcome).toBe("execute");
    expect(policyGate({ kind: "refund_capture", amountUsd: 60 }, policy, []).outcome).toBe("awaiting_approval");
  });
});
