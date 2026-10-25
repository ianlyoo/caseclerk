// One-command spike flows (sandbox). Run through ./run.sh so keys load from the env file:
//   ./run.sh flow.mjs check                     token + scopes only (does the app have disputes scopes?)
//   ./run.sh flow.mjs chargeback [amount]       (b) card order → capture → process-chargeback → poll list until it appears
//   ./run.sh flow.mjs create <buyer_txn_id> [amount]   (a) buyer-side simulator (needs PAYPAL_SANDBOX_BUYER_EMAIL)
//   ./run.sh flow.mjs buyer-order [amount]     PayPal-wallet order for the sandbox buyer to approve in a browser (prints id + approve URL)
//   ./run.sh flow.mjs inquiry <orderId> [buyer_txn_id]   (a) after buyer approval: capture → create dispute as the buyer → poll for it
//   ./run.sh flow.mjs settle <dispute_id>       message/offer if allowed → require-evidence → provide-evidence → adjudicate SELLER_FAVOR
//   ./run.sh flow.mjs webhook <preview base url>   register the dispute webhook; prints PAYPAL_WEBHOOK_ID
import { api, accessToken, log, show } from "./lib.mjs";
import * as lib from "./lib.mjs";
import { execFileSync } from "node:child_process";

const [cmd, ...args] = process.argv.slice(2);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const D = "/v1/customer/disputes";
const node = (...a) => execFileSync(process.execPath, a, { stdio: "inherit", cwd: import.meta.dirname });
/** Runs one action; true only if the API call succeeded (sandbox actions sometimes 400 right after a link appears). */
const act = (...a) => { try { node(...a); return true; } catch { console.log(`  ${a[0]} ${a[1]} failed; will retry on the next poll`); return false; } };
const PREVIEW = "https://caseclerk-git-spike-ianlyoo0412-4658s-projects.vercel.app";
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
    if (!merchantId) {
      const g = await api("GET", `/v2/checkout/orders/${o.data.id}`, { step: "flow.order.get" });
      merchantId = g.data?.purchase_units?.[0]?.payee?.merchant_id;
    }
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
  case "buyer-order": {
    const amount = args[0] ?? "24.00";
    const o = await api("POST", "/v2/checkout/orders", {
      step: "flow.order(paypal)",
      headers: { "PayPal-Request-Id": `spike-wallet-${Date.now()}` },
      json: {
        intent: "CAPTURE",
        purchase_units: [{
          reference_id: `spike-${Date.now()}`,
          description: "Hand-thrown stoneware mug set",
          amount: { currency_code: "USD", value: amount, breakdown: { item_total: { currency_code: "USD", value: amount } } },
          items: [{ name: "Hand-thrown stoneware mug set (2 × 12 oz, speckled oat)", sku: "MUG-OAT-2", quantity: "1", category: "PHYSICAL_GOODS", unit_amount: { currency_code: "USD", value: amount } }],
        }],
        payment_source: { paypal: { experience_context: {
          brand_name: "CaseClerk Test Store", shipping_preference: "GET_FROM_FILE", user_action: "PAY_NOW",
          return_url: `${PREVIEW}/board?paypal=return`, cancel_url: `${PREVIEW}/board?paypal=cancel`,
        } } },
      },
    });
    if (!o.ok) { show(o.data); process.exit(1); }
    // With payment_source.paypal the buyer link is rel "payer-action" (rel "approve" without payment_source).
    const approve = o.data.links?.find((l) => l.rel === "payer-action" || l.rel === "approve")?.href;
    console.log(`order=${o.data.id} status=${o.data.status} created=${new Date().toISOString()}`);
    console.log(`approve=${approve}`);
    break;
  }
  case "inquiry": {
    // Route (a), end to end after the sandbox buyer approved <orderId> in the browser (and gave consent).
    const [orderId, buyerTxn] = args;
    let o = (await api("GET", `/v2/checkout/orders/${orderId}`, { step: "flow.inquiry.order" })).data;
    console.log(`order=${orderId} status=${o?.status}`);
    if (o?.status === "APPROVED") {
      const c = await api("POST", `/v2/checkout/orders/${orderId}/capture`, { step: "flow.inquiry.capture", headers: { "PayPal-Request-Id": `spike-cap-${orderId}` }, json: {} });
      if (!c.ok) { show(c.data); process.exit(1); }
      o = c.data;
    }
    const pu = o?.purchase_units?.[0];
    const cap = pu?.payments?.captures?.[0];
    if (!cap) { console.log("no capture: the buyer has not approved yet (status CREATED/PAYER_ACTION_REQUIRED) or the order expired"); process.exit(1); }
    const amount = cap.amount?.value ?? pu?.amount?.value ?? "24.00";
    console.log(`capture=${cap.id} (${cap.status}) amount=${amount} payer=${o.payer?.email_address ?? o.payer?.payer_id ?? "?"}`);
    // The buyer-side id isn't exposed to the seller API (needs the buyer's Activity page or Transaction Search).
    // Try the given buyer id first, else the capture id (same payment, seller side).
    const ids = [...new Set([buyerTxn, cap.id].filter(Boolean))];
    for (const txn of ids) {
      console.log(`create dispute (a) with buyer_transaction_id=${txn}`);
      if (!act("disputes.mjs", "create", txn, amount)) continue;
      const t0 = Date.now();
      for (let i = 0; i < 45; i++) {
        const l = await api("GET", `${D}?disputed_transaction_id=${cap.id}`, { step: "flow.inquiry.list" });
        const item = l.data?.items?.find((d) => d.dispute_life_cycle_stage !== "CHARGEBACK") ?? l.data?.items?.[0];
        if (item) {
          console.log(`ROUTE_A_OK dispute ${item.dispute_id} visible after ${Math.round((Date.now() - t0) / 1000)} s: ${item.reason} ${item.status} ${item.dispute_life_cycle_stage}`);
          log({ step: "flow.inquiry.visible", order_id: orderId, capture_id: cap.id, buyer_txn: txn, dispute_id: item.dispute_id, after_s: (Date.now() - t0) / 1000 });
          node("disputes.mjs", "get", item.dispute_id);
          process.exit(0);
        }
        await sleep(20_000);
      }
      console.log("create returned 2xx but the dispute is not listed after 15 min"); process.exit(1);
    }
    console.log(`ROUTE_A_FAILED for ${ids.join(", ")}. If the capture id was rejected, read the buyer's Transaction ID (sandbox buyer → Activity → this payment) and rerun: flow.mjs inquiry ${orderId} <buyer_txn_id>`);
    process.exit(1);
  }
  case "create": {
    node("disputes.mjs", "create", args[0], args[1] ?? "12.00");
    break;
  }
  case "settle": {
    // State loop: act on whichever action link PayPal exposes, until RESOLVED.
    // Order: message/offer (INQUIRY only) → evidence → (sandbox) require-evidence once → adjudicate SELLER_FAVOR.
    const id = args[0];
    const t0 = Date.now();
    const done = new Set();
    let last = "";
    while (Date.now() - t0 < 45 * 60_000) {
      const d = await getDispute(id);
      const l = links(d);
      const key = `${d?.status}/${d?.dispute_life_cycle_stage} links=${l.join(",")}`;
      if (key !== last) { console.log(`+${Math.round((Date.now() - t0) / 1000)}s ${key}`); last = key; }
      if (d?.status === "RESOLVED") { console.log(`outcome=${d.dispute_outcome?.outcome_code}`); break; }
      if (l.includes("send_message") && !done.has("msg")) { if (act("disputes.mjs", "send-message", id)) done.add("msg"); }
      else if (l.includes("make_offer") && !done.has("offer")) { if (act("disputes.mjs", "make-offer", id, "3.00", d.allowed_response_options?.make_offer?.offer_types?.[0] ?? "REFUND")) done.add("offer"); }
      else if (l.includes("provide_evidence") && !done.has(`ev${done.has("req") ? 2 : 1}`)) {
        const requested = d.evidences?.filter((e) => e.source === "REQUESTED_FROM_SELLER").map((e) => e.evidence_type) ?? [];
        const type = done.has("req") ? "OTHER" : (requested.includes("PROOF_OF_FULFILLMENT") || !requested.length ? "PROOF_OF_FULFILLMENT" : requested[0]);
        if (act("disputes.mjs", "provide-evidence", id, type)) done.add(`ev${done.has("req") ? 2 : 1}`);
      }
      else if (l.includes("require_evidence") && !done.has("req")) { if (act("disputes.mjs", "require-evidence", id, "SELLER_EVIDENCE")) done.add("req"); }
      else if (l.includes("adjudicate") && !done.has("adj")) { if (act("disputes.mjs", "adjudicate", id, args[1] ?? "SELLER_FAVOR")) done.add("adj"); }
      await sleep(20_000);
    }
    log({ step: "flow.settle.done", dispute_id: id, total_s: (Date.now() - t0) / 1000, actions: [...done] });
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
