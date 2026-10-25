// Public entry points of the agent (used by W4's routes and the UI's server code).
//   runAgent(caseId, trigger)   webhook → after(), approvals, manual re-runs
//   executeApproved(actionId)   Approvals → Approve
//   deny(actionId, note?)       Approvals → Deny
import type { AgentTrigger } from "../types";
import { denyWith, executeApprovedWith, type ApprovalResult } from "./actions";
import type { AgentDeps } from "./ports";
import { runAgentWith, type RunOutcome } from "./run";

export type { AgentDeps, RunOutcome, ApprovalResult };
export { runAgentWith, executeApprovedWith, denyWith };
export { policyGate } from "./policy";
export { expectedValues, EV_ASSUMPTIONS } from "./ev";

let provider: (() => AgentDeps | Promise<AgentDeps>) | null = null;
let cached: AgentDeps | null = null;

/** Registers how to build the agent's dependencies (real PayPal + DB + Claude, or test fakes). */
export function setAgentDeps(p: (() => AgentDeps | Promise<AgentDeps>) | AgentDeps | null): void {
  cached = null;
  provider = p === null ? null : typeof p === "function" ? p : () => p;
}

async function deps(): Promise<AgentDeps> {
  if (cached) return cached;
  if (!provider) {
    const { liveDeps } = await import("./wiring");
    provider = liveDeps;
  }
  cached = await provider();
  return cached;
}

export async function runAgent(caseId: string, trigger: AgentTrigger): Promise<RunOutcome> {
  return runAgentWith(await deps(), caseId, trigger);
}

export async function executeApproved(actionId: string): Promise<ApprovalResult> {
  return executeApprovedWith(await deps(), actionId);
}

export async function deny(actionId: string, note?: string): Promise<ApprovalResult> {
  return denyWith(await deps(), actionId, note);
}
