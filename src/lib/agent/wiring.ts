// Live dependencies: W1's PayPal + evidence modules, W4's repo, Claude, spend caps.
// Filled in once src/lib/paypal/{disputes,orders,tracking,transactions}.ts, src/lib/evidence/pdf.ts
// and src/lib/db land on main; until then runAgent reports this clearly instead of failing obscurely.
import type { AgentDeps } from "./ports";

export class AgentNotWiredError extends Error {
  constructor() {
    super("CaseClerk agent: PayPal/DB modules are not on this build yet (wiring pending merge)");
    this.name = "AgentNotWiredError";
  }
}

export function liveDeps(): AgentDeps {
  throw new AgentNotWiredError();
}
