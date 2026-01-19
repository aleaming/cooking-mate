-- ============================================================
-- TRIAL SYSTEM FIELDS
-- ============================================================

-- Add trial tracking fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Index for trial expiration queries
CREATE INDEX IF NOT EXISTS idx_profiles_trial_ends_at ON profiles(trial_ends_at)
WHERE trial_ends_at IS NOT NULL;

-- ============================================================
-- HELPER FUNCTION: Check if user is in active trial
-- ============================================================

CREATE OR REPLACE FUNCTION is_in_active_trial(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  status TEXT;
  trial_end TIMESTAMPTZ;
BEGIN
  SELECT subscription_status::TEXT, trial_ends_at INTO status, trial_end
  FROM profiles
  WHERE id = user_id;

  RETURN status = 'trialing' AND trial_end IS NOT NULL AND trial_end > NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- UPDATE has_active_subscription to check trial expiration
-- ============================================================

CREATE OR REPLACE FUNCTION has_active_subscription(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  status subscription_status;
  trial_end TIMESTAMPTZ;
BEGIN
  SELECT subscription_status, trial_ends_at INTO status, trial_end
  FROM profiles
  WHERE id = user_id;

  -- Active subscription always has access
  IF status = 'active' THEN
    RETURN TRUE;
  END IF;

  -- Trialing users only have access if trial hasn't expired
  IF status = 'trialing' AND trial_end IS NOT NULL AND trial_end > NOW() THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- UPDATE handle_new_user to set trial on signup
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    display_name,
    subscription_status,
    trial_started_at,
    trial_ends_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'trialing',
    NOW(),
    NOW() + INTERVAL '14 days'
  )
  ON CONFLICT (id) DO UPDATE SET
    -- Only upgrade to trialing if currently inactive (handles edge cases)
    subscription_status = CASE
      WHEN profiles.subscription_status = 'inactive' THEN 'trialing'::subscription_status
      ELSE profiles.subscription_status
    END,
    trial_started_at = CASE
      WHEN profiles.subscription_status = 'inactive' THEN NOW()
      ELSE profiles.trial_started_at
    END,
    trial_ends_at = CASE
      WHEN profiles.subscription_status = 'inactive' THEN NOW() + INTERVAL '14 days'
      ELSE profiles.trial_ends_at
    END;
  RETURN NEW;
END;
$$;

-- ============================================================
-- UPDATE get_subscription_info to include trial fields
-- ============================================================

-- Must DROP first because we're changing the return type (adding trial columns)
DROP FUNCTION IF EXISTS get_subscription_info(uuid);

CREATE OR REPLACE FUNCTION get_subscription_info(user_id UUID)
RETURNS TABLE (
  status subscription_status,
  tier subscription_tier,
  period subscription_period,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN,
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.subscription_status,
    p.subscription_tier,
    p.subscription_period,
    p.subscription_current_period_end,
    p.subscription_cancel_at_period_end,
    p.trial_started_at,
    p.trial_ends_at
  FROM profiles p
  WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
