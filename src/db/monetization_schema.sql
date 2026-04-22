-- ============================================================
-- PAWBER MONETIZATION SYSTEM (Subscriptions, Leads & Commissions)
-- ============================================================

-- 1. Client Subscriptions (Petsfolio Plus)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_plus_member BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS plus_membership_expires_at TIMESTAMP;

-- 2. Provider Monetization (Bidding, Leads, Certs)
ALTER TABLE providers
ADD COLUMN IF NOT EXISTS is_bidding_unlimited BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS bidding_subscription_expires_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS is_certified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS certification_id TEXT,
ADD COLUMN IF NOT EXISTS certification_completed_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS free_bids_remaining INT DEFAULT 5; -- Refresh daily

-- 3. Lead Unlocks Table
CREATE TABLE IF NOT EXISTS lead_unlocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE NOT NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
    amount_paid NUMERIC NOT NULL,
    unlocked_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(provider_id, booking_id)
);

-- 4. Premium Leads flag in bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS is_premium_lead BOOLEAN DEFAULT FALSE;

-- 5. Subscriptions Tracking for Providers
CREATE TABLE IF NOT EXISTS provider_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE NOT NULL,
    plan_type TEXT CHECK (plan_type IN ('bidding_unlimited', 'certification_course')),
    amount_paid NUMERIC NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'completed')),
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Ensure Bids table exists (if it doesn't already exist from another migration)
CREATE TABLE IF NOT EXISTS bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE NOT NULL,
    request_id UUID NOT NULL, -- references service_requests or bookings
    amount NUMERIC NOT NULL,
    message TEXT,
    eta TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMP DEFAULT NOW()
);
