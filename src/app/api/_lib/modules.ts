// Late-bound access to W2's agent module, which may not be on this branch yet.
//
// The import goes through a webpack context over src/lib restricted by `webpackInclude`, so the build
// succeeds whether or not the file exists: when it exists it is bundled normally, when it doesn't the
// import rejects at runtime and we return null. Once W2 is on main this file can become a
// plain static import.
export type AgentTrigger = { kind: "webhook" | "approval" | "manual"; eventType?: string };

export type AgentModule = {
  runAgent(caseId: string, trigger: AgentTrigger): Promise<void>;
  executeApproved?(actionId: string): Promise<unknown>;
  deny?(actionId: string): Promise<unknown>;
};

type Name = "agent/run" | "agent/approvals" | "agent/index";

const cache = new Map<Name, Promise<unknown>>();

async function load<T>(name: Name, required: (keyof T)[]): Promise<T | null> {
  if (!cache.has(name)) {
    cache.set(
      name,
      import(
        /* webpackInclude: /agent[\\/](run|approvals|index)\.ts$/ */
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
