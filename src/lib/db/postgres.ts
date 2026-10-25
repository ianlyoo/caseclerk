// Neon Postgres repo over the HTTP driver (one round trip per statement, no sessions).
// Schema: db/migrations/*.sql, applied by src/lib/db/migrate.ts.
import { randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { DEFAULT_POLICY, type AgentAction, type AuditEntry, type CaseRecord, type SellerPolicy } from "@/lib/types";
import type { ActionPatch, Repo, TestCapture } from "./repo";
import { clampLimit, LOCK_TTL_DEFAULT_S, round6, statusAfterSnapshot, utcDayStart } from "./shared";

type Row = Record<string, unknown>;
type Query = (text: string, params?: unknown[]) => Promise<Row[]>;

const iso = (v: unknown): string => (v instanceof Date ? v.toISOString() : new Date(String(v)).toISOString());
const num = (v: unknown): number | undefined => (v === null || v === undefined ? undefined : Number(v));
const json = (v: unknown): string | null => (v === undefined ? null : JSON.stringify(v));

function toCase(r: Row): CaseRecord {
  return {
    id: r.id as string,
    snapshot: r.snapshot as CaseRecord["snapshot"],
    ...(r.order_ctx ? { order: r.order_ctx as CaseRecord["order"] } : {}),
    ...(r.triage ? { triage: r.triage as CaseRecord["triage"] } : {}),
    ...(r.decision ? { decision: r.decision as CaseRecord["decision"] } : {}),
    status: r.status as CaseRecord["status"],
    isTestDispute: r.is_test_dispute as boolean,
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

function toAction(r: Row): AgentAction {
  const amount = num(r.amount_usd);
  return {
    id: r.id as string,
    caseId: r.case_id as string,
    kind: r.kind as AgentAction["kind"],
    params: (r.params ?? {}) as AgentAction["params"],
    rationale: r.rationale as string,
    ...(amount !== undefined ? { amountUsd: amount } : {}),
    requiresApproval: r.requires_approval as boolean,
    status: r.status as AgentAction["status"],
    ...(r.result ? { result: r.result as AgentAction["result"] } : {}),
    createdAt: iso(r.created_at),
    updatedAt: iso(r.updated_at),
  };
}

function toAudit(r: Row): AuditEntry {
  const cost = num(r.cost_usd);
  return {
    id: r.id as string,
    caseId: r.case_id as string,
    at: iso(r.at),
    actor: r.actor as AuditEntry["actor"],
    kind: r.kind as string,
    summary: r.summary as string,
    ...(r.data ? { data: r.data as Record<string, unknown> } : {}),
    ...(cost !== undefined ? { costUsd: cost } : {}),
  };
}

function toCapture(r: Row): TestCapture {
  return {
    captureId: r.capture_id as string,
    ...(r.order_id ? { orderId: r.order_id as string } : {}),
    ...(r.dispute_id ? { disputeId: r.dispute_id as string } : {}),
    ...(r.scenario ? { scenario: r.scenario as string } : {}),
    createdAt: iso(r.created_at),
  };
}

const ACTION_COLUMNS: Record<keyof ActionPatch, [string, (v: unknown) => unknown]> = {
  status: ["status", (v) => v],
  result: ["result", (v) => json(v)],
  params: ["params", (v) => json(v)],
  rationale: ["rationale", (v) => v],
  amountUsd: ["amount_usd", (v) => v ?? null],
  requiresApproval: ["requires_approval", (v) => v],
};

export function createPostgresRepo(url: string, query?: Query): Repo {
  const q: Query =
    query ??
    (() => {
      const sql = neon(url);
      return (text, params = []) => sql.query(text, params) as Promise<Row[]>;
    })();

  async function setCaseColumn(id: string, column: string, value: unknown): Promise<CaseRecord | null> {
    const rows = await q(`UPDATE cases SET ${column} = $2, updated_at = now() WHERE id = $1 RETURNING *`, [id, value]);
    return rows[0] ? toCase(rows[0]) : null;
  }

  return {
    kind: "postgres",

    cases: {
      async upsertFromSnapshot(snapshot, opts) {
        const rows = await q(
          `INSERT INTO cases (id, snapshot, status, is_test_dispute, dispute_status, capture_id,
                              seller_response_due, snapshot_updated_at)
           VALUES ($1, $2::jsonb, $3,
                   COALESCE($4::boolean, EXISTS (SELECT 1 FROM test_captures t WHERE t.capture_id = $5)),
                   $6, $5, $7::timestamptz, $8::timestamptz)
           ON CONFLICT (id) DO UPDATE SET
             snapshot = EXCLUDED.snapshot,
             dispute_status = EXCLUDED.dispute_status,
             capture_id = EXCLUDED.capture_id,
             seller_response_due = EXCLUDED.seller_response_due,
             snapshot_updated_at = EXCLUDED.snapshot_updated_at,
             status = CASE WHEN EXCLUDED.dispute_status = 'RESOLVED' THEN 'resolved' ELSE cases.status END,
             is_test_dispute = cases.is_test_dispute OR $4::boolean IS TRUE,
             updated_at = now()
           WHERE cases.snapshot_updated_at IS NULL
              OR EXCLUDED.snapshot_updated_at IS NULL
              OR EXCLUDED.snapshot_updated_at > cases.snapshot_updated_at
              OR (EXCLUDED.snapshot_updated_at = cases.snapshot_updated_at
                  AND (EXCLUDED.dispute_status <> cases.dispute_status
                       OR EXCLUDED.snapshot->'allowed' IS DISTINCT FROM cases.snapshot->'allowed'
                       OR EXCLUDED.snapshot->>'outcome' IS DISTINCT FROM cases.snapshot->>'outcome'))
           RETURNING *, (xmax = 0) AS inserted`,
          [
            snapshot.id,
            JSON.stringify(snapshot),
            statusAfterSnapshot(undefined, snapshot),
            opts?.isTestDispute ?? null,
            snapshot.sellerTransactionId ?? null,
            snapshot.status,
            validTime(snapshot.sellerResponseDueDate),
            validTime(snapshot.updateTime),
          ],
        );
        if (rows[0]) return { record: toCase(rows[0]), created: rows[0].inserted === true, changed: true };
        const existing = await q(`SELECT * FROM cases WHERE id = $1`, [snapshot.id]);
        if (!existing[0]) throw new Error(`case ${snapshot.id} vanished during upsert`);
        return { record: toCase(existing[0]), created: false, changed: false };
      },
      async get(id) {
        const rows = await q(`SELECT * FROM cases WHERE id = $1`, [id]);
        return rows[0] ? toCase(rows[0]) : null;
      },
      async list(query = {}) {
        const where: string[] = [];
        const params: unknown[] = [];
        if (query.status?.length) {
          params.push(query.status);
          where.push(`status = ANY($${params.length}::text[])`);
        }
        if (query.open !== undefined) where.push(query.open ? `dispute_status <> 'RESOLVED'` : `dispute_status = 'RESOLVED'`);
        if (query.isTestDispute !== undefined) {
          params.push(query.isTestDispute);
          where.push(`is_test_dispute = $${params.length}`);
        }
        params.push(clampLimit(query.limit));
        const rows = await q(
          `SELECT * FROM cases ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
           ORDER BY updated_at DESC, id LIMIT $${params.length}`,
          params,
        );
        return rows.map(toCase);
      },
      setTriage: (id, triage) => setCaseColumn(id, "triage", JSON.stringify(triage)),
      setDecision: (id, decision) => setCaseColumn(id, "decision", JSON.stringify(decision)),
      setStatus: (id, status) => setCaseColumn(id, "status", status),
      setOrder: (id, order) => setCaseColumn(id, "order_ctx", JSON.stringify(order)),
    },

    actions: {
      async insert(a) {
        const rows = await q(
          `INSERT INTO actions (id, case_id, kind, params, rationale, amount_usd, requires_approval, status, result)
           VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9::jsonb) RETURNING *`,
          [
            a.id ?? randomUUID(),
            a.caseId,
            a.kind,
            JSON.stringify(a.params ?? {}),
            a.rationale ?? "",
            a.amountUsd ?? null,
            a.requiresApproval,
            a.status ?? "proposed",
            json(a.result),
          ],
        );
        return toAction(rows[0]);
      },
      async update(id, patch, opts) {
        const sets: string[] = [];
        const params: unknown[] = [id];
        for (const [key, [column, conv]] of Object.entries(ACTION_COLUMNS)) {
          if (!(key in patch)) continue;
          params.push(conv(patch[key as keyof ActionPatch]));
          const cast = column === "result" || column === "params" ? "::jsonb" : "";
          sets.push(`${column} = $${params.length}${cast}`);
        }
        sets.push(`updated_at = clock_timestamp()`);
        let guard = "";
        if (opts?.ifStatus) {
          params.push(opts.ifStatus);
          guard = ` AND status = ANY($${params.length}::text[])`;
        }
        const rows = await q(`UPDATE actions SET ${sets.join(", ")} WHERE id = $1${guard} RETURNING *`, params);
        return rows[0] ? toAction(rows[0]) : null;
      },
      async get(id) {
        if (!isUuid(id)) return null;
        const rows = await q(`SELECT * FROM actions WHERE id = $1`, [id]);
        return rows[0] ? toAction(rows[0]) : null;
      },
      async listByCase(caseId) {
        const rows = await q(`SELECT * FROM actions WHERE case_id = $1 ORDER BY created_at, id`, [caseId]);
        return rows.map(toAction);
      },
      async listAwaitingApproval() {
        const rows = await q(`SELECT * FROM actions WHERE status = 'awaiting_approval' ORDER BY created_at, id`);
        return rows.map(toAction);
      },
    },

    audit: {
      async append(e) {
        const rows = await q(
          `INSERT INTO audit (id, case_id, at, actor, kind, summary, data, cost_usd)
           VALUES ($1, $2, COALESCE($3::timestamptz, clock_timestamp()), $4, $5, $6, $7::jsonb, $8) RETURNING *`,
          [randomUUID(), e.caseId, e.at ?? null, e.actor, e.kind, e.summary, json(e.data), e.costUsd ?? null],
        );
        return toAudit(rows[0]);
      },
      async listByCase(caseId, opts) {
        const rows = await q(
          `SELECT * FROM (SELECT * FROM audit WHERE case_id = $1 ORDER BY at DESC, seq DESC LIMIT $2) t
           ORDER BY at, seq`,
          [caseId, clampLimit(opts?.limit, 1000)],
        );
        return rows.map(toAudit);
      },
    },

    policy: {
      async get() {
        const rows = await q(`SELECT value FROM policy WHERE id = 1`);
        return rows[0] ? { ...DEFAULT_POLICY, ...(rows[0].value as SellerPolicy) } : { ...DEFAULT_POLICY };
      },
      async set(p) {
        const rows = await q(
          `INSERT INTO policy (id, value) VALUES (1, $1::jsonb)
           ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, updated_at = now() RETURNING value`,
          [JSON.stringify(p)],
        );
        return rows[0].value as SellerPolicy;
      },
    },

    spend: {
      async add(e) {
        await q(
          `INSERT INTO spend (at, kind, cost_usd, case_id, model, usage)
           VALUES (COALESCE($1::timestamptz, now()), $2, $3, $4, $5, $6::jsonb)`,
          [e.at ?? null, e.kind, e.costUsd, e.caseId ?? null, e.model ?? null, json(e.usage)],
        );
      },
      async totals() {
        const rows = await q(
          `SELECT COALESCE(sum(cost_usd), 0) AS total,
                  COALESCE(sum(cost_usd) FILTER (WHERE at >= $1), 0) AS today,
                  count(*) FILTER (WHERE kind = 'run' AND at >= $1) AS runs
           FROM spend`,
          [utcDayStart().toISOString()],
        );
        const r = rows[0];
        return { totalUsd: round6(Number(r.total)), todayUsd: round6(Number(r.today)), runsToday: Number(r.runs) };
      },
    },

    webhookEvents: {
      async insertIfNew(eventId, meta) {
        const rows = await q(
          `INSERT INTO webhook_events (event_id, event_type, resource_id) VALUES ($1, $2, $3)
           ON CONFLICT (event_id) DO NOTHING RETURNING event_id`,
          [eventId, meta?.eventType ?? null, meta?.resourceId ?? null],
        );
        return rows.length === 1;
      },
      async remove(eventId) {
        await q(`DELETE FROM webhook_events WHERE event_id = $1`, [eventId]);
      },
    },

    rateLimit: {
      async hit(key, limit, windowS) {
        const rows = await q(
          `INSERT INTO rate_limits (key, count, reset_at) VALUES ($1, 1, now() + make_interval(secs => $2))
           ON CONFLICT (key) DO UPDATE SET
             count = CASE WHEN rate_limits.reset_at <= now() THEN 1 ELSE rate_limits.count + 1 END,
             reset_at = CASE WHEN rate_limits.reset_at <= now() THEN EXCLUDED.reset_at ELSE rate_limits.reset_at END
           RETURNING count, reset_at`,
          [key, windowS],
        );
        const count = Number(rows[0].count);
        return { allowed: count <= limit, count, limit, resetAt: iso(rows[0].reset_at) };
      },
    },

    locks: {
      async withCaseLock(caseId, fn, opts) {
        const holder = randomUUID();
        const rows = await q(
          `INSERT INTO case_locks (case_id, holder, expires_at) VALUES ($1, $2, now() + make_interval(secs => $3))
           ON CONFLICT (case_id) DO UPDATE SET holder = EXCLUDED.holder, expires_at = EXCLUDED.expires_at
             WHERE case_locks.expires_at <= now()
           RETURNING holder`,
          [caseId, holder, opts?.ttlS ?? LOCK_TTL_DEFAULT_S],
        );
        if (rows.length === 0) return { acquired: false };
        try {
          return { acquired: true, value: await fn() };
        } finally {
          await q(`DELETE FROM case_locks WHERE case_id = $1 AND holder = $2`, [caseId, holder]).catch((e: unknown) =>
            console.warn(`[db] lock release failed case=${caseId}: ${e instanceof Error ? e.message : "unknown"}`),
          );
        }
      },
    },

    testCaptures: {
      async record(c) {
        const rows = await q(
          `INSERT INTO test_captures (capture_id, order_id, dispute_id, scenario) VALUES ($1, $2, $3, $4)
           ON CONFLICT (capture_id) DO UPDATE SET
             order_id = COALESCE(EXCLUDED.order_id, test_captures.order_id),
             dispute_id = COALESCE(EXCLUDED.dispute_id, test_captures.dispute_id),
             scenario = COALESCE(EXCLUDED.scenario, test_captures.scenario)
           RETURNING *`,
          [c.captureId, c.orderId ?? null, c.disputeId ?? null, c.scenario ?? null],
        );
        return toCapture(rows[0]);
      },
      async get(captureId) {
        const rows = await q(`SELECT * FROM test_captures WHERE capture_id = $1`, [captureId]);
        return rows[0] ? toCapture(rows[0]) : null;
      },
    },
  };
}

function validTime(v: string | undefined): string | null {
  return v && !Number.isNaN(Date.parse(v)) ? v : null;
}

function isUuid(v: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
}
