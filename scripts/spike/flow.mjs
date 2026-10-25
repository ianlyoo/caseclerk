// One-command spike flows (sandbox). Run through ./run.sh so keys load from the env file:
//   ./run.sh flow.mjs check                     token + scopes only (does the app have disputes scopes?)
//   ./run.sh flow.mjs chargeback [amount]       (b) card order → capture → process-chargeback → poll list until it appears
//   ./run.sh flow.mjs create <buyer_txn_id> [amount]   (a) buyer-side simulator (needs PAYPAL_SANDBOX_BUYER_EMAIL)
//   ./run.sh flow.mjs settle <dispute_id>       message/offer if allowed → require-evidence → provide-evidence → adjudicate SELLER_FAVOR
//   ./run.sh flow.mjs webhook <preview base url>   register the dispute webhook; prints PAYPAL_WEBHOOK_ID
import { api, accessToken, log, show } from "./lib.mjs";
import * as lib from "./lib.mjs";
import { execFileSync } from "node:child_process";

const [cmd, ...args] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const D = "/v1/customer/disputes";
const node = (...a) => execFileSync(process.execPath, a, { stdio: "inherit", cwd: import.meta.dirname });
const links = (d) => (d?.links ?? []).map((l) => l.rel);

async function getDispute(id) {
  const r = await api("GET", `${D}/${id}`, { step: "flow.get" });
  return r.data;
}

/** Polls until predicate(dispute) is true or timeout; logs every status/stage/links change. */
async function waitFor(id, predicate, label, timeoutS = 900) {
  const t0 = Date.now();
  let last = "";
  while (Date.now() - t0 < timeoutS * 1000) {
    const d = await getDispute(id);
    const key = `${d?.status}/${d?.dispute_life_cycle_stage} links=${links(d).join(",")}`;
    if (key !== last) { console.log(`  +${Math.round((Date.now() - t0) / 1000)}s ${key}`); last = key; }
    if (predicate(d)) { log({ step: `flow.wait ${label}`, dispute_id: id, waited_s: (Date.now() - t0) / 1000, state: key }); return d; }
    await sleep(20_000);
  }
  throw new Error(`timeout waiting for ${label} on ${id}`);
}

switch (cmd) {
  case "check": {
    await accessToken();
    const scopes = lib.tokenScope.split(" ").filter((s) => s.includes("dispute"));
    console.log(`token ok; dispute scopes: ${scopes.join(" ") || "(none)"}`);
    console.log(`create-dispute simulator scope present: ${scopes.some((s) => s.endsWith("/disputes/create"))}`);
    break;
  }
  case "chargeback": {
    const amount = args[0] ?? "12.00";
    const o = await api("POST", "/v2/checkout/orders", {
      step: "flow.order(card)",
      headers: { "PayPal-Request-Id": `spike-card-${Date.now()}` },
      json: {
        intent: "CAPTURE",
        purchase_units: [{ reference_id: `spike-${Date.now()}`, description: "CaseClerk spike test item", amount: { currency_code: "USD", value: amount } }],
        // PayPal's documented sandbox Visa test number; not a real card.
        payment_source: { card: { number: "4032039317984658", expiry: "2030-12", security_code: "123", name: "Spike Tester" } },
      },
    });
    let cap = o.data?.purchase_units?.[0]?.payments?.captures?.[0];
    let merchantId = o.data?.purchase_units?.[0]?.payee?.merchant_id;
    if (o.data?.status === "APPROVED" || (!cap && o.ok)) {
      const c = await api("POST", `/v2/checkout/orders/${o.data.id}/capture`, { step: "flow.capture", json: {} });
      cap = c.data?.purchase_units?.[0]?.payments?.captures?.[0];
      merchantId ??= c.data?.purchase_units?.[0]?.payee?.merchant_id;
    }
    if (!cap) { show(o.data); process.exit(1); }
    console.log(`order=${o.data.id} capture=${cap.id} (${cap.status}) merchant_id=${merchantId}`);
    node("disputes.mjs", "chargeback", cap.id, merchantId, amount);
    const t0 = Date.now();
    for (let i = 0; i < 45; i++) {
      const r = await api("GET", `${D}?disputed_transaction_id=${cap.id}`, { step: "flow.list-by-txn" });
      const item = r.data?.items?.[0];
      if (item) {
        console.log(`dispute ${item.dispute_id} visible after ${Math.round((Date.now() - t0) / 1000)} s: ${item.reason} ${item.status} ${item.dispute_life_cycle_stage}`);
        log({ step: "flow.chargeback.visible", capture_id: cap.id, dispute_id: item.dispute_id, after_s: (Date.now() - t0) / 1000 });
        node("disputes.mjs", "get", item.dispute_id);
        process.exit(0);
      }
      await sleep(20_000);
    }
    console.log("dispute not listed after 15 min");
    process.exit(1);
  }
  case "create": {
    node("disputes.mjs", "create", args[0], args[1] ?? "12.00");
    break;
  }
  case "settle": {
    const id = args[0];
    let d = await getDispute(id);
    console.log(`start: ${d.reason} ${d.status}/${d.dispute_life_cycle_stage} links=${links(d)}`);
    if (links(d).includes("send_message")) node("disputes.mjs", "send-message", id);
    if (links(d).includes("make_offer")) node("disputes.mjs", "make-offer", id, "3.00", d.allowed_response_options?.make_offer?.offer_types?.[0] ?? "REFUND");
    if (!links(d).includes("provide_evidence")) {
      d = await waitFor(id, (x) => x?.status === "UNDER_REVIEW" || links(x).includes("provide_evidence") || links(x).includes("require_evidence"), "under-review-or-evidence");
      if (links(d).includes("require_evidence")) node("disputes.mjs", "require-evidence", id, "SELLER_EVIDENCE");
      d = await waitFor(id, (x) => links(x).includes("provide_evidence"), "provide_evidence link");
    }
    const requested = d.evidences?.find((e) => e.source === "REQUESTED_FROM_SELLER")?.evidence_type;
    node("disputes.mjs", "provide-evidence", id, requested === "PROOF_OF_FULFILLMENT" ? "PROOF_OF_FULFILLMENT" : (requested ?? "PROOF_OF_FULFILLMENT"));
    d = await waitFor(id, (x) => links(x).includes("adjudicate"), "adjudicate link");
    node("disputes.mjs", "adjudicate", id, "SELLER_FAVOR");
    await waitFor(id, (x) => x?.status === "RESOLVED", "RESOLVED");
    node("disputes.mjs", "get", id);
    break;
  }
  case "webhook": {
    node("webhooks.mjs", "create", `${args[0].replace(/\/$/, "")}/api/webhooks/paypal`);
    break;
  }
  default:
    console.error("see header for usage");
    process.exit(2);
}
