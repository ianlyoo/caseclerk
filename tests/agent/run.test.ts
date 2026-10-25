import { describe, expect, it } from "vitest";
import { runAgentWith } from "../../src/lib/agent/run";
import { executeApprovedWith, denyWith } from "../../src/lib/agent/actions";
import { agentSystem } from "../../src/lib/agent/prompts";
import { DEFAULT_POLICY } from "../../src/lib/types";
import { makeDeps, snapshot, TRIAGE_TURN } from "./fakes";

const ID = "PP-R-TST-10000001";
const TRACKING = [{ carrier: "USPS", trackingNumber: "9400111899223344556677", status: "DELIVERED" }];
const NARRATIVE =
  "The buyer ordered one ceramic pour-over coffee dripper for 12.00 USD on 2026-10-18. The seller shipped it with USPS under tracking number 9400111899223344556677, and the carrier reports the parcel as delivered. The item matched its listing. We ask that the chargeback be reversed.";

const fightTurns = (narrative = NARRATIVE) => [
  TRIAGE_TURN,
  { tools: [{ name: "get_order", input: {} }, { name: "get_tracking", input: {} }] },
  {
    tools: [
      {
        name: "record_decision",
        input: { strategy: "fight", win_probability: 0.8, evidence_strength: "strong", offer_percent: 0, rationale: "Tracking shows delivery; winnable." },
      },
      {
        name: "provide_evidence",
        input: {
          evidence_types: ["PROOF_OF_FULFILLMENT", "OTHER"],
          narrative,
          exhibits: [{ title: "Order", body: "1 x ceramic pour-over coffee dripper, 12.00 USD" }],
        },
      },
    ],
  },
];

describe("runAgent: chargeback with tracking", () => {
  it("triages, gathers, decides, submits evidence once and audits every step", async () => {
    const { deps, db, llm, paypal, pdfs } = makeDeps({ snap: snapshot(), tracking: TRACKING, turns: fightTurns() });
    db.seed(snapshot());

    const out = await runAgentWith(deps, ID, { kind: "webhook", eventType: "CUSTOMER.DISPUTE.UPDATED" });
    expect(out.status).toBe("done");
    // Summing the timeline counts each model call once; the run total is a field on run.done.
    const summed = db._audit.reduce((n, e) => n + (e.costUsd ?? 0), 0);
    expect(summed).toBeCloseTo(out.costUsd, 9);
    const done = db._audit.find((e) => e.kind === "agent.run.done")!;
    expect(done.costUsd).toBeUndefined();
    expect(done.data?.runCostUsd).toBeCloseTo(out.costUsd, 9);

    // Models: Haiku for triage, Opus 5.5 at medium for the decision, auto tool choice, caching on.
    expect(llm.requests.map((r) => r.model)).toEqual(["claude-haiku-5-5", "claude-opus-5-5", "claude-opus-5-5"]);
    const opus = llm.requests[1];
    expect(opus.output_config?.effort).toBe("medium");
    expect(opus.tool_choice).toEqual({ type: "auto" });
    expect(opus.tools?.every((t) => "strict" in t && t.strict)).toBe(true);
    expect(JSON.stringify(opus.system)).toContain("ephemeral");
    // Only actions PayPal allows are offered as tools.
    const names = (opus.tools ?? []).map((t) => (t as { name: string }).name);
    expect(names).toContain("provide_evidence");
    expect(names).not.toContain("send_message");
    expect(names).not.toContain("make_offer");

    const ev = paypal.calls.filter((c) => c.name === "provideEvidence");
    expect(ev).toHaveLength(1);
    const req = ev[0].args[1] as { evidences: { evidenceType: string; trackingInfo?: unknown[] }[]; files: unknown[] };
    expect(req.evidences.map((e) => e.evidenceType)).toEqual(["PROOF_OF_FULFILLMENT"]);
    expect(req.evidences[0].trackingInfo).toEqual([{ carrierName: "USPS", trackingNumber: "9400111899223344556677" }]);
    expect(req.files).toHaveLength(1);
    expect(pdfs[0].narrative).toBe(NARRATIVE);

    const c = await db.cases.get(ID);
    expect(c?.status).toBe("waiting_on_paypal");
    expect(c?.triage?.category).toBe("not_as_described");
    expect(c?.decision?.strategy).toBe("fight");
    expect(c?.decision?.expectedValueUsd.fight).toBeGreaterThan(c!.decision!.expectedValueUsd.refund);
    expect(c?.order?.shipping?.[0].carrier).toBe("USPS");

    const kinds = db._audit.map((e) => e.kind);
    for (const k of ["agent.run.start", "triage", "agent.step", "tool.get_order", "tool.get_tracking", "decision", "action.executed", "agent.run.done"]) {
      expect(kinds).toContain(k);
    }
    // Every LLM step carries its cost; the run total equals the recorded spend.
    const costed = db._audit.filter((e) => e.kind === "agent.step" || e.kind === "triage");
    expect(costed.every((e) => (e.costUsd ?? 0) > 0)).toBe(true);
    const llmSpend = db._spend.filter((s) => s.kind === "llm").reduce((a, s) => a + s.costUsd, 0);
    expect(out.costUsd).toBeCloseTo(llmSpend, 6);
    // No message bodies or tracking numbers in full in the timeline.
    expect(JSON.stringify(db._audit)).not.toContain("9400111899223344556677");
  });

  it("is idempotent per snapshot version: the same UPDATED again makes no LLM call", async () => {
    const { deps, db, llm } = makeDeps({ snap: snapshot(), tracking: TRACKING, turns: fightTurns() });
    db.seed(snapshot());
    await runAgentWith(deps, ID, { kind: "webhook" });
    const n = llm.requests.length;
    const again = await runAgentWith(deps, ID, { kind: "webhook" });
    expect(again.status).toBe("skipped");
    expect(llm.requests).toHaveLength(n);
  });

  it("continues after require-evidence and never repeats an executed action", async () => {
    const turns = [
      ...fightTurns(),
      // Run 2 (new snapshot version): triage is not repeated.
      {
        tools: [
          {
            name: "record_decision",
            input: { strategy: "fight", win_probability: 0.75, evidence_strength: "strong", offer_percent: 0, rationale: "PayPal asked for more; resubmit." },
          },
          { name: "provide_evidence", input: { evidence_types: ["OTHER"], narrative: NARRATIVE, exhibits: [] } },
        ],
      },
    ];
    const { deps, db, llm, paypal, state } = makeDeps({ snap: snapshot(), tracking: TRACKING, turns });
    db.seed(snapshot());
    await runAgentWith(deps, ID, { kind: "webhook" });

    // PayPal moved to UNDER_REVIEW after our evidence: no actionable link, no LLM call.
    state.snap = snapshot({ status: "UNDER_REVIEW", updateTime: "2026-10-25T04:00:00.000Z", allowed: ["require_evidence", "adjudicate"] });
    const waiting = await runAgentWith(deps, ID, { kind: "webhook" });
    expect(waiting.status).toBe("waiting");
    expect(llm.requests).toHaveLength(3);

    // require-evidence → WAITING_FOR_SELLER_RESPONSE again with a newer version.
    state.snap = snapshot({ updateTime: "2026-10-25T05:00:00.000Z" });
    const second = await runAgentWith(deps, ID, { kind: "webhook" });
    expect(second.status).toBe("done");
    expect(llm.requests.map((r) => r.model).filter((m) => m === "claude-haiku-5-5")).toHaveLength(1);
    expect(paypal.calls.filter((c) => c.name === "provideEvidence")).toHaveLength(2);
    // The brief told the model what was already done.
    expect(JSON.stringify(llm.requests[3].messages[0])).toContain("evidence submission executed");
  });

  it("refuses a duplicate submission for the same evidence request", async () => {
    const dupTurns = [
      ...fightTurns(),
      {
        tools: [
          {
            name: "record_decision",
            input: { strategy: "fight", win_probability: 0.8, evidence_strength: "strong", offer_percent: 0, rationale: "Again." },
          },
          { name: "provide_evidence", input: { evidence_types: ["OTHER"], narrative: NARRATIVE, exhibits: [] } },
        ],
      },
      { text: "Evidence was already submitted for this request." },
    ];
    const { deps, db, paypal } = makeDeps({ snap: snapshot(), tracking: TRACKING, turns: dupTurns });
    db.seed(snapshot());
    await runAgentWith(deps, ID, { kind: "webhook" });
    // A manual re-run on the same version (bypasses the version check) still can't resubmit.
    await runAgentWith(deps, ID, { kind: "manual" });
    expect(paypal.calls.filter((c) => c.name === "provideEvidence")).toHaveLength(1);
    expect(db._audit.map((e) => e.kind)).toContain("action.duplicate");
  });

  it("skips overlapping runs on the same case", async () => {
    const { deps, db } = makeDeps({ snap: snapshot(), turns: [] });
    db.seed(snapshot());
    db._locks.add(ID);
    expect((await runAgentWith(deps, ID, { kind: "webhook" })).status).toBe("locked");
  });

  it("closes a resolved case without any model call", async () => {
    const snap = snapshot({ status: "RESOLVED", outcome: "RESOLVED_WITH_PAYOUT", allowed: [] });
    const { deps, db, llm } = makeDeps({ snap, turns: [] });
    db.seed(snapshot());
    const out = await runAgentWith(deps, ID, { kind: "webhook", eventType: "CUSTOMER.DISPUTE.RESOLVED" });
    expect(out.status).toBe("done");
    expect(llm.requests).toHaveLength(0);
    expect((await db.cases.get(ID))?.status).toBe("resolved");
  });

  it("only triages while PayPal allows no action yet", async () => {
    const snap = snapshot({ status: "UNDER_REVIEW", allowed: [] });
    const { deps, db, llm } = makeDeps({ snap, turns: [TRIAGE_TURN] });
    db.seed(snap);
    const out = await runAgentWith(deps, ID, { kind: "webhook", eventType: "CUSTOMER.DISPUTE.CREATED" });
    expect(out.status).toBe("waiting");
    expect(llm.requests.map((r) => r.model)).toEqual(["claude-haiku-5-5"]);
    expect((await db.cases.get(ID))?.status).toBe("triaged");
  });
});

describe("no invented facts", () => {
  it("the system prompt forbids inventing tracking numbers and facts", () => {
    const s = agentSystem();
    expect(s).toMatch(/Never invent or guess tracking numbers/);
    expect(s).toMatch(/Use only facts returned by tools/);
  });

  it("without tracking: a fabricated tracking number is held back; the corrected evidence goes without PROOF_OF_FULFILLMENT", async () => {
    const invented =
      "The seller shipped the dripper with USPS, tracking 9400111899223344556677, delivered on 2026-10-20. The buyer received exactly what the listing described, so the chargeback should be reversed in the seller's favour.";
    const honest =
      "The buyer paid 12.00 USD for one ceramic pour-over coffee dripper on 2026-10-18. No carrier tracking was recorded for this payment. The listing described the item accurately and the buyer did not contact the seller before filing.";
    const turns = [
      TRIAGE_TURN,
      { tools: [{ name: "get_order", input: {} }, { name: "get_tracking", input: {} }] },
      {
        tools: [
          {
            name: "record_decision",
            input: { strategy: "fight", win_probability: 0.5, evidence_strength: "medium", offer_percent: 0, rationale: "Item matched the listing." },
          },
          { name: "provide_evidence", input: { evidence_types: ["PROOF_OF_FULFILLMENT", "OTHER"], narrative: invented, exhibits: [] } },
        ],
      },
      { tools: [{ name: "provide_evidence", input: { evidence_types: ["PROOF_OF_FULFILLMENT", "OTHER"], narrative: honest, exhibits: [] } }] },
    ];
    const { deps, db, llm, paypal } = makeDeps({ snap: snapshot(), tracking: [], turns });
    db.seed(snapshot());
    await runAgentWith(deps, ID, { kind: "webhook" });

    // The tracking tool told the model there is none.
    const trackingResult = JSON.stringify(llm.requests[2].messages.at(-1));
    expect(trackingResult).toContain("No tracking exists for this payment");
    // The invented number was rejected back to the model.
    const rejection = JSON.stringify(llm.requests[3].messages.at(-1));
    expect(rejection).toContain("9400111899223344556677");
    expect(rejection).toContain("is_error");
    expect(db._audit.map((e) => e.kind)).toContain("agent.fact_check");

    const ev = paypal.calls.filter((c) => c.name === "provideEvidence");
    expect(ev).toHaveLength(1);
    const req = ev[0].args[1] as { evidences: { evidenceType: string; notes?: string; trackingInfo?: unknown }[] };
    expect(req.evidences.map((e) => e.evidenceType)).toEqual(["OTHER"]);
    expect(JSON.stringify(req)).not.toContain("9400111899223344556677");
  });
});

describe("approvals", () => {
  const acceptTurns = [
    TRIAGE_TURN,
    { tools: [{ name: "get_order", input: {} }, { name: "get_tracking", input: {} }] },
    {
      tools: [
        {
          name: "record_decision",
          input: { strategy: "accept_claim", win_probability: 0.1, evidence_strength: "weak", offer_percent: 0, rationale: "No tracking; refunding costs less." },
        },
        { name: "accept_claim", input: { note: "We accept and refund the buyer." } },
      ],
    },
  ];

  it("a refund above the threshold waits; approve runs it exactly once", async () => {
    const snap = snapshot({ amount: { value: "80.00", currency_code: "USD" } });
    const { deps, db, paypal, llm, state } = makeDeps({ snap, tracking: [], turns: acceptTurns });
    db.seed(snap);
    await runAgentWith(deps, ID, { kind: "webhook" });

    expect(paypal.calls.filter((c) => c.name === "acceptClaim")).toHaveLength(0);
    const [a] = await db.actions.listByCase(ID);
    expect(a.status).toBe("awaiting_approval");
    expect(a.amountUsd).toBe(80);
    expect((await db.cases.get(ID))?.status).toBe("awaiting_approval");

    // While waiting, further webhooks (same or newer version) make no model calls.
    const calls = llm.requests.length;
    expect((await runAgentWith(deps, ID, { kind: "webhook" })).status).toBe("skipped");
    state.snap = snapshot({ amount: snap.amount, updateTime: "2026-10-25T05:00:00.000Z" });
    expect((await runAgentWith(deps, ID, { kind: "webhook", eventType: "CUSTOMER.DISPUTE.UPDATED" })).status).toBe("waiting");
    expect(llm.requests).toHaveLength(calls);

    const r = await executeApprovedWith(deps, a.id);
    expect(r.ok).toBe(true);
    const twice = await executeApprovedWith(deps, a.id);
    expect(twice.ok).toBe(false);
    expect(paypal.calls.filter((c) => c.name === "acceptClaim")).toHaveLength(1);
    expect((await db.actions.get(a.id))?.status).toBe("executed");
  });

  it("deny closes the request without calling PayPal", async () => {
    const snap = snapshot({ amount: { value: "80.00", currency_code: "USD" } });
    const { deps, db, paypal } = makeDeps({ snap, tracking: [], turns: acceptTurns });
    db.seed(snap);
    await runAgentWith(deps, ID, { kind: "webhook" });
    const [a] = await db.actions.listByCase(ID);
    expect((await denyWith(deps, a.id, "I'd rather fight")).ok).toBe(true);
    expect((await executeApprovedWith(deps, a.id)).ok).toBe(false);
    expect(paypal.calls.filter((c) => c.name === "acceptClaim")).toHaveLength(0);
    expect((await db.actions.get(a.id))?.status).toBe("denied");
  });

  it("an approved action PayPal no longer allows fails visibly instead of being sent", async () => {
    const snap = snapshot({ amount: { value: "80.00", currency_code: "USD" } });
    const { deps, db, paypal, state } = makeDeps({ snap, tracking: [], turns: acceptTurns });
    db.seed(snap);
    await runAgentWith(deps, ID, { kind: "webhook" });
    const [a] = await db.actions.listByCase(ID);
    state.snap = snapshot({ status: "UNDER_REVIEW", allowed: [], updateTime: "2026-10-25T06:00:00.000Z" });
    const r = await executeApprovedWith(deps, a.id);
    expect(r.ok).toBe(false);
    expect(paypal.calls.filter((c) => c.name === "acceptClaim")).toHaveLength(0);
    expect((await db.actions.get(a.id))?.status).toBe("failed");
  });

  it("dry run records a proposal and calls nothing", async () => {
    const { deps, db, paypal } = makeDeps({ snap: snapshot(), tracking: TRACKING, turns: fightTurns(), policy: { ...DEFAULT_POLICY, dryRun: true } });
    db.seed(snapshot());
    await runAgentWith(deps, ID, { kind: "webhook" });
    expect(paypal.calls.filter((c) => c.name !== "getDispute")).toHaveLength(0);
    const [a] = await db.actions.listByCase(ID);
    expect(a.status).toBe("proposed");
  });

  it("policy overrides a low-odds fight into accepting the claim", async () => {
    const turns = [
      TRIAGE_TURN,
      {
        tools: [
          { name: "record_decision", input: { strategy: "fight", win_probability: 0.1, evidence_strength: "weak", offer_percent: 0, rationale: "Try anyway." } },
          { name: "provide_evidence", input: { evidence_types: ["OTHER"], narrative: NARRATIVE, exhibits: [] } },
        ],
      },
      { tools: [{ name: "accept_claim", input: { note: "We accept." } }] },
    ];
    const { deps, db, paypal } = makeDeps({ snap: snapshot(), tracking: TRACKING, turns });
    db.seed(snapshot());
    await runAgentWith(deps, ID, { kind: "webhook" });
    const c = await db.cases.get(ID);
    expect(c?.decision?.strategy).toBe("accept_claim");
    expect(c?.decision?.policyNote).toMatch(/below your 45% minimum/);
    expect(paypal.calls.filter((c) => c.name === "provideEvidence")).toHaveLength(0);
    // $12 is within the $15 auto-refund limit.
    expect(paypal.calls.filter((c) => c.name === "acceptClaim")).toHaveLength(1);
  });
});
