// Test doubles: in-memory repo (same shape as W4's), fake PayPal, scripted Claude.
import type Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "node:crypto";
import { createSpend, type SpendCaps } from "../../src/lib/spend";
import type { AgentDeps, DbPort, PaypalPort, TrackingInfo } from "../../src/lib/agent/ports";
import {
  DEFAULT_POLICY,
  type AgentAction,
  type AuditEntry,
  type CaseRecord,
  type DisputeSnapshot,
  type SellerPolicy,
  type SpendTotals,
} from "../../src/lib/types";

export function snapshot(over: Partial<DisputeSnapshot> = {}): DisputeSnapshot {
  return {
    id: "PP-R-TST-10000001",
    reason: "MERCHANDISE_OR_SERVICE_NOT_AS_DESCRIBED",
    status: "WAITING_FOR_SELLER_RESPONSE",
    stage: "CHARGEBACK",
    channel: "EXTERNAL",
    amount: { value: "12.00", currency_code: "USD" },
    createTime: "2026-10-25T02:33:14.000Z",
    updateTime: "2026-10-25T02:37:04.000Z",
    sellerResponseDueDate: "2026-11-04T02:33:14.000Z",
    sellerTransactionId: "2UN05916MP311444Y",
    requestedEvidence: ["PROOF_OF_FULFILLMENT", "PROOF_OF_REFUND", "OTHER"],
    messages: [],
    allowed: ["provide_evidence", "accept_claim"],
    ...over,
  };
}

export function memoryDb(policy: SellerPolicy = DEFAULT_POLICY, clock?: () => string) {
  const cases = new Map<string, CaseRecord>();
  const actions = new Map<string, AgentAction>();
  const audit: AuditEntry[] = [];
  const spend: { kind: "llm" | "run"; costUsd: number }[] = [];
  const held = new Set<string>();
  let tick = 0;
  // Strictly increasing timestamps keep ordering deterministic within a test.
  const now = clock ?? (() => new Date(Date.parse("2026-10-25T03:00:00.000Z") + ++tick * 1000).toISOString());
  const patch = (id: string, p: Partial<CaseRecord>) => {
    const c = cases.get(id);
    if (!c) return null;
    const n = { ...c, ...structuredClone(p), updatedAt: now() };
    cases.set(id, n);
    return structuredClone(n);
  };
  const db: DbPort & {
    spend: { add(e: { kind: "llm" | "run"; costUsd: number }): Promise<void>; totals(): Promise<SpendTotals> };
    _audit: AuditEntry[];
    _spend: typeof spend;
    _locks: Set<string>;
    seed(s: DisputeSnapshot, extra?: Partial<CaseRecord>): CaseRecord;
  } = {
    _audit: audit,
    _spend: spend,
    _locks: held,
    seed(s, extra = {}) {
      const t = now();
      const c: CaseRecord = { id: s.id, snapshot: s, status: "new", isTestDispute: true, createdAt: t, updatedAt: t, ...extra };
      cases.set(c.id, c);
      return c;
    },
    cases: {
      async get(id) {
        const c = cases.get(id);
        return c ? structuredClone(c) : null;
      },
      async setTriage(id, triage) {
        return patch(id, { triage });
      },
      async setDecision(id, decision) {
        return patch(id, { decision });
      },
      async setStatus(id, status) {
        return patch(id, { status });
      },
      async setOrder(id, order) {
        return patch(id, { order });
      },
      async upsertFromSnapshot(s) {
        const prev = cases.get(s.id);
        if (!prev) return { record: db.seed(s) };
        const record = { ...prev, snapshot: structuredClone(s), status: s.status === "RESOLVED" ? ("resolved" as const) : prev.status };
        cases.set(s.id, record);
        return { record: structuredClone(record) };
      },
    },
    actions: {
      async insert(a) {
        const t = now();
        const row: AgentAction = { ...structuredClone(a), id: a.id ?? randomUUID(), status: a.status ?? "proposed", createdAt: t, updatedAt: t };
        actions.set(row.id, row);
        return structuredClone(row);
      },
      async update(id, p, opts) {
        const a = actions.get(id);
        if (!a) return null;
        if (opts?.ifStatus && !opts.ifStatus.includes(a.status)) return null;
        const n = { ...a, ...structuredClone(p), updatedAt: now() };
        actions.set(id, n);
        return structuredClone(n);
      },
      async get(id) {
        const a = actions.get(id);
        return a ? structuredClone(a) : null;
      },
      async listByCase(caseId) {
        return [...actions.values()].filter((a) => a.caseId === caseId).map((a) => structuredClone(a));
      },
    },
    audit: {
      async append(e) {
        const entry: AuditEntry = { id: randomUUID(), at: now(), ...structuredClone(e) };
        audit.push(entry);
        return entry;
      },
      async listByCase(caseId) {
        return audit.filter((e) => e.caseId === caseId).map((e) => structuredClone(e));
      },
    },
    policy: {
      async get() {
        return structuredClone(policy);
      },
    },
    locks: {
      async withCaseLock(caseId, fn) {
        if (held.has(caseId)) return { acquired: false };
        held.add(caseId);
        try {
          return { acquired: true, value: await fn() };
        } finally {
          held.delete(caseId);
        }
      },
    },
    spend: {
      async add(e) {
        spend.push({ kind: e.kind, costUsd: e.costUsd });
      },
      async totals() {
        return {
          totalUsd: spend.reduce((a, s) => a + s.costUsd, 0),
          todayUsd: spend.reduce((a, s) => a + s.costUsd, 0),
          runsToday: spend.filter((s) => s.kind === "run").length,
        };
      },
    },
  };
  return db;
}

export type PaypalCalls = { name: string; args: unknown[] }[];

export function fakePaypal(state: { snap: DisputeSnapshot; tracking?: TrackingInfo[] }) {
  const calls: PaypalCalls = [];
  // Like PayPal: a write needs its link right now (else 422), and on an inquiry a message or an offer
  // hands the turn to the buyer, which removes make_offer/send_message (seen live on PP-R-CTQ-10194465).
  const REL: Record<string, string> = {
    sendMessage: "send_message",
    makeOffer: "make_offer",
    provideEvidence: "provide_evidence",
    acceptClaim: "accept_claim",
    acknowledgeReturn: "acknowledge_return_item",
  };
  const ok = async (name: string, ...args: unknown[]) => {
    if (!(state.snap.allowed as string[]).includes(REL[name])) {
      throw Object.assign(new Error("422 ACTION_NOT_ALLOWED_IN_CURRENT_DISPUTE_STATE"), { status: 422, issue: "ACTION_NOT_ALLOWED_IN_CURRENT_DISPUTE_STATE" });
    }
    calls.push({ name, args });
    if ((name === "sendMessage" || name === "makeOffer") && state.snap.stage === "INQUIRY") {
      state.snap = {
        ...state.snap,
        status: "WAITING_FOR_BUYER_RESPONSE",
        allowed: state.snap.allowed.filter((r) => r !== "send_message" && r !== "make_offer"),
        updateTime: new Date(Date.parse(state.snap.updateTime) + 60_000).toISOString(),
      };
    }
    return { status: 200, debugId: `dbg-${calls.length}` };
  };
  const pp: PaypalPort & { calls: PaypalCalls } = {
    calls,
    async getDispute() {
      return structuredClone(state.snap);
    },
    async getOrderForCapture(captureId) {
      return {
        orderId: "6JA992408R656953R",
        captureId,
        items: [{ name: "Ceramic pour-over coffee dripper", quantity: 1, unitAmount: { value: "12.00", currency_code: "USD" } }],
        buyerCountry: "US",
        paidAt: "2026-10-18T09:12:00.000Z",
      };
    },
    async getTracking() {
      return structuredClone(state.tracking ?? []);
    },
    sendMessage: (id, text) => ok("sendMessage", id, text),
    makeOffer: (id, o) => ok("makeOffer", id, o),
    provideEvidence: (id, req) => ok("provideEvidence", id, req),
    acceptClaim: (id, o) => ok("acceptClaim", id, o),
    acknowledgeReturn: (id, note) => ok("acknowledgeReturn", id, note),
  };
  return pp;
}

type Turn = { tools?: { name: string; input: Record<string, unknown> }[]; text?: string; usage?: Partial<Anthropic.Usage> };

/** A Claude stand-in that plays scripted turns in order and records every request. */
export function scriptedLlm(turns: Turn[] | ((req: Anthropic.MessageCreateParamsNonStreaming, i: number) => Turn)) {
  const requests: Anthropic.MessageCreateParamsNonStreaming[] = [];
  return {
    requests,
    async create(req: Anthropic.MessageCreateParamsNonStreaming): Promise<Anthropic.Message> {
      requests.push(structuredClone(req));
      const i = requests.length - 1;
      const t = typeof turns === "function" ? turns(req, i) : turns[i];
      if (!t) throw new Error(`scriptedLlm: no turn ${i}`);
      const content: Anthropic.ContentBlock[] = [];
      if (t.text) content.push({ type: "text", text: t.text, citations: null } as Anthropic.TextBlock);
      (t.tools ?? []).forEach((u, k) => content.push({ type: "tool_use", id: `toolu_${i}_${k}`, name: u.name, input: u.input } as Anthropic.ToolUseBlock));
      return {
        id: `msg_${i}`,
        type: "message",
        role: "assistant",
        model: req.model,
        content,
        stop_reason: t.tools?.length ? "tool_use" : "end_turn",
        stop_sequence: null,
        usage: {
          input_tokens: 1200,
          output_tokens: 600,
          cache_creation_input_tokens: 0,
          cache_read_input_tokens: 2500,
          ...t.usage,
        },
      } as unknown as Anthropic.Message;
    },
  };
}

export const TRIAGE_TURN: Turn = { text: JSON.stringify({ category: "not_as_described", summary: "Card holder says the $12.00 item was not as described." }) };

export function makeDeps(opts: {
  snap: DisputeSnapshot;
  tracking?: TrackingInfo[];
  turns: Turn[] | ((req: Anthropic.MessageCreateParamsNonStreaming, i: number) => Turn);
  policy?: SellerPolicy;
  caps?: Partial<SpendCaps>;
}) {
  const state = { snap: opts.snap, tracking: opts.tracking };
  const db = memoryDb(opts.policy);
  const paypal = fakePaypal(state);
  const llm = scriptedLlm(opts.turns);
  const pdfs: { narrative: string; exhibits: { title: string; body: string }[]; generatedAt?: string }[] = [];
  const deps: AgentDeps = {
    db,
    paypal,
    llm,
    evidence: {
      async buildEvidencePdf(input) {
        pdfs.push({ narrative: input.narrative, exhibits: input.exhibits, generatedAt: input.generatedAt?.toISOString() });
        return new TextEncoder().encode("%PDF-1.7 test");
      },
    },
    spend: createSpend(db.spend, { totalUsd: 45, dailyUsd: 4, runsPerDay: 60, testDisputesPerIpPerDay: 3, ...opts.caps }),
    config: { transactionSearch: false },
    now: () => new Date("2026-10-25T03:00:00.000Z"),
  };
  return { deps, db, paypal, llm, state, pdfs };
}
