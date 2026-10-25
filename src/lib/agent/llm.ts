// One guarded Messages API call: reserve budget → call → record real cost from `usage`.
import Anthropic from "@anthropic-ai/sdk";
import { estimateCost, type Spend } from "../spend";
import type { LlmPort } from "./ports";

let client: Anthropic | null = null;

/** The real Anthropic client (key from ANTHROPIC_API_KEY). */
export function anthropicLlm(): LlmPort {
  return {
    create(params) {
      client ??= new Anthropic({ maxRetries: 2, timeout: 120_000 });
      return client.messages.create(params);
    },
  };
}

/** Rough token count for a request (≈3.5 chars per token), for the budget reservation only. */
export function approxTokens(params: Anthropic.MessageCreateParamsNonStreaming): number {
  const chars = JSON.stringify(params.system ?? "").length + JSON.stringify(params.messages).length + JSON.stringify(params.tools ?? []).length;
  return Math.ceil(chars / 3.5);
}

export type GuardedResult = { message: Anthropic.Message; costUsd: number };

export async function guardedCall(
  llm: LlmPort,
  spend: Spend,
  params: Anthropic.MessageCreateParamsNonStreaming,
  caseId?: string,
): Promise<GuardedResult> {
  const reservation = await spend.reserve(estimateCost(params.model, approxTokens(params), params.max_tokens));
  let message: Anthropic.Message;
  try {
    message = await llm.create(params);
  } catch (e) {
    spend.release(reservation);
    throw e;
  }
  const costUsd = await spend.record(reservation, params.model, message.usage, caseId);
  return { message, costUsd };
}

export function textOf(m: Anthropic.Message): string {
  return m.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}
