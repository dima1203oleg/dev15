-- Durable non-financial partner engagement projections. These records never
-- alter compensation and public leaderboard entries are opt-in only.

ALTER TABLE leaderboard_snapshots
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS leaderboard_snapshots_idempotency_idx
  ON leaderboard_snapshots (idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS achievements_threshold_idx
  ON achievements (threshold);

INSERT INTO achievements (id, threshold, label, reward_type) VALUES
  ('first-referral', 1, 'First Referral', 'BADGE'),
  ('first-five', 5, 'First Five', 'BADGE'),
  ('bronze-achievement', 10, 'Bronze Achievement', 'BADGE'),
  ('momentum', 20, 'Momentum', 'BADGE'),
  ('silver-achievement', 30, 'Silver Achievement', 'BADGE'),
  ('power-50', 50, 'Power 50', 'BADGE'),
  ('gold-achievement', 75, 'Gold Achievement', 'BADGE'),
  ('century', 100, 'Century', 'BADGE'),
  ('growth-150', 150, 'Growth 150', 'BADGE'),
  ('platinum-achievement', 200, 'Platinum Achievement', 'BADGE'),
  ('ambassador-candidate', 500, 'Ambassador Candidate', 'BADGE'),
  ('ambassador-pro', 750, 'Ambassador Pro', 'BADGE'),
  ('ambassador-elite', 1000, 'Ambassador Elite', 'BADGE'),
  ('legend', 2500, 'Legend', 'BADGE')
ON CONFLICT (id) DO UPDATE SET threshold = EXCLUDED.threshold, label = EXCLUDED.label, reward_type = EXCLUDED.reward_type;
