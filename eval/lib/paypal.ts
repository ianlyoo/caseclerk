// Minimal sandbox PayPal client for the eval scripts (eval/ only; the app uses W1's src/lib/paypal).
// Keys come from env; nothing here prints them.
import type { DisputeLinkRel, DisputeSnapshot, DisputeStatus } from "../../src/lib/types";
import type { PaypalPort, TrackingInfo } from "../../src/lib/agent/ports";

const BASE = (process.env.PAYPAL_API_BASE ?? "https://api-m.sandbox.paypal.com").replace(/\/$/, "");
if (!/sandbox\.paypal\.com$/.test(new URL(BASE).hostname)) throw new Error("eval: PAYPAL_API_BASE must be the sandbox");

let token: string | null = null;

async function auth(): Promise<string> {
  if (token) return token;
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) throw new Error("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET not set (load the env file)");
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`oauth2/token ${res.status}`);
  token = ((await res.json()) as { access_token: string }).access_token;
  return token;
}

export async function pp<T = Record<string, unknown>>(method: string, path: string, body?: string | FormData): Promise<{ status: number; debugId?: string; json: T }> {
  const headers: Record<string, string> = { Authorization: `Bearer ${await auth()}` };
  if (typeof body === "string") headers["Content-Type"] = "application/json";
  const res = await fetch(`${BASE}${path}`, { method, headers, body });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 200) };
  }
  return { status: res.status, debugId: res.headers.get("paypal-debug-id") ?? undefined, json: json as T };
}

const RELS: DisputeLinkRel[] = ["send_message", "make_offer", "provide_evidence", "accept_claim", "acknowledge_return_item", "appeal", "escalate", "provide_supporting_info", "require_evidence", "adjudicate"];
const STATUSES = ["OPEN", "WAITING_FOR_BUYER_RESPONSE", "WAITING_FOR_SELLER_RESPONSE", "UNDER_REVIEW", "RESOLVED"];

type Raw = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

export function toSnapshot(raw: Raw): DisputeSnapshot {
  const txn = raw.disputed_transactions?.[0] ?? {};
  const rels = new Set((raw.links ?? []).map((l: Raw) => l.rel));
  const requested = [...new Set((raw.evidences ?? []).filter((e: Raw) => e.source === "REQUESTED_FROM_SELLER").map((e: Raw) => e.evidence_type as string))] as string[];
  return {
    id: raw.dispute_id,
    reason: raw.reason,
    status: (STATUSES.includes(raw.status) ? raw.status : "OTHER") as DisputeStatus,
    stage: raw.dispute_life_cycle_stage ?? "UNKNOWN",
    channel: raw.dispute_channel,
    amount: raw.dispute_amount,
    createTime: raw.create_time,
    updateTime: raw.update_time,
    sellerResponseDueDate: raw.seller_response_due_date,
    sellerTransactionId: txn.seller_transaction_id,
    buyerTransactionId: txn.buyer_transaction_id,
    outcome: raw.dispute_outcome?.outcome_code,
    requestedEvidence: requested.length ? requested : undefined,
    messages: (raw.messages ?? []).map((m: Raw) => ({ postedBy: m.posted_by ?? "UNKNOWN", at: m.time_posted ?? "", content: m.content ?? "" })),
    allowed: RELS.filter((r) => rels.has(r)),
  };
}

export async function getDispute(id: string): Promise<DisputeSnapshot> {
  const r = await pp<Raw>("GET", `/v1/customer/disputes/${encodeURIComponent(id)}`);
  if (r.status !== 200) throw new Error(`get dispute ${r.status} (debug ${r.debugId})`);
  return toSnapshot(r.json);
}

export async function listDisputeIds(startTime: string): Promise<string[]> {
  const r = await pp<{ items?: Raw[] }>("GET", `/v1/customer/disputes?start_time=${encodeURIComponent(startTime)}&page_size=50`);
  return (r.json.items ?? []).map((d) => d.dispute_id as string);
}

const done = (r: { status: number; debugId?: string }) => ({ status: r.status, debugId: r.debugId });

/** PaypalPort over raw REST, for eval/run-live.ts until W1's modules are on main. */
export function evalPaypal(): PaypalPort {
  const D = "/v1/customer/disputes";
  return {
    getDispute,
    async getOrderForCapture(captureId) {
      const cap = await pp<Raw>("GET", `/v2/payments/captures/${encodeURIComponent(captureId)}`);
      if (cap.status !== 200) return null;
      const orderId = cap.json.supplementary_data?.related_ids?.order_id as string | undefined;
      if (!orderId) return { captureId, items: [], paidAt: cap.json.create_time };
      const o = await pp<Raw>("GET", `/v2/checkout/orders/${encodeURIComponent(orderId)}`);
      const pu = o.json.purchase_units?.[0] ?? {};
      const items = (pu.items ?? []).map((i: Raw) => ({ name: i.name, quantity: Number(i.quantity ?? 1), unitAmount: i.unit_amount, description: i.description }));
      if (!items.length && pu.description) items.push({ name: pu.description, quantity: 1, unitAmount: pu.amount });
      return { orderId, captureId, items, paidAt: cap.json.create_time, buyerCountry: o.json.payment_source?.card?.billing_address?.country_code };
    },
    async getTracking(captureId): Promise<TrackingInfo[]> {
      const cap = await pp<Raw>("GET", `/v2/payments/captures/${encodeURIComponent(captureId)}`);
      const orderId = cap.json.supplementary_data?.related_ids?.order_id as string | undefined;
      if (!orderId) return [];
      const o = await pp<Raw>("GET", `/v2/checkout/orders/${encodeURIComponent(orderId)}`);
      const trackers = (o.json.purchase_units ?? []).flatMap((u: Raw) => u.shipping?.trackers ?? []);
      return trackers
        .filter((t: Raw) => t.id)
        .map((t: Raw) => {
          // Tracker id is "<captureId>-<trackingNumber>".
          const num = String(t.id).startsWith(`${captureId}-`) ? String(t.id).slice(captureId.length + 1) : String(t.id);
          return { carrier: t.carrier ?? "OTHER", trackingNumber: num, status: t.status };
        });
    },
    sendMessage: async (id, text) => done(await pp("POST", `${D}/${id}/send-message`, JSON.stringify({ message: text }))),
    makeOffer: async (id, o) =>
      done(await pp("POST", `${D}/${id}/make-offer`, JSON.stringify({ note: o.note, offer_type: o.offerType, ...(o.amount ? { offer_amount: o.amount } : {}) }))),
    async provideEvidence(id, req) {
      const input = {
        evidences: req.evidences.map((e) => ({
          evidence_type: e.evidenceType,
          ...(e.notes ? { notes: e.notes.slice(0, 2000) } : {}),
          ...(e.trackingInfo?.length
            ? { evidence_info: { tracking_info: e.trackingInfo.map((t) => ({ carrier_name: t.carrierName, tracking_number: t.trackingNumber })) } }
            : {}),
        })),
      };
      const form = new FormData();
      form.append("input", new Blob([JSON.stringify(input)], { type: "application/json" }));
      req.files.forEach((f, i) => form.append(`file${i + 1}`, new Blob([f.bytes as Uint8Array<ArrayBuffer>], { type: f.contentType }), f.name));
      return done(await pp("POST", `${D}/${id}/provide-evidence`, form));
    },
    acceptClaim: async (id, o) =>
      done(await pp("POST", `${D}/${id}/accept-claim`, JSON.stringify({ note: o.note, accept_claim_type: "REFUND", ...(o.refundAmount ? { refund_amount: o.refundAmount } : {}) }))),
    acknowledgeReturn: async (id, note) => done(await pp("POST", `${D}/${id}/acknowledge-return-item`, JSON.stringify({ note, acknowledgement_type: "ITEM_RECEIVED" }))),
  };
}
