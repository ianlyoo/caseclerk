// Orders v2 + Payments v2 (captures). The card route completes without a buyer (sandbox test card).
import type { Money, OrderContext } from "../types";
import { paypalFetch } from "./client";

export type OrderItemInput = { name: string; quantity: number; unitAmount: Money; sku?: string; description?: string };
export type ShippingInput = {
  name: string;
  address: { line1: string; line2?: string; city: string; state: string; postalCode: string; countryCode: string };
  amount?: Money; // shipping charge
};

export type PaidOrder = {
  orderId: string;
  captureId: string;
  captureStatus: string;
  amount: Money;
  merchantId?: string;
  createTime?: string;
  debugId?: string;
};

/** PayPal's documented sandbox Visa test number (not a real card). */
const SANDBOX_VISA = { number: "4032039317984658", expiry: "2030-12", security_code: "123" };

const money = (value: number, currency_code: string): Money => ({ currency_code, value: value.toFixed(2) });
const cents = (m: Money) => Math.round(Number(m.value) * 100);

/**
 * Creates and captures a card order in one call (intent CAPTURE + payment_source.card):
 * PayPal returns status COMPLETED with the capture inside, no buyer approval needed.
 */
export async function createPaidCardOrder(o: {
  items: OrderItemInput[];
  shipping?: ShippingInput;
  amount?: Money; // optional cross-check; computed from items + shipping
  invoiceId?: string;
  description?: string;
  cardholderName?: string;
  requestId?: string;
}): Promise<PaidOrder> {
  if (!o.items.length) throw new Error("createPaidCardOrder: no items");
  const currency = o.items[0].unitAmount.currency_code;
  const itemCents = o.items.reduce((n, i) => n + cents(i.unitAmount) * i.quantity, 0);
  const shipCents = o.shipping?.amount ? cents(o.shipping.amount) : 0;
  const total = money((itemCents + shipCents) / 100, currency);
  if (o.amount && cents(o.amount) !== itemCents + shipCents) {
    throw new Error(`createPaidCardOrder: amount ${o.amount.value} != items + shipping ${total.value}`);
  }
  const breakdown: Record<string, Money> = { item_total: money(itemCents / 100, currency) };
  if (shipCents) breakdown.shipping = money(shipCents / 100, currency);

  const purchaseUnit: Record<string, unknown> = {
    reference_id: o.invoiceId ?? `cc-${Date.now()}`,
    description: o.description,
    invoice_id: o.invoiceId,
    amount: { ...total, breakdown },
    items: o.items.map((i) => ({
      name: i.name.slice(0, 127),
      quantity: String(i.quantity),
      unit_amount: i.unitAmount,
      sku: i.sku,
      description: i.description?.slice(0, 127),
      category: "PHYSICAL_GOODS",
    })),
  };
  if (o.shipping) {
    const a = o.shipping.address;
    purchaseUnit.shipping = {
      type: "SHIPPING",
      name: { full_name: o.shipping.name },
      address: {
        address_line_1: a.line1,
        address_line_2: a.line2,
        admin_area_2: a.city,
        admin_area_1: a.state,
        postal_code: a.postalCode,
        country_code: a.countryCode,
      },
    };
  }

  const res = await paypalFetch<RawOrder>("/v2/checkout/orders", {
    method: "POST",
    requestId: o.requestId ?? `cc-order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [purchaseUnit],
      payment_source: { card: { ...SANDBOX_VISA, name: o.cardholderName ?? "Sandbox Buyer" } },
    }),
  });
  let order = res.json;
  let pu = order.purchase_units?.[0];
  let cap = pu?.payments?.captures?.[0];
  if (!cap && order.status === "APPROVED") {
    const c = await paypalFetch<RawOrder>(`/v2/checkout/orders/${order.id}/capture`, { method: "POST", body: "{}" });
    order = c.json;
    pu = order.purchase_units?.[0];
    cap = pu?.payments?.captures?.[0];
  }
  if (!cap) throw new Error(`createPaidCardOrder: order ${order.id} has status ${order.status} and no capture (debug_id ${res.debugId ?? "?"})`);
  if (cap.status === "DECLINED" || cap.status === "FAILED") throw new Error(`createPaidCardOrder: capture ${cap.id} ${cap.status}`);
  let merchantId = pu?.payee?.merchant_id;
  if (!merchantId) merchantId = (await getOrder(order.id)).purchase_units?.[0]?.payee?.merchant_id;
  return {
    orderId: order.id,
    captureId: cap.id,
    captureStatus: cap.status,
    amount: cap.amount ?? total,
    merchantId,
    createTime: cap.create_time ?? order.create_time,
    debugId: res.debugId,
  };
}

export type RawOrder = {
  id: string;
  status: string;
  create_time?: string;
  update_time?: string;
  purchase_units?: {
    reference_id?: string;
    invoice_id?: string;
    description?: string;
    amount?: Money & { breakdown?: Record<string, Money> };
    payee?: { merchant_id?: string; email_address?: string };
    items?: { name: string; quantity: string; unit_amount: Money; sku?: string; description?: string }[];
    shipping?: {
      name?: { full_name?: string };
      address?: { country_code?: string; [k: string]: unknown };
      trackers?: { id: string; status?: string; items?: unknown[]; create_time?: string; update_time?: string }[];
    };
    payments?: { captures?: { id: string; status: string; amount?: Money; create_time?: string }[] };
  }[];
  payer?: { address?: { country_code?: string } };
  [k: string]: unknown;
};

export async function getOrder(id: string): Promise<RawOrder> {
  return (await paypalFetch<RawOrder>(`/v2/checkout/orders/${encodeURIComponent(id)}`)).json;
}

export type Capture = {
  id: string;
  status: string; // COMPLETED | DECLINED | PARTIALLY_REFUNDED | PENDING | REFUNDED | FAILED
  amount: Money;
  invoiceId?: string;
  orderId?: string;
  createTime?: string;
  updateTime?: string;
  statusReason?: string;
};

export async function getCapture(id: string): Promise<Capture> {
  const { json } = await paypalFetch<{
    id: string;
    status: string;
    amount: Money;
    invoice_id?: string;
    create_time?: string;
    update_time?: string;
    status_details?: { reason?: string };
    supplementary_data?: { related_ids?: { order_id?: string } };
  }>(`/v2/payments/captures/${encodeURIComponent(id)}`);
  return {
    id: json.id,
    status: json.status,
    amount: json.amount,
    invoiceId: json.invoice_id,
    orderId: json.supplementary_data?.related_ids?.order_id,
    createTime: json.create_time,
    updateTime: json.update_time,
    statusReason: json.status_details?.reason,
  };
}

/** Maps a raw order (no PII: names and addresses are dropped, only the country is kept) to OrderContext. */
export function toOrderContext(order: RawOrder): OrderContext {
  const pu = order.purchase_units?.[0];
  const cap = pu?.payments?.captures?.[0];
  return {
    orderId: order.id,
    captureId: cap?.id,
    items: (pu?.items ?? []).map((i) => ({
      name: i.name,
      quantity: Number(i.quantity),
      unitAmount: i.unit_amount,
      description: i.description,
    })),
    buyerCountry: pu?.shipping?.address?.country_code ?? order.payer?.address?.country_code,
    paidAt: cap?.create_time ?? order.create_time,
  };
}
