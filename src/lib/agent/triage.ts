// Triage: one cheap structured-output call per case (Haiku 5.5; never Opus).
import type { DisputeSnapshot, Triage, TriageCategory } from "../types";
import type { Spend } from "../spend";
import type { Effort } from "./config";
import { guardedCall, textOf } from "./llm";
import type { LlmPort } from "./ports";
import { TRIAGE_SYSTEM } from "./prompts";

export const TRIAGE_CATEGORIES: readonly TriageCategory[] = [
  "not_received",
  "not_as_described",
  "unauthorized",
  "duplicate_or_billing",
  "other",
];

const SCHEMA = {
  type: "object",
  properties: {
    category: { type: "string", enum: [...TRIAGE_CATEGORIES] },
    summary: { type: "string" },
  },
  required: ["category", "summary"],
  additionalProperties: false,
};

/** The facts triage sees: reason, stage, amount and the buyer's words (never sent to logs). */
export function triageInput(s: DisputeSnapshot): string {
  const buyer = s.messages
    .filter((m) => m.postedBy === "BUYER")
    .map((m) => `- ${m.content.slice(0, 1500)}`)
    .join("\n");
  return [
    `PayPal reason: ${s.reason}`,
    `Stage: ${s.stage}${s.channel ? ` (${s.channel})` : ""}`,
    `Amount: ${s.amount.value} ${s.amount.currency_code}`,
    `Buyer messages:\n${buyer || "(none: card chargebacks carry no buyer text)"}`,
  ].join("\n");
}

export type TriageResult = { triage: Triage; costUsd: number };

export async function runTriage(
  llm: LlmPort,
  spend: Spend,
  snapshot: DisputeSnapshot,
  opts: { model: string; effort: Effort; maxTokens: number; caseId?: string; now?: Date },
): Promise<TriageResult> {
  const { message, costUsd } = await guardedCall(
    llm,
    spend,
    {
      model: opts.model,
      max_tokens: opts.maxTokens,
      system: TRIAGE_SYSTEM,
      output_config: { effort: opts.effort, format: { type: "json_schema", schema: SCHEMA } },
      messages: [{ role: "user", content: triageInput(snapshot) }],
    },
    opts.caseId,
  );
  if (message.stop_reason === "refusal") throw new Error("Triage model declined to classify this dispute");
  const parsed = parseTriage(textOf(message));
  return {
    triage: { ...parsed, model: `${opts.model} (${opts.effort})`, at: (opts.now ?? new Date()).toISOString() },
    costUsd,
  };
}

export function parseTriage(text: string): { category: TriageCategory; summary: string } {
  let j: { category?: string; summary?: string };
  try {
    j = JSON.parse(text);
  } catch {
    throw new Error("Triage returned invalid JSON");
  }
  const category = TRIAGE_CATEGORIES.includes(j.category as TriageCategory) ? (j.category as TriageCategory) : "other";
  return { category, summary: (j.summary ?? "").trim().slice(0, 300) };
}
