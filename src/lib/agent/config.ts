// Model settings. Decisions, evidence text and buyer messages: Opus 5.5 at medium effort.
// Triage: Haiku 5.5 (never Opus, owner #436), effort picked by the triage check (docs/experiments.md).

export type Effort = "low" | "medium" | "high";

export type AgentConfig = {
  triageModel: "claude-haiku-5-5" | "claude-sonnet-5-5";
  triageEffort: Effort;
  agentModel: "claude-opus-5-5";
  agentEffort: Effort;
  /** Per agent turn; thinking counts toward it. */
  agentMaxTokens: number;
  triageMaxTokens: number;
  /** Hard stop for the tool loop. */
  maxTurns: number;
  /** Include search_transactions (needs Transaction Search on the PayPal app). */
  transactionSearch: boolean;
};

export const DEFAULT_CONFIG: AgentConfig = {
  triageModel: "claude-haiku-5-5",
  triageEffort: "medium",
  agentModel: "claude-opus-5-5",
  agentEffort: "medium",
  agentMaxTokens: 6000,
  triageMaxTokens: 2000,
  maxTurns: 6,
  transactionSearch: process.env.PAYPAL_TRANSACTION_SEARCH === "1",
};

export function resolveConfig(over?: Partial<AgentConfig>): AgentConfig {
  return { ...DEFAULT_CONFIG, ...over };
}
