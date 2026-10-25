// Expected-value model for fight / refund / offer. All values are USD relative to keeping the
// full payment (0 = no loss, negative = expected loss). Deliberately simple and explained in the UI.
import type { Decision, DisputeSnapshot, SellerPolicy } from "../types";

export const EV_ASSUMPTIONS = {
  /** PayPal US standard dispute fee on chargebacks and claims (not on inquiries). */
  disputeFeeUsd: 15,
  /** PayPal keeps its processing fee on refunds: 3.49% + $0.49 (US, PayPal checkout). */
  feeRate: 0.0349,
  feeFixedUsd: 0.49,
  /** Seller time: the agent does the work, the seller reviews it. */
  sellerHourlyUsd: 30,
  fightMinutes: 10,
  refundMinutes: 2,
  /** Share of buyers who accept a partial-refund offer (inquiry stage). */
  offerAcceptRate: 0.5,
};

export type EvInput = {
  amountUsd: number;
  stage: DisputeSnapshot["stage"];
  winProbability: number;
  /** Offer as a share of the amount (0..1); only evaluated at the inquiry stage. */
  offerShare?: number;
};

export type EvResult = Decision["expectedValueUsd"] & { best: "fight" | "refund" | "offer" };

const round2 = (n: number) => Math.round(n * 100) / 100;

export function processingFee(amountUsd: number): number {
  const a = EV_ASSUMPTIONS;
  return round2(amountUsd * a.feeRate + a.feeFixedUsd);
}

export function expectedValues(i: EvInput): EvResult {
  const a = EV_ASSUMPTIONS;
  const p = Math.min(1, Math.max(0, i.winProbability));
  const inquiry = i.stage === "INQUIRY";
  const disputeFee = inquiry ? 0 : a.disputeFeeUsd;
  const time = (min: number) => (min / 60) * a.sellerHourlyUsd;

  // Losing costs the amount, the dispute fee and the processing fee PayPal doesn't return.
  const lose = i.amountUsd + disputeFee + processingFee(i.amountUsd);
  const fight = -(1 - p) * lose - time(a.fightMinutes);
  // Refunding/accepting now: amount + kept fee (+ dispute fee once it's a chargeback/claim).
  const refund = -(i.amountUsd + processingFee(i.amountUsd) + disputeFee) - time(a.refundMinutes);

  const out: EvResult = { fight: round2(fight), refund: round2(refund), best: fight >= refund ? "fight" : "refund" };
  if (inquiry && i.offerShare !== undefined && i.offerShare > 0) {
    const q = a.offerAcceptRate;
    const offer = q * -(i.amountUsd * i.offerShare) + (1 - q) * fight - time(a.refundMinutes);
    out.offer = round2(offer);
    if (offer > Math.max(fight, refund)) out.best = "offer";
  }
  return out;
}

/** Dispute amount in USD. Non-USD amounts are used as-is (sandbox disputes are USD). */
export function amountUsd(s: Pick<DisputeSnapshot, "amount">): number {
  const n = Number(s.amount?.value);
  return Number.isFinite(n) ? n : 0;
}

export type StrategyCheck = { strategy: Decision["strategy"]; policyNote?: string };

/**
 * Applies the seller policy to the agent's proposed strategy: below minWinProbabilityToFight,
 * fighting gives way to the cheaper of refund/offer when that is the better expected value.
 */
export function applyPolicyToStrategy(
  proposed: Decision["strategy"],
  ev: EvResult,
  winProbability: number,
  policy: SellerPolicy,
  stage: DisputeSnapshot["stage"],
): StrategyCheck {
  if (proposed !== "fight") return { strategy: proposed };
  if (winProbability >= policy.minWinProbabilityToFight) return { strategy: proposed };
  const offerBetter = ev.offer !== undefined && ev.offer > ev.refund && ev.offer > ev.fight;
  if (offerBetter) {
    return {
      strategy: "offer_partial",
      policyNote: `Win chance ${pct(winProbability)} is below your ${pct(policy.minWinProbabilityToFight)} minimum; a partial offer has the best expected value.`,
    };
  }
  if (ev.refund > ev.fight) {
    return {
      strategy: stage === "INQUIRY" ? "refund_full" : "accept_claim",
      policyNote: `Win chance ${pct(winProbability)} is below your ${pct(policy.minWinProbabilityToFight)} minimum and refunding costs less than fighting.`,
    };
  }
  return { strategy: proposed };
}

const pct = (p: number) => `${Math.round(p * 100)}%`;
