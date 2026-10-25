// Live sandbox contract tests. Off by default; run with scripts/test-live.sh (loads the key file).
// Creates real sandbox orders/chargebacks (no real money) and submits evidence on one waiting dispute.
import { appendFileSync, mkdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { getToken, NotEnabledError } from "../../src/lib/paypal/client";
import { getDispute, getDisputeRaw, listDisputes, provideEvidence, toSnapshot } from "../../src/lib/paypal/disputes";
import { getCapture, getOrder, toOrderContext } from "../../src/lib/paypal/orders";
import { getTracking } from "../../src/lib/paypal/tracking";
import { searchTransactions } from "../../src/lib/paypal/transactions";
import { openTestDispute, TEST_SCENARIOS, type TestScenario } from "../../src/lib/paypal/testDispute";
import { buildEvidencePdf } from "../../src/lib/evidence/pdf";

const live = process.env.PAYPAL_LIVE_TESTS === "1";
// Results also go to .scratch/live-results.log (gitignored) so a run leaves a record of the ids it touched.
const log = (...a: unknown[]) => {
  const line = `${new Date().toISOString()} ${a.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join(" ")}`;
  console.log("[live]", line);
  mkdirSync(".scratch", { recursive: true });
  appendFileSync(".scratch/live-results.log", line + "\n");
};

describe.skipIf(!live)("PayPal sandbox (live)", () => {
  it("gets a token with dispute scopes", async () => {
    const t = await getToken();
    expect(t.token.length).toBeGreaterThan(20);
    for (const s of ["disputes/read-seller", "disputes/update-seller", "shipping/trackers/readwrite"]) expect(t.scope).toContain(s);
  });

  it("lists disputes and maps each one with getDispute", async () => {
    const { items } = await listDisputes({ pageSize: 10 });
    expect(items.length).toBeGreaterThan(0);
    const s = await getDispute(items[0].id);
    expect(s.id).toBe(items[0].id);
    expect(s.amount.value).toMatch(/^\d+\.\d{2}$/);
    log("list", items.length, "first", s.id, s.status, s.stage, s.allowed.join(","));
  });

  it("toSnapshot on a live payload matches the raw fields", async () => {
    const { items } = await listDisputes({ pageSize: 10 });
    const { json, debugId } = await getDisputeRaw(items[0].id);
    const s = toSnapshot(json);
    expect(debugId).toBeTruthy();
    expect(s.reason).toBe(json.reason);
    expect(s.sellerTransactionId).toBe(json.disputed_transactions?.[0]?.seller_transaction_id);
    expect(s.allowed).toEqual((json.links ?? []).map((l) => l.rel).filter((r) => r !== "self" && s.allowed.includes(r as never)));
  });

  for (const scenario of Object.keys(TEST_SCENARIOS) as TestScenario[]) {
    it(`openTestDispute(${scenario}) end to end`, { timeout: 180_000 }, async () => {
      const t0 = Date.now();
      const r = await openTestDispute({ scenario });
      log(scenario, { disputeId: r.disputeId, orderId: r.orderId, captureId: r.captureId, amount: r.amount.value, resolvedAfterMs: r.resolvedAfterMs, totalMs: Date.now() - t0 });
      expect(r.disputeId).toMatch(/^PP-R-/);
      const s = await getDispute(r.disputeId!);
      expect(s.reason).toBe(TEST_SCENARIOS[scenario].reason);
      expect(s.stage).toBe("CHARGEBACK");
      expect(s.sellerTransactionId).toBe(r.captureId);
      expect(s.amount).toEqual(r.amount);

      const cap = await getCapture(r.captureId);
      expect(cap.orderId).toBe(r.orderId);
      const tr = await getTracking(r.captureId);
      expect(tr[0]?.trackingNumber).toBe(r.order.shipping?.[0]?.trackingNumber);
      const ctx = toOrderContext(await getOrder(r.orderId));
      expect(ctx.items.map((i) => i.name)).toEqual(r.order.items.map((i) => i.name));

      // The dispute also becomes findable by capture (what the webhook path relies on).
      const deadline = Date.now() + 100_000;
      let listed = false;
      while (!listed && Date.now() < deadline) {
        listed = (await listDisputes({ disputedTransactionId: r.captureId })).items.some((d) => d.id === r.disputeId);
        if (!listed) await new Promise((res) => setTimeout(res, 10_000));
      }
      log(scenario, "listed by capture after", Math.round((Date.now() - t0) / 1000), "s:", listed);
      expect(listed).toBe(true);
    });
  }

  it("provideEvidence on a dispute waiting for the seller", { timeout: 120_000 }, async () => {
    const forced = process.env.PAYPAL_LIVE_EVIDENCE_DISPUTE;
    let target = forced ? await getDispute(forced) : undefined;
    if (!target) {
      const { items } = await listDisputes({ disputeState: "REQUIRED_ACTION", pageSize: 50 });
      for (const it of items) {
        const s = await getDispute(it.id);
        if (s.status === "WAITING_FOR_SELLER_RESPONSE" && s.allowed.includes("provide_evidence")) {
          target = s;
          break;
        }
      }
    }
    expect(target, "no dispute in WAITING_FOR_SELLER_RESPONSE with provide_evidence").toBeTruthy();
    const s = target!;
    const capId = s.sellerTransactionId!;
    const ctx = toOrderContext(await getOrder((await getCapture(capId)).orderId!));
    ctx.shipping = (await getTracking(capId)).map((t) => ({ carrier: t.carrier, trackingNumber: t.trackingNumber, status: t.status, trackingUrl: t.trackingUrl }));
    const pdf = await buildEvidencePdf({
      case: { id: s.id, snapshot: s, status: "acting", isTestDispute: true, createdAt: s.createTime, updatedAt: s.updateTime },
      order: ctx,
      narrative: "The order shipped with tracking to the address on the PayPal transaction. Carrier tracking is attached.",
      exhibits: [{ title: "Carrier tracking", body: ctx.shipping.map((t) => `${t.carrier} ${t.trackingNumber}: ${t.status}`).join("\n") || "No tracking on file." }],
    });
    const tracking = ctx.shipping.map((t) => ({ carrierName: t.carrier, trackingNumber: t.trackingNumber }));
    const r = await provideEvidence(s.id, {
      evidences: [{ evidenceType: tracking.length ? "PROOF_OF_FULFILLMENT" : "OTHER", notes: "Shipped with tracking; see the attached evidence pack.", trackingInfo: tracking }],
      files: [{ name: `evidence-${s.id}.pdf`, bytes: pdf, contentType: "application/pdf" }],
    });
    log("provideEvidence", s.id, r.status, r.debugId, `${pdf.byteLength} bytes`);
    expect(r.status).toBe(200);
    const after = await getDispute(s.id);
    expect(after.allowed).not.toContain("provide_evidence");
  });

  it("searchTransactions returns rows or NotEnabledError", async () => {
    try {
      const rows = await searchTransactions({ dateRange: { start: new Date(Date.now() - 2 * 86_400_000).toISOString(), end: new Date().toISOString() } });
      log("transaction search enabled:", rows.length, "rows");
      expect(Array.isArray(rows)).toBe(true);
    } catch (e) {
      expect(e).toBeInstanceOf(NotEnabledError);
      log("transaction search not enabled:", (e as Error).message);
    }
  });
});
