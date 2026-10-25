-- The PayPal wire: one row per PayPal API call the app makes (kind 'call') and per webhook
-- delivery received (kind 'event'). IDs, paths, statuses and timings only: no bodies, no headers.
CREATE TABLE IF NOT EXISTS wire (
  id uuid PRIMARY KEY,
  seq bigserial,
  at timestamptz NOT NULL DEFAULT clock_timestamp(),
  kind text NOT NULL CHECK (kind IN ('call', 'event')),
  origin text NOT NULL,
  case_id text,
  ref text,
  method text,
  path text,
  status integer,
  debug_id text,
  duration_ms integer,
  event_id text,
  event_type text,
  verify text,
  detail jsonb
);
CREATE INDEX IF NOT EXISTS wire_at_idx ON wire (at DESC, seq DESC);
CREATE INDEX IF NOT EXISTS wire_case_idx ON wire (case_id, at, seq);
CREATE INDEX IF NOT EXISTS wire_ref_idx ON wire (ref) WHERE case_id IS NULL;
