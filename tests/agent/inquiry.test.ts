// Inquiry turn-taking: offer before message, re-read links before every write, quiet waits.
import { describe, expect, it } from "vitest";
import { runAgentWith } from "../../src/lib/agent/run";
import { DEFAULT_POLICY } from "../../src/lib/types";
import { makeDeps, snapshot, TRIAGE_TURN } from "./fakes";

const ID = "PP-R-TST-10000001";
// Inquiry snapshot as PayPal shows it while waiting for the seller (shape of PP-R-CTQ-10194465 before the message).
const inquiry = () =>
  snapshot({
    reason: "MERCHANDISE_OR_SERVICE_NOT_RECEIVED",
    stage: "INQUIRY",
    channel: "INTERNAL",
    amount: { value: "24.00", currency_code: "USD" },
    requestedEvidence: undefined,
    messages: [{ postedBy: "BUYER", at: "2026-10-25T02:40:00.000Z", content: "It has been two weeks and nothing arrived." }],
    allowed: ["send_message", "make_offer", "accept_claim"],
  });

const DECIDE_OFFER = {
  name: "record_decision",
  input: { strategy: "offer_partial", win_probability: 0.3, evidence_strength: "weak", offer_percent: 40, rationale: "No tracking; a partial refund costs less than losing." },
};
const OFFER = { name: "make_offer", input: { offer_type: "REFUND", amount_usd: 9.6, note: "Sorry for the wait. We can refund $9.60 now while we trace the parcel." } };
const MESSAGE = { name: "send_message", input: { message: "Hi, we're looking into your parcel today." } };

describe("inquiry: offer and message", () => {
  it("sends the offer first and holds the separate message, whatever order the model asks for", async () => {
    const snap = inquiry();
    const { deps, db, paypal, state } = makeDeps({
      snap,
      tracking: [],
      turns: [TRIAGE_TURN, { tools: [{ name: "get_order", input: {} }, { name: "get_tracking", input: {} }] }, { tools: [DECIDE_OFFER, MESSAGE, OFFER] }],
    });
    db.seed(snap);
    const out = await runAgentWith(deps, ID, { kind: "webhook", eventType: "CUSTOMER.DISPUTE.CREATED" });

    expect(out.status).toBe("done");
    expect(paypal.calls.map((c) => c.name)).toEqual(["makeOffer"]);
    expect(paypal.calls[0].args[1]).toMatchObject({ offerType: "REFUND", amount: { value: "9.60" }, note: expect.stringContaining("refund") });
    const acts = await db.actions.listByCase(ID);
    expect(acts.map((a) => `${a.kind}=${a.status}`)).toEqual(["make_offer=executed"]);
    expect(db._audit.map((e) => e.kind)).toContain("action.skipped");
    expect(state.snap.status).toBe("WAITING_FOR_BUYER_RESPONSE");
    expect((await db.cases.get(ID))?.status).toBe("waiting_on_buyer");
  });

  it("full-refund offer: runs before the message even when the model lists the message first", async () => {
    const snap = inquiry();
    const { deps, db, paypal } = makeDeps({
      snap,
      tracking: [],
      policy: { ...DEFAULT_POLICY, autoRefundMaxUsd: 30 },
      turns: [
        TRIAGE_TURN,
        {
          tools: [
            { name: "record_decision", input: { strategy: "refund_full", win_probability: 0.1, evidence_strength: "weak", offer_percent: 100, rationale: "No tracking; refund now." } },
            MESSAGE,
            { name: "make_offer", input: { offer_type: "REFUND", amount_usd: 24, note: "Sorry it never arrived. Here is a full refund." } },
          ],
        },
      ],
    });
    db.seed(snap);
    await runAgentWith(deps, ID, { kind: "manual" });
    expect(paypal.calls.map((c) => c.name)).toEqual(["makeOffer"]);
    expect((await db.actions.listByCase(ID)).map((a) => `${a.kind}=${a.status}`)).toEqual(["make_offer=executed"]);
  });

  it("sends a message when no offer is made", async () => {
    const snap = inquiry();
    const { deps, db, paypal } = makeDeps({
      snap,
      tracking: [],
      turns: [
        TRIAGE_TURN,
        {
          tools: [
            { name: "record_decision", input: { strategy: "message_buyer", win_probability: 0.6, evidence_strength: "medium", offer_percent: 0, rationale: "Ask for details first." } },
            MESSAGE,
          ],
        },
      ],
    });
    db.seed(snap);
    await runAgentWith(deps, ID, { kind: "manual" });
    expect(paypal.calls.map((c) => c.name)).toEqual(["sendMessage"]);
  });

  it("re-reads PayPal's links before a write and queues nothing when the link is gone", async () => {
    const snap = inquiry();
    let state!: { snap: typeof snap };
    const made = makeDeps({
      snap,
      tracking: [],
      turns: (_req, i) => {
        // The buyer answers between the decision and the offer: PayPal now waits for the buyer.
        if (i === 2) state.snap = { ...state.snap, status: "WAITING_FOR_BUYER_RESPONSE", allowed: ["accept_claim"], updateTime: "2026-10-25T03:30:00.000Z" };
        return [TRIAGE_TURN, { tools: [DECIDE_OFFER] }, { tools: [OFFER] }][i];
      },
    });
    state = made.state;
    made.db.seed(snap);
    await runAgentWith(made.deps, ID, { kind: "manual" });

    expect(made.paypal.calls).toHaveLength(0);
    expect(await made.db.actions.listByCase(ID)).toHaveLength(0);
    expect(made.db._audit.find((e) => e.kind === "action.blocked")?.summary).toContain("no longer allows");
    // Stops there: no further model turn after the refused write.
    expect(made.llm.requests).toHaveLength(3);
  });
});

describe("stuck chargebacks stay quiet", () => {
  it("reason OTHER in UNDER_REVIEW: one note, then UPDATED events cost nothing and add nothing", async () => {
    const snap = snapshot({ reason: "OTHER", status: "UNDER_REVIEW", allowed: ["provide_supporting_info"] });
    const { deps, db, llm, state } = makeDeps({ snap, turns: [TRIAGE_TURN] });
    db.seed(snap);
    expect((await runAgentWith(deps, ID, { kind: "webhook", eventType: "CUSTOMER.DISPUTE.CREATED" })).status).toBe("waiting");
    expect(llm.requests.map((r) => r.model)).toEqual(["claude-haiku-5-5"]);
    const audits = db._audit.length;

    for (const t of ["2026-10-25T05:00:00.000Z", "2026-10-25T06:00:00.000Z", "2026-10-25T07:00:00.000Z"]) {
      state.snap = { ...state.snap, updateTime: t };
      const out = await runAgentWith(deps, ID, { kind: "webhook", eventType: "CUSTOMER.DISPUTE.UPDATED" });
      expect(out.status).toBe("skipped");
    }
    expect(llm.requests).toHaveLength(1);
    expect(db._audit).toHaveLength(audits);

    // Something actionable changes: the agent wakes up again.
    state.snap = { ...state.snap, status: "WAITING_FOR_SELLER_RESPONSE", allowed: ["provide_evidence", "accept_claim"], updateTime: "2026-10-25T08:00:00.000Z" };
    await runAgentWith(deps, ID, { kind: "webhook", eventType: "CUSTOMER.DISPUTE.UPDATED" }).catch(() => undefined);
    expect(llm.requests.length).toBeGreaterThan(1);
  });

  it("after deciding to wait, UPDATED events with nothing new make no model call; a buyer message wakes it", async () => {
    const snap = inquiry();
    const waiting = { ...snap, status: "WAITING_FOR_BUYER_RESPONSE" as const, allowed: ["send_message" as const, "accept_claim" as const] };
    const wait = { tools: [{ name: "record_decision", input: { strategy: "wait", win_probability: 0.5, evidence_strength: "medium", offer_percent: 0, rationale: "Buyer's turn." } }] };
    const { deps, db, llm, state } = makeDeps({ snap: waiting, turns: [TRIAGE_TURN, wait, wait] });
    db.seed(waiting);
    await runAgentWith(deps, ID, { kind: "webhook", eventType: "CUSTOMER.DISPUTE.CREATED" });
    const calls = llm.requests.length;

    state.snap = { ...state.snap, updateTime: "2026-10-25T06:00:00.000Z" };
    expect((await runAgentWith(deps, ID, { kind: "webhook", eventType: "CUSTOMER.DISPUTE.UPDATED" })).status).toBe("skipped");
    expect(llm.requests).toHaveLength(calls);

    state.snap = {
      ...state.snap,
      status: "WAITING_FOR_SELLER_RESPONSE",
      messages: [...state.snap.messages, { postedBy: "BUYER", at: "2026-10-25T06:30:00.000Z", content: "Still nothing." }],
      updateTime: "2026-10-25T06:30:00.000Z",
    };
    await runAgentWith(deps, ID, { kind: "webhook", eventType: "CUSTOMER.DISPUTE.UPDATED" });
    expect(llm.requests.length).toBeGreaterThan(calls);
  });
});
