// Refunds with a dispute guard: refunding a capture that has an open dispute can pay the buyer twice
// (refund + chargeback payout), so we refuse and point the caller at accept-claim / make-offer instead.
import type { Money } from "../types";
import { paypalFetch } from "./client";
import { listDisputes } from "./disputes";
import { getCapture } from "./orders";

export class RefundBlockedError extends Error {
  readonly captureId: string;
  readonly disputeId?: string;
  constructor(captureId: string, reason: string, disputeId?: string) {
    super(`Refund refused for capture ${captureId}: ${reason}`);
    this.name = "RefundBlockedError";
    this.captureId = captureId;
    this.disputeId = disputeId;
  }
}

const REFUNDABLE = new Set(["COMPLETED", "PARTIALLY_REFUNDED"]);

export type RefundResult = { refundId: string; status: string; amount?: Money; httpStatus: number; debugId?: string };

/**
 * Refunds a capture (full when amount is omitted). Refuses when any dispute on the capture
 * isn't RESOLVED, or the capture isn't refundable. Note: a brand-new chargeback is listed
 * only 42–70 s after it's filed, so this guard can't see it inside that window.
 */
export async function refundCapture(captureId: string, amount?: Money, opts: { note?: string; requestId?: string } = {}): Promise<RefundResult> {
  const { items } = await listDisputes({ disputedTransactionId: captureId, pageSize: 50 });
  const open = items.find((d) => d.status !== "RESOLVED");
  if (open) throw new RefundBlockedError(captureId, `dispute ${open.id} is ${open.status}; resolve it through the dispute (accept claim or offer) instead`, open.id);

  const cap = await getCapture(captureId);
  if (!REFUNDABLE.has(cap.status)) throw new RefundBlockedError(captureId, `capture status is ${cap.status}`);
  if (amount && amount.currency_code !== cap.amount.currency_code) throw new RefundBlockedError(captureId, "currency mismatch");
  if (amount && Number(amount.value) > Number(cap.amount.value)) throw new RefundBlockedError(captureId, `amount ${amount.value} exceeds capture ${cap.amount.value}`);

  const body: Record<string, unknown> = {};
  if (amount) body.amount = amount;
  if (opts.note) body.note_to_payer = opts.note.slice(0, 255);
  const res = await paypalFetch<{ id: string; status: string; amount?: Money }>(`/v2/payments/captures/${encodeURIComponent(captureId)}/refund`, {
    method: "POST",
    body: JSON.stringify(body),
    requestId: opts.requestId ?? `cc-refund-${captureId}-${Date.now()}`,
  });
  return { refundId: res.json.id, status: res.json.status, amount: res.json.amount ?? amount, httpStatus: res.status, debugId: res.debugId };
}
