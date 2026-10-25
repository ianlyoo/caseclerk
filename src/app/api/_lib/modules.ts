// Late-bound access to W1 (PayPal) and W2 (agent) modules that may not be on this branch yet.
//
// The import goes through a webpack context over src/lib restricted by `webpackInclude`, so the build
// succeeds whether or not the file exists: when it exists it is bundled normally, when it doesn't the
// import rejects at runtime and we return null. Once all modules are on main this file can become
// plain static imports.
import type { DisputeSnapshot } from "@/lib/types";

export type AgentTrigger = { kind: "webhook" | "approval" | "manual"; eventType?: string };

export type AgentModule = {
  runAgent(caseId: string, trigger: AgentTrigger): Promise<void>;
  executeApproved?(actionId: string): Promise<unknown>;
  deny?(actionId: string): Promise<unknown>;
};

export type DisputesModule = { getDispute(id: string): Promise<DisputeSnapshot> };

export type TestDisputeModule = {
  openTestDispute(opts: { scenario?: string }): Promise<{ disputeId?: string; captureId: string; orderId: string }>;
};

export type SimulatorsModule = {
  requireEvidence(id: string): Promise<unknown>;
  adjudicate(id: string, outcome: "SELLER_FAVOR" | "BUYER_FAVOR"): Promise<unknown>;
};

type Name = "agent/run" | "agent/approvals" | "agent/index" | "paypal/disputes" | "paypal/testDispute" | "paypal/simulators";

const cache = new Map<Name, Promise<unknown>>();

async function load<T>(name: Name, required: (keyof T)[]): Promise<T | null> {
  if (!cache.has(name)) {
    cache.set(
      name,
      import(
        /* webpackInclude: /(agent[\\/](run|approvals|index)|paypal[\\/](disputes|testDispute|simulators))\.ts$/ */
        /* webpackMode: "lazy-once" */
        `../../../lib/${name}`
      ).catch(() => null),
    );
  }
  const mod = (await cache.get(name)) as Record<string, unknown> | null;
  if (!mod || required.some((k) => typeof mod[k as string] !== "function")) return null;
  return mod as T;
}

export const loadAgent = () => load<AgentModule>("agent/run", ["runAgent"]);
/** executeApproved / deny: from agent/run, agent/approvals or agent/index, whichever exports it. */
export async function loadApprovals(): Promise<Required<Pick<AgentModule, "executeApproved" | "deny">> | null> {
  for (const name of ["agent/run", "agent/approvals", "agent/index"] as const) {
    const mod = await load<Required<AgentModule>>(name, ["executeApproved", "deny"]);
    if (mod) return mod;
  }
  return null;
}
export const loadDisputes = () => load<DisputesModule>("paypal/disputes", ["getDispute"]);
export const loadTestDispute = () => load<TestDisputeModule>("paypal/testDispute", ["openTestDispute"]);
export const loadSimulators = () => load<SimulatorsModule>("paypal/simulators", ["requireEvidence", "adjudicate"]);
