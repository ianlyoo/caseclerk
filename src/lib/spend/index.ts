// Spend caps for live Claude calls. Every LLM call does reserve() first and record() after;
// over a cap, reserve() throws SpendCapError and no request is sent.
import type { SpendTotals } from "../types";
import { costFromUsage, usageNumbers, type UsageLike } from "./prices";

export { costFromUsage, estimateCost, isPricedModel, type ModelId, type UsageLike } from "./prices";

export type SpendCaps = {
  totalUsd: number;
  dailyUsd: number;
  runsPerDay: number;
  testDisputesPerIpPerDay: number;
};

function num(env: Record<string, string | undefined>, key: string, fallback: number): number {
  const raw = env[key];
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** Hard caps, from env with the defaults agreed in docs/ARCHITECTURE.md. */
export function readCaps(env: Record<string, string | undefined> = process.env): SpendCaps {
  return {
    totalUsd: num(env, "SPEND_CAP_TOTAL_USD", 45),
    dailyUsd: num(env, "SPEND_CAP_DAILY_USD", 4),
    runsPerDay: num(env, "AGENT_RUNS_PER_DAY", 60),
    testDisputesPerIpPerDay: num(env, "TEST_DISPUTES_PER_IP_PER_DAY", 3),
  };
}

/** Matches W4's `spend` repo (src/lib/db). */
export type SpendStore = {
  add(e: {
    kind: "llm" | "run";
    costUsd: number;
    caseId?: string;
    model?: string;
    usage?: Record<string, number>;
  }): Promise<void>;
  totals(): Promise<SpendTotals>;
};

export type CapName = "total" | "daily" | "runs";

export class SpendCapError extends Error {
  readonly cap: CapName;
  constructor(cap: CapName, detail: string) {
    super(`Demo budget reached (${cap} cap): ${detail}`);
    this.name = "SpendCapError";
    this.cap = cap;
  }
}

export type Spend = {
  /** Counts one agent run; throws SpendCapError when today's run cap or a money cap is already reached. */
  startRun(caseId: string): Promise<void>;
  /** Throws SpendCapError if this call could cross a cap. Returns a reservation to pass to record(). */
  reserve(estimateUsd: number): Promise<Reservation>;
  /** Records the real cost from the API's usage and releases the reservation. Returns the cost in USD. */
  record(r: Reservation, model: string, usage: UsageLike, caseId?: string): Promise<number>;
  /** Releases a reservation whose call failed before any usage was billed. */
  release(r: Reservation): void;
  totals(): Promise<SpendTotals>;
  caps: SpendCaps;
};

export type Reservation = { id: number; usd: number };

export function createSpend(store: SpendStore, caps: SpendCaps = readCaps()): Spend {
  // In-flight reservations of this instance (calls sent, usage not yet recorded).
  const pending = new Map<number, number>();
  let seq = 0;
  const pendingUsd = () => [...pending.values()].reduce((a, b) => a + b, 0);
  const fmt = (n: number) => `$${n.toFixed(2)}`;

  function check(t: SpendTotals, extraUsd: number) {
    const p = pendingUsd() + extraUsd;
    if (t.totalUsd + p > caps.totalUsd) {
      throw new SpendCapError("total", `${fmt(t.totalUsd)} spent of ${fmt(caps.totalUsd)}`);
    }
    if (t.todayUsd + p > caps.dailyUsd) {
      throw new SpendCapError("daily", `${fmt(t.todayUsd)} spent today of ${fmt(caps.dailyUsd)}`);
    }
  }

  return {
    caps,
    async startRun(caseId) {
      const t = await store.totals();
      if (t.runsToday >= caps.runsPerDay) {
        throw new SpendCapError("runs", `${t.runsToday} agent runs today of ${caps.runsPerDay}`);
      }
      check(t, 0);
      await store.add({ kind: "run", costUsd: 0, caseId });
    },
    async reserve(estimateUsd) {
      check(await store.totals(), estimateUsd);
      const r = { id: ++seq, usd: estimateUsd };
      pending.set(r.id, estimateUsd);
      return r;
    },
    async record(r, model, usage, caseId) {
      pending.delete(r.id);
      const costUsd = costFromUsage(model, usage);
      await store.add({ kind: "llm", costUsd, caseId, model, usage: usageNumbers(usage) });
      return costUsd;
    },
    release(r) {
      pending.delete(r.id);
    },
    totals: () => store.totals(),
  };
}

/** Matches W4's `rateLimit` repo. */
export type RateLimiter = {
  hit(key: string, limit: number, windowS: number): Promise<{ allowed: boolean; count: number; limit: number; resetAt: string }>;
};

/** TEST_DISPUTES_PER_IP_PER_DAY for api/test-dispute (W4 calls this with the client IP). */
export async function hitTestDisputeQuota(limiter: RateLimiter, ip: string, caps: SpendCaps = readCaps()) {
  return limiter.hit(`test-dispute:${ip}`, caps.testDisputesPerIpPerDay, 24 * 60 * 60);
}
