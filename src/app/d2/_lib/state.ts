// A case's state in plain words, from its record alone (the inbox has no actions or audit rows).
import type { CaseRecord } from "@/lib/types";
import { RESERVED_CASES } from "./routes";
import { cap, day, dayClock, leftWords, reasonWords, stageWord } from "./format";

export type Phase = "waiting" | "open" | "closed";
export type StateKey = "ask" | "sending" | "review" | "buyer" | "read" | "received" | "error" | "kept" | "lost";

export type CaseState = { phase: Phase; key: StateKey; words: string };

const SELLER_WON = new Set(["RESOLVED_WITH_PAYOUT", "RESOLVED_SELLER_FAVOUR", "RESOLVED_SELLER_FAVOR"]);
export const sellerWon = (c: CaseRecord) => SELLER_WON.has(c.snapshot.outcome ?? "");

export function caseState(c: CaseRecord): CaseState {
  const s = c.snapshot;
  if (c.status === "resolved" || s.status === "RESOLVED") {
    return sellerWon(c) ? { phase: "closed", key: "kept", words: "Closed for you" } : { phase: "closed", key: "lost", words: "Closed for the buyer" };
  }
  if (c.status === "awaiting_approval") return { phase: "waiting", key: "ask", words: "Waiting for your yes" };
  if (c.status === "acting") return { phase: "open", key: "sending", words: "Sending to PayPal" };
  if (c.status === "error") return { phase: "open", key: "error", words: "Stopped on an error" };
  if (c.status === "waiting_on_buyer" || s.status === "WAITING_FOR_BUYER_RESPONSE") return { phase: "open", key: "buyer", words: "Waiting for the buyer" };
  if (c.status === "waiting_on_paypal") {
    return { phase: "open", key: "review", words: c.decision?.strategy === "fight" ? "Filed. PayPal is reviewing" : "PayPal is reviewing" };
  }
  if (c.status === "triaged") return { phase: "open", key: "read", words: "Read. Nothing to answer yet" };
  return { phase: "open", key: "received", words: "Received. Not worked yet" };
}

/** The deadline that matters now, in words: the seller's, the buyer's, or none. */
export function deadlineWords(c: CaseRecord, now = Date.now()): { due?: string; text: string } {
  const s = c.snapshot;
  if (s.status === "RESOLVED") return { text: `Closed ${day(s.updateTime)}` };
  if (s.sellerResponseDueDate) {
    return { due: s.sellerResponseDueDate, text: `Due ${dayClock(s.sellerResponseDueDate)}, ${leftWords(s.sellerResponseDueDate, now)}` };
  }
  if (s.buyerResponseDueDate && s.status === "WAITING_FOR_BUYER_RESPONSE") return { text: `Buyer has until ${day(s.buyerResponseDueDate)}` };
  return { text: "No deadline from PayPal right now" };
}

export const itemName = (c: CaseRecord) => c.order?.items[0]?.name ?? null;

/** "Chargeback, not as described" */
export const claimWords = (c: CaseRecord) => `${cap(stageWord(c.snapshot.stage))}, ${reasonWords(c.snapshot.reason)}`;

/** The newest case waiting for a yes that a visitor may really approve (not one kept for the demo). */
export function judgeCase<T extends CaseRecord>(list: readonly T[] | null | undefined): T | null {
  return (
    [...(list ?? [])]
      .filter((c) => c.status === "awaiting_approval" && !RESERVED_CASES.includes(c.id))
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || b.id.localeCompare(a.id))[0] ?? null
  );
}

/** Item names that several separate sandbox test disputes share (the same camera listing at different amounts). */
export function sharedListings(list: readonly CaseRecord[]): Map<string, number> {
  const n = new Map<string, number>();
  for (const c of list) {
    const name = itemName(c);
    if (name) n.set(name, (n.get(name) ?? 0) + 1);
  }
  return new Map([...n].filter(([, k]) => k > 1));
}
