// Usage:
//   node webhooks.mjs list
//   node webhooks.mjs create <https url>        → prints the webhook id (an identifier, not a secret)
//   node webhooks.mjs delete <webhook id>
//   node webhooks.mjs simulate <webhook id> <event_type>   (fallback only: simulator events can't be signature-verified)
import { api, show } from "./lib.mjs";

const [cmd, arg, arg2] = process.argv.slice(2);
const EVENTS = ["CUSTOMER.DISPUTE.CREATED", "CUSTOMER.DISPUTE.UPDATED", "CUSTOMER.DISPUTE.RESOLVED", "PAYMENT.CAPTURE.COMPLETED", "PAYMENT.CAPTURE.REVERSED", "PAYMENT.CAPTURE.REFUNDED"];

if (cmd === "list") {
  const r = await api("GET", "/v1/notifications/webhooks");
  show(r.data?.webhooks?.map((w) => ({ id: w.id, url: w.url, events: w.event_types?.map((e) => e.name) })) ?? r.data);
} else if (cmd === "create") {
  const r = await api("POST", "/v1/notifications/webhooks", { step: "webhooks.create", json: { url: arg, event_types: EVENTS.map((name) => ({ name })) } });
  show(r.ok ? { id: r.data.id, url: r.data.url } : r.data);
} else if (cmd === "delete") {
  const r = await api("DELETE", `/v1/notifications/webhooks/${arg}`);
  show(r.status);
} else if (cmd === "simulate") {
  const r = await api("POST", "/v1/notifications/simulate-event", { step: "webhooks.simulate", json: { webhook_id: arg, event_type: arg2, resource_version: "1.0" } });
  show(r.ok ? { id: r.data.id, event_type: r.data.event_type } : r.data);
} else {
  console.error("usage: webhooks.mjs list|create|delete|simulate");
  process.exit(2);
}
