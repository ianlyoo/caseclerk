// Usage:
//   node orders.mjs create-paypal <amount>        → order for buyer approval in the browser (prints approve URL)
//   node orders.mjs create-card <amount>          → order paid with a sandbox test card (no buyer approval)
//   node orders.mjs get <orderId>
//   node orders.mjs capture <orderId>
import { api, show } from "./lib.mjs";

const [cmd, arg] = process.argv.slice(2);
const unit = (amount) => [{
  reference_id: `spike-${Date.now()}`,
  description: "CaseClerk spike test item",
  amount: { currency_code: "USD", value: amount },
}];

if (cmd === "create-paypal") {
  const r = await api("POST", "/v2/checkout/orders", {
    step: "orders.create(paypal)",
    json: {
      intent: "CAPTURE",
      purchase_units: unit(arg ?? "12.00"),
      payment_source: { paypal: { experience_context: {
        shipping_preference: "NO_SHIPPING", user_action: "PAY_NOW",
        return_url: "https://example.com/return", cancel_url: "https://example.com/cancel",
      } } },
    },
  });
  show({ id: r.data?.id, status: r.data?.status, links: r.data?.links?.map((l) => `${l.rel} ${l.href}`) ?? r.data });
} else if (cmd === "create-card") {
  // PayPal's documented sandbox Visa test number; not a real card.
  const r = await api("POST", "/v2/checkout/orders", {
    step: "orders.create(card)",
    headers: { "PayPal-Request-Id": `spike-card-${Date.now()}` },
    json: {
      intent: "CAPTURE",
      purchase_units: unit(arg ?? "12.00"),
      payment_source: { card: { number: "4032039317984658", expiry: "2030-12", security_code: "123", name: "Spike Tester" } },
    },
  });
  const cap = r.data?.purchase_units?.[0]?.payments?.captures?.[0];
  show({ id: r.data?.id, status: r.data?.status, capture_id: cap?.id, capture_status: cap?.status, payee: r.data?.purchase_units?.[0]?.payee, err: r.ok ? undefined : r.data });
} else if (cmd === "get") {
  const r = await api("GET", `/v2/checkout/orders/${arg}`);
  show({ id: r.data?.id, status: r.data?.status, payer_id: r.data?.payer?.payer_id, payee: r.data?.purchase_units?.[0]?.payee, captures: r.data?.purchase_units?.[0]?.payments?.captures?.map((c) => ({ id: c.id, status: c.status })) });
} else if (cmd === "capture") {
  const r = await api("POST", `/v2/checkout/orders/${arg}/capture`, { step: "orders.capture", json: {} });
  const cap = r.data?.purchase_units?.[0]?.payments?.captures?.[0];
  show({ id: r.data?.id, status: r.data?.status, capture_id: cap?.id, capture_status: cap?.status, payer_id: r.data?.payer?.payer_id, payee_merchant_id: r.data?.purchase_units?.[0]?.payee?.merchant_id, err: r.ok ? undefined : r.data });
} else {
  console.error("usage: orders.mjs create-paypal|create-card|get|capture …");
  process.exit(2);
}
