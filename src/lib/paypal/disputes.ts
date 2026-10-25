// Customer Disputes API v1 (seller side). Every write is gated by PayPal's HATEOAS links:
// callers check `snapshot.allowed` first; PayPal answers 422 ACTION_NOT_ALLOWED_IN_CURRENT_DISPUTE_STATE otherwise.
import type { DisputeLinkRel, DisputeMessage, DisputeSnapshot, DisputeStatus, Money } from "../types";
import { paypalFetch, type PayPalResult } from "./client";
import { getTracking, restoreTrackers, type Tracker } from "./tracking";

const D = "/v1/customer/disputes";

const LINK_RELS: readonly DisputeLinkRel[] = [
  "send_message",
  "make_offer",
  "provide_evidence",
  "accept_claim",
  "acknowledge_return_item",
  "appeal",
  "escalate",
  "provide_supporting_info",
  "require_evidence",
  "adjudicate",
];

const STATUSES: readonly DisputeStatus[] = [
  "OPEN",
  "WAITING_FOR_BUYER_RESPONSE",
  "WAITING_FOR_SELLER_RESPONSE",
  "UNDER_REVIEW",
  "RESOLVED",
];

/** The subset of PayPal's dispute payload we read. Everything else stays in `raw`. */
export type RawDispute = {
  dispute_id: string;
  create_time: string;
  update_time: string;
  reason: string;
  status: string;
  dispute_state?: string;
  dispute_amount: Money;
  dispute_life_cycle_stage?: string;
  dispute_channel?: string;
  external_reason_code?: string;
  seller_response_due_date?: string;
  buyer_response_due_date?: string;
  disputed_transactions?: {
    seller_transaction_id?: string;
    buyer_transaction_id?: string;
    invoice_number?: string;
    gross_amount?: Money;
    transaction_status?: string;
  }[];
  dispute_outcome?: { outcome_code?: string; outcome_reason?: string; amount_refunded?: Money };
  evidences?: { evidence_type: string; source?: string; date?: string; notes?: string }[];
  messages?: { posted_by?: string; time_posted?: string; content?: string }[];
  links?: { href: string; rel: string; method?: string }[];
  [key: string]: unknown;
};

/** Action rels currently offered by PayPal on this dispute (from its HATEOAS links). */
export function allowed(raw: Pick<RawDispute, "links">): DisputeLinkRel[] {
  const rels = new Set((raw.links ?? []).map((l) => l.rel));
  return LINK_RELS.filter((r) => rels.has(r));
}

/** Normalizes GET /v1/customer/disputes/{id} into the shared DisputeSnapshot. */
export function toSnapshot(raw: RawDispute): DisputeSnapshot {
  const txn = raw.disputed_transactions?.[0];
  const requested = [
    ...new Set((raw.evidences ?? []).filter((e) => e.source === "REQUESTED_FROM_SELLER").map((e) => e.evidence_type)),
  ];
  const messages: DisputeMessage[] = (raw.messages ?? []).map((m) => ({
    postedBy: m.posted_by ?? "UNKNOWN",
    at: m.time_posted ?? "",
    content: m.content ?? "",
  }));
  return {
    id: raw.dispute_id,
    reason: raw.reason,
    status: (STATUSES as readonly string[]).includes(raw.status) ? (raw.status as DisputeStatus) : "OTHER",
    stage: raw.dispute_life_cycle_stage ?? "UNKNOWN",
    channel: raw.dispute_channel,
    amount: raw.dispute_amount,
    createTime: raw.create_time,
    updateTime: raw.update_time,
    sellerResponseDueDate: raw.seller_response_due_date,
    buyerResponseDueDate: raw.buyer_response_due_date,
    sellerTransactionId: txn?.seller_transaction_id,
    buyerTransactionId: txn?.buyer_transaction_id,
    invoiceId: txn?.invoice_number,
    outcome: raw.dispute_outcome?.outcome_code,
    requestedEvidence: requested.length ? requested : undefined,
    messages,
    allowed: allowed(raw),
    raw,
  };
}

const enc = encodeURIComponent;

export async function getDisputeRaw(id: string): Promise<PayPalResult<RawDispute>> {
  return paypalFetch<RawDispute>(`${D}/${enc(id)}`);
}

export async function getDispute(id: string): Promise<DisputeSnapshot> {
  return toSnapshot((await getDisputeRaw(id)).json);
}

export type ListDisputesQuery = {
  /** Capture id (seller transaction id) of the disputed payment. */
  disputedTransactionId?: string;
  /** ISO time; PayPal returns disputes created after it (max 180 days back). */
  startTime?: string;
  /** e.g. REQUIRED_ACTION, REQUIRED_OTHER_PARTY_ACTION, UNDER_PAYPAL_REVIEW, RESOLVED, OPEN_INQUIRIES. */
  disputeState?: string;
  pageSize?: number;
  nextPageToken?: string;
};

export type DisputeListItem = {
  id: string;
  reason: string;
  status: DisputeStatus;
  stage: string;
  amount: Money;
  createTime: string;
  updateTime: string;
  sellerResponseDueDate?: string;
};

export async function listDisputes(q: ListDisputesQuery = {}): Promise<{ items: DisputeListItem[]; nextPageToken?: string }> {
  const p = new URLSearchParams();
  if (q.disputedTransactionId) p.set("disputed_transaction_id", q.disputedTransactionId);
  if (q.startTime) p.set("start_time", q.startTime);
  if (q.disputeState) p.set("dispute_state", q.disputeState);
  if (q.nextPageToken) p.set("next_page_token", q.nextPageToken);
  p.set("page_size", String(q.pageSize ?? 20));
  const { json } = await paypalFetch<{ items?: RawDispute[]; links?: { rel: string; href: string }[] }>(`${D}?${p}`);
  const next = json?.links?.find((l) => l.rel === "next")?.href;
  return {
    items: (json?.items ?? []).map((d) => {
      const s = toSnapshot(d);
      return {
        id: s.id,
        reason: s.reason,
        status: s.status,
        stage: s.stage,
        amount: s.amount,
        createTime: s.createTime,
        updateTime: s.updateTime,
        sellerResponseDueDate: s.sellerResponseDueDate,
      };
    }),
    nextPageToken: next ? (new URL(next).searchParams.get("next_page_token") ?? undefined) : undefined,
  };
}

export type ActionResult = { status: number; debugId?: string };
const done = (r: PayPalResult): ActionResult => ({ status: r.status, debugId: r.debugId });

/** INQUIRY stage only (chargebacks answer 422). */
export async function sendMessage(id: string, text: string): Promise<ActionResult> {
  return done(await paypalFetch(`${D}/${enc(id)}/send-message`, { method: "POST", body: JSON.stringify({ message: text }) }));
}

export type OfferType = "REFUND" | "REFUND_WITH_RETURN" | "REFUND_WITH_REPLACEMENT" | "REPLACEMENT_WITHOUT_REFUND";

export async function makeOffer(id: string, o: { offerType: OfferType; amount?: Money; note: string }): Promise<ActionResult> {
  if (o.offerType !== "REPLACEMENT_WITHOUT_REFUND" && !o.amount) throw new Error(`makeOffer: ${o.offerType} needs an amount`);
  const body: Record<string, unknown> = { note: o.note, offer_type: o.offerType };
  if (o.amount) body.offer_amount = o.amount;
  return done(await paypalFetch(`${D}/${enc(id)}/make-offer`, { method: "POST", body: JSON.stringify(body) }));
}

/** Evidence types PayPal asks for on seller disputes (full list in the Disputes API reference). */
export type EvidenceType =
  | "PROOF_OF_FULFILLMENT"
  | "PROOF_OF_REFUND"
  | "PROOF_OF_DELIVERY_SIGNATURE"
  | "PROOF_OF_RECEIPT_COPY"
  | "RETURN_POLICY"
  | "BILLING_AGREEMENT"
  | "PROOF_OF_RESHIPMENT"
  | "ITEM_DESCRIPTION"
  | "DETAILS_OF_PURCHASE"
  | "ONLINE_TRACKING_INFORMATION"
  | "DELIVERY_RECEIPT"
  | "MERCHANT_RESPONSE"
  | "OTHER"
  | (string & {});

export type EvidenceItem = {
  evidenceType: EvidenceType;
  notes?: string;
  trackingInfo?: { carrierName: string; trackingNumber: string; carrierNameOther?: string }[];
  refundIds?: string[];
};

export type EvidenceFile = { name: string; bytes: Uint8Array; contentType: string };

/** PayPal accepts JPG, GIF, PNG and PDF; we cap the whole upload below Vercel's 4.5 MB body limit. */
export const EVIDENCE_MAX_TOTAL_BYTES = 4_500_000;
const EVIDENCE_TYPES = new Set(["application/pdf", "image/png", "image/jpeg", "image/gif"]);

export function evidenceInput(evidences: EvidenceItem[]) {
  return {
    evidences: evidences.map((e) => {
      const out: Record<string, unknown> = { evidence_type: e.evidenceType };
      if (e.notes) out.notes = e.notes.slice(0, 2000);
      const info: Record<string, unknown> = {};
      if (e.trackingInfo?.length) {
        info.tracking_info = e.trackingInfo.map((t) => ({
          carrier_name: t.carrierName,
          tracking_number: t.trackingNumber,
          ...(t.carrierNameOther ? { carrier_name_other: t.carrierNameOther } : {}),
        }));
      }
      if (e.refundIds?.length) info.refund_ids = e.refundIds.map((refund_id) => ({ refund_id }));
      if (Object.keys(info).length) out.evidence_info = info;
      return out;
    }),
  };
}

/**
 * Multipart: `input` JSON part + file1..n. Retries the sandbox's spurious 400 right after the link appears.
 * When an evidence item carries tracking, PayPal rewrites the capture's tracker as SHIPPED; we read the
 * trackers first and put back any status that went down (DELIVERED stays DELIVERED). `trackingRestored`
 * lists the tracking numbers that needed it. Restoring is best effort and never fails the submission.
 */
export async function provideEvidence(
  id: string,
  req: { evidences: EvidenceItem[]; files: EvidenceFile[]; captureId?: string },
): Promise<ActionResult & { trackingRestored?: string[]; trackingRestoreError?: string }> {
  if (!req.evidences.length) throw new Error("provideEvidence: at least one evidence item is required");
  const total = req.files.reduce((n, f) => n + f.bytes.byteLength, 0);
  if (total > EVIDENCE_MAX_TOTAL_BYTES) throw new Error(`provideEvidence: files total ${total} bytes, over the ${EVIDENCE_MAX_TOTAL_BYTES} byte limit`);
  for (const f of req.files) {
    if (!EVIDENCE_TYPES.has(f.contentType)) throw new Error(`provideEvidence: ${f.contentType} not accepted (PDF, PNG, JPG, GIF only)`);
  }

  const withTracking = req.evidences.some((e) => e.trackingInfo?.length);
  let captureId = req.captureId;
  let before: Tracker[] = [];
  let restoreError: string | undefined;
  if (withTracking) {
    try {
      captureId ??= (await getDisputeRaw(id)).json.disputed_transactions?.[0]?.seller_transaction_id;
      if (captureId) before = await getTracking(captureId);
    } catch (e) {
      restoreError = `could not read trackers before submitting: ${(e as Error).message}`;
    }
  }

  const form = new FormData();
  form.append("input", new Blob([JSON.stringify(evidenceInput(req.evidences))], { type: "application/json" }));
  req.files.forEach((f, i) => form.append(`file${i + 1}`, new Blob([f.bytes as Uint8Array<ArrayBuffer>], { type: f.contentType }), f.name));
  const result: ActionResult & { trackingRestored?: string[]; trackingRestoreError?: string } = done(
    await paypalFetch(`${D}/${enc(id)}/provide-evidence`, { method: "POST", body: form, retryOn400: true }),
  );

  if (captureId && before.length) {
    try {
      result.trackingRestored = await restoreTrackers(captureId, before);
    } catch (e) {
      restoreError = `could not restore tracker status: ${(e as Error).message}`;
    }
  }
  if (restoreError) result.trackingRestoreError = restoreError;
  return result;
}

/** Accepts liability: PayPal refunds the buyer (full, or refundAmount when allowed). */
export async function acceptClaim(id: string, o: { note: string; refundAmount?: Money }): Promise<ActionResult> {
  const body: Record<string, unknown> = { note: o.note, accept_claim_type: "REFUND" };
  if (o.refundAmount) body.refund_amount = o.refundAmount;
  return done(await paypalFetch(`${D}/${enc(id)}/accept-claim`, { method: "POST", body: JSON.stringify(body) }));
}

export async function acknowledgeReturn(id: string, note: string): Promise<ActionResult> {
  return done(
    await paypalFetch(`${D}/${enc(id)}/acknowledge-return-item`, {
      method: "POST",
      body: JSON.stringify({ note, acknowledgement_type: "ITEM_RECEIVED" }),
    }),
  );
}
