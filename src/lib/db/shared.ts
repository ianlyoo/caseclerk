// Logic shared by both repo implementations, so they behave the same.
import type { CaseRecord, CaseStatus, DisputeSnapshot } from "@/lib/types";

export const LIST_LIMIT_DEFAULT = 100;
export const LIST_LIMIT_MAX = 500;
export const LOCK_TTL_DEFAULT_S = 330; // a bit over Vercel's 300 s max function duration

export function clampLimit(limit: number | undefined, def = LIST_LIMIT_DEFAULT): number {
  if (!limit || !Number.isFinite(limit) || limit < 1) return def;
  return Math.min(Math.floor(limit), LIST_LIMIT_MAX);
}

/** GET /api/wire page size: default 50, at most 200. */
export function wireRecentLimit(limit: number | undefined): number {
  return Math.min(clampLimit(limit, 50), 200);
}

/** True when `next` should replace `prev` (same or newer PayPal update_time). */
export function isNewerSnapshot(prev: DisputeSnapshot, next: DisputeSnapshot): boolean {
  const a = Date.parse(prev.updateTime);
  const b = Date.parse(next.updateTime);
  if (Number.isNaN(a) || Number.isNaN(b)) return true;
  if (b !== a) return b > a;
  // Same update_time: replace only if something visible changed (PayPal sometimes keeps the stamp).
  return prev.status !== next.status || prev.allowed.join() !== next.allowed.join() || prev.outcome !== next.outcome;
}

/** Case status after a new snapshot: RESOLVED wins; otherwise keep what the agent set. */
export function statusAfterSnapshot(current: CaseStatus | undefined, snap: DisputeSnapshot): CaseStatus {
  if (snap.status === "RESOLVED") return "resolved";
  return current ?? "new";
}

export function isOpenCase(c: CaseRecord): boolean {
  return c.snapshot.status !== "RESOLVED";
}

export function utcDayStart(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function round6(n: number): number {
  return Math.round(n * 1e6) / 1e6;
}
