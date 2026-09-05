-- Durable rank evaluation history. Rank snapshots are append-only evidence of
-- the rule/rate that was effective at a point in time; they are not a balance
-- shortcut and must never be rewritten in place.

CREATE TABLE IF NOT EXISTS partner_rank_snapshots (
  id TEXT PRIMARY KEY,
  partner_id TEXT NOT NULL REFERENCES partners(id),
  qualified_active_paid_l1 INTEGER NOT NULL CHECK (qualified_active_paid_l1 >= 0),
  rank TEXT NOT NULL CHECK (rank IN ('STARTER', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM')),
  rank_state TEXT NOT NULL CHECK (rank_state IN ('ACTIVE', 'BELOW_THRESHOLD', 'GRACE', 'COOLDOWN', 'SUSPENDED')),
  rate_bps INTEGER NOT NULL CHECK (rate_bps BETWEEN 0 AND 10000),
  grace_cycles_in_window INTEGER NOT NULL DEFAULT 0 CHECK (grace_cycles_in_window >= 0),
  rule_version TEXT NOT NULL,
  reason TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rank_events (
  id TEXT PRIMARY KEY,
  partner_id TEXT NOT NULL REFERENCES partners(id),
  event_type TEXT NOT NULL,
  previous_rank TEXT CHECK (previous_rank IS NULL OR previous_rank IN ('STARTER', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM')),
  new_rank TEXT CHECK (new_rank IS NULL OR new_rank IN ('STARTER', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM')),
  previous_state TEXT CHECK (previous_state IS NULL OR previous_state IN ('ACTIVE', 'BELOW_THRESHOLD', 'GRACE', 'COOLDOWN', 'SUSPENDED')),
  new_state TEXT CHECK (new_state IS NULL OR new_state IN ('ACTIVE', 'BELOW_THRESHOLD', 'GRACE', 'COOLDOWN', 'SUSPENDED')),
  qualified_active_paid_l1 INTEGER NOT NULL CHECK (qualified_active_paid_l1 >= 0),
  rule_version TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION siren_reject_rank_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'IMMUTABLE_RANK_HISTORY: use a new snapshot/event';
END;
$$;

DROP TRIGGER IF EXISTS partner_rank_snapshots_immutable ON partner_rank_snapshots;
CREATE TRIGGER partner_rank_snapshots_immutable
BEFORE UPDATE OR DELETE ON partner_rank_snapshots
FOR EACH ROW EXECUTE FUNCTION siren_reject_rank_mutation();

DROP TRIGGER IF EXISTS rank_events_immutable ON rank_events;
CREATE TRIGGER rank_events_immutable
BEFORE UPDATE OR DELETE ON rank_events
FOR EACH ROW EXECUTE FUNCTION siren_reject_rank_mutation();

CREATE INDEX IF NOT EXISTS partner_rank_snapshots_latest_idx
  ON partner_rank_snapshots (partner_id, occurred_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS rank_events_partner_occurred_idx
  ON rank_events (partner_id, occurred_at DESC, id DESC);
