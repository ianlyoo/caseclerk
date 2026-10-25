// Triage check (owner #436): which cheap model/effort labels every hand-labelled dispute correctly?
// Tries Haiku 5.5 medium → Haiku 5.5 high → Sonnet 5.5 low → Sonnet 5.5 medium and stops at the
// first all-correct setting.
//
//   node --import ./eval/register.mjs eval/triage.ts            run (needs ANTHROPIC_API_KEY; PayPal keys only
//                                                                if sandbox snapshots aren't cached yet)
//   node --import ./eval/register.mjs eval/triage.ts --write    also append the result to docs/experiments.md
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { anthropicLlm } from "../src/lib/agent/llm";
import { runTriage } from "../src/lib/agent/triage";
import type { Effort } from "../src/lib/agent/config";
import { createSpend, readCaps, type SpendStore } from "../src/lib/spend";
import type { DisputeSnapshot, TriageCategory } from "../src/lib/types";

type Case = {
  id: string;
  kind: "sandbox" | "synthetic";
  label: TriageCategory;
  disputeId?: string;
  reason?: string;
  amount?: string;
  text?: string;
};

const DATA = new URL("./data/triage-cases.json", import.meta.url);
const SNAPS = new URL("./data/sandbox-snapshots.json", import.meta.url);
const DOC = new URL("../docs/experiments.md", import.meta.url);

const SETTINGS: { model: "claude-haiku-5-5" | "claude-sonnet-5-5"; effort: Effort }[] = [
  { model: "claude-haiku-5-5", effort: "medium" },
  { model: "claude-haiku-5-5", effort: "high" },
  { model: "claude-sonnet-5-5", effort: "low" },
  { model: "claude-sonnet-5-5", effort: "medium" },
];

/** Only the fields triage reads; no ids of people, no addresses. */
type SnapLite = Pick<DisputeSnapshot, "id" | "reason" | "stage" | "channel" | "amount" | "messages">;

async function sandboxSnapshots(cases: Case[]): Promise<Record<string, SnapLite>> {
  const cached: Record<string, SnapLite> = existsSync(SNAPS) ? JSON.parse(readFileSync(SNAPS, "utf8")) : {};
  const missing = cases.filter((c) => c.kind === "sandbox" && !cached[c.disputeId!]);
  if (missing.length) {
    const { getDispute } = await import("../src/lib/paypal");
    for (const c of missing) {
      const s = await getDispute(c.disputeId!);
      cached[s.id] = { id: s.id, reason: s.reason, stage: s.stage, channel: s.channel, amount: s.amount, messages: s.messages };
    }
    writeFileSync(SNAPS, JSON.stringify(cached, null, 2) + "\n");
  }
  return cached;
}

function toSnapshot(c: Case, snaps: Record<string, SnapLite>): DisputeSnapshot {
  const base = c.kind === "sandbox"
    ? snaps[c.disputeId!]
    : {
        id: c.id,
        reason: c.reason!,
        stage: "INQUIRY",
        channel: "INTERNAL",
        amount: { value: c.amount!, currency_code: "USD" },
        messages: [{ postedBy: "BUYER", at: "2026-10-20T10:00:00Z", content: c.text! }],
      };
  return { ...base, status: "WAITING_FOR_SELLER_RESPONSE", createTime: "", updateTime: "", allowed: [] } as DisputeSnapshot;
}

async function main() {
  const write = process.argv.includes("--write");
  const { cases } = JSON.parse(readFileSync(DATA, "utf8")) as { cases: Case[] };
  const snaps = await sandboxSnapshots(cases);

  // In-process spend ledger with the normal caps, so the eval can't run away either.
  const ledger: number[] = [];
  const store: SpendStore = {
    async add(e) {
      ledger.push(e.costUsd);
    },
    async totals() {
      const t = ledger.reduce((a, b) => a + b, 0);
      return { totalUsd: t, todayUsd: t, runsToday: 0 };
    },
  };
  const spend = createSpend(store, { ...readCaps(), dailyUsd: 0.5, totalUsd: 0.5 });
  const llm = anthropicLlm();

  const rows: string[] = [];
  let pick: (typeof SETTINGS)[number] | null = null;
  let pickScore = "";
  for (const s of SETTINGS) {
    let right = 0;
    let cost = 0;
    const wrong: string[] = [];
    for (const c of cases) {
      const r = await runTriage(llm, spend, toSnapshot(c, snaps), { model: s.model, effort: s.effort, maxTokens: 2000 });
      cost += r.costUsd;
      if (r.triage.category === c.label) right++;
      else wrong.push(`${c.id}: got ${r.triage.category}, want ${c.label}`);
    }
    const line = `${s.model} ${s.effort}: ${right}/${cases.length} correct, $${cost.toFixed(4)}${wrong.length ? ` — wrong: ${wrong.join("; ")}` : ""}`;
    console.log(line);
    rows.push(`| ${s.model} | ${s.effort} | ${right}/${cases.length} | $${cost.toFixed(4)} | ${wrong.length ? wrong.join("; ") : "—"} |`);
    if (right === cases.length) {
      pick = s;
      pickScore = `${right}/${cases.length}`;
      break;
    }
  }
  const total = ledger.reduce((a, b) => a + b, 0);
  console.log(pick ? `PICK ${pick.model} ${pick.effort} (${pickScore})` : "No setting got every case right");
  console.log(`Total cost $${total.toFixed(4)}`);

  if (write) {
    const sandboxN = cases.filter((c) => c.kind === "sandbox").length;
    const md = [
      "",
      "## Triage check",
      "",
      `Run ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC by W2 (\`eval/triage.ts\`). ${cases.length} disputes labelled by hand before the run (\`eval/data/triage-cases.json\`): ${sandboxN} real sandbox chargebacks (snapshots in \`eval/data/sandbox-snapshots.json\`) and ${cases.length - sandboxN} synthetic inquiry-stage buyer texts, incl. 2 where the buyer's words contradict PayPal's reason code. Order: Haiku 5.5 medium → Haiku 5.5 high → Sonnet 5.5 low → Sonnet 5.5 medium, stop at the first all-correct.`,
      "",
      "| Model | Effort | Correct | Cost | Misses |",
      "|---|---|---|---|---|",
      ...rows,
      "",
      pick
        ? `**Pick: \`${pick.model}\` effort \`${pick.effort}\` (${pickScore}).** Set in \`src/lib/agent/config.ts\` (\`triageModel\`, \`triageEffort\`). Eval cost $${total.toFixed(4)}.`
        : `**No setting got every case right**; kept Haiku 5.5 and flagged to the PM. Eval cost $${total.toFixed(4)}.`,
      "",
    ].join("\n");
    appendFileSync(DOC, md);
    console.log("Appended to docs/experiments.md");
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
