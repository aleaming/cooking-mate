-- ============================================================
-- FIX: Add missing INSERT policy for profiles table
-- ============================================================
-- This policy was missing from 002_rls_policies.sql, causing
-- "Database error saving new user" during signup because the
-- handle_new_user() trigger couldn't insert into profiles.
-- ============================================================

-- Allow profile creation during signup (triggered by handle_new_user function)
CREATE POLICY "Enable profile creation during signup"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
