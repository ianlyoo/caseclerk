// In-memory repo: used when DATABASE_URL is absent (local dev, tests, previews without a DB).
// State lives per server instance and is lost on cold start.
import { randomUUID } from "node:crypto";
import { DEFAULT_POLICY, type AgentAction, type AuditEntry, type CaseRecord, type SellerPolicy } from "@/lib/types";
import type { Repo, SpendEntry, TestCapture, WireEntry } from "./repo";
import { clampLimit, isVerifiedWire, wireRecentLimit, isNewerSnapshot, isOpenCase, LOCK_TTL_DEFAULT_S, round6, statusAfterSnapshot, utcDayStart } from "./shared";

const clone = <T>(v: T): T => structuredClone(v);

export function createMemoryRepo(): Repo {
  const cases = new Map<string, CaseRecord>();
  const actions = new Map<string, AgentAction>();
  const audit: AuditEntry[] = [];
  let policy: SellerPolicy | null = null;
  const spend: Required<Pick<SpendEntry, "kind" | "costUsd" | "at">>[] = [];
  const events = new Set<string>();
  const windows = new Map<string, { count: number; resetAt: number }>();
  const locks = new Map<string, { holder: string; expiresAt: number }>();
  const captures = new Map<string, TestCapture>();
  const wire: WireEntry[] = [];

  const now = () => new Date().toISOString();

  function patchCase(id: string, patch: Partial<CaseRecord>): CaseRecord | null {
    const c = cases.get(id);
    if (!c) return null;
    const next = { ...c, ...clone(patch), updatedAt: now() };
    cases.set(id, next);
    return clone(next);
  }

  return {
    kind: "memory",

    cases: {
      async upsertFromSnapshot(snapshot, opts) {
        const prev = cases.get(snapshot.id);
        if (!prev) {
          const t = now();
          const capture = snapshot.sellerTransactionId ? captures.get(snapshot.sellerTransactionId) : undefined;
          const isTest = opts?.isTestDispute ?? Boolean(capture);
          const record: CaseRecord = {
            id: snapshot.id,
            snapshot: clone(snapshot),
            ...(capture?.order ? { order: clone(capture.order) } : {}),
            status: statusAfterSnapshot(undefined, snapshot),
            isTestDispute: isTest,
            createdAt: t,
            updatedAt: t,
          };
          cases.set(record.id, record);
          return { record: clone(record), created: true, changed: true };
        }
        if (!isNewerSnapshot(prev.snapshot, snapshot)) return { record: clone(prev), created: false, changed: false };
        const record: CaseRecord = {
          ...prev,
          snapshot: clone(snapshot),
          status: statusAfterSnapshot(prev.status, snapshot),
          isTestDispute: prev.isTestDispute || opts?.isTestDispute === true,
          updatedAt: now(),
        };
        cases.set(record.id, record);
        return { record: clone(record), created: false, changed: true };
      },
      async get(id) {
        const c = cases.get(id);
        return c ? clone(c) : null;
      },
      async list(q = {}) {
        let rows = [...cases.values()];
        if (q.status?.length) rows = rows.filter((c) => q.status!.includes(c.status));
        if (q.open !== undefined) rows = rows.filter((c) => isOpenCase(c) === q.open);
        if (q.isTestDispute !== undefined) rows = rows.filter((c) => c.isTestDispute === q.isTestDispute);
        rows.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt) || a.id.localeCompare(b.id));
        return rows.slice(0, clampLimit(q.limit)).map(clone);
      },
      async setTriage(id, triage) {
        return patchCase(id, { triage });
      },
      async setDecision(id, decision) {
        return patchCase(id, { decision });
      },
      async setStatus(id, status) {
        return patchCase(id, { status });
      },
      async setOrder(id, order) {
        return patchCase(id, { order });
      },
    },

    actions: {
      async insert(a) {
        const t = now();
        const row: AgentAction = {
          ...clone(a),
          id: a.id ?? randomUUID(),
          status: a.status ?? "proposed",
          createdAt: t,
          updatedAt: t,
        };
        if (actions.has(row.id)) throw new Error(`action ${row.id} already exists`);
        actions.set(row.id, row);
        return clone(row);
      },
      async update(id, patch, opts) {
        const a = actions.get(id);
        if (!a) return null;
        if (opts?.ifStatus && !opts.ifStatus.includes(a.status)) return null;
        const next: AgentAction = { ...a, ...clone(patch), updatedAt: now() };
        actions.set(id, next);
        return clone(next);
      },
      async get(id) {
        const a = actions.get(id);
        return a ? clone(a) : null;
      },
      async listByCase(caseId) {
        return [...actions.values()].filter((a) => a.caseId === caseId).sort(byCreated).map(clone);
      },
      async listAwaitingApproval() {
        return [...actions.values()].filter((a) => a.status === "awaiting_approval").sort(byCreated).map(clone);
      },
    },

    audit: {
      async append(e) {
        const entry: AuditEntry = {
          id: randomUUID(),
          caseId: e.caseId,
          at: e.at ?? now(),
          actor: e.actor,
          kind: e.kind,
          summary: e.summary,
          ...(e.data !== undefined ? { data: clone(e.data) } : {}),
          ...(e.costUsd !== undefined ? { costUsd: e.costUsd } : {}),
        };
        audit.push(entry);
        return clone(entry);
      },
      async listByCase(caseId, opts) {
        const rows = audit
          .map((e, i) => ({ e, i }))
          .filter(({ e }) => e.caseId === caseId)
          .sort((a, b) => a.e.at.localeCompare(b.e.at) || a.i - b.i)
          .map(({ e }) => e);
        const limit = clampLimit(opts?.limit, 1000);
        return rows.slice(-limit).map(clone);
      },
    },

    policy: {
      async get() {
        return clone(policy ?? DEFAULT_POLICY);
      },
      async set(p) {
        policy = clone(p);
        return clone(p);
      },
    },

    spend: {
      async add(e) {
        spend.push({ kind: e.kind, costUsd: e.costUsd, at: e.at ?? now() });
      },
      async totals() {
        const day = utcDayStart().toISOString();
        let totalUsd = 0;
        let todayUsd = 0;
        let runsToday = 0;
        for (const s of spend) {
          totalUsd += s.costUsd;
          if (s.at >= day) {
            todayUsd += s.costUsd;
            if (s.kind === "run") runsToday += 1;
          }
        }
        return { totalUsd: round6(totalUsd), todayUsd: round6(todayUsd), runsToday };
      },
    },

    webhookEvents: {
      async insertIfNew(eventId) {
        if (events.has(eventId)) return false;
        events.add(eventId);
        return true;
      },
      async remove(eventId) {
        events.delete(eventId);
      },
    },

    rateLimit: {
      async hit(key, limit, windowS) {
        const t = Date.now();
        let w = windows.get(key);
        if (!w || w.resetAt <= t) {
          w = { count: 0, resetAt: t + windowS * 1000 };
          windows.set(key, w);
        }
        w.count += 1;
        return { allowed: w.count <= limit, count: w.count, limit, resetAt: new Date(w.resetAt).toISOString() };
      },
    },

    locks: {
      async withCaseLock(caseId, fn, opts) {
        const t = Date.now();
        const held = locks.get(caseId);
        if (held && held.expiresAt > t) return { acquired: false };
        const holder = randomUUID();
        locks.set(caseId, { holder, expiresAt: t + (opts?.ttlS ?? LOCK_TTL_DEFAULT_S) * 1000 });
        try {
          return { acquired: true, value: await fn() };
        } finally {
          if (locks.get(caseId)?.holder === holder) locks.delete(caseId);
        }
      },
    },

    testCaptures: {
      async record(c) {
        const prev = captures.get(c.captureId);
        const defined = Object.fromEntries(Object.entries(c).filter(([, v]) => v !== undefined));
        const row: TestCapture = { ...prev, ...defined, captureId: c.captureId, createdAt: prev?.createdAt ?? now() };
        captures.set(c.captureId, row);
        return clone(row);
      },
      async get(captureId) {
        const c = captures.get(captureId);
        return c ? clone(c) : null;
      },
    },

    wire: {
      async append(e) {
        const defined = Object.fromEntries(Object.entries(e).filter(([, v]) => v !== undefined)) as typeof e;
        const row: WireEntry = {
          ...clone(defined),
          ...(e.durationMs !== undefined ? { durationMs: Math.round(e.durationMs) } : {}),
          id: e.id ?? randomUUID(),
          at: e.at && !Number.isNaN(Date.parse(e.at)) ? new Date(e.at).toISOString() : now(),
        };
        wire.push(row);
        return clone(row);
      },
      async update(id, patch) {
        const w = wire.find((r) => r.id === id);
        if (!w) return;
        const defined = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)) as typeof patch;
        Object.assign(w, clone(defined), defined.durationMs !== undefined ? { durationMs: Math.round(defined.durationMs) } : {});
      },
      async listByCase(caseId, opts) {
        const rows = inTimeOrder(wire.filter((w) => w.caseId === caseId && (opts?.includeUnverified || isVerifiedWire(w))));
        return rows.slice(-clampLimit(opts?.limit, 500)).map(clone);
      },
      async listRecent(opts = {}) {
        const since = opts.since && !Number.isNaN(Date.parse(opts.since)) ? new Date(opts.since).toISOString() : undefined;
        const rows = inTimeOrder(wire.filter((w) => (!since || w.at > since) && (opts.includeUnverified || isVerifiedWire(w))));
        return rows.slice(-wireRecentLimit(opts.limit)).map(clone);
      },
      async tag(ids, patch) {
        for (const w of wire) {
          if (!ids.includes(w.id)) continue;
          if (patch.ref) w.ref = patch.ref;
          if (patch.caseId && !w.caseId) w.caseId = patch.caseId;
        }
      },
      async linkRef(ref, caseId) {
        for (const w of wire) if (w.ref === ref && !w.caseId) w.caseId = caseId;
      },
    },
  };
}

/** Time order: by `at`, ties broken by insertion order (the array index; Postgres uses seq). */
function inTimeOrder(rows: WireEntry[]): WireEntry[] {
  return rows
    .map((w, i) => ({ w, i }))
    .sort((a, b) => a.w.at.localeCompare(b.w.at) || a.i - b.i)
    .map(({ w }) => w);
}

function byCreated(a: { createdAt: string; id: string }, b: { createdAt: string; id: string }): number {
  return a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);
}
