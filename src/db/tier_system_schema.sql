-- ============================================================
-- FINAL PAWBER WALKER TIER SYSTEM
-- ============================================================

-- 1. Upgrade Providers Table with Tier & Performance Metrics
ALTER TABLE providers 
ADD COLUMN IF NOT EXISTS tier INT DEFAULT 3,
ADD COLUMN IF NOT EXISTS completed_bookings INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS cancelled_bookings INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS on_time_percentage NUMERIC DEFAULT 100.0,
ADD COLUMN IF NOT EXISTS complaint_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_30_day_bookings INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_evaluated_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS strike_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS strikes_reset_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS ranking_score NUMERIC DEFAULT 0;

-- 2. Strike System Table
CREATE TABLE IF NOT EXISTS provider_strikes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  strike_type TEXT CHECK (strike_type IN ('late', 'cancellation', 'complaint')) NOT NULL,
  points INT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Upgrade Requests Table
CREATE TABLE IF NOT EXISTS tier_upgrade_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE NOT NULL,
  requested_tier INT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'ops_review')),
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES profiles(id)
);

-- Create indexes for new evaluation jobs
CREATE INDEX IF NOT EXISTS idx_providers_tier ON providers(tier);
CREATE INDEX IF NOT EXISTS idx_providers_ranking ON providers(ranking_score DESC);
CREATE INDEX IF NOT EXISTS idx_strikes_provider ON provider_strikes(provider_id, created_at);
