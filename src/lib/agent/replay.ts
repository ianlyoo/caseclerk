// Over a spend cap the agent makes no LLM call; the case shows the agent's last recorded run
// for the same kind of dispute (fixtures recorded from live sandbox runs by eval/run-live.ts).
import type { AuditActor, CaseRecord, Decision, Triage } from "../types";
import { audit } from "./actions";
import { FIXTURES } from "./fixtures";
import type { AgentDeps } from "./ports";

export type RecordedRun = {
  scenario: string;
  /** PayPal reasons this run stands in for. */
  reasons: string[];
  stage: string;
  recordedAt: string;
  sourceDisputeId: string;
  costUsd: number;
  triage: Pick<Triage, "category" | "summary">;
  decision: Omit<Decision, "at" | "model"> & { model: string };
  timeline: { actor: AuditActor; kind: string; summary: string; costUsd?: number }[];
};

export function pickRecordedRun(c: Pick<CaseRecord, "snapshot">, runs: RecordedRun[] = FIXTURES): RecordedRun | null {
  const { reason, stage } = c.snapshot;
  return (
    runs.find((r) => r.reasons.includes(reason) && r.stage === stage) ??
    runs.find((r) => r.reasons.includes(reason)) ??
    runs.find((r) => r.stage === stage) ??
    runs[0] ??
    null
  );
}

/** Appends the recorded run to the case timeline, clearly marked as a replay. Returns false if none exists. */
export async function replayStoredRun(deps: AgentDeps, c: CaseRecord, runs: RecordedRun[] = FIXTURES): Promise<boolean> {
  const run = pickRecordedRun(c, runs);
  if (!run) return false;
  const tag = { replay: true, scenario: run.scenario, recordedAt: run.recordedAt };
  await audit(
    deps,
    c.id,
    "system",
    "replay.start",
    `Replay of a recorded run (${run.recordedAt.slice(0, 10)}, sandbox dispute ${run.sourceDisputeId}); nothing below was sent to PayPal for this case.`,
    tag,
  );
  for (const e of run.timeline) {
    await audit(deps, c.id, e.actor, `replay.${e.kind}`, `Replay · ${e.summary}`, tag, e.costUsd);
  }
  const at = (deps.now?.() ?? new Date()).toISOString();
  if (!c.triage) await deps.db.cases.setTriage(c.id, { ...run.triage, model: "replay", at });
  await deps.db.cases.setDecision(c.id, { ...run.decision, model: `replay of ${run.decision.model}`, at });
  if (c.status === "new" || c.status === "acting") await deps.db.cases.setStatus(c.id, "triaged");
  return true;
}
