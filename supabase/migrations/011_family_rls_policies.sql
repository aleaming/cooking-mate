-- ============================================================
-- FAMILY SHARING FEATURE - ROW LEVEL SECURITY POLICIES
-- ============================================================
-- Defines access control for all family-related tables.
-- Uses helper functions from 010_family_tables.sql
-- ============================================================

-- Enable RLS on all family tables
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_meal_votes ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- FAMILIES TABLE POLICIES
-- ============================================================

-- Users can view families they own
CREATE POLICY "Owners can view own families"
  ON families FOR SELECT
  USING (owner_id = auth.uid());

-- Users can view families they are members of
CREATE POLICY "Members can view their families"
  ON families FOR SELECT
  USING (
    id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid()
    )
  );

-- Users can create families
CREATE POLICY "Users can create families"
  ON families FOR INSERT
  WITH CHECK (owner_id = auth.uid());

-- Only owners can update their families
CREATE POLICY "Owners can update own families"
  ON families FOR UPDATE
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid());

-- Only owners can delete their families
CREATE POLICY "Owners can delete own families"
  ON families FOR DELETE
  USING (owner_id = auth.uid());

-- ============================================================
-- FAMILY MEMBERS TABLE POLICIES
-- ============================================================

-- Members can view other members in their families
CREATE POLICY "Members can view family members"
  ON family_members FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid()
    )
  );

-- Owners and admins can add members (via invitation acceptance)
CREATE POLICY "Admins can add family members"
  ON family_members FOR INSERT
  WITH CHECK (
    -- User is creating their own membership (joining via invitation)
    user_id = auth.uid()
    OR
    -- User is an owner/admin of the family
    can_manage_family(family_id, auth.uid())
  );

-- Owners and admins can update member roles/nicknames
CREATE POLICY "Admins can update family members"
  ON family_members FOR UPDATE
  USING (can_manage_family(family_id, auth.uid()))
  WITH CHECK (can_manage_family(family_id, auth.uid()));

-- Members can update their own nickname
CREATE POLICY "Members can update own nickname"
  ON family_members FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Owners and admins can remove members (except owners removing themselves)
CREATE POLICY "Admins can remove family members"
  ON family_members FOR DELETE
  USING (
    -- Admin removing another member
    (can_manage_family(family_id, auth.uid()) AND user_id != (SELECT owner_id FROM families WHERE id = family_id))
    OR
    -- Member removing themselves (leaving family)
    user_id = auth.uid()
  );

-- ============================================================
-- FAMILY INVITATIONS TABLE POLICIES
-- ============================================================

-- Members can view invitations for their families
CREATE POLICY "Members can view family invitations"
  ON family_invitations FOR SELECT
  USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid()
    )
  );

-- Anyone can view their own pending invitation (by email match not possible with RLS)
-- Instead, we'll handle token-based lookups via service role in server actions

-- Owners and admins can create invitations
CREATE POLICY "Admins can create invitations"
  ON family_invitations FOR INSERT
  WITH CHECK (
    can_manage_family(family_id, auth.uid())
    AND inviter_id = auth.uid()
  );

-- Owners and admins can update invitations (revoke, etc.)
CREATE POLICY "Admins can update invitations"
  ON family_invitations FOR UPDATE
  USING (can_manage_family(family_id, auth.uid()))
  WITH CHECK (can_manage_family(family_id, auth.uid()));

-- Owners and admins can delete invitations
CREATE POLICY "Admins can delete invitations"
  ON family_invitations FOR DELETE
  USING (can_manage_family(family_id, auth.uid()));

-- ============================================================
-- FAMILY MEAL PLANS TABLE POLICIES
-- ============================================================

-- Family members can view meal plans
CREATE POLICY "Members can view family meal plans"
  ON family_meal_plans FOR SELECT
  USING (is_family_member(family_id, auth.uid()));

-- Any family member can propose meals
CREATE POLICY "Members can propose meals"
  ON family_meal_plans FOR INSERT
  WITH CHECK (
    is_family_member(family_id, auth.uid())
    AND created_by = auth.uid()
  );

-- Meal proposer or admins can update meal plans
CREATE POLICY "Proposer or admins can update meals"
  ON family_meal_plans FOR UPDATE
  USING (
    created_by = auth.uid()
    OR can_manage_family(family_id, auth.uid())
  )
  WITH CHECK (
    created_by = auth.uid()
    OR can_manage_family(family_id, auth.uid())
  );

-- Meal proposer or admins can delete meal plans
CREATE POLICY "Proposer or admins can delete meals"
  ON family_meal_plans FOR DELETE
  USING (
    created_by = auth.uid()
    OR can_manage_family(family_id, auth.uid())
  );

-- ============================================================
-- FAMILY MEAL VOTES TABLE POLICIES
-- ============================================================

-- Family members can view votes on their family's meals
CREATE POLICY "Members can view meal votes"
  ON family_meal_votes FOR SELECT
  USING (
    meal_plan_id IN (
      SELECT id FROM family_meal_plans
      WHERE is_family_member(family_id, auth.uid())
    )
  );

-- Voters, admins, and owners can cast votes
CREATE POLICY "Voters can cast votes"
  ON family_meal_votes FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND meal_plan_id IN (
      SELECT id FROM family_meal_plans
      WHERE can_vote_in_family(family_id, auth.uid())
    )
  );

-- Users can update their own votes
CREATE POLICY "Users can update own votes"
  ON family_meal_votes FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own votes
CREATE POLICY "Users can delete own votes"
  ON family_meal_votes FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- PROFILES TABLE POLICY UPDATES
-- ============================================================
-- Allow users to update their family-related columns

-- Note: This assumes profiles already has policies from earlier migrations.
-- We just need to ensure the new columns are accessible.
-- The existing "Users can update own profile" policy should cover this.

-- ============================================================
-- SERVICE ROLE BYPASS FOR INVITATION LOOKUPS
-- ============================================================
-- The server actions will use the service role to:
-- 1. Look up invitations by token (for acceptance)
-- 2. Create member records when invitations are accepted
-- 3. Send invitation emails
-- These operations bypass RLS with SECURITY DEFINER functions or service role.

-- Function to accept an invitation (runs with elevated privileges)
CREATE OR REPLACE FUNCTION accept_family_invitation(p_token TEXT, p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_invitation family_invitations%ROWTYPE;
  v_family families%ROWTYPE;
  v_member_count INTEGER;
  v_new_member_id UUID;
BEGIN
  -- Find the invitation
  SELECT * INTO v_invitation
  FROM family_invitations
  WHERE token = p_token AND status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Invalid or expired invitation');
  END IF;

  -- Check if expired
  IF v_invitation.expires_at < NOW() THEN
    UPDATE family_invitations SET status = 'expired' WHERE id = v_invitation.id;
    RETURN json_build_object('error', 'Invitation has expired');
  END IF;

  -- Get family info
  SELECT * INTO v_family FROM families WHERE id = v_invitation.family_id;

  -- Check member count
  v_member_count := count_family_members(v_family.id);
  IF v_member_count >= v_family.max_members THEN
    RETURN json_build_object('error', 'Family has reached maximum members');
  END IF;

  -- Check if user is already a member
  IF is_family_member(v_family.id, p_user_id) THEN
    RETURN json_build_object('error', 'You are already a member of this family');
  END IF;

  -- Create the membership
  INSERT INTO family_members (family_id, user_id, role, invited_by)
  VALUES (v_family.id, p_user_id, v_invitation.role, v_invitation.inviter_id)
  RETURNING id INTO v_new_member_id;

  -- Update invitation status
  UPDATE family_invitations
  SET status = 'accepted', accepted_at = NOW(), accepted_by = p_user_id
  WHERE id = v_invitation.id;

  -- Return success
  RETURN json_build_object(
    'success', true,
    'family_id', v_family.id,
    'family_name', v_family.name,
    'role', v_invitation.role,
    'member_id', v_new_member_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get invitation details by token (for preview before accepting)
CREATE OR REPLACE FUNCTION get_invitation_by_token(p_token TEXT)
RETURNS JSON AS $$
DECLARE
  v_invitation family_invitations%ROWTYPE;
  v_family families%ROWTYPE;
  v_inviter profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_invitation
  FROM family_invitations
  WHERE token = p_token;

  IF NOT FOUND THEN
    RETURN json_build_object('error', 'Invitation not found');
  END IF;

  IF v_invitation.status != 'pending' THEN
    RETURN json_build_object('error', 'Invitation is no longer valid', 'status', v_invitation.status);
  END IF;

  IF v_invitation.expires_at < NOW() THEN
    UPDATE family_invitations SET status = 'expired' WHERE id = v_invitation.id;
    RETURN json_build_object('error', 'Invitation has expired');
  END IF;

  SELECT * INTO v_family FROM families WHERE id = v_invitation.family_id;
  SELECT * INTO v_inviter FROM profiles WHERE id = v_invitation.inviter_id;

  RETURN json_build_object(
    'id', v_invitation.id,
    'family_id', v_family.id,
    'family_name', v_family.name,
    'inviter_name', COALESCE(v_inviter.display_name, v_inviter.email),
    'inviter_email', v_inviter.email,
    'role', v_invitation.role,
    'expires_at', v_invitation.expires_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
