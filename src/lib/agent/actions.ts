// Write actions: dedupe → policy gate → record → execute (or queue for approval / propose in dry run).
// executeApproved / deny serve the Approvals UI.
import type { ActionKind, AgentAction, CaseRecord, CaseStatus, DisputeSnapshot, Money, OrderContext, SellerPolicy } from "../types";
import { policyGate, type GateOutcome } from "./policy";
import type { AgentDeps, EvidenceItem, OfferType } from "./ports";

/** Request inputs stored on the action (files are rebuilt from these at execution time). */
export type ProvideEvidenceParams = {
  evidences: EvidenceItem[];
  narrative: string;
  exhibits: { title: string; body: string }[];
  /** snapshot.updateTime when proposed: one submission per PayPal evidence request. */
  round: string;
};

export type ActionParams =
  | { kind: "provide_evidence"; p: ProvideEvidenceParams }
  | { kind: "accept_claim"; p: { note: string; refundAmount?: Money } }
  | { kind: "make_offer"; p: { offerType: OfferType; amount?: Money; note: string } }
  | { kind: "send_message"; p: { message: string } }
  | { kind: "acknowledge_return_item"; p: { note: string } };

const LIVE: AgentAction["status"][] = ["awaiting_approval", "approved", "executing", "executed"];

const LABEL: Record<ActionKind, string> = {
  send_message: "message to the buyer",
  make_offer: "offer to the buyer",
  provide_evidence: "evidence submission",
  accept_claim: "claim acceptance",
  acknowledge_return_item: "return acknowledgement",
  refund_capture: "refund",
  require_evidence: "require-evidence (sandbox)",
  adjudicate: "adjudication (sandbox)",
};

/**
 * Why this action would repeat one already done or pending, or null if it's new.
 * Evidence may be sent again only once PayPal asks again (a newer snapshot after our last submission);
 * messages only after a newer buyer message; claims and offers never twice.
 */
export function duplicateReason(kind: ActionKind, existing: AgentAction[], snap: DisputeSnapshot): string | null {
  const same = existing.filter((a) => a.kind === kind && LIVE.includes(a.status));
  if (!same.length) return null;
  const pending = same.find((a) => a.status !== "executed");
  if (pending) return `A ${LABEL[kind]} is already ${pending.status.replace(/_/g, " ")}`;
  const last = same.reduce((a, b) => (a.updatedAt > b.updatedAt ? a : b));
  if (kind === "provide_evidence") {
    return t(snap.updateTime) > t(last.updatedAt) ? null : `Evidence was already submitted for this request (${last.updatedAt})`;
  }
  if (kind === "send_message") {
    const lastBuyer = Math.max(0, ...snap.messages.filter((m) => m.postedBy === "BUYER").map((m) => t(m.at)));
    return lastBuyer > t(last.updatedAt) ? null : "Already replied; waiting for the buyer";
  }
  return `A ${LABEL[kind]} was already sent`;
}

export function moneyOf(a: ActionParams): number | undefined {
  if (a.kind === "accept_claim") return a.p.refundAmount ? Number(a.p.refundAmount.value) : undefined;
  if (a.kind === "make_offer") return a.p.amount ? Number(a.p.amount.value) : 0;
  return undefined;
}

export type SubmitResult =
  | { outcome: "duplicate"; reason: string }
  | { outcome: GateOutcome["outcome"]; reason: string; action?: AgentAction };

/** Gate and record one action; executes it at once when the gate says so. */
export async function submitAction(
  deps: AgentDeps,
  c: CaseRecord,
  snap: DisputeSnapshot,
  policy: SellerPolicy,
  a: ActionParams,
  rationale: string,
): Promise<SubmitResult> {
  const existing = await deps.db.actions.listByCase(c.id);
  const dup = duplicateReason(a.kind, existing, snap);
  if (dup) {
    await audit(deps, c.id, "agent", "action.duplicate", `Skipped ${LABEL[a.kind]}: ${dup}`);
    return { outcome: "duplicate", reason: dup };
  }
  const amountUsd = moneyOf(a);
  const gate = policyGate({ kind: a.kind, amountUsd }, policy, snap.allowed);
  if (gate.outcome === "blocked") {
    await audit(deps, c.id, "agent", "action.blocked", `Blocked ${LABEL[a.kind]}: ${gate.reason}`);
    return gate;
  }
  const status = gate.outcome === "execute" ? "executing" : gate.outcome === "proposed" ? "proposed" : "awaiting_approval";
  const action = await deps.db.actions.insert({
    caseId: c.id,
    kind: a.kind,
    params: a.p as unknown as Record<string, unknown>,
    rationale,
    amountUsd,
    requiresApproval: gate.outcome === "awaiting_approval",
    status,
  });
  if (gate.outcome === "proposed") {
    await audit(deps, c.id, "agent", "action.proposed", `Proposed ${LABEL[a.kind]} (dry run, not sent)`, { actionId: action.id });
    return { ...gate, action };
  }
  if (gate.outcome === "awaiting_approval") {
    await audit(deps, c.id, "agent", "action.awaiting_approval", `${cap(LABEL[a.kind])} waits for your approval: ${gate.reason}`, {
      actionId: action.id,
      amountUsd,
    });
    return { ...gate, action };
  }
  const done = await perform(deps, c, action);
  return { ...gate, action: done, reason: done.status === "executed" ? gate.reason : (done.result?.error ?? "failed") };
}

/** Calls PayPal for a recorded action and stores the result. Never throws. */
export async function perform(deps: AgentDeps, c: CaseRecord, action: AgentAction): Promise<AgentAction> {
  const pp = deps.paypal;
  const p = action.params as Record<string, never>;
  try {
    let r: { status: number; debugId?: string };
    switch (action.kind) {
      case "provide_evidence": {
        const ep = action.params as unknown as ProvideEvidenceParams;
        const order: OrderContext = c.order ?? { items: [] };
        const pdf = await deps.evidence.buildEvidencePdf({ case: c, order, narrative: ep.narrative, exhibits: ep.exhibits });
        r = await pp.provideEvidence(c.id, {
          evidences: ep.evidences,
          files: [{ name: `caseclerk-evidence-${c.id}.pdf`, bytes: pdf, contentType: "application/pdf" }],
        });
        break;
      }
      case "accept_claim":
        r = await pp.acceptClaim(c.id, p as unknown as { note: string; refundAmount?: Money });
        break;
      case "make_offer":
        r = await pp.makeOffer(c.id, p as unknown as { offerType: OfferType; amount?: Money; note: string });
        break;
      case "send_message":
        r = await pp.sendMessage(c.id, (p as unknown as { message: string }).message);
        break;
      case "acknowledge_return_item":
        r = await pp.acknowledgeReturn(c.id, (p as unknown as { note: string }).note);
        break;
      default:
        throw new Error(`${action.kind} is not an agent action`);
    }
    const ok = r.status >= 200 && r.status < 300;
    const updated = await deps.db.actions.update(action.id, {
      status: ok ? "executed" : "failed",
      result: { httpStatus: r.status, debugId: r.debugId, ...(ok ? {} : { error: `PayPal answered ${r.status}` }) },
    });
    await audit(
      deps,
      c.id,
      "paypal",
      ok ? "action.executed" : "action.failed",
      ok ? `PayPal accepted the ${LABEL[action.kind]} (HTTP ${r.status})` : `PayPal rejected the ${LABEL[action.kind]} (HTTP ${r.status})`,
      { actionId: action.id, httpStatus: r.status, debugId: r.debugId, tool: action.kind },
    );
    return updated ?? action;
  } catch (e) {
    const err = e as { message?: string; status?: number; debugId?: string; issue?: string };
    const msg = (err.issue ?? err.message ?? "unknown error").slice(0, 300);
    const updated = await deps.db.actions.update(action.id, {
      status: "failed",
      result: { httpStatus: err.status, debugId: err.debugId, error: msg },
    });
    await audit(deps, c.id, "paypal", "action.failed", `The ${LABEL[action.kind]} failed: ${msg}`, {
      actionId: action.id,
      httpStatus: err.status,
      debugId: err.debugId,
      tool: action.kind,
    });
    return updated ?? action;
  }
}

/** Case status after an action settles. */
export function statusAfter(kind: ActionKind, executed: boolean): CaseStatus | null {
  if (!executed) return null;
  if (kind === "send_message" || kind === "make_offer") return "waiting_on_buyer";
  return "waiting_on_paypal";
}

export type ApprovalResult = { ok: boolean; message: string; action?: AgentAction };

/** Seller approved a queued action: re-check PayPal's links, then execute it once. */
export async function executeApprovedWith(deps: AgentDeps, actionId: string): Promise<ApprovalResult> {
  const a = await deps.db.actions.get(actionId);
  if (!a) return { ok: false, message: "Action not found" };
  const claimed = await deps.db.actions.update(actionId, { status: "approved" }, { ifStatus: ["awaiting_approval"] });
  if (!claimed) return { ok: false, message: `Action is ${a.status.replace(/_/g, " ")}, not awaiting approval`, action: a };
  await audit(deps, a.caseId, "seller", "action.approved", `You approved the ${LABEL[a.kind]}`, { actionId });

  let c = await deps.db.cases.get(a.caseId);
  if (!c) return { ok: false, message: "Case not found" };
  let snap = c.snapshot;
  try {
    snap = await deps.paypal.getDispute(a.caseId);
    c = (await deps.db.cases.upsertFromSnapshot(snap)).record;
  } catch {
    // Use the stored snapshot; PayPal's answer to the action is the final word.
  }
  const policy = await deps.db.policy.get();
  const gate = policyGate({ kind: a.kind, amountUsd: a.amountUsd }, { ...policy, dryRun: false }, snap.allowed);
  if (gate.outcome === "blocked") {
    const failed = await deps.db.actions.update(actionId, { status: "failed", result: { error: gate.reason } });
    await audit(deps, a.caseId, "system", "action.failed", `Couldn't run the approved ${LABEL[a.kind]}: ${gate.reason}`, { actionId });
    return { ok: false, message: gate.reason, action: failed ?? a };
  }
  const executing = await deps.db.actions.update(actionId, { status: "executing" }, { ifStatus: ["approved"] });
  if (!executing) return { ok: false, message: "Action is already running", action: a };
  const done = await perform(deps, c, executing);
  const ok = done.status === "executed";
  const next = statusAfter(a.kind, ok) ?? "triaged";
  await deps.db.cases.setStatus(a.caseId, ok ? next : "error");
  return { ok, message: ok ? `Sent to PayPal` : (done.result?.error ?? "PayPal rejected it"), action: done };
}

/** Seller denied a queued action. */
export async function denyWith(deps: AgentDeps, actionId: string, note?: string): Promise<ApprovalResult> {
  const a = await deps.db.actions.update(actionId, { status: "denied" }, { ifStatus: ["awaiting_approval"] });
  if (!a) {
    const cur = await deps.db.actions.get(actionId);
    return { ok: false, message: cur ? `Action is ${cur.status.replace(/_/g, " ")}, not awaiting approval` : "Action not found" };
  }
  await audit(deps, a.caseId, "seller", "action.denied", `You denied the ${LABEL[a.kind]}${note ? `: ${note.slice(0, 120)}` : ""}`, {
    actionId,
  });
  const others = (await deps.db.actions.listByCase(a.caseId)).filter((x) => x.status === "awaiting_approval");
  if (!others.length) await deps.db.cases.setStatus(a.caseId, "triaged");
  return { ok: true, message: "Denied", action: a };
}

export async function audit(
  deps: AgentDeps,
  caseId: string,
  actor: "agent" | "seller" | "paypal" | "system",
  kind: string,
  summary: string,
  data?: Record<string, unknown>,
  costUsd?: number,
) {
  await deps.db.audit.append({ caseId, actor, kind, summary, ...(data ? { data } : {}), ...(costUsd !== undefined ? { costUsd } : {}) });
}

const t = (iso: string) => Date.parse(iso) || 0;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export { LABEL as ACTION_LABEL };
