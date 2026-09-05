-- Preserve the exact signed provider payload for subscription webhook
-- idempotency/conflict checks. Existing rows remain readable; new gateway
-- deliveries store raw bytes before any parsed provider representation.

ALTER TABLE subscription_events
  ADD COLUMN IF NOT EXISTS raw_body BYTEA;

CREATE INDEX IF NOT EXISTS subscription_events_provider_event_idx
  ON subscription_events (provider_event_id);
