-- Durable campaign attribution helpers. These contain no PII and are safe to
-- use for referral analytics once the authenticated repository is wired.

CREATE TABLE IF NOT EXISTS partner_campaign_links (
  id TEXT PRIMARY KEY,
  partner_id TEXT NOT NULL REFERENCES partners(id),
  campaign TEXT NOT NULL CHECK (length(campaign) BETWEEN 1 AND 64),
  content TEXT NOT NULL DEFAULT '' CHECK (length(content) <= 64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (partner_id, campaign, content)
);

CREATE TABLE IF NOT EXISTS partner_link_clicks (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  partner_id TEXT NOT NULL REFERENCES partners(id),
  campaign_link_id TEXT REFERENCES partner_campaign_links(id),
  referral_code TEXT NOT NULL,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  request_id TEXT,
  ip_hash TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS partner_link_clicks_partner_idx
  ON partner_link_clicks (partner_id, occurred_at);
