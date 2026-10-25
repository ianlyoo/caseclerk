// Where the public entry points get their dependencies: live wiring by default, fakes in tests.
import type { AgentDeps } from "./ports";

let provider: (() => AgentDeps | Promise<AgentDeps>) | null = null;
let cached: AgentDeps | null = null;

/** Registers how to build the agent's dependencies (real PayPal + DB + Claude, or test fakes). */
export function setAgentDeps(p: (() => AgentDeps | Promise<AgentDeps>) | AgentDeps | null): void {
  cached = null;
  provider = p === null ? null : typeof p === "function" ? p : () => p;
}

export async function agentDeps(): Promise<AgentDeps> {
  if (cached) return cached;
  if (!provider) {
    const { liveDeps } = await import("./wiring");
    provider = liveDeps;
  }
  cached = await provider();
  return cached;
}
