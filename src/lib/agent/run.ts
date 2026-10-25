// The agent run: load case → refresh snapshot → triage once → gather facts with tools → decide
// (expected value under the seller policy) → act through the policy gate → audit every step.
// Idempotent per (caseId, snapshot.updateTime); a per-case lock prevents overlapping runs.
import type Anthropic from "@anthropic-ai/sdk";
import type { AgentTrigger, CaseRecord, CaseStatus, Decision, DisputeSnapshot, Money, SellerPolicy } from "../types";
import { SpendCapError } from "../spend";
import { audit, statusAfter, submitAction, ACTION_LABEL, type ActionParams, type SubmitResult } from "./actions";
import { resolveConfig, type AgentConfig } from "./config";
import { amountUsd, applyPolicyToStrategy, expectedValues } from "./ev";
import { unknownIdentifiers } from "./facts";
import { guardedCall, textOf } from "./llm";
import type { AgentDeps, EvidenceItem, OfferType, OrderFacts, TrackingInfo, TransactionFacts } from "./ports";
import { agentSystem, policyLines } from "./prompts";
import { replayStoredRun } from "./replay";
import { ACTIONABLE_RELS, EVIDENCE_TYPES, toolsFor, WRITE_TOOL_NAMES } from "./tools";
import { runTriage } from "./triage";

export type RunOutcome = {
  status: "done" | "skipped" | "locked" | "waiting" | "replayed" | "error";
  summary: string;
  costUsd: number;
};

/** Seconds a run may hold the case lock (Vercel functions stop at 300 s). */
const LOCK_TTL_S = 290;

export async function runAgentWith(deps: AgentDeps, caseId: string, trigger: AgentTrigger): Promise<RunOutcome> {
  const lock = await deps.db.locks.withCaseLock(caseId, () => runLocked(deps, caseId, trigger), { ttlS: LOCK_TTL_S });
  if (!lock.acquired) return { status: "locked", summary: "Another agent run is working on this case", costUsd: 0 };
  return lock.value;
}

type Ctx = {
  deps: AgentDeps;
  cfg: AgentConfig;
  c: CaseRecord;
  snap: DisputeSnapshot;
  policy: SellerPolicy;
  order?: OrderFacts | null;
  tracking?: TrackingInfo[];
  txns?: TransactionFacts[];
  decision?: Decision;
  acted: { kind: string; result: SubmitResult }[];
  costUsd: number;
};

async function runLocked(deps: AgentDeps, caseId: string, trigger: AgentTrigger): Promise<RunOutcome> {
  const cfg = resolveConfig(deps.config);
  const now = () => deps.now?.() ?? new Date();
  let c = await deps.db.cases.get(caseId);
  if (!c) return { status: "error", summary: `Case ${caseId} not found`, costUsd: 0 };

  // Always act on PayPal's current state; fall back to the stored snapshot if PayPal is unreachable.
  let snap = c.snapshot;
  try {
    snap = await deps.paypal.getDispute(caseId);
    c = (await deps.db.cases.upsertFromSnapshot(snap)).record;
  } catch (e) {
    await audit(deps, caseId, "system", "tool.get_dispute", `Couldn't refresh the dispute from PayPal (${errMsg(e)}); using the last copy`, {
      tool: "get_dispute",
    });
  }

  const history = await deps.db.audit.listByCase(caseId, { limit: 1000 });
  const doneFor = history.some((e) => e.kind === "agent.run.done" && e.data?.updateTime === snap.updateTime);
  if (doneFor && trigger.kind === "webhook") {
    return { status: "skipped", summary: "Already handled this version of the dispute", costUsd: 0 };
  }
  const finish = async (status: CaseStatus | null, summary: string, costUsd: number, data: Record<string, unknown> = {}) => {
    if (status) await deps.db.cases.setStatus(caseId, status);
    await audit(deps, caseId, "agent", "agent.run.done", summary, { updateTime: snap.updateTime, trigger: trigger.kind, ...data }, costUsd || undefined);
  };

  if (snap.status === "RESOLVED") {
    const outcome = snap.outcome ? ` (${snap.outcome})` : "";
    await finish("resolved", `PayPal closed the dispute${outcome}. Nothing left to do.`, 0);
    return { status: "done", summary: `Resolved${outcome}`, costUsd: 0 };
  }

  const actions = await deps.db.actions.listByCase(caseId);
  if (actions.some((a) => a.status === "awaiting_approval")) {
    await finish("awaiting_approval", "Waiting for your approval before doing anything else.", 0);
    return { status: "waiting", summary: "Awaiting approval", costUsd: 0 };
  }
  const actionable = snap.allowed.some((r) => ACTIONABLE_RELS.includes(r));
  if (!actionable && c.triage) {
    await finish("waiting_on_paypal", `${statusLine(snap)} No action is open to the seller right now.`, 0);
    return { status: "waiting", summary: "Waiting on PayPal", costUsd: 0 };
  }

  const ctx: Ctx = { deps, cfg, c, snap, policy: await deps.db.policy.get(), acted: [], costUsd: 0 };
  try {
    await deps.spend.startRun(caseId);
    await deps.db.cases.setStatus(caseId, "acting");
    await audit(deps, caseId, "agent", "agent.run.start", `Agent started: ${triggerLine(trigger, snap)}`, {
      trigger: trigger.kind,
      eventType: trigger.eventType,
      status: snap.status,
      allowed: snap.allowed,
    });

    if (!c.triage) {
      const t = await runTriage(deps.llm, deps.spend, snap, {
        model: cfg.triageModel,
        effort: cfg.triageEffort,
        maxTokens: cfg.triageMaxTokens,
        caseId,
        now: now(),
      });
      ctx.costUsd += t.costUsd;
      ctx.c = (await deps.db.cases.setTriage(caseId, t.triage)) ?? { ...ctx.c, triage: t.triage };
      await audit(deps, caseId, "agent", "triage", `Triage: ${CATEGORY[t.triage.category]}. ${t.triage.summary}`, {
        category: t.triage.category,
        model: t.triage.model,
      }, t.costUsd);
    }

    if (!actionable) {
      await finish("triaged", `${statusLine(snap)} No action is open to the seller yet; the agent continues when PayPal updates the case.`, ctx.costUsd);
      return { status: "waiting", summary: "Triaged; waiting on PayPal", costUsd: ctx.costUsd };
    }

    await decideAndAct(ctx, actions, trigger);
    const status = caseStatusAfterRun(ctx);
    await finish(status, runSummary(ctx), ctx.costUsd, { strategy: ctx.decision?.strategy });
    return { status: "done", summary: runSummary(ctx), costUsd: ctx.costUsd };
  } catch (e) {
    if (e instanceof SpendCapError) {
      await audit(deps, caseId, "system", "spend.blocked", `Demo budget reached (${e.cap} cap): no new AI calls.`, { cap: e.cap }, ctx.costUsd || undefined);
      if (!ctx.decision) {
        const replayed = await replayStoredRun(deps, ctx.c);
        await finish(null, replayed ? "Showing the agent's last recorded run for this kind of dispute." : "No recorded run to show.", 0, {
          replay: true,
        });
        return { status: "replayed", summary: "Demo budget reached", costUsd: ctx.costUsd };
      }
      await deps.db.cases.setStatus(caseId, caseStatusAfterRun(ctx));
      return { status: "replayed", summary: "Demo budget reached mid-run", costUsd: ctx.costUsd };
    }
    await deps.db.cases.setStatus(caseId, "error");
    await audit(deps, caseId, "system", "agent.error", `The agent stopped on an error: ${errMsg(e)}`, undefined, ctx.costUsd || undefined);
    return { status: "error", summary: errMsg(e), costUsd: ctx.costUsd };
  }
}

const CATEGORY: Record<string, string> = {
  not_received: "item not received",
  not_as_described: "not as described",
  unauthorized: "unauthorized payment",
  duplicate_or_billing: "billing problem",
  other: "other",
};

async function decideAndAct(ctx: Ctx, priorActions: Awaited<ReturnType<AgentDeps["db"]["actions"]["listByCase"]>>, trigger: AgentTrigger) {
  const { deps, cfg, snap } = ctx;
  const tools = toolsFor(snap.allowed, { transactionSearch: cfg.transactionSearch && !!deps.paypal.searchTransactions });
  const system: Anthropic.TextBlockParam[] = [{ type: "text", text: agentSystem(), cache_control: { type: "ephemeral" } }];
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: caseBrief(ctx, priorActions, trigger) }];

  for (let turn = 1; turn <= cfg.maxTurns; turn++) {
    const { message, costUsd } = await guardedCall(
      deps.llm,
      deps.spend,
      {
        model: cfg.agentModel,
        max_tokens: cfg.agentMaxTokens,
        system,
        tools,
        tool_choice: { type: "auto" },
        output_config: { effort: cfg.agentEffort },
        cache_control: { type: "ephemeral" },
        messages,
      },
      ctx.c.id,
    );
    ctx.costUsd += costUsd;
    messages.push({ role: "assistant", content: message.content as Anthropic.ContentBlockParam[] });

    const uses = message.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    const text = textOf(message);
    await audit(deps, ctx.c.id, "agent", "agent.step", stepLine(uses, text, message.stop_reason), {
      turn,
      tools: uses.map((u) => u.name),
      model: cfg.agentModel,
      inputTokens: message.usage.input_tokens,
      outputTokens: message.usage.output_tokens,
      cacheReadTokens: message.usage.cache_read_input_tokens ?? 0,
      cacheWriteTokens: message.usage.cache_creation_input_tokens ?? 0,
    }, costUsd);

    if (message.stop_reason === "refusal") throw new Error("The model declined this request");
    if (!uses.length) break;

    const results: Anthropic.ToolResultBlockParam[] = [];
    let hadError = false;
    for (const u of uses) {
      const r = await runTool(ctx, u.name, (u.input ?? {}) as Record<string, unknown>);
      hadError ||= !!r.isError;
      results.push({ type: "tool_result", tool_use_id: u.id, content: JSON.stringify(r.content), ...(r.isError ? { is_error: true } : {}) });
    }
    messages.push({ role: "user", content: results });

    if (isFinished(ctx, uses, hadError)) break;
    if (turn === cfg.maxTurns) {
      await audit(deps, ctx.c.id, "agent", "agent.turn_limit", `Stopped after ${turn} steps without finishing; the next PayPal update resumes the case.`);
    }
  }
}

/** Done when a decision exists and either nothing is left to do or the matching action went through the gate. */
function isFinished(ctx: Ctx, uses: Anthropic.ToolUseBlock[], hadError: boolean): boolean {
  if (!ctx.decision || hadError) return false;
  if (ctx.decision.strategy === "wait") return true;
  if (!writeToolsFor(ctx.decision.strategy, ctx.snap).length) return true;
  return uses.some((u) => WRITE_TOOL_NAMES.includes(u.name)) && ctx.acted.length > 0;
}

type ToolOut = { content: unknown; isError?: boolean };

async function runTool(ctx: Ctx, name: string, input: Record<string, unknown>): Promise<ToolOut> {
  try {
    switch (name) {
      case "get_order":
        return { content: await toolGetOrder(ctx) };
      case "get_tracking":
        return { content: await toolGetTracking(ctx) };
      case "get_dispute":
        return { content: await toolGetDispute(ctx) };
      case "search_transactions":
        return { content: await toolSearchTransactions(ctx) };
      case "record_decision":
        return await toolRecordDecision(ctx, input);
      case "provide_evidence":
      case "accept_claim":
      case "make_offer":
      case "send_message":
      case "acknowledge_return_item":
        return await toolWrite(ctx, name, input);
      default:
        return { content: { error: `Unknown tool ${name}` }, isError: true };
    }
  } catch (e) {
    await audit(ctx.deps, ctx.c.id, "system", `tool.${name}`, `${name.replace(/_/g, " ")} failed: ${errMsg(e)}`, { tool: name });
    return { content: { error: errMsg(e) }, isError: true };
  }
}

async function toolGetOrder(ctx: Ctx) {
  const capture = ctx.snap.sellerTransactionId;
  if (!capture) {
    ctx.order = null;
    await audit(ctx.deps, ctx.c.id, "agent", "tool.get_order", "No payment id on the dispute, so no order to read", { tool: "get_order" });
    return { found: false, reason: "The dispute has no seller transaction id" };
  }
  const order = await ctx.deps.paypal.getOrderForCapture(capture);
  ctx.order = order;
  await saveOrder(ctx);
  const summary = order
    ? `Read the order: ${order.items.length} item${order.items.length === 1 ? "" : "s"}${order.items[0] ? ` (${order.items[0].name.slice(0, 40)})` : ""}${order.paidAt ? `, paid ${day(order.paidAt)}` : ""}`
    : "PayPal has no order record for this payment";
  await audit(ctx.deps, ctx.c.id, "agent", "tool.get_order", summary, { tool: "get_order", found: !!order, orderId: order?.orderId });
  return order ? { found: true, ...order } : { found: false };
}

async function toolGetTracking(ctx: Ctx) {
  const capture = ctx.snap.sellerTransactionId;
  const tracking = capture ? await ctx.deps.paypal.getTracking(capture) : [];
  ctx.tracking = tracking;
  await saveOrder(ctx);
  const t = tracking[0];
  const summary = t
    ? `Read tracking: ${t.carrier} …${t.trackingNumber.slice(-6)}${t.status ? `, ${t.status.toLowerCase()}` : ""}${tracking.length > 1 ? ` (+${tracking.length - 1} more)` : ""}`
    : "No tracking was added to this payment";
  await audit(ctx.deps, ctx.c.id, "agent", "tool.get_tracking", summary, { tool: "get_tracking", count: tracking.length, status: t?.status });
  return { tracking, note: tracking.length ? undefined : "No tracking exists for this payment. Do not cite any tracking number." };
}

async function toolGetDispute(ctx: Ctx) {
  const snap = await ctx.deps.paypal.getDispute(ctx.c.id);
  ctx.snap = snap;
  ctx.c = (await ctx.deps.db.cases.upsertFromSnapshot(snap)).record;
  await audit(ctx.deps, ctx.c.id, "agent", "tool.get_dispute", `Read the dispute: ${statusLine(snap)}`, { tool: "get_dispute", status: snap.status });
  return disputeFacts(snap);
}

async function toolSearchTransactions(ctx: Ctx) {
  const search = ctx.deps.paypal.searchTransactions;
  const id = ctx.snap.sellerTransactionId;
  if (!search || !id) return { available: false };
  const txns = await search({ transactionId: id });
  ctx.txns = txns;
  await audit(ctx.deps, ctx.c.id, "agent", "tool.search_transactions", `Read ${txns.length} transaction record${txns.length === 1 ? "" : "s"}`, {
    tool: "search_transactions",
    count: txns.length,
  });
  return { transactions: txns };
}

async function toolRecordDecision(ctx: Ctx, input: Record<string, unknown>): Promise<ToolOut> {
  const proposed = String(input.strategy) as Decision["strategy"];
  const p = clamp01(Number(input.win_probability));
  const strength = (["strong", "medium", "weak"] as const).find((s) => s === input.evidence_strength) ?? "medium";
  const offerPct = Math.min(ctx.policy.maxOfferPercent, Math.max(0, Number(input.offer_percent) || 0));
  const amount = amountUsd(ctx.snap);
  const ev = expectedValues({ amountUsd: amount, stage: ctx.snap.stage, winProbability: p, offerShare: offerPct / 100 });
  const { strategy, policyNote } = applyPolicyToStrategy(proposed, ev, p, ctx.policy, ctx.snap.stage);
  const rationale = String(input.rationale ?? "").trim().slice(0, 400);
  const decision: Decision = {
    strategy,
    winProbability: p,
    expectedValueUsd: { fight: ev.fight, refund: ev.refund, ...(ev.offer !== undefined ? { offer: ev.offer } : {}) },
    rationale,
    evidenceStrength: strength,
    ...(policyNote ? { policyNote } : {}),
    model: `${ctx.cfg.agentModel} (${ctx.cfg.agentEffort})`,
    at: (ctx.deps.now?.() ?? new Date()).toISOString(),
  };
  ctx.decision = decision;
  ctx.c = (await ctx.deps.db.cases.setDecision(ctx.c.id, decision)) ?? { ...ctx.c, decision };
  const evLine = `expected result: fight ${usd(ev.fight)}, refund ${usd(ev.refund)}${ev.offer !== undefined ? `, offer ${usd(ev.offer)}` : ""}`;
  await audit(
    ctx.deps,
    ctx.c.id,
    "agent",
    "decision",
    `Decision: ${STRATEGY[strategy]} (win chance ${Math.round(p * 100)}%, ${evLine}). ${rationale}${policyNote ? ` Policy: ${policyNote}` : ""}`,
    { strategy, proposed, winProbability: p, evidenceStrength: strength, expectedValueUsd: decision.expectedValueUsd },
  );
  const tools = writeToolsFor(strategy, ctx.snap);
  return {
    content: {
      final_strategy: strategy,
      ...(policyNote ? { policy_note: policyNote } : {}),
      expected_value_usd: decision.expectedValueUsd,
      next: tools.length
        ? `Act now with: ${tools.join(", ")}.`
        : strategy === "wait"
          ? "Nothing to do now. Stop."
          : "PayPal doesn't currently allow the action this strategy needs. Stop; the case resumes on the next PayPal update.",
    },
  };
}

const STRATEGY: Record<Decision["strategy"], string> = {
  fight: "fight with evidence",
  refund_full: "refund in full",
  offer_partial: "offer a partial refund",
  accept_claim: "accept the claim",
  message_buyer: "message the buyer",
  wait: "wait",
};

const TOOL_STRATEGIES: Record<string, Decision["strategy"][]> = {
  provide_evidence: ["fight"],
  accept_claim: ["accept_claim", "refund_full"],
  make_offer: ["offer_partial", "refund_full"],
  send_message: ["message_buyer", "offer_partial", "refund_full", "fight"],
  acknowledge_return_item: ["fight", "refund_full", "accept_claim", "offer_partial", "message_buyer"],
};

const REL_FOR_TOOL: Record<string, string> = {
  provide_evidence: "provide_evidence",
  accept_claim: "accept_claim",
  make_offer: "make_offer",
  send_message: "send_message",
  acknowledge_return_item: "acknowledge_return_item",
};

function writeToolsFor(strategy: Decision["strategy"], snap: DisputeSnapshot): string[] {
  return WRITE_TOOL_NAMES.filter(
    (n) => TOOL_STRATEGIES[n].includes(strategy) && (snap.allowed as string[]).includes(REL_FOR_TOOL[n]) && n !== "acknowledge_return_item",
  );
}

async function toolWrite(ctx: Ctx, name: string, input: Record<string, unknown>): Promise<ToolOut> {
  const d = ctx.decision;
  if (!d) return { content: { error: "Call record_decision before any write action." }, isError: true };
  if (!TOOL_STRATEGIES[name].includes(d.strategy)) {
    return { content: { error: `${name} doesn't fit the final strategy "${d.strategy}".` }, isError: true };
  }
  const money = (n: number): Money => ({ value: n.toFixed(2), currency_code: ctx.snap.amount.currency_code });
  let a: ActionParams;
  switch (name) {
    case "provide_evidence": {
      const built = await buildEvidence(ctx, input);
      if ("error" in built) return { content: { error: built.error }, isError: true };
      a = { kind: "provide_evidence", p: built };
      break;
    }
    case "accept_claim":
      a = { kind: "accept_claim", p: { note: str(input.note, 500), refundAmount: ctx.snap.amount } };
      break;
    case "make_offer": {
      const offerType = String(input.offer_type) as OfferType;
      const amt = Math.max(0, Number(input.amount_usd) || 0);
      const total = amountUsd(ctx.snap);
      const capUsd = d.strategy === "refund_full" ? total : (total * ctx.policy.maxOfferPercent) / 100;
      if (amt > capUsd + 0.005) {
        return { content: { error: `Offer $${amt.toFixed(2)} exceeds the policy cap of $${capUsd.toFixed(2)}.` }, isError: true };
      }
      a = {
        kind: "make_offer",
        p: { offerType, note: str(input.note, 1000), ...(offerType === "REPLACEMENT_WITHOUT_REFUND" ? {} : { amount: money(amt) }) },
      };
      break;
    }
    case "send_message":
      a = { kind: "send_message", p: { message: str(input.message, 2000) } };
      break;
    default:
      a = { kind: "acknowledge_return_item", p: { note: str(input.note, 500) } };
  }
  const r = await submitAction(ctx.deps, ctx.c, ctx.snap, ctx.policy, a, d.rationale);
  ctx.acted.push({ kind: name, result: r });
  const ok = r.outcome !== "blocked" && !(r.outcome === "execute" && r.action?.status === "failed");
  return {
    content: { outcome: r.outcome, status: "action" in r ? r.action?.status : undefined, detail: r.reason },
    ...(ok ? {} : { isError: true }),
  };
}

async function buildEvidence(ctx: Ctx, input: Record<string, unknown>) {
  if (ctx.tracking === undefined) await toolGetTracking(ctx);
  if (ctx.order === undefined) await toolGetOrder(ctx);
  const tracking = ctx.tracking ?? [];
  const narrative = str(input.narrative, 4000);
  const exhibits = (Array.isArray(input.exhibits) ? input.exhibits : [])
    .slice(0, 6)
    .map((x) => ({ title: str((x as Record<string, unknown>).title, 120), body: str((x as Record<string, unknown>).body, 2500) }))
    .filter((x) => x.title && x.body);
  if (narrative.length < 40) return { error: "The narrative is too short; write 120-220 words of facts." };

  // Every identifier in the text must come from PayPal/tool data.
  const known = [
    ctx.c.id,
    ctx.snap.sellerTransactionId,
    ctx.snap.buyerTransactionId,
    ctx.snap.invoiceId,
    ctx.order?.orderId,
    ctx.order?.captureId,
    ...tracking.map((t) => t.trackingNumber),
    ...(ctx.txns ?? []).map((t) => t.transactionId),
  ].filter((x): x is string => !!x);
  const unknown = unknownIdentifiers([narrative, ...exhibits.map((e) => `${e.title} ${e.body}`)].join("\n"), known);
  if (unknown.length) {
    await audit(ctx.deps, ctx.c.id, "system", "agent.fact_check", `Held back the evidence: it cited ${unknown.length} identifier${unknown.length > 1 ? "s" : ""} no tool returned`, {
      count: unknown.length,
    });
    return {
      error: `These identifiers don't appear in any tool result: ${unknown.join(", ")}. Remove them; cite only facts returned by tools.`,
    };
  }

  const allowedTypes = new Set<string>(EVIDENCE_TYPES);
  let types = [...new Set((Array.isArray(input.evidence_types) ? input.evidence_types : []).map(String))].filter((t) => allowedTypes.has(t));
  if (!tracking.length) types = types.filter((t) => t !== "PROOF_OF_FULFILLMENT");
  if (!types.includes("OTHER") && !types.length) types.push("OTHER");
  const evidences: EvidenceItem[] = types.map((t, i) => {
    const item: EvidenceItem = { evidenceType: t };
    if (t === "PROOF_OF_FULFILLMENT") {
      item.trackingInfo = tracking.map((x) => ({ carrierName: x.carrier, trackingNumber: x.trackingNumber }));
      item.notes = "Shipment tracking from the seller's PayPal records; full account in the attached evidence pack.";
    } else if (t === "OTHER" || i === 0) {
      item.notes = narrative.slice(0, 2000);
    } else {
      item.notes = "See the attached evidence pack.";
    }
    return item;
  });
  if (!evidences.some((e) => e.notes === narrative.slice(0, 2000))) evidences[0].notes = narrative.slice(0, 2000);
  return { evidences, narrative, exhibits, round: ctx.snap.updateTime };
}

async function saveOrder(ctx: Ctx) {
  const base = ctx.order ?? ctx.c.order ?? { items: [] };
  const order = { ...base, ...(ctx.tracking ? { shipping: ctx.tracking } : {}) };
  ctx.c = (await ctx.deps.db.cases.setOrder(ctx.c.id, order)) ?? { ...ctx.c, order };
}

/** The opening user message: everything the model needs to plan, no PII beyond the buyer's own words. */
function caseBrief(ctx: Ctx, prior: { kind: string; status: string; updatedAt: string; result?: { httpStatus?: number; error?: string } }[], trigger: AgentTrigger): string {
  const { snap, c, policy } = ctx;
  const lines = [
    `Case brief (${trigger.kind}${trigger.eventType ? `: ${trigger.eventType}` : ""})`,
    `Dispute: ${JSON.stringify(disputeFacts(snap))}`,
    `Triage: ${c.triage ? `${c.triage.category}. ${c.triage.summary}` : "not available"}`,
    `Seller policy:\n${policyLines(policy).map((l) => `- ${l}`).join("\n")}`,
    `Actions so far: ${
      prior.length
        ? prior
            .map((a) => `${ACTION_LABEL[a.kind as keyof typeof ACTION_LABEL] ?? a.kind} ${a.status} ${a.updatedAt}${a.result?.error ? ` (${a.result.error})` : ""}`)
            .join("; ")
        : "none"
    }`,
    c.decision ? `Previous decision: ${c.decision.strategy} at ${c.decision.at}: ${c.decision.rationale}` : "",
    `Write actions PayPal allows now: ${snap.allowed.filter((r) => ACTIONABLE_RELS.includes(r)).join(", ") || "none"}.`,
    "Gather what you need, record your decision, then act.",
  ];
  return lines.filter(Boolean).join("\n\n");
}

function disputeFacts(s: DisputeSnapshot) {
  return {
    id: s.id,
    reason: s.reason,
    stage: s.stage,
    channel: s.channel,
    status: s.status,
    amount: s.amount,
    created: s.createTime,
    updated: s.updateTime,
    sellerResponseDue: s.sellerResponseDueDate,
    requestedEvidence: s.requestedEvidence ?? [],
    paymentId: s.sellerTransactionId,
    messages: s.messages.map((m) => ({ from: m.postedBy, at: m.at, text: m.content.slice(0, 1500) })),
    allowedActions: s.allowed,
  };
}

function caseStatusAfterRun(ctx: Ctx): CaseStatus {
  const outcomes = ctx.acted.map((a) => a.result);
  if (outcomes.some((r) => r.outcome === "awaiting_approval")) return "awaiting_approval";
  const executed = ctx.acted.filter((a) => a.result.outcome === "execute" && "action" in a.result && a.result.action?.status === "executed");
  if (executed.length) return statusAfter(executed[executed.length - 1].kind as never, true) ?? "waiting_on_paypal";
  if (ctx.acted.some((a) => a.result.outcome === "execute")) return "error";
  if (ctx.decision?.strategy === "wait") return "waiting_on_paypal";
  return "triaged";
}

function runSummary(ctx: Ctx): string {
  const d = ctx.decision;
  if (!d) return "The agent finished without a decision; it continues on the next PayPal update.";
  const acts = ctx.acted.map((a) => `${ACTION_LABEL[a.kind as keyof typeof ACTION_LABEL]}: ${OUTCOME[a.result.outcome]}`);
  return `Agent finished: ${STRATEGY[d.strategy]}${acts.length ? `; ${acts.join("; ")}` : ""}. Cost ${usd4(ctx.costUsd)}.`;
}

const OUTCOME: Record<SubmitResult["outcome"], string> = {
  execute: "sent",
  awaiting_approval: "waiting for approval",
  proposed: "proposed (dry run)",
  blocked: "blocked",
  duplicate: "already done",
};

function stepLine(uses: Anthropic.ToolUseBlock[], text: string, stop: string | null): string {
  if (uses.length) {
    const names = uses.map((u) => u.name.replace(/_/g, " "));
    return `Agent step: ${names.join(", ")}`;
  }
  if (text) return `Agent: ${text.replace(/\s+/g, " ").slice(0, 200)}`;
  return `Agent step finished (${stop ?? "no output"})`;
}

function statusLine(s: DisputeSnapshot): string {
  return `PayPal status ${s.status.replace(/_/g, " ").toLowerCase()} (${s.stage.toLowerCase()} stage).`;
}

function triggerLine(t: AgentTrigger, s: DisputeSnapshot): string {
  const why = t.kind === "webhook" ? (t.eventType ?? "PayPal update") : t.kind === "approval" ? "after your approval" : "manual run";
  return `${why}; ${s.reason.replace(/_/g, " ").toLowerCase()}, ${s.amount.value} ${s.amount.currency_code}`;
}

const clamp01 = (n: number) => (Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0.5);
const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
const usd = (n: number) => `${n < 0 ? "-" : ""}$${Math.abs(n).toFixed(2)}`;
const usd4 = (n: number) => `$${n.toFixed(4)}`;
const day = (iso: string) => iso.slice(0, 10);
const errMsg = (e: unknown) => (e instanceof Error ? e.message : String(e)).slice(0, 300);
