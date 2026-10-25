// Approve answers once PayPal has answered: with a defer hook, executeApprovedWith (W2) waits only for
// the claim, the parallel reads, the filing and the result write; audit, case status and the tracker
// restore run afterwards. Counts store round trips, each ~0.25–0.45 s on Vercel iad1 → Neon sin1.
import { describe, expect, it } from "vitest";
import { executeApprovedWith, type Defer } from "../../src/lib/agent/actions";
import { runAgentWith } from "../../src/lib/agent/run";
import { makeDeps, snapshot, TRIAGE_TURN } from "../agent/fakes";

const ID = "PP-R-TST-10000001";
const TRACKING = [{ carrier: "USPS", trackingNumber: "9400111899223344556677", status: "DELIVERED" }];
const NARRATIVE =
  "The buyer ordered a vintage film camera for 412.00 USD. The seller shipped it with USPS under tracking number 9400111899223344556677, and the carrier reports the parcel as delivered. We ask that the chargeback be reversed.";
const turns = [
  TRIAGE_TURN,
  { tools: [{ name: "get_order", input: {} }, { name: "get_tracking", input: {} }] },
  {
    tools: [
      { name: "record_decision", input: { strategy: "fight", win_probability: 0.75, evidence_strength: "strong", offer_percent: 0, rationale: "Delivered with tracking." } },
      { name: "provide_evidence", input: { evidence_types: ["PROOF_OF_FULFILLMENT"], narrative: NARRATIVE, exhibits: [{ title: "Order", body: "1 x film camera" }] } },
    ],
  },
];

const DB_MS = 5;

/**
 * Adds DB_MS to every store call, like a cross-region round trip, and counts sequential round trips:
 * a call that starts while no other store call is in flight begins a new one.
 */
function slow<T extends object>(db: T) {
  const stats = { rounds: 0, inFlight: 0 };
  for (const repo of Object.values(db)) {
    if (!repo || typeof repo !== "object") continue;
    for (const [k, fn] of Object.entries(repo)) {
      if (typeof fn !== "function") continue;
      (repo as Record<string, unknown>)[k] = async (...args: unknown[]) => {
        if (stats.inFlight++ === 0) stats.rounds += 1;
        try {
          await new Promise((r) => setTimeout(r, DB_MS));
          return await fn.apply(repo, args);
        } finally {
          stats.inFlight -= 1;
        }
      };
    }
  }
  return stats;
}

describe("approve latency", () => {
  it("returns PayPal's answer after a few round trips and defers the rest", async () => {
    const snap = snapshot({ amount: { value: "412.00", currency_code: "USD" }, sellerTransactionId: "CAP-412" });
    const { deps, db, paypal } = makeDeps({ snap, tracking: TRACKING, turns });
    db.seed(snap);
    await runAgentWith(deps, ID, { kind: "webhook", eventType: "CUSTOMER.DISPUTE.CREATED" });
    const [pending] = await db.actions.listByCase(ID);
    expect(pending.status).toBe("awaiting_approval");

    const stats = slow(db);
    const tasks: (() => Promise<void>)[] = [];
    const defer: Defer = (t) => void tasks.push(t);
    const r = await executeApprovedWith(deps, pending.id, { defer });

    // Claim, [audit + case + policy + getDispute], [executing + snapshot], result: 4 round trips (was 11).
    expect(stats.rounds).toBeLessThanOrEqual(4);
    expect(r).toMatchObject({ ok: true, action: { status: "executed", result: { httpStatus: 200 } } });
    const [sent] = paypal.calls.filter((c) => c.name === "provideEvidence");
    expect(sent.args[1]).toMatchObject({ captureId: "CAP-412", deferRestore: defer }); // no extra dispute lookup
    expect(db._audit.some((e) => e.kind === "action.executed")).toBe(false);
    expect((await db.cases.get(ID))?.status).toBe("awaiting_approval");

    expect(tasks.length).toBeGreaterThanOrEqual(2);
    await Promise.all(tasks.splice(0).map((t) => t()));
    expect(db._audit.filter((e) => e.kind === "action.executed")).toHaveLength(1);
    expect((await db.cases.get(ID))?.status).toBe("waiting_on_paypal");
    const kinds = db._audit.map((e) => e.kind);
    expect(kinds.indexOf("action.approved")).toBeLessThan(kinds.indexOf("action.executed"));
  });

  it("without a defer hook, everything is done before it returns (agent and tests)", async () => {
    const snap = snapshot({ amount: { value: "412.00", currency_code: "USD" } });
    const { deps, db } = makeDeps({ snap, tracking: TRACKING, turns });
    db.seed(snap);
    await runAgentWith(deps, ID, { kind: "webhook", eventType: "CUSTOMER.DISPUTE.CREATED" });
    const [pending] = await db.actions.listByCase(ID);
    expect((await executeApprovedWith(deps, pending.id)).ok).toBe(true);
    expect(db._audit.filter((e) => e.kind === "action.executed")).toHaveLength(1);
    expect((await db.cases.get(ID))?.status).toBe("waiting_on_paypal");
  });
});
