// Policy gate: every write action passes here before PayPal is called.
//   blocked            PayPal doesn't currently offer the action (no HATEOAS link) — never sent
//   proposed           dry-run mode: recorded for the seller, never sent
//   awaiting_approval  money leaves the seller above their auto limit — waits in Approvals
//   execute            run now
import type { ActionKind, DisputeLinkRel, SellerPolicy } from "../types";

export type GateInput = {
  kind: ActionKind;
  /** Money this action gives to the buyer, in USD (refunds, offers, accepted claims). */
  amountUsd?: number;
};

export type GateOutcome =
  | { outcome: "execute"; reason: string }
  | { outcome: "awaiting_approval"; reason: string }
  | { outcome: "proposed"; reason: string }
  | { outcome: "blocked"; reason: string };

/** The PayPal link rel each action needs. refund_capture isn't link-gated (Payments API). */
export const LINK_FOR: Partial<Record<ActionKind, DisputeLinkRel>> = {
  send_message: "send_message",
  make_offer: "make_offer",
  provide_evidence: "provide_evidence",
  accept_claim: "accept_claim",
  acknowledge_return_item: "acknowledge_return_item",
  require_evidence: "require_evidence",
  adjudicate: "adjudicate",
};

export const MONEY_ACTIONS: ReadonlySet<ActionKind> = new Set(["make_offer", "accept_claim", "refund_capture"]);

export function policyGate(action: GateInput, policy: SellerPolicy, allowed: readonly DisputeLinkRel[]): GateOutcome {
  const rel = LINK_FOR[action.kind];
  if (rel && !allowed.includes(rel)) {
    return { outcome: "blocked", reason: `PayPal doesn't allow ${action.kind.replace(/_/g, " ")} on this dispute right now` };
  }
  if (action.kind === "require_evidence" || action.kind === "adjudicate") {
    return { outcome: "blocked", reason: "Sandbox simulators run only from the demo controls" };
  }
  if (policy.dryRun) return { outcome: "proposed", reason: "Dry run is on: proposed only, nothing sent to PayPal" };

  if (MONEY_ACTIONS.has(action.kind)) {
    const amount = action.amountUsd ?? 0;
    if (!Number.isFinite(amount) || amount < 0) {
      return { outcome: "awaiting_approval", reason: "Amount unclear: needs your approval" };
    }
    if (amount > policy.approvalAboveUsd) {
      return { outcome: "awaiting_approval", reason: `$${amount.toFixed(2)} is above your $${policy.approvalAboveUsd} approval threshold` };
    }
    if (amount > policy.autoRefundMaxUsd) {
      return { outcome: "awaiting_approval", reason: `$${amount.toFixed(2)} is above your $${policy.autoRefundMaxUsd} auto-refund limit` };
    }
    return { outcome: "execute", reason: `$${amount.toFixed(2)} is within your $${policy.autoRefundMaxUsd} auto-refund limit` };
  }
  return { outcome: "execute", reason: "No money leaves your account" };
}
