-- CaseClerk schema v1. Applied by src/lib/db/migrate.ts (statements split on ";" at line end:
-- keep one statement per ";" and no function bodies).

CREATE TABLE IF NOT EXISTS cases (
  id                   text PRIMARY KEY,                 -- PayPal dispute id (PP-R-...)
  snapshot             jsonb NOT NULL,                   -- DisputeSnapshot, raw kept server-side
  order_ctx            jsonb,
  triage               jsonb,
  decision             jsonb,
  status               text NOT NULL DEFAULT 'new',
  is_test_dispute      boolean NOT NULL DEFAULT false,
  dispute_status       text NOT NULL,                    -- snapshot.status, for filters
  capture_id           text,                             -- snapshot.sellerTransactionId
  seller_response_due  timestamptz,                      -- deadline board
  snapshot_updated_at  timestamptz,                      -- snapshot.updateTime (stale-delivery guard)
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);
-- Inbox: newest activity first, optionally only open disputes.
CREATE INDEX IF NOT EXISTS cases_updated_idx ON cases (updated_at DESC, id);
CREATE INDEX IF NOT EXISTS cases_open_due_idx ON cases (seller_response_due) WHERE dispute_status <> 'RESOLVED';
CREATE INDEX IF NOT EXISTS cases_status_idx ON cases (status, updated_at DESC);
CREATE INDEX IF NOT EXISTS cases_capture_idx ON cases (capture_id);

CREATE TABLE IF NOT EXISTS actions (
  id                 uuid PRIMARY KEY,
  case_id            text NOT NULL REFERENCES cases (id) ON DELETE CASCADE,
  kind               text NOT NULL,
  params             jsonb NOT NULL DEFAULT '{}'::jsonb,
  rationale          text NOT NULL DEFAULT '',
  amount_usd         numeric(12, 2),
  requires_approval  boolean NOT NULL DEFAULT false,
  status             text NOT NULL,
  result             jsonb,
  created_at         timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at         timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX IF NOT EXISTS actions_case_idx ON actions (case_id, created_at);
CREATE INDEX IF NOT EXISTS actions_awaiting_idx ON actions (created_at) WHERE status = 'awaiting_approval';

-- Case timeline. seq keeps insertion order for entries with the same timestamp.
CREATE TABLE IF NOT EXISTS audit (
  seq        bigserial PRIMARY KEY,
  id         uuid NOT NULL UNIQUE,
  case_id    text NOT NULL,
  at         timestamptz NOT NULL DEFAULT clock_timestamp(),
  actor      text NOT NULL,
  kind       text NOT NULL,
  summary    text NOT NULL,
  data       jsonb,
  cost_usd   numeric(12, 6)
);
CREATE INDEX IF NOT EXISTS audit_case_idx ON audit (case_id, at, seq);

-- Single-row seller policy.
CREATE TABLE IF NOT EXISTS policy (
  id          smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  value       jsonb NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS spend (
  id        bigserial PRIMARY KEY,
  at        timestamptz NOT NULL DEFAULT now(),
  kind      text NOT NULL CHECK (kind IN ('llm', 'run')),
  cost_usd  numeric(12, 6) NOT NULL DEFAULT 0,
  case_id   text,
  model     text,
  usage     jsonb
);
CREATE INDEX IF NOT EXISTS spend_at_idx ON spend (at);

CREATE TABLE IF NOT EXISTS webhook_events (
  event_id     text PRIMARY KEY,
  event_type   text,
  resource_id  text,
  received_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key       text PRIMARY KEY,
  count     integer NOT NULL,
  reset_at  timestamptz NOT NULL
);

-- Per-case lease lock (Neon's HTTP driver has no sessions, so no advisory locks).
CREATE TABLE IF NOT EXISTS case_locks (
  case_id     text PRIMARY KEY,
  holder      uuid NOT NULL,
  expires_at  timestamptz NOT NULL
);

-- Captures created by "Open test dispute"; the webhook marks their disputes isTestDispute.
CREATE TABLE IF NOT EXISTS test_captures (
  capture_id  text PRIMARY KEY,
  order_id    text,
  dispute_id  text,
  scenario    text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
