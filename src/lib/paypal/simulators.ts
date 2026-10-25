// Sandbox-only dispute simulators. Never exposed outside test disputes / demo controls.
import type { Money } from "../types";
import { paypalFetch } from "./client";
import type { ActionResult } from "./disputes";

export type CardBrand = "VISA" | "MASTERCARD";

/**
 * Card-network reason codes for the process-chargeback simulator, verified live in the sandbox
 * (see README). The brand only labels the chargeback; the order itself is paid with the sandbox Visa.
 */
export const CHARGEBACK_REASON_CODES = {
  not_as_described: { reasonCode: "C2", cardBrand: "VISA" as CardBrand },
  not_received: { reasonCode: "13.1", cardBrand: "VISA" as CardBrand },
  unauthorized: { reasonCode: "4837", cardBrand: "MASTERCARD" as CardBrand },
} as const;

/** POST /v2/customer-support/process-chargeback: files a card chargeback against a capture. */
export async function processChargeback(o: {
  captureId: string;
  amount: Money;
  reasonCode: string;
  merchantId?: string;
  cardBrand?: CardBrand;
  responseDays?: number;
}): Promise<ActionResult & { json: unknown }> {
  const now = new Date();
  const due = new Date(now.getTime() + (o.responseDays ?? 10) * 86_400_000);
  const ref = String(Date.now());
  const body = {
    adjacency: "PAYPAL",
    file_layout: "ATCK_CB",
    merchant_id: o.merchantId ?? process.env.PAYPAL_MERCHANT_ID,
    financial_institution: { processor: "FDMS" },
    transaction: { id_enc: o.captureId, amount: o.amount },
    instrument: { instrument_type: "CARD", card_brand: o.cardBrand ?? "VISA", credit_card_transaction_id: ref, external: false },
    dispute: {
      id: null,
      stage: "CHARGEBACK",
      response_date: due.toISOString(),
      status: "2",
      amount: o.amount,
      receive_date: now.toISOString(),
      event_code: "CHARGEBACK_INITIATED",
      money_movement_date: now.toISOString(),
      event_type: "DEBIT",
      chargeback_type: "REPORTED_TO_PROCESSOR",
      processor_info: { reference_number: ref.padEnd(23, "0"), reason_code: o.reasonCode, notes: "CASECLERK_TEST" },
    },
  };
  const res = await paypalFetch("/v2/customer-support/process-chargeback", { method: "POST", body: JSON.stringify(body) });
  return { status: res.status, debugId: res.debugId, json: res.json };
}

/** Moves an UNDER_REVIEW dispute back to waiting for evidence. Gated by the `require_evidence` link. */
export async function requireEvidence(id: string, action: "SELLER_EVIDENCE" | "BUYER_EVIDENCE" = "SELLER_EVIDENCE"): Promise<ActionResult> {
  const r = await paypalFetch(`/v1/customer/disputes/${encodeURIComponent(id)}/require-evidence`, {
    method: "POST",
    body: JSON.stringify({ action }),
    retryOn400: true,
  });
  return { status: r.status, debugId: r.debugId };
}

/**
 * Settles the dispute. On chargebacks, SELLER_FAVOR resolves as RESOLVED_WITH_PAYOUT
 * (PayPal pays the buyer and releases the seller's hold). Gated by the `adjudicate` link.
 */
export async function adjudicate(id: string, outcome: "SELLER_FAVOR" | "BUYER_FAVOR"): Promise<ActionResult> {
  const r = await paypalFetch(`/v1/customer/disputes/${encodeURIComponent(id)}/adjudicate`, {
    method: "POST",
    body: JSON.stringify({ adjudication_outcome: outcome }),
    retryOn400: true,
  });
  return { status: r.status, debugId: r.debugId };
}

/**
 * Buyer-side create-dispute simulator (inquiry stage). Needs the buyer's consent through
 * Log in with PayPal; until the app has it, PayPal answers 400 "No permissions to set target_client_id".
 */
export async function createInquiry(o: {
  buyerTransactionId: string;
  amount: Money;
  reason?: "MERCHANDISE_OR_SERVICE_NOT_RECEIVED" | "MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED";
  buyerEmail?: string;
}): Promise<ActionResult & { json: unknown }> {
  const email = o.buyerEmail ?? process.env.PAYPAL_SANDBOX_BUYER_EMAIL;
  const clientId = process.env.PAYPAL_CLIENT_ID;
  if (!email || !clientId) throw new Error("createInquiry: PAYPAL_SANDBOX_BUYER_EMAIL and PAYPAL_CLIENT_ID are required");
  const b64 = (v: unknown) => Buffer.from(JSON.stringify(v)).toString("base64url");
  const assertion = `${b64({ alg: "none", typ: "JWT" })}.${b64({ iss: clientId, email })}.`;
  const input = {
    disputed_transactions: [{ buyer_transaction_id: o.buyerTransactionId }],
    reason: o.reason ?? "MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
    dispute_amount: o.amount,
    extensions: {
      merchant_contacted: true,
      merchant_contacted_outcome: "NO_RESPONSE",
      merchandize_dispute_properties: { issue_type: "PRODUCT" },
    },
  };
  const form = new FormData();
  form.append("input", new Blob([JSON.stringify(input)], { type: "application/json" }));
  const r = await paypalFetch("/v1/customer/disputes", { method: "POST", body: form, headers: { "PayPal-Auth-Assertion": assertion } });
  return { status: r.status, debugId: r.debugId, json: r.json };
}
