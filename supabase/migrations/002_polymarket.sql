-- Polymarket market odds integration
-- Adds fields to matches table to store market-implied probabilities

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS polymarket_slug TEXT,
  ADD COLUMN IF NOT EXISTS polymarket_home_prob NUMERIC(4,3),
  ADD COLUMN IF NOT EXISTS polymarket_away_prob NUMERIC(4,3),
  ADD COLUMN IF NOT EXISTS polymarket_draw_prob NUMERIC(4,3),
  ADD COLUMN IF NOT EXISTS polymarket_volume NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS polymarket_updated_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_matches_polymarket_slug ON matches(polymarket_slug) WHERE polymarket_slug IS NOT NULL;
