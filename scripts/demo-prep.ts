// Pre-creates sandbox test disputes and drives each to a chosen stage, so a demo or video never waits
// on PayPal (link unlocks took ~3.5 min in the spike and ~19 min per step on 2026-10-25).
//
//   scripts/run.sh scripts/demo-prep.ts --count 2 --stage evidence
//   scripts/run.sh scripts/demo-prep.ts --count 3 --stage resolved --scenario mix
//   scripts/run.sh scripts/demo-prep.ts --ids PP-R-AAA-1,PP-R-BBB-2 --stage review
//
// Stages (each includes the ones before it):
//   evidence  WAITING_FOR_SELLER_RESPONSE with provide_evidence allowed
//   review    seller evidence submitted, dispute UNDER_REVIEW
//   resolved  adjudicated (default SELLER_FAVOR → RESOLVED_WITH_PAYOUT on chargebacks), RESOLVED
//
// Options:
//   --scenario not_received|not_as_described|unauthorized|mix   (default mix)
//   --outcome SELLER_FAVOR|BUYER_FAVOR                            (default SELLER_FAVOR)
//   --agent-grace-min N   at review/resolved, wait N min after evidence opens for the production agent
//                         (webhook → agent) to submit its own pack before this script submits one (default 4)
//   --timeout-min N       give up after N minutes (default 90)
//   --no-record           don't record captures in the database (DATABASE_URL); cases then lack the test badge
//   --item "Name"         one fixed line item instead of random catalog items (free shipping, so the
//                         dispute amount equals the price); needs --amounts
//   --item-desc "..."     item description (optional)      --shop "Name"  shop name on the order
//   --amounts a,b         price per dispute, in order; --count defaults to the number of amounts
//   --reason-code X --card-brand VISA|MASTERCARD   override the scenario's code (same reason only, see README)
//
//   Demo case awaiting approval on camera (stops at evidence; production's agent drafts, nobody approves):
//   scripts/run.sh scripts/demo-prep.ts --stage evidence --scenario not_as_described \
//     --item "Olympus OM-1n body, chrome" --amounts 412.00,389.00 --shop "Northlight Camera Exchange"
//
// Note: production receives the webhooks for these disputes and the agent acts on them as they arrive,
// exactly as in a live demo. Its timeline is what the video shows; this script only fills gaps.
import { buildEvidencePdf } from "../src/lib/evidence/pdf";
import { getDispute, provideEvidence } from "../src/lib/paypal/disputes";
import { getCapture, getOrder, toOrderContext } from "../src/lib/paypal/orders";
import { adjudicate } from "../src/lib/paypal/simulators";
import { openTestDispute, SHOP_NAME, TEST_SCENARIOS, type TestScenario } from "../src/lib/paypal/testDispute";
import { getTracking } from "../src/lib/paypal/tracking";
import type { CardBrand } from "../src/lib/paypal/simulators";
import type { DisputeSnapshot } from "../src/lib/types";

type Stage = "evidence" | "review" | "resolved";
const STAGES: Stage[] = ["evidence", "review", "resolved"];

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : undefined;
}
const stage = (arg("stage") ?? "evidence") as Stage;
const amounts = (arg("amounts") ?? "").split(",").filter(Boolean);
const itemName = arg("item");
const count = Number(arg("count") ?? (amounts.length || (arg("ids") ? 0 : 1)));
const cardBrand = arg("card-brand") as CardBrand | undefined;
const scenarioArg = arg("scenario") ?? "mix";
const outcome = (arg("outcome") ?? "SELLER_FAVOR") as "SELLER_FAVOR" | "BUYER_FAVOR";
const graceMs = Number(arg("agent-grace-min") ?? 4) * 60_000;
const timeoutMs = Number(arg("timeout-min") ?? 90) * 60_000;
const record = !process.argv.includes("--no-record") && Boolean(process.env.DATABASE_URL);
const scenarios = Object.keys(TEST_SCENARIOS) as TestScenario[];

const badItem =
  (itemName !== undefined) !== (amounts.length > 0) ||
  (itemName !== undefined && amounts.length < count) ||
  amounts.some((a) => !/^\d+\.\d{2}$/.test(a)) ||
  (cardBrand !== undefined && cardBrand !== "VISA" && cardBrand !== "MASTERCARD");
if (badItem || !STAGES.includes(stage) || !(scenarioArg === "mix" || scenarios.includes(scenarioArg as TestScenario)) || !(count >= 0 && count <= 10)) {
  console.error("usage: demo-prep.ts --count N(<=10) --stage evidence|review|resolved [--scenario mix|" + scenarios.join("|") + "] [--ids a,b] [--outcome SELLER_FAVOR|BUYER_FAVOR] [--item NAME --amounts 412.00,389.00 [--item-desc D] [--shop S]] [--reason-code X --card-brand VISA|MASTERCARD]");
  process.exit(2);
}

const t0 = Date.now();
const log = (id: string, msg: string) => console.log(`+${String(Math.round((Date.now() - t0) / 1000)).padStart(4)}s ${id.padEnd(18)} ${msg}`);
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Item = { id: string; scenario?: string; evidenceOpenedAt?: number; done?: boolean; last?: string; adjudicated?: boolean; submitted?: boolean };
const items: Item[] = (arg("ids") ?? "").split(",").filter(Boolean).map((id) => ({ id }));

// 1. Create
for (let i = 0; i < count; i++) {
  const scenario = scenarioArg === "mix" ? scenarios[i % 2] : (scenarioArg as TestScenario); // mix alternates INR / SNAD
  const r = await openTestDispute({
    scenario,
    ...(itemName
      ? {
          items: [{ name: itemName, quantity: 1, unitAmount: { currency_code: "USD", value: amounts[i] }, ...(arg("item-desc") ? { description: arg("item-desc") } : {}) }],
          shippingFee: null,
        }
      : {}),
    reasonCode: arg("reason-code"),
    cardBrand,
    shopName: arg("shop"),
  });
  if (!r.disputeId) {
    console.error(`capture ${r.captureId}: dispute id not returned; rerun later with --ids once it is listed`);
    continue;
  }
  if (record) {
    try {
      const { testCaptures } = await import("../src/lib/db");
      await testCaptures.record({ captureId: r.captureId, orderId: r.orderId, disputeId: r.disputeId, scenario, order: r.order });
    } catch (e) {
      log(r.disputeId, `recording the test capture failed (case won't carry the test badge): ${(e as Error).message}`);
    }
  }
  items.push({ id: r.disputeId, scenario });
  log(r.disputeId, `created ${scenario} (${r.reasonCode}) ${r.amount.value} ${r.amount.currency_code} capture=${r.captureId}${record ? " (recorded)" : ""}`);
}
if (!items.length) process.exit(1);
if (!record) console.log("note: not recording test captures (no DATABASE_URL or --no-record); cases won't show the test badge");

const sellerEvidence = (s: DisputeSnapshot) =>
  ((s.raw as { evidences?: { source?: string; dispute_life_cycle_stage?: string }[] })?.evidences ?? []).filter((e) => e.source === "SUBMITTED_BY_SELLER").length;

async function submitEvidence(s: DisputeSnapshot) {
  const captureId = s.sellerTransactionId!;
  const cap = await getCapture(captureId);
  const order = cap.orderId ? toOrderContext(await getOrder(cap.orderId)) : { items: [] };
  const trackers = await getTracking(captureId);
  order.shipping = trackers.map((t) => ({ carrier: t.carrier, trackingNumber: t.trackingNumber, status: t.status, trackingUrl: t.trackingUrl }));
  const tracking = trackers.map((t) => `${t.carrier} ${t.trackingNumber} (${t.status.toLowerCase()})`).join(", ");
  const pdf = await buildEvidencePdf({
    case: { id: s.id, snapshot: s, status: "acting", isTestDispute: true, createdAt: s.createTime, updatedAt: s.updateTime },
    order,
    narrative: `We shipped this order with tracking to the address on the PayPal transaction${tracking ? `: ${tracking}` : ""}. The item matches its listing description and photos. We ask that the chargeback be decided in the seller's favor.`,
    exhibits: [{ title: "Carrier tracking", body: tracking || "No tracking on file." }],
    seller: { name: arg("shop") ?? SHOP_NAME },
    amountCharged: cap.amount,
  });
  const r = await provideEvidence(s.id, {
    captureId,
    evidences: [
      {
        evidenceType: trackers.length ? "PROOF_OF_FULFILLMENT" : "OTHER",
        notes: "Shipped with tracking; see the attached evidence pack.",
        trackingInfo: trackers.map((t) => ({ carrierName: t.carrier, trackingNumber: t.trackingNumber })),
      },
    ],
    files: [{ name: `evidence-${s.id}.pdf`, bytes: pdf, contentType: "application/pdf" }],
  });
  return r;
}

// 2. Drive every dispute until it reaches the stage
while (items.some((i) => !i.done) && Date.now() - t0 < timeoutMs) {
  for (const it of items.filter((i) => !i.done)) {
    let s: DisputeSnapshot;
    try {
      s = await getDispute(it.id);
    } catch (e) {
      log(it.id, `read failed: ${(e as Error).message}`);
      continue;
    }
    const state = `${s.status} [${s.allowed.join(",")}]${s.outcome ? ` ${s.outcome}` : ""}`;
    if (state !== it.last) log(it.id, state);
    it.last = state;
    const hasEvidence = sellerEvidence(s) > 0;

    if (stage === "evidence" && s.allowed.includes("provide_evidence")) it.done = true;
    else if (stage === "review" && hasEvidence && s.status === "UNDER_REVIEW") it.done = true;
    else if (stage === "resolved" && s.status === "RESOLVED") it.done = true;
    else if (s.status === "RESOLVED") {
      log(it.id, `resolved before reaching ${stage}; skipping`);
      it.done = true;
    }
    if (it.done) {
      log(it.id, `reached ${stage}`);
      continue;
    }

    try {
      if (stage !== "evidence" && s.allowed.includes("provide_evidence") && !hasEvidence && !it.submitted) {
        it.evidenceOpenedAt ??= Date.now();
        if (Date.now() - it.evidenceOpenedAt >= graceMs) {
          const r = await submitEvidence(s);
          it.submitted = true;
          log(it.id, `evidence submitted ${r.status} debug_id=${r.debugId}${r.trackingRestored?.length ? ` tracker restored: ${r.trackingRestored.join(",")}` : ""}${r.trackingRestoreError ? ` (${r.trackingRestoreError})` : ""}`);
        }
      } else if (stage === "resolved" && s.allowed.includes("adjudicate") && !it.adjudicated) {
        const r = await adjudicate(it.id, outcome);
        it.adjudicated = true;
        log(it.id, `adjudicate ${outcome} ${r.status} debug_id=${r.debugId}`);
      }
    } catch (e) {
      log(it.id, `action failed, will retry: ${(e as Error).message}`);
    }
  }
  if (items.some((i) => !i.done)) await sleep(30_000);
}

// 3. Summary
console.log("\nsummary");
for (const it of items) {
  const s = await getDispute(it.id).catch(() => undefined);
  const trackers = s?.sellerTransactionId ? await getTracking(s.sellerTransactionId).catch(() => []) : [];
  console.log(`${it.id}  ${it.done ? "ready" : "NOT READY"}  ${s?.reason ?? "?"}  ${s?.status ?? "?"}${s?.outcome ? ` ${s.outcome}` : ""}  tracking=${trackers.map((t) => t.status).join(",") || "-"}`);
}
console.log(`total ${Math.round((Date.now() - t0) / 60_000)} min`);
process.exit(items.every((i) => i.done) ? 0 : 1);
