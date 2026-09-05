-- Immutable payment adjustment and commission-state history. Full refunds and
-- chargebacks are recorded as compensating transactions; original payment,
-- commission and ledger rows remain explainable.

CREATE TABLE IF NOT EXISTS payment_adjustments (
  id TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL REFERENCES payments(id),
  provider TEXT NOT NULL,
  provider_event_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('REFUND', 'CHARGEBACK')),
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'UAH', 'EUR', 'PLN')),
  status TEXT NOT NULL DEFAULT 'APPLIED' CHECK (status = 'APPLIED'),
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE (provider, provider_event_id),
  UNIQUE (payment_id, kind)
);

CREATE TABLE IF NOT EXISTS commission_events (
  id TEXT PRIMARY KEY,
  commission_id TEXT NOT NULL REFERENCES commissions(id),
  event_type TEXT NOT NULL,
  previous_state TEXT NOT NULL,
  new_state TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION siren_reject_payment_history_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'IMMUTABLE_PAYMENT_HISTORY: use a compensating transaction';
END;
$$;

DROP TRIGGER IF EXISTS payment_adjustments_immutable ON payment_adjustments;
CREATE TRIGGER payment_adjustments_immutable
BEFORE UPDATE OR DELETE ON payment_adjustments
FOR EACH ROW EXECUTE FUNCTION siren_reject_payment_history_mutation();

DROP TRIGGER IF EXISTS commission_events_immutable ON commission_events;
CREATE TRIGGER commission_events_immutable
BEFORE UPDATE OR DELETE ON commission_events
FOR EACH ROW EXECUTE FUNCTION siren_reject_payment_history_mutation();

CREATE INDEX IF NOT EXISTS payment_adjustments_payment_idx
  ON payment_adjustments (payment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS commission_events_commission_idx
  ON commission_events (commission_id, occurred_at DESC);
