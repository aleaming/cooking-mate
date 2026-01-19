-- ============================================================
-- SUBSCRIPTION FIELDS FOR PROFILES
-- ============================================================

-- Create subscription status enum
CREATE TYPE subscription_status AS ENUM (
  'inactive',
  'active',
  'trialing',
  'past_due',
  'canceled',
  'unpaid'
);

-- Create subscription tier enum
CREATE TYPE subscription_tier AS ENUM ('basic', 'pro');

-- Create subscription period enum
CREATE TYPE subscription_period AS ENUM ('monthly', 'yearly');

-- Add subscription columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status subscription_status DEFAULT 'inactive';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_tier subscription_tier;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_period subscription_period;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_id TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_current_period_end TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN DEFAULT FALSE;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);

-- ============================================================
-- HELPER FUNCTION: Check if user has active subscription
-- ============================================================

CREATE OR REPLACE FUNCTION has_active_subscription(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  status subscription_status;
BEGIN
  SELECT subscription_status INTO status
  FROM profiles
  WHERE id = user_id;

  RETURN status = 'active' OR status = 'trialing';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- HELPER FUNCTION: Get subscription info for user
-- ============================================================

CREATE OR REPLACE FUNCTION get_subscription_info(user_id UUID)
RETURNS TABLE (
  status subscription_status,
  tier subscription_tier,
  period subscription_period,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.subscription_status,
    p.subscription_tier,
    p.subscription_period,
    p.subscription_current_period_end,
    p.subscription_cancel_at_period_end
  FROM profiles p
  WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
