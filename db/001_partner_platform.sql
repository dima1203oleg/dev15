-- SIREN UA Partner Platform persistence contract
-- PostgreSQL 15+. Money is stored as integer minor units. This migration is
-- intentionally not executed by Dev15: no production database credentials or
-- migration runner were supplied in this checkout.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partners (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
  referral_code TEXT NOT NULL UNIQUE,
  rank TEXT NOT NULL CHECK (rank IN ('STARTER', 'BRONZE', 'SILVER', 'GOLD', 'PLATINUM')),
  rank_state TEXT NOT NULL CHECK (rank_state IN ('ACTIVE', 'BELOW_THRESHOLD', 'GRACE', 'COOLDOWN', 'SUSPENDED')),
  qualified_active_paid_l1 INTEGER NOT NULL DEFAULT 0 CHECK (qualified_active_paid_l1 >= 0),
  quality_status TEXT NOT NULL DEFAULT 'QUALITY_GOOD' CHECK (quality_status IN ('QUALITY_GOOD', 'QUALITY_REVIEW', 'QUALITY_RESTRICTED', 'QUALITY_BLOCKED')),
  public_profile_opt_in BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  plan_code TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('REGISTERED', 'TRIAL_ACTIVE', 'TRIAL_ENDING', 'PAYMENT_PENDING', 'PREMIUM_ACTIVE', 'TRIAL_EXPIRED', 'PAYMENT_FAILED', 'PAST_DUE', 'SUBSCRIPTION_GRACE', 'CANCEL_AT_PERIOD_END', 'CANCELED', 'EXPIRED', 'SUSPENDED', 'REFUNDED')),
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  provider TEXT CHECK (provider IN ('WEB', 'APPLE', 'GOOGLE')),
  provider_subscription_id TEXT,
  billing_consent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscription_events (
  id TEXT PRIMARY KEY,
  subscription_id TEXT NOT NULL REFERENCES subscriptions(id),
  event_type TEXT NOT NULL,
  provider_event_id TEXT,
  payload JSONB NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider_event_id)
);

CREATE TABLE IF NOT EXISTS referral_attributions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id),
  direct_partner_id TEXT NOT NULL REFERENCES partners(id),
  second_level_partner_id TEXT REFERENCES partners(id),
  status TEXT NOT NULL CHECK (status IN ('ATTRIBUTED', 'LOCKED', 'REJECTED')),
  source_channel TEXT NOT NULL,
  campaign TEXT,
  attributed_at TIMESTAMPTZ NOT NULL,
  qualified_at TIMESTAMPTZ,
  CHECK (direct_partner_id <> user_id),
  CHECK (second_level_partner_id IS NULL OR (second_level_partner_id <> direct_partner_id AND second_level_partner_id <> user_id))
);

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  provider TEXT NOT NULL,
  provider_payment_id TEXT NOT NULL,
  gross_amount_minor BIGINT NOT NULL CHECK (gross_amount_minor >= 0),
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'UAH', 'EUR', 'PLN')),
  status TEXT NOT NULL,
  is_test_payment BOOLEAN NOT NULL DEFAULT false,
  provider_event_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_payment_id),
  UNIQUE (provider_event_id)
);

CREATE TABLE IF NOT EXISTS qualified_payments (
  payment_id TEXT PRIMARY KEY REFERENCES payments(id),
  attribution_id TEXT NOT NULL REFERENCES referral_attributions(id),
  qcb_amount_minor BIGINT NOT NULL CHECK (qcb_amount_minor >= 0),
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'UAH', 'EUR', 'PLN')),
  qcb_policy_version TEXT NOT NULL,
  qualification_reason TEXT NOT NULL,
  rule_version TEXT NOT NULL,
  qualified_at TIMESTAMPTZ NOT NULL,
  UNIQUE (payment_id)
);

CREATE TABLE IF NOT EXISTS commissions (
  id TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL REFERENCES qualified_payments(payment_id),
  partner_id TEXT NOT NULL REFERENCES partners(id),
  referral_level TEXT NOT NULL CHECK (referral_level IN ('L1', 'L2')),
  qcb_amount_minor BIGINT NOT NULL CHECK (qcb_amount_minor >= 0),
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'UAH', 'EUR', 'PLN')),
  qcb_policy_version TEXT NOT NULL,
  achieved_rank TEXT NOT NULL,
  effective_rank TEXT NOT NULL,
  rate_bps INTEGER NOT NULL CHECK (rate_bps BETWEEN 0 AND 10000),
  raw_commission_minor BIGINT NOT NULL CHECK (raw_commission_minor >= 0),
  rounded_commission_minor BIGINT NOT NULL CHECK (rounded_commission_minor >= 0),
  rounding_policy TEXT NOT NULL CHECK (rounding_policy = 'HALF_UP'),
  cap_result JSONB NOT NULL,
  rule_version TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('CREATED', 'PENDING', 'HELD', 'VESTED', 'AVAILABLE', 'PAID', 'REJECTED', 'HELD_FOR_REVIEW', 'REVERSED', 'ADJUSTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (payment_id, partner_id, referral_level)
);

CREATE TABLE IF NOT EXISTS ledger_accounts (
  code TEXT PRIMARY KEY,
  account_type TEXT NOT NULL CHECK (account_type IN ('PLATFORM_REVENUE', 'PARTNER_PENDING', 'PARTNER_HELD', 'PARTNER_AVAILABLE', 'PARTNER_LOCKED', 'PARTNER_PAID', 'PARTNER_REVERSED', 'PARTNER_DEBT', 'PAYOUT_PROVIDER'))
);

INSERT INTO ledger_accounts (code, account_type) VALUES
  ('PLATFORM_REVENUE', 'PLATFORM_REVENUE'),
  ('PARTNER_PENDING', 'PARTNER_PENDING'),
  ('PARTNER_HELD', 'PARTNER_HELD'),
  ('PARTNER_AVAILABLE', 'PARTNER_AVAILABLE'),
  ('PARTNER_LOCKED', 'PARTNER_LOCKED'),
  ('PARTNER_PAID', 'PARTNER_PAID'),
  ('PARTNER_REVERSED', 'PARTNER_REVERSED'),
  ('PARTNER_DEBT', 'PARTNER_DEBT'),
  ('PAYOUT_PROVIDER', 'PAYOUT_PROVIDER')
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS ledger_transactions (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  rule_version TEXT,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS ledger_lines (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  transaction_id TEXT NOT NULL REFERENCES ledger_transactions(id),
  account_code TEXT NOT NULL REFERENCES ledger_accounts(code),
  direction TEXT NOT NULL CHECK (direction IN ('DEBIT', 'CREDIT')),
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'UAH', 'EUR', 'PLN')),
  partner_id TEXT REFERENCES partners(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION siren_reject_ledger_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'IMMUTABLE_LEDGER: use a compensating transaction';
END;
$$;

DROP TRIGGER IF EXISTS ledger_transactions_immutable ON ledger_transactions;
CREATE TRIGGER ledger_transactions_immutable
BEFORE UPDATE OR DELETE ON ledger_transactions
FOR EACH ROW EXECUTE FUNCTION siren_reject_ledger_mutation();

DROP TRIGGER IF EXISTS ledger_lines_immutable ON ledger_lines;
CREATE TRIGGER ledger_lines_immutable
BEFORE UPDATE OR DELETE ON ledger_lines
FOR EACH ROW EXECUTE FUNCTION siren_reject_ledger_mutation();

CREATE OR REPLACE FUNCTION siren_assert_ledger_transaction_balanced()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  target_transaction_id TEXT;
  transaction_currency_count INTEGER;
  debit_total BIGINT;
  credit_total BIGINT;
BEGIN
  target_transaction_id := CASE WHEN TG_OP = 'DELETE' THEN OLD.transaction_id ELSE NEW.transaction_id END;
  SELECT COUNT(DISTINCT currency),
         COALESCE(SUM(CASE WHEN direction = 'DEBIT' THEN amount_minor ELSE 0 END), 0),
         COALESCE(SUM(CASE WHEN direction = 'CREDIT' THEN amount_minor ELSE 0 END), 0)
    INTO transaction_currency_count, debit_total, credit_total
    FROM ledger_lines
   WHERE transaction_id = target_transaction_id;

  IF transaction_currency_count <> 1 OR debit_total <> credit_total THEN
    RAISE EXCEPTION 'LEDGER_NOT_BALANCED: transaction %', target_transaction_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS ledger_lines_balanced ON ledger_lines;
CREATE CONSTRAINT TRIGGER ledger_lines_balanced
AFTER INSERT OR UPDATE OR DELETE ON ledger_lines
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION siren_assert_ledger_transaction_balanced();

CREATE OR REPLACE VIEW wallet_projections AS
SELECT
  partner_id,
  currency,
  COALESCE(SUM(CASE WHEN account_code = 'PARTNER_PENDING' THEN CASE WHEN direction = 'CREDIT' THEN amount_minor ELSE -amount_minor END ELSE 0 END), 0) AS pending_minor,
  COALESCE(SUM(CASE WHEN account_code = 'PARTNER_HELD' THEN CASE WHEN direction = 'CREDIT' THEN amount_minor ELSE -amount_minor END ELSE 0 END), 0) AS held_minor,
  COALESCE(SUM(CASE WHEN account_code = 'PARTNER_AVAILABLE' THEN CASE WHEN direction = 'CREDIT' THEN amount_minor ELSE -amount_minor END ELSE 0 END), 0) AS available_minor,
  COALESCE(SUM(CASE WHEN account_code = 'PARTNER_LOCKED' THEN CASE WHEN direction = 'CREDIT' THEN amount_minor ELSE -amount_minor END ELSE 0 END), 0) AS locked_for_payout_minor,
  COALESCE(SUM(CASE WHEN account_code = 'PARTNER_PAID' THEN CASE WHEN direction = 'CREDIT' THEN amount_minor ELSE -amount_minor END ELSE 0 END), 0) AS paid_minor,
  COALESCE(SUM(CASE WHEN account_code = 'PARTNER_REVERSED' THEN CASE WHEN direction = 'CREDIT' THEN amount_minor ELSE -amount_minor END ELSE 0 END), 0) AS reversed_minor,
  COALESCE(SUM(CASE WHEN account_code = 'PARTNER_DEBT' THEN CASE WHEN direction = 'CREDIT' THEN amount_minor ELSE -amount_minor END ELSE 0 END), 0) AS debt_minor
FROM ledger_lines
WHERE partner_id IS NOT NULL
GROUP BY partner_id, currency;

CREATE TABLE IF NOT EXISTS fx_rates (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  version TEXT NOT NULL,
  base_currency TEXT NOT NULL CHECK (base_currency IN ('USD', 'UAH', 'EUR', 'PLN')),
  payout_currency TEXT NOT NULL CHECK (payout_currency IN ('USD', 'UAH', 'EUR', 'PLN')),
  rate_numerator BIGINT NOT NULL CHECK (rate_numerator > 0),
  rate_denominator BIGINT NOT NULL CHECK (rate_denominator > 0),
  quoted_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL CHECK (expires_at > quoted_at),
  UNIQUE (provider, version)
);

CREATE TABLE IF NOT EXISTS payout_methods (
  id TEXT PRIMARY KEY,
  partner_id TEXT NOT NULL REFERENCES partners(id),
  provider TEXT NOT NULL,
  destination_ciphertext BYTEA NOT NULL,
  destination_last4 TEXT NOT NULL CHECK (length(destination_last4) = 4),
  verification_status TEXT NOT NULL CHECK (verification_status IN ('PENDING', 'VERIFIED', 'FAILED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payout_requests (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  partner_id TEXT NOT NULL REFERENCES partners(id),
  payout_method_id TEXT NOT NULL REFERENCES payout_methods(id),
  requested_amount_minor BIGINT NOT NULL CHECK (requested_amount_minor > 0),
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'UAH', 'EUR', 'PLN')),
  provider_fee_minor BIGINT NOT NULL DEFAULT 0 CHECK (provider_fee_minor >= 0),
  fx_fee_minor BIGINT NOT NULL DEFAULT 0 CHECK (fx_fee_minor >= 0),
  withholding_minor BIGINT NOT NULL DEFAULT 0 CHECK (withholding_minor >= 0),
  fx_rate_id TEXT REFERENCES fx_rates(id),
  status TEXT NOT NULL CHECK (status IN ('REQUESTED', 'VALIDATING', 'PAYOUT_HELD', 'PROCESSING', 'PAID', 'FAILED', 'REJECTED')),
  provider_payout_id TEXT UNIQUE,
  failure_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS payout_attempts (
  id TEXT PRIMARY KEY,
  payout_request_id TEXT NOT NULL REFERENCES payout_requests(id),
  provider_payout_id TEXT,
  request_id TEXT NOT NULL,
  response_status TEXT,
  response_payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (payout_request_id, request_id)
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY,
  provider TEXT NOT NULL,
  provider_event_id TEXT NOT NULL,
  signature_verified_at TIMESTAMPTZ NOT NULL,
  raw_body BYTEA NOT NULL,
  processed_at TIMESTAMPTZ,
  processing_status TEXT NOT NULL CHECK (processing_status IN ('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED')),
  UNIQUE (provider, provider_event_id)
);

CREATE TABLE IF NOT EXISTS idempotency_records (
  scope TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_fingerprint TEXT NOT NULL,
  response_status INTEGER,
  response_body JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (scope, idempotency_key)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id TEXT,
  action TEXT NOT NULL,
  target_entity TEXT NOT NULL,
  target_id TEXT NOT NULL,
  previous_value JSONB,
  new_value JSONB,
  reason TEXT NOT NULL,
  request_id TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS event_outbox (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  event_type TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  payload JSONB NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  published_at TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fraud_signals (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  partner_id TEXT REFERENCES partners(id),
  user_id TEXT REFERENCES users(id),
  signal_name TEXT NOT NULL,
  weight INTEGER NOT NULL CHECK (weight BETWEEN 0 AND 100),
  present BOOLEAN NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fraud_cases (
  id TEXT PRIMARY KEY,
  partner_id TEXT REFERENCES partners(id),
  user_id TEXT REFERENCES users(id),
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  status TEXT NOT NULL CHECK (status IN ('OK', 'REVIEW', 'BLOCKED', 'RESOLVED')),
  reason TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS partner_quality_scores (
  partner_id TEXT PRIMARY KEY REFERENCES partners(id),
  score INTEGER NOT NULL CHECK (score BETWEEN 0 AND 100),
  status TEXT NOT NULL CHECK (status IN ('QUALITY_GOOD', 'QUALITY_REVIEW', 'QUALITY_RESTRICTED', 'QUALITY_BLOCKED')),
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  calculated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  threshold INTEGER NOT NULL CHECK (threshold > 0),
  label TEXT NOT NULL,
  reward_type TEXT NOT NULL DEFAULT 'BADGE' CHECK (reward_type = 'BADGE')
);

CREATE TABLE IF NOT EXISTS partner_achievements (
  partner_id TEXT NOT NULL REFERENCES partners(id),
  achievement_id TEXT NOT NULL REFERENCES achievements(id),
  unlocked_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (partner_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id TEXT PRIMARY KEY,
  metric TEXT NOT NULL,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS leaderboard_entries (
  snapshot_id TEXT NOT NULL REFERENCES leaderboard_snapshots(id),
  partner_id TEXT NOT NULL REFERENCES partners(id),
  position INTEGER NOT NULL CHECK (position > 0),
  score NUMERIC(30, 0) NOT NULL CHECK (score >= 0),
  public_profile_opt_in BOOLEAN NOT NULL,
  PRIMARY KEY (snapshot_id, partner_id),
  UNIQUE (snapshot_id, position)
);

CREATE TABLE IF NOT EXISTS ambassador_profiles (
  partner_id TEXT PRIMARY KEY REFERENCES partners(id),
  tier TEXT NOT NULL CHECK (tier IN ('NONE', 'CANDIDATE', 'AMBASSADOR', 'PRO', 'ELITE', 'LEGEND')),
  approved BOOLEAN NOT NULL DEFAULT false,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (approved = false OR (approved_by IS NOT NULL AND approved_at IS NOT NULL))
);

CREATE TABLE IF NOT EXISTS notification_jobs (
  id TEXT PRIMARY KEY,
  recipient_id TEXT NOT NULL,
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('PUSH', 'EMAIL', 'IN_APP', 'TELEGRAM', 'SMS')),
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('SCHEDULED', 'SENT', 'SKIPPED', 'FAILED')),
  idempotency_key TEXT NOT NULL UNIQUE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS financial_rule_versions (
  version TEXT PRIMARY KEY,
  rule_type TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('DRAFT', 'VALIDATED', 'APPROVED', 'SCHEDULED', 'ACTIVE')),
  value JSONB NOT NULL,
  created_by TEXT NOT NULL,
  approved_by TEXT,
  effective_from TIMESTAMPTZ,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (approved_by IS NULL OR approved_by <> created_by)
);

CREATE INDEX IF NOT EXISTS subscriptions_user_state_idx ON subscriptions (user_id, state);
CREATE INDEX IF NOT EXISTS referral_attributions_direct_idx ON referral_attributions (direct_partner_id, status);
CREATE INDEX IF NOT EXISTS referral_attributions_second_idx ON referral_attributions (second_level_partner_id, status);
CREATE INDEX IF NOT EXISTS commissions_partner_state_idx ON commissions (partner_id, state, created_at);
CREATE INDEX IF NOT EXISTS ledger_lines_partner_currency_idx ON ledger_lines (partner_id, currency, created_at);
CREATE INDEX IF NOT EXISTS payout_requests_partner_status_idx ON payout_requests (partner_id, status, created_at);
CREATE INDEX IF NOT EXISTS audit_logs_target_idx ON audit_logs (target_entity, target_id, created_at);
CREATE INDEX IF NOT EXISTS event_outbox_pending_idx ON event_outbox (published_at, created_at) WHERE published_at IS NULL;
CREATE INDEX IF NOT EXISTS fraud_cases_status_idx ON fraud_cases (status, created_at);
CREATE INDEX IF NOT EXISTS notification_jobs_due_idx ON notification_jobs (status, scheduled_for);
