-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopping_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow profile creation during signup (triggered by handle_new_user function)
CREATE POLICY "Enable profile creation during signup"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- INGREDIENTS POLICIES (Public read)
-- ============================================================

-- Anyone can read ingredients (needed for recipe display)
CREATE POLICY "Ingredients are publicly readable"
  ON ingredients FOR SELECT
  USING (true);

-- ============================================================
-- RECIPES POLICIES
-- ============================================================

-- Anyone can read system recipes (is_system = true OR owner_id IS NULL)
-- Users can read their own recipes
-- Users can read public recipes from others
CREATE POLICY "Recipes are readable based on ownership and visibility"
  ON recipes FOR SELECT
  USING (
    is_system = TRUE
    OR owner_id IS NULL
    OR owner_id = auth.uid()
    OR is_public = TRUE
  );

-- Users can create their own recipes
CREATE POLICY "Users can create own recipes"
  ON recipes FOR INSERT
  WITH CHECK (
    owner_id = auth.uid()
    AND is_system = FALSE
  );

-- Users can update their own recipes
CREATE POLICY "Users can update own recipes"
  ON recipes FOR UPDATE
  USING (owner_id = auth.uid() AND is_system = FALSE)
  WITH CHECK (owner_id = auth.uid() AND is_system = FALSE);

-- Users can delete their own recipes
CREATE POLICY "Users can delete own recipes"
  ON recipes FOR DELETE
  USING (owner_id = auth.uid() AND is_system = FALSE);

-- ============================================================
-- RECIPE INGREDIENTS POLICIES
-- ============================================================

-- Recipe ingredients follow recipe visibility
CREATE POLICY "Recipe ingredients follow recipe visibility"
  ON recipe_ingredients FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM recipes r
      WHERE r.id = recipe_id
      AND (
        r.is_system = TRUE
        OR r.owner_id IS NULL
        OR r.owner_id = auth.uid()
        OR r.is_public = TRUE
      )
    )
  );

-- Users can manage ingredients for their own recipes
CREATE POLICY "Users can insert recipe ingredients for own recipes"
  ON recipe_ingredients FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM recipes r
      WHERE r.id = recipe_id
      AND r.owner_id = auth.uid()
      AND r.is_system = FALSE
    )
  );

CREATE POLICY "Users can update recipe ingredients for own recipes"
  ON recipe_ingredients FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM recipes r
      WHERE r.id = recipe_id
      AND r.owner_id = auth.uid()
      AND r.is_system = FALSE
    )
  );

CREATE POLICY "Users can delete recipe ingredients for own recipes"
  ON recipe_ingredients FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM recipes r
      WHERE r.id = recipe_id
      AND r.owner_id = auth.uid()
      AND r.is_system = FALSE
    )
  );

-- ============================================================
-- MEAL PLANS POLICIES
-- ============================================================

-- Users can only see their own meal plans
CREATE POLICY "Users can view own meal plans"
  ON meal_plans FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own meal plans
CREATE POLICY "Users can create own meal plans"
  ON meal_plans FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own meal plans
CREATE POLICY "Users can update own meal plans"
  ON meal_plans FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own meal plans
CREATE POLICY "Users can delete own meal plans"
  ON meal_plans FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- COOKING SESSIONS POLICIES
-- ============================================================

-- Users can only see their own cooking sessions
CREATE POLICY "Users can view own cooking sessions"
  ON cooking_sessions FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own cooking sessions
CREATE POLICY "Users can create own cooking sessions"
  ON cooking_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own cooking sessions
CREATE POLICY "Users can update own cooking sessions"
  ON cooking_sessions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own cooking sessions
CREATE POLICY "Users can delete own cooking sessions"
  ON cooking_sessions FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================
-- SHOPPING PREFERENCES POLICIES
-- ============================================================

-- Users can only see their own shopping preferences
CREATE POLICY "Users can view own shopping preferences"
  ON shopping_preferences FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own shopping preferences
CREATE POLICY "Users can create own shopping preferences"
  ON shopping_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own shopping preferences
CREATE POLICY "Users can update own shopping preferences"
  ON shopping_preferences FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
