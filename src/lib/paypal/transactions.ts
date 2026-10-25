// Transaction Search API (/v1/reporting/transactions). Needs "Transaction search" ticked on the
// REST app; until then PayPal answers 403 NOT_AUTHORIZED and we throw NotEnabledError.
import type { Money } from "../types";
import { NotEnabledError, PayPalError, paypalFetch } from "./client";

export type TransactionSearch =
  | { transactionId: string; startDate?: string; endDate?: string }
  | { dateRange: { start: string; end: string }; transactionId?: undefined; startDate?: undefined; endDate?: undefined };

export type TransactionRecord = {
  transactionId: string;
  eventCode?: string; // T0006 checkout, T1106 chargeback, T1107 refund, ...
  status?: string; // S success, P pending, D denied, V reversed
  amount?: Money;
  fee?: Money;
  initiatedAt?: string;
  updatedAt?: string;
  invoiceId?: string;
  payerCountry?: string;
  items?: { name?: string; quantity?: string; unitPrice?: Money }[];
};

const DAY = 86_400_000;

export async function searchTransactions(q: TransactionSearch): Promise<TransactionRecord[]> {
  const p = new URLSearchParams({ fields: "transaction_info,payer_info,cart_info", page_size: "100" });
  let start: Date;
  let end: Date;
  if ("dateRange" in q && q.dateRange) {
    start = new Date(q.dateRange.start);
    end = new Date(q.dateRange.end);
  } else {
    // PayPal requires a date window (max 31 days); default to the last 30 days around the lookup.
    end = q.endDate ? new Date(q.endDate) : new Date();
    start = q.startDate ? new Date(q.startDate) : new Date(end.getTime() - 30 * DAY);
  }
  if (end.getTime() - start.getTime() > 31 * DAY) throw new Error("searchTransactions: date range over 31 days");
  p.set("start_date", start.toISOString().replace(/\.\d{3}Z$/, "Z"));
  p.set("end_date", end.toISOString().replace(/\.\d{3}Z$/, "Z"));
  if (q.transactionId) p.set("transaction_id", q.transactionId);

  try {
    const { json } = await paypalFetch<{ transaction_details?: RawDetail[] }>(`/v1/reporting/transactions?${p}`);
    return (json?.transaction_details ?? []).map(toRecord);
  } catch (err) {
    if (err instanceof PayPalError && (err.status === 403 || err.errorName === "NOT_AUTHORIZED")) {
      throw new NotEnabledError("Transaction Search", err);
    }
    throw err;
  }
}

type RawDetail = {
  transaction_info?: {
    transaction_id: string;
    transaction_event_code?: string;
    transaction_status?: string;
    transaction_amount?: Money;
    fee_amount?: Money;
    transaction_initiation_date?: string;
    transaction_updated_date?: string;
    invoice_id?: string;
  };
  payer_info?: { country_code?: string };
  cart_info?: { item_details?: { item_name?: string; item_quantity?: string; item_unit_price?: Money }[] };
};

function toRecord(d: RawDetail): TransactionRecord {
  const t = d.transaction_info;
  return {
    transactionId: t?.transaction_id ?? "",
    eventCode: t?.transaction_event_code,
    status: t?.transaction_status,
    amount: t?.transaction_amount,
    fee: t?.fee_amount,
    initiatedAt: t?.transaction_initiation_date,
    updatedAt: t?.transaction_updated_date,
    invoiceId: t?.invoice_id,
    payerCountry: d.payer_info?.country_code,
    items: d.cart_info?.item_details?.map((i) => ({ name: i.item_name, quantity: i.item_quantity, unitPrice: i.item_unit_price })),
  };
}
