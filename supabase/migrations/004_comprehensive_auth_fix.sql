-- ============================================================
-- COMPREHENSIVE AUTH FIX
-- ============================================================
-- This migration fixes the "Database error saving new user" issue
-- by ensuring all auth-related objects exist and are configured correctly.
-- Safe to run multiple times (idempotent).
-- ============================================================

-- Step 1: Ensure profiles table exists
-- (Will do nothing if table already exists)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Step 2: Enable RLS on profiles (safe to run multiple times)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 3: Drop and recreate the trigger function with proper settings
-- The key fix: Set the search_path to prevent search_path injection attacks
-- and ensure the function runs with elevated privileges
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent errors if profile already exists
  RETURN NEW;
END;
$$;

-- Step 4: Grant necessary permissions to the function
-- This ensures the function can be executed during auth operations
ALTER FUNCTION handle_new_user() OWNER TO postgres;

-- Step 5: Create the trigger (will fail silently if it already exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Step 6: Create RLS policies (drop first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable profile creation during signup" ON profiles;

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- CRITICAL FIX: Allow profile creation during signup
-- This policy allows the trigger to create profiles for new users
CREATE POLICY "Enable profile creation during signup"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Step 7: Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Add updated_at trigger to profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- VERIFICATION: Run this to confirm the fix worked
-- ============================================================
-- SELECT
--   (SELECT COUNT(*) FROM pg_tables WHERE tablename = 'profiles') as profiles_table_exists,
--   (SELECT COUNT(*) FROM pg_trigger WHERE tgname = 'on_auth_user_created') as auth_trigger_exists,
--   (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles' AND policyname LIKE '%signup%') as insert_policy_exists;
