// Evidence on a dispute of $250 or more waits for the seller with the exact filing prepared; nothing is sent.
import { describe, expect, it } from "vitest";
import { executeApprovedWith } from "../../src/lib/agent/actions";
import type { PreparedFiling } from "../../src/lib/agent/actions";
import { runAgentWith } from "../../src/lib/agent/run";
import { makeDeps, snapshot, TRIAGE_TURN } from "./fakes";

const ID = "PP-R-TST-10000001";
const TRACKING = [{ carrier: "USPS", trackingNumber: "9400111899223344556677", status: "DELIVERED" }];
const NARRATIVE =
  "The buyer ordered a vintage film camera for 412.00 USD. The seller shipped it with USPS under tracking number 9400111899223344556677, and the carrier reports the parcel as delivered. The listing described its condition accurately. We ask that the chargeback be reversed.";
const big = (over = {}) => snapshot({ amount: { value: "412.00", currency_code: "USD" }, ...over });

const turns = [
  TRIAGE_TURN,
  { tools: [{ name: "get_order", input: {} }, { name: "get_tracking", input: {} }] },
  {
    tools: [
      { name: "record_decision", input: { strategy: "fight", win_probability: 0.75, evidence_strength: "strong", offer_percent: 0, rationale: "Delivered with tracking." } },
      { name: "provide_evidence", input: { evidence_types: ["PROOF_OF_FULFILLMENT"], narrative: NARRATIVE, exhibits: [{ title: "Order", body: "1 x film camera, 412.00 USD" }] } },
      // A model that then tries to settle anyway must be stopped.
      { name: "record_decision", input: { strategy: "accept_claim", win_probability: 0.2, evidence_strength: "weak", offer_percent: 0, rationale: "Settle." } },
      { name: "accept_claim", input: { note: "We accept." } },
    ],
  },
];

describe("evidence approval at $250+", () => {
  it("a $412 chargeback stops at waiting for you with the filing prepared, sends nothing, and approve files it once", async () => {
    const snap = big();
    const { deps, db, paypal, llm, state, pdfs } = makeDeps({ snap, tracking: TRACKING, turns });
    db.seed(snap);
    const out = await runAgentWith(deps, ID, { kind: "webhook", eventType: "CUSTOMER.DISPUTE.CREATED" });

    expect(out.status).toBe("done");
    expect(paypal.calls).toHaveLength(0); // no evidence, no accept, no refund
    const acts = await db.actions.listByCase(ID);
    expect(acts.map((a) => `${a.kind}=${a.status}`)).toEqual(["provide_evidence=awaiting_approval"]);
    const [a] = acts;
    expect(a.requiresApproval).toBe(true);
    const filing = a.params.filing as PreparedFiling;
    expect(filing.prepared).toBe(true);
    expect(filing.input.evidences).toEqual([
      expect.objectContaining({ evidence_type: "PROOF_OF_FULFILLMENT", notes: NARRATIVE, evidence_info: { tracking_info: [{ carrier_name: "USPS", tracking_number: "9400111899223344556677" }] } }),
    ]);
    expect(filing.files).toEqual([{ field: "file1", name: `caseclerk-evidence-${ID}.pdf`, size: expect.any(Number), contentType: "application/pdf" }]);
    expect(filing.files[0].size).toBeGreaterThan(0);
    expect((await db.cases.get(ID))?.status).toBe("awaiting_approval");
    expect((await db.cases.get(ID))?.decision?.strategy).toBe("fight");
    const queued = db._audit.find((e) => e.kind === "action.awaiting_approval")!;
    expect(queued.summary).toContain("$250");
    expect(queued.summary).toContain("deadline is 2026-11-04 02:33");

    // Webhooks while pending: no model call, no second pending action, at most one note.
    const calls = llm.requests.length;
    for (const t of ["2026-10-25T05:00:00.000Z", "2026-10-25T06:00:00.000Z", "2026-10-25T07:00:00.000Z"]) {
      state.snap = { ...state.snap, updateTime: t };
      await runAgentWith(deps, ID, { kind: "webhook", eventType: "CUSTOMER.DISPUTE.UPDATED" });
    }
    expect(llm.requests).toHaveLength(calls);
    expect(await db.actions.listByCase(ID)).toHaveLength(1);
    expect(db._audit.filter((e) => e.kind === "agent.run.done" && e.data?.awaiting)).toHaveLength(1);

    // Approve: filed live once, with the prepared evidence and the same PDF date.
    const r = await executeApprovedWith(deps, a.id);
    expect(r.ok).toBe(true);
    const sent = paypal.calls.filter((c) => c.name === "provideEvidence");
    expect(sent).toHaveLength(1);
    const req = sent[0].args[1] as { evidences: unknown[]; files: { name: string }[] };
    expect(req.files.map((f) => f.name)).toEqual([filing.files[0].name]);
    expect(pdfs.at(-1)?.generatedAt).toBe(pdfs[0].generatedAt);
    expect(r.action?.result?.httpStatus).toBe(200);
    expect((await executeApprovedWith(deps, a.id)).ok).toBe(false);
    expect(paypal.calls.filter((c) => c.name !== "provideEvidence")).toHaveLength(0);
  });

  it("approval after PayPal closed the window (deadline passed) fails visibly instead of filing", async () => {
    const snap = big();
    const { deps, db, paypal, state } = makeDeps({ snap, tracking: TRACKING, turns });
    db.seed(snap);
    await runAgentWith(deps, ID, { kind: "webhook" });
    const [a] = await db.actions.listByCase(ID);
    state.snap = { ...state.snap, status: "UNDER_REVIEW", allowed: [], updateTime: "2026-11-04T03:00:00.000Z" };
    const r = await executeApprovedWith(deps, a.id);
    expect(r.ok).toBe(false);
    expect(paypal.calls).toHaveLength(0);
    expect((await db.actions.get(a.id))?.status).toBe("failed");
  });

  it("below $250 evidence is filed at once, as before", async () => {
    const snap = big({ amount: { value: "249.99", currency_code: "USD" } });
    const { deps, db, paypal } = makeDeps({ snap, tracking: TRACKING, turns: turns.map((t, i) => (i === 2 ? { tools: t.tools!.slice(0, 2) } : t)) });
    db.seed(snap);
    await runAgentWith(deps, ID, { kind: "webhook" });
    expect(paypal.calls.map((c) => c.name)).toEqual(["provideEvidence"]);
    expect((await db.actions.listByCase(ID))[0].params.filing).toBeUndefined();
  });
});
