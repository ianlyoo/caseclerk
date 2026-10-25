// Fetches a dispute snapshot with W1's getDispute; until that module is on main, a minimal
// normalizer over GET /v1/customer/disputes/{id} keeps the webhook pipeline working.
import { paypalFetch } from "@/lib/paypal/client";
import type { DisputeLinkRel, DisputeSnapshot, DisputeStatus } from "@/lib/types";
import { loadDisputes } from "./modules";

const STATUSES: DisputeStatus[] = ["OPEN", "WAITING_FOR_BUYER_RESPONSE", "WAITING_FOR_SELLER_RESPONSE", "UNDER_REVIEW", "RESOLVED"];
const RELS: DisputeLinkRel[] = [
  "send_message", "make_offer", "provide_evidence", "accept_claim", "acknowledge_return_item",
  "appeal", "escalate", "provide_supporting_info", "require_evidence", "adjudicate",
];

type RawDispute = {
  dispute_id: string;
  reason?: string;
  status?: string;
  dispute_life_cycle_stage?: string;
  dispute_channel?: string;
  dispute_amount?: { value: string; currency_code: string };
  create_time?: string;
  update_time?: string;
  seller_response_due_date?: string;
  buyer_response_due_date?: string;
  disputed_transactions?: { seller_transaction_id?: string; buyer_transaction_id?: string; invoice_number?: string }[];
  dispute_outcome?: { outcome_code?: string };
  evidences?: unknown;
  messages?: { posted_by?: string; time_posted?: string; content?: string }[];
  links?: { rel?: string }[];
  [k: string]: unknown;
};

export function fallbackSnapshot(raw: RawDispute): DisputeSnapshot {
  const tx = raw.disputed_transactions?.[0];
  const status = STATUSES.includes(raw.status as DisputeStatus) ? (raw.status as DisputeStatus) : "OTHER";
  return {
    id: raw.dispute_id,
    reason: raw.reason ?? "UNKNOWN",
    status,
    stage: raw.dispute_life_cycle_stage ?? "UNKNOWN",
    ...(raw.dispute_channel ? { channel: raw.dispute_channel } : {}),
    amount: raw.dispute_amount ?? { value: "0.00", currency_code: "USD" },
    createTime: raw.create_time ?? new Date().toISOString(),
    updateTime: raw.update_time ?? raw.create_time ?? new Date().toISOString(),
    ...(raw.seller_response_due_date ? { sellerResponseDueDate: raw.seller_response_due_date } : {}),
    ...(raw.buyer_response_due_date ? { buyerResponseDueDate: raw.buyer_response_due_date } : {}),
    ...(tx?.seller_transaction_id ? { sellerTransactionId: tx.seller_transaction_id } : {}),
    ...(tx?.buyer_transaction_id ? { buyerTransactionId: tx.buyer_transaction_id } : {}),
    ...(tx?.invoice_number ? { invoiceId: tx.invoice_number } : {}),
    ...(raw.dispute_outcome?.outcome_code ? { outcome: raw.dispute_outcome.outcome_code } : {}),
    messages: (raw.messages ?? []).map((m) => ({
      postedBy: m.posted_by ?? "UNKNOWN",
      at: m.time_posted ?? "",
      content: m.content ?? "",
    })),
    allowed: (raw.links ?? []).map((l) => l.rel as DisputeLinkRel).filter((r) => RELS.includes(r)),
    raw,
  };
}

export async function fetchDisputeSnapshot(id: string): Promise<DisputeSnapshot> {
  const w1 = await loadDisputes();
  if (w1) return w1.getDispute(id);
  // W1's module is on main; this path only runs if it fails to load.
  const res = await paypalFetch<RawDispute>(`/v1/customer/disputes/${encodeURIComponent(id)}`);
  if (res.status < 200 || res.status >= 300 || !res.json) {
    throw new Error(`GET dispute ${res.status} debug_id=${res.debugId ?? "-"}`);
  }
  return fallbackSnapshot(res.json);
}
