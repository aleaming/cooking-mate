-- ============================================================
-- FAMILY SHARING FEATURE - TABLES & ENUMS
-- ============================================================
-- Enables households to collaborate on meal planning with
-- role-based permissions and voting on meal proposals.
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

-- Family member roles (hierarchical permissions)
CREATE TYPE family_role AS ENUM (
  'owner',    -- Full control, can delete family
  'admin',    -- Can manage members and invitations
  'voter',    -- Can vote on meal proposals
  'viewer'    -- View-only access to family content
);

-- Invitation status tracking
CREATE TYPE invitation_status AS ENUM (
  'pending',  -- Awaiting response
  'accepted', -- Joined the family
  'expired',  -- Past expiration date
  'revoked'   -- Cancelled by admin/owner
);

-- Meal plan approval status
CREATE TYPE meal_plan_status AS ENUM (
  'proposed',  -- Awaiting votes
  'approved',  -- Passed voting threshold
  'rejected'   -- Did not pass voting
);

-- Vote types for meal proposals
CREATE TYPE vote_type AS ENUM (
  'approve',
  'reject',
  'abstain'
);

-- ============================================================
-- FAMILIES TABLE
-- ============================================================
-- Core family/household group entity

CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'My Family',
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  max_members INTEGER NOT NULL DEFAULT 5 CHECK (max_members >= 1 AND max_members <= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_families_owner_id ON families(owner_id);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_families_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER families_updated_at
  BEFORE UPDATE ON families
  FOR EACH ROW
  EXECUTE FUNCTION update_families_updated_at();

-- ============================================================
-- FAMILY MEMBERS TABLE
-- ============================================================
-- Tracks membership and roles within families

CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role family_role NOT NULL DEFAULT 'viewer',
  nickname TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  CONSTRAINT unique_family_member UNIQUE (family_id, user_id)
);

-- Indexes
CREATE INDEX idx_family_members_family_id ON family_members(family_id);
CREATE INDEX idx_family_members_user_id ON family_members(user_id);
CREATE INDEX idx_family_members_role ON family_members(role);

-- ============================================================
-- FAMILY INVITATIONS TABLE
-- ============================================================
-- Manages pending and historical invitations

CREATE TABLE family_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  inviter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role family_role NOT NULL DEFAULT 'viewer',
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  status invitation_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '7 days',
  accepted_at TIMESTAMPTZ,
  accepted_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Indexes for fast lookups
CREATE INDEX idx_invitations_token ON family_invitations(token);
CREATE INDEX idx_invitations_email ON family_invitations(email);
CREATE INDEX idx_invitations_family_id ON family_invitations(family_id);
CREATE INDEX idx_invitations_status ON family_invitations(status);

-- ============================================================
-- FAMILY MEAL PLANS TABLE
-- ============================================================
-- Shared meal plans for family coordination

CREATE TABLE family_meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  meal_type meal_slot_type NOT NULL,
  recipe_id TEXT NOT NULL,
  servings INTEGER NOT NULL DEFAULT 4 CHECK (servings >= 1 AND servings <= 50),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status meal_plan_status NOT NULL DEFAULT 'proposed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_family_meal_slot UNIQUE (family_id, plan_date, meal_type)
);

-- Indexes
CREATE INDEX idx_family_meal_plans_family_id ON family_meal_plans(family_id);
CREATE INDEX idx_family_meal_plans_date ON family_meal_plans(plan_date);
CREATE INDEX idx_family_meal_plans_status ON family_meal_plans(status);
CREATE INDEX idx_family_meal_plans_created_by ON family_meal_plans(created_by);

-- Update timestamp trigger
CREATE TRIGGER family_meal_plans_updated_at
  BEFORE UPDATE ON family_meal_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_families_updated_at();

-- ============================================================
-- FAMILY MEAL VOTES TABLE
-- ============================================================
-- Tracks votes on meal proposals

CREATE TABLE family_meal_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID NOT NULL REFERENCES family_meal_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote vote_type NOT NULL,
  comment TEXT,
  voted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_vote_per_meal UNIQUE (meal_plan_id, user_id)
);

-- Indexes
CREATE INDEX idx_family_meal_votes_meal_plan_id ON family_meal_votes(meal_plan_id);
CREATE INDEX idx_family_meal_votes_user_id ON family_meal_votes(user_id);

-- ============================================================
-- PROFILE TABLE ADDITIONS
-- ============================================================
-- Add family context columns to existing profiles

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS active_family_id UUID REFERENCES families(id) ON DELETE SET NULL;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS family_mode_enabled BOOLEAN NOT NULL DEFAULT FALSE;

-- Index for active family lookups
CREATE INDEX IF NOT EXISTS idx_profiles_active_family_id ON profiles(active_family_id);

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Check if user is a member of a specific family
CREATE OR REPLACE FUNCTION is_family_member(p_family_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM family_members
    WHERE family_id = p_family_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's role in a family (returns NULL if not a member)
CREATE OR REPLACE FUNCTION get_family_role(p_family_id UUID, p_user_id UUID)
RETURNS family_role AS $$
DECLARE
  v_role family_role;
BEGIN
  SELECT role INTO v_role
  FROM family_members
  WHERE family_id = p_family_id AND user_id = p_user_id;
  RETURN v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can manage family (owner or admin)
CREATE OR REPLACE FUNCTION can_manage_family(p_family_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_role family_role;
BEGIN
  v_role := get_family_role(p_family_id, p_user_id);
  RETURN v_role IN ('owner', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user can vote in family
CREATE OR REPLACE FUNCTION can_vote_in_family(p_family_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_role family_role;
BEGIN
  v_role := get_family_role(p_family_id, p_user_id);
  RETURN v_role IN ('owner', 'admin', 'voter');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get vote counts for a meal plan
CREATE OR REPLACE FUNCTION get_meal_vote_counts(p_meal_plan_id UUID)
RETURNS TABLE (
  approve_count INTEGER,
  reject_count INTEGER,
  abstain_count INTEGER,
  total_votes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(CASE WHEN vote = 'approve' THEN 1 ELSE 0 END)::INTEGER, 0) as approve_count,
    COALESCE(SUM(CASE WHEN vote = 'reject' THEN 1 ELSE 0 END)::INTEGER, 0) as reject_count,
    COALESCE(SUM(CASE WHEN vote = 'abstain' THEN 1 ELSE 0 END)::INTEGER, 0) as abstain_count,
    COUNT(*)::INTEGER as total_votes
  FROM family_meal_votes
  WHERE meal_plan_id = p_meal_plan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Count family members
CREATE OR REPLACE FUNCTION count_family_members(p_family_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*)::INTEGER FROM family_members WHERE family_id = p_family_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
