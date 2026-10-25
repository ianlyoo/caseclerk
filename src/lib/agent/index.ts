// Public entry points of the agent (used by W4's routes and the UI's server code).
//   runAgent(caseId, trigger)   webhook → after(), approvals, manual re-runs
//   executeApproved(actionId)   Approvals → Approve
//   deny(actionId, note?)       Approvals → Deny
// Defined in run.ts (routes import them from "@/lib/agent/run"); re-exported here.
export type { AgentDeps } from "./ports";
export type { ApprovalResult } from "./actions";
export type { RunOutcome } from "./run";
export { runAgent, executeApproved, deny, runAgentWith } from "./run";
export { executeApprovedWith, denyWith } from "./actions";
export { setAgentDeps } from "./registry";
export { policyGate } from "./policy";
export { expectedValues, EV_ASSUMPTIONS } from "./ev";
