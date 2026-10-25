// Claude list prices (USD per million tokens) and cost from the API's `usage`.
// Cache reads: 0.05x input on Opus 5.5, 0.1x elsewhere. Cache writes: 1.25x (5-minute TTL), 2x (1-hour TTL).

export type ModelId = "claude-opus-5-5" | "claude-sonnet-5-5" | "claude-haiku-5-5";

type Rate = { input: number; output: number; cacheRead: number };

const PRICES: Record<ModelId, Rate> = {
  "claude-opus-5-5": { input: 4, output: 20, cacheRead: 0.2 },
  "claude-sonnet-5-5": { input: 2, output: 10, cacheRead: 0.2 },
  "claude-haiku-5-5": { input: 0.1, output: 0.5, cacheRead: 0.01 },
};

/** Haiku 5.5 bills prompts over 100K tokens at $0.50 / $2.50 per MTok. */
const HAIKU_LONG = { threshold: 100_000, input: 0.5, output: 2.5, cacheRead: 0.05 };

const CACHE_WRITE_5M = 1.25;
const CACHE_WRITE_1H = 2;

/** The subset of the Messages API `usage` object that affects cost. */
export type UsageLike = {
  input_tokens: number;
  output_tokens: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  cache_creation?: { ephemeral_5m_input_tokens?: number | null; ephemeral_1h_input_tokens?: number | null } | null;
};

export function isPricedModel(model: string): model is ModelId {
  return model in PRICES;
}

export function rateFor(model: string, promptTokens = 0): Rate {
  if (!isPricedModel(model)) throw new Error(`No price for model ${model}`);
  if (model === "claude-haiku-5-5" && promptTokens > HAIKU_LONG.threshold) return HAIKU_LONG;
  return PRICES[model];
}

/** Exact cost of one call in USD, from the response's `usage`. */
export function costFromUsage(model: string, u: UsageLike): number {
  const cacheRead = u.cache_read_input_tokens ?? 0;
  const cacheWrite = u.cache_creation_input_tokens ?? 0;
  const write1h = u.cache_creation?.ephemeral_1h_input_tokens ?? 0;
  const write5m = Math.max(0, cacheWrite - write1h);
  const r = rateFor(model, u.input_tokens + cacheRead + cacheWrite);
  const usd =
    (u.input_tokens * r.input +
      u.output_tokens * r.output +
      cacheRead * r.cacheRead +
      write5m * r.input * CACHE_WRITE_5M +
      write1h * r.input * CACHE_WRITE_1H) /
    1_000_000;
  return Math.round(usd * 1e6) / 1e6;
}

/** Upper-bound estimate for a call before it is made (used to reserve budget). */
export function estimateCost(model: string, promptTokens: number, maxOutputTokens: number): number {
  const r = rateFor(model, promptTokens);
  // Assume the whole prompt is a fresh cache write (worst case) and the full output budget is used.
  return (promptTokens * r.input * CACHE_WRITE_5M + maxOutputTokens * r.output) / 1_000_000;
}

/** Token counts only, for storage next to a spend entry. */
export function usageNumbers(u: UsageLike): Record<string, number> {
  return {
    input: u.input_tokens,
    output: u.output_tokens,
    cacheRead: u.cache_read_input_tokens ?? 0,
    cacheWrite: u.cache_creation_input_tokens ?? 0,
  };
}
