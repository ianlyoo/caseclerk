// PayPal's record in plain words, for the opened record layer and the live "PayPal's latest" line.
import type { WireEntry } from "@/lib/db/repo";

export const EVENT_WORDS: Record<string, string> = {
  "CUSTOMER.DISPUTE.CREATED": "Dispute opened",
  "CUSTOMER.DISPUTE.UPDATED": "Dispute updated",
  "CUSTOMER.DISPUTE.RESOLVED": "Dispute resolved",
  "PAYMENT.CAPTURE.COMPLETED": "Payment completed",
  "PAYMENT.CAPTURE.REVERSED": "Payment reversed",
  "CHECKOUT.ORDER.APPROVED": "Order approved",
  "CHECKOUT.ORDER.COMPLETED": "Order completed",
};

export const callWords = (method?: string, path?: string) => {
  const p = path ?? "";
  if (p.includes("verify-webhook-signature")) return "Checked the webhook signature";
  if (/provide-evidence$/.test(p)) return "Filed the evidence";
  if (/accept-claim$/.test(p)) return "Accepted the claim";
  if (/make-offer$/.test(p)) return "Made an offer";
  if (/send-message$/.test(p)) return "Wrote to the buyer";
  if (p.includes("process-chargeback")) return "Filed the sandbox chargeback";
  if (/\/v2\/checkout\/orders\/[^/]+\/capture$/.test(p)) return "Took the payment";
  if (p.startsWith("/v1/customer/disputes")) return "Read the dispute";
  if (p.startsWith("/v2/payments/captures")) return "Read the payment";
  if (p.startsWith("/v2/checkout/orders")) return method === "POST" ? "Made the sandbox order" : "Read the order";
  if (p.startsWith("/v1/shipping/trackers")) return method === "PUT" ? "Updated the tracker" : method === "POST" ? "Added the tracking" : "Read the tracking";
  return `${method ?? ""} ${p}`.trim();
};

export const wireWords = (w: WireEntry) =>
  w.kind === "event" ? `${EVENT_WORDS[w.eventType ?? ""] ?? w.eventType}, webhook${w.verify === "SUCCESS" ? " (verified)" : ""}` : callWords(w.method, w.path);

/** The first sentence or two of an agent's note, for a one-line read. */
// a stop inside a figure ("$24.00") or an id is not a sentence end
export const firstSentences = (s: string, n = 1) => (s.match(/(?:[^.!?]|[.!?](?!\s|$))+[.!?]+(?:\s|$)/g) ?? [s]).slice(0, n).join("").trim();

export const ACTOR_WORDS: Record<string, string> = { agent: "CaseClerk", seller: "You", paypal: "PayPal", system: "CaseClerk" };
