// What the seller ended up with on a resolved dispute, from PayPal's own numbers only:
// the dispute's fund_movements (holds and releases on the seller's balance) and the capture's
// seller_receivable_breakdown (gross − PayPal fee = net). Anything PayPal doesn't state → null.
import type { DisputeSnapshot, Money } from "../types";
import { getCapture, type Capture } from "./orders";

export type FundMovement = {
  type: "DEBIT" | "CREDIT";
  reason?: string; // e.g. HOLD_PLACED, HOLD_RELEASED
  amount: Money;
  at?: string;
};

export type CaseMoney = {
  gross: Money; // the capture
  fee: Money; // PayPal's transaction fee on the capture (not a dispute fee)
  net: Money; // gross − fee
  kept: Money; // net + the seller's fund_movements (credits − debits)
  source: "paypal_fund_movements";
  at: string; // when CaseClerk read these numbers from PayPal
  captureId: string;
  movements: FundMovement[]; // the seller's (RECEIVER) movements, oldest first
};

type RawFundMovement = {
  party?: string;
  type?: string;
  reason?: string;
  amount?: Money;
  initiated_time?: string;
};

const MONEY = /^-?\d+(\.\d{1,2})?$/;
const cents = (m: Money) => Math.round(Number(m.value) * 100);
const money = (c: number, currency_code: string): Money => ({ currency_code, value: (c / 100).toFixed(2) });

/** The seller's fund movements on a raw dispute, or null if PayPal doesn't list any (or lists something unreadable). */
export function sellerFundMovements(rawDispute: unknown): FundMovement[] | null {
  const list = (rawDispute as { fund_movements?: RawFundMovement[] } | null)?.fund_movements;
  if (!Array.isArray(list)) return null;
  const out: FundMovement[] = [];
  for (const f of list) {
    if (f?.party !== "RECEIVER") continue;
    if ((f.type !== "DEBIT" && f.type !== "CREDIT") || !f.amount?.currency_code || !MONEY.test(f.amount.value ?? "")) return null;
    out.push({ type: f.type, reason: f.reason, amount: { currency_code: f.amount.currency_code, value: f.amount.value }, at: f.initiated_time });
  }
  if (!out.length) return null;
  return out.sort((a, b) => (a.at ?? "").localeCompare(b.at ?? ""));
}

/**
 * Pure: money for a RESOLVED dispute, or null when PayPal doesn't state it. Null when: the dispute
 * isn't RESOLVED or has no seller fund movements; the capture lacks gross/fee/net; the capture isn't
 * COMPLETED (a refund isn't a fund movement, so "kept" would be wrong); currencies differ.
 */
export function computeCaseMoney(snapshot: DisputeSnapshot, capture: Capture | null, at: string): CaseMoney | null {
  if (snapshot.status !== "RESOLVED" || !capture) return null;
  if (capture.id !== snapshot.sellerTransactionId || capture.status !== "COMPLETED") return null;
  const movements = sellerFundMovements(snapshot.raw);
  const { gross, fee, net } = capture.sellerReceivable ?? {};
  if (!movements || !gross || !fee || !net) return null;
  const cur = gross.currency_code;
  if (![gross, fee, net, ...movements.map((m) => m.amount)].every((m) => m.currency_code === cur && MONEY.test(m.value))) return null;
  if (cents(gross) - cents(fee) !== cents(net)) return null;
  const kept = movements.reduce((sum, m) => sum + (m.type === "CREDIT" ? 1 : -1) * cents(m.amount), cents(net));
  return {
    gross: { ...gross },
    fee: { ...fee },
    net: { ...net },
    kept: money(kept, cur),
    source: "paypal_fund_movements",
    at,
    captureId: capture.id,
    movements,
  };
}

/** Whether reading the capture could produce money for this snapshot (saves a PayPal call when it can't). */
export function moneyMayBeStated(snapshot: DisputeSnapshot): boolean {
  return snapshot.status === "RESOLVED" && Boolean(snapshot.sellerTransactionId) && sellerFundMovements(snapshot.raw) !== null;
}

/** Reads the capture (one PayPal GET) and computes the money; null when PayPal doesn't state it. Throws on PayPal errors. */
export async function fetchCaseMoney(snapshot: DisputeSnapshot): Promise<CaseMoney | null> {
  if (!moneyMayBeStated(snapshot)) return null;
  const capture = await getCapture(snapshot.sellerTransactionId!);
  return computeCaseMoney(snapshot, capture, new Date().toISOString());
}
