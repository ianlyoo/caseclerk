// Sandbox webhook registrations (webhook ids are identifiers, not secrets).
//   scripts/run.sh scripts/webhooks.ts list
//   scripts/run.sh scripts/webhooks.ts create <https url>
//   scripts/run.sh scripts/webhooks.ts delete <webhook id>
import { paypalFetch } from "../src/lib/paypal/client";

const EVENTS = [
  "CUSTOMER.DISPUTE.CREATED",
  "CUSTOMER.DISPUTE.UPDATED",
  "CUSTOMER.DISPUTE.RESOLVED",
  "PAYMENT.CAPTURE.COMPLETED",
  "PAYMENT.CAPTURE.REVERSED",
  "PAYMENT.CAPTURE.REFUNDED",
];
type Hook = { id: string; url: string; event_types?: { name: string }[] };
const [cmd, arg] = process.argv.slice(2);

if (cmd === "list") {
  const { json } = await paypalFetch<{ webhooks?: Hook[] }>("/v1/notifications/webhooks");
  for (const w of json.webhooks ?? []) console.log(w.id, w.url, (w.event_types ?? []).map((e) => e.name).join(","));
} else if (cmd === "create" && arg) {
  const existing = (await paypalFetch<{ webhooks?: Hook[] }>("/v1/notifications/webhooks")).json.webhooks?.find((w) => w.url === arg);
  if (existing) {
    console.log(`already registered: ${existing.id} ${existing.url}`);
  } else {
    const r = await paypalFetch<Hook>("/v1/notifications/webhooks", { method: "POST", body: JSON.stringify({ url: arg, event_types: EVENTS.map((name) => ({ name })) }) });
    console.log(`created: ${r.json.id} ${r.json.url} (debug_id ${r.debugId})`);
  }
} else if (cmd === "delete" && arg) {
  const r = await paypalFetch(`/v1/notifications/webhooks/${encodeURIComponent(arg)}`, { method: "DELETE" });
  console.log(`deleted ${arg}: ${r.status}`);
} else {
  console.error("usage: webhooks.ts list | create <url> | delete <id>");
  process.exit(2);
}
