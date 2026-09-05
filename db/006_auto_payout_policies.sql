-- Durable auto-payout preferences. This records intent only; execution still
-- requires the provider/KYC/compliance/fraud gates in the payout worker.

CREATE TABLE IF NOT EXISTS auto_payout_policies (
  partner_id TEXT PRIMARY KEY REFERENCES partners(id),
  enabled BOOLEAN NOT NULL DEFAULT false,
  cadence TEXT NOT NULL CHECK (cadence IN ('MONTHLY', 'THRESHOLD')),
  threshold_minor BIGINT NOT NULL CHECK (threshold_minor > 0),
  currency TEXT NOT NULL CHECK (currency IN ('USD', 'UAH', 'EUR', 'PLN')),
  updated_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS auto_payout_policies_due_idx
  ON auto_payout_policies (enabled, cadence, updated_at);
