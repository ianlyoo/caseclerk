// One live end-to-end agent run on a real sandbox dispute; prints the audit trail (no PII) and cost.
//   node --import ./eval/register.mjs eval/run-live.ts <disputeId> [--record <scenario>]
// --record writes the run as a replay fixture to src/lib/agent/fixtures/<scenario>.json.
// Real PayPal (W1), evidence PDF (W1) and Claude; W4's in-memory repo so nothing lands in the app DB.
import { writeFileSync } from "node:fs";
import { createMemoryRepo } from "../src/lib/db/memory";
import { anthropicLlm } from "../src/lib/agent/llm";
import type { AgentDeps } from "../src/lib/agent/ports";
import { runAgentWith } from "../src/lib/agent/run";
import type { RecordedRun } from "../src/lib/agent/replay";
import { liveEvidence, livePaypal } from "../src/lib/agent/wiring";
import { getDispute } from "../src/lib/paypal";
import { createSpend, readCaps } from "../src/lib/spend";

async function main() {
  const id = process.argv[2];
  if (!id?.startsWith("PP-")) throw new Error("usage: run-live.ts <disputeId> [--record <scenario>]");
  const rec = process.argv.indexOf("--record");
  const scenario = rec > 0 ? process.argv[rec + 1] : undefined;

  const db = createMemoryRepo();
  const snap = await getDispute(id);
  await db.cases.upsertFromSnapshot(snap, { isTestDispute: true });
  const deps: AgentDeps = {
    db,
    paypal: livePaypal({ transactionSearch: process.env.PAYPAL_TRANSACTION_SEARCH === "1" }),
    evidence: liveEvidence,
    llm: anthropicLlm(),
    // Same caps as production, but a $1 ceiling for this one run.
    spend: createSpend(db.spend, { ...readCaps(), dailyUsd: 1, totalUsd: 1 }),
  };

  console.log(`Dispute ${id}: ${snap.reason}, ${snap.stage}, ${snap.status}, ${snap.amount.value} ${snap.amount.currency_code}; PayPal allows: ${snap.allowed.join(", ") || "none"}`);
  const t0 = Date.now();
  const out = await runAgentWith(deps, id, { kind: "manual" });
  const secs = ((Date.now() - t0) / 1000).toFixed(1);

  const trail = await db.audit.listByCase(id);
  console.log("\nTimeline:");
  for (const e of trail) {
    const cost = e.costUsd ? `  [$${e.costUsd.toFixed(4)}]` : "";
    const tool = typeof e.data?.tool === "string" ? ` (${e.data.tool})` : "";
    console.log(`${e.at.slice(11, 19)}  ${e.actor.padEnd(6)} ${e.kind.padEnd(24)} ${e.summary}${tool}${cost}`);
  }
  const c = await db.cases.get(id);
  const steps = trail.filter((e) => e.kind === "agent.step");
  const tokens = steps.reduce(
    (a, e) => ({
      input: a.input + Number(e.data?.inputTokens ?? 0),
      output: a.output + Number(e.data?.outputTokens ?? 0),
      cacheRead: a.cacheRead + Number(e.data?.cacheReadTokens ?? 0),
      cacheWrite: a.cacheWrite + Number(e.data?.cacheWriteTokens ?? 0),
    }),
    { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  );
  console.log(`\nResult: ${out.status} — ${out.summary}`);
  console.log(`Case status: ${c?.status}; actions: ${(await db.actions.listByCase(id)).map((a) => `${a.kind}=${a.status}${a.result?.httpStatus ? `(${a.result.httpStatus})` : ""}`).join(", ") || "none"}`);
  console.log(`Opus tokens: ${JSON.stringify(tokens)}; ${steps.length} turns; ${secs} s`);
  console.log(`COST $${out.costUsd.toFixed(4)}`);

  if (scenario && c?.triage && c.decision) {
    const run: RecordedRun = {
      scenario,
      reasons: [snap.reason],
      stage: snap.stage,
      recordedAt: new Date().toISOString(),
      sourceDisputeId: id,
      costUsd: out.costUsd,
      triage: { category: c.triage.category, summary: c.triage.summary },
      decision: { ...c.decision },
      timeline: trail
        .filter((e) => !e.kind.startsWith("agent.run."))
        .map((e) => ({ actor: e.actor, kind: e.kind, summary: e.summary, ...(e.costUsd ? { costUsd: e.costUsd } : {}) })),
    };
    delete (run.decision as { at?: string }).at;
    const path = new URL(`../src/lib/agent/fixtures/${scenario}.json`, import.meta.url);
    writeFileSync(path, JSON.stringify(run, null, 2) + "\n");
    console.log(`Recorded replay fixture ${scenario}.json`);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
