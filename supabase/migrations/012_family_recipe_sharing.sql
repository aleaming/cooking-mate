-- ============================================================
-- FAMILY RECIPE SHARING
-- ============================================================
-- Enables family members to view and use each other's recipes
-- in the family meal plan calendar.
--
-- 1. RLS policies on recipes, recipe_ingredients, recipe_photos
--    so family members can SELECT each other's recipes.
-- 2. SECURITY DEFINER function get_family_recipes() for efficient
--    batch fetching with owner attribution.
-- ============================================================

-- ------------------------------------------------------------
-- 1. RLS POLICIES
-- ------------------------------------------------------------

-- Family members can read each other's recipes
CREATE POLICY "Family members can read family recipes"
  ON recipes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM family_members fm1
      JOIN family_members fm2 ON fm1.family_id = fm2.family_id
      WHERE fm1.user_id = auth.uid()
        AND fm2.user_id = recipes.owner_id
    )
  );

-- Family members can read recipe_ingredients for family recipes
CREATE POLICY "Family members can read family recipe ingredients"
  ON recipe_ingredients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes r
      JOIN family_members fm1 ON fm1.user_id = auth.uid()
      JOIN family_members fm2 ON fm2.user_id = r.owner_id
        AND fm2.family_id = fm1.family_id
      WHERE r.id = recipe_ingredients.recipe_id
    )
  );

-- Family members can read recipe_photos for family recipes
CREATE POLICY "Family members can read family recipe photos"
  ON recipe_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes r
      JOIN family_members fm1 ON fm1.user_id = auth.uid()
      JOIN family_members fm2 ON fm2.user_id = r.owner_id
        AND fm2.family_id = fm1.family_id
      WHERE r.id = recipe_photos.recipe_id
    )
  );

-- ------------------------------------------------------------
-- 2. SECURITY DEFINER FUNCTION
-- ------------------------------------------------------------
-- Returns all recipes from family members (excluding caller's own)
-- with owner display name for attribution.

CREATE OR REPLACE FUNCTION get_family_recipes(p_family_id UUID)
RETURNS TABLE (
  recipe_id TEXT,
  recipe_data JSONB,
  owner_id UUID,
  owner_display_name TEXT,
  owner_email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is a member of this family
  IF NOT is_family_member(p_family_id, auth.uid()) THEN
    RAISE EXCEPTION 'Not a member of this family';
  END IF;

  RETURN QUERY
  SELECT
    r.id AS recipe_id,
    to_jsonb(r) AS recipe_data,
    r.owner_id,
    COALESCE(p.display_name, split_part(p.email, '@', 1)) AS owner_display_name,
    p.email AS owner_email
  FROM recipes r
  JOIN family_members fm ON fm.user_id = r.owner_id
    AND fm.family_id = p_family_id
  JOIN profiles p ON p.id = r.owner_id
  WHERE r.owner_id != auth.uid()
    AND r.owner_id IS NOT NULL
    AND r.is_system = false;
END;
$$;
