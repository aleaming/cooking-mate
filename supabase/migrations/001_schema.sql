-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack', 'any');
CREATE TYPE meal_slot_type AS ENUM ('breakfast', 'lunch', 'dinner');
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE dietary_tag AS ENUM (
  'vegetarian', 'vegan', 'gluten-free', 'dairy-free',
  'nut-free', 'low-carb', 'high-protein'
);
CREATE TYPE ingredient_category AS ENUM (
  'produce', 'dairy', 'protein', 'grains', 'pantry',
  'oils-vinegars', 'herbs-spices', 'nuts-seeds', 'seafood',
  'beverages', 'other'
);

-- ============================================================
-- PROFILES (extends Supabase Auth)
-- ============================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- MASTER INGREDIENTS
-- ============================================================

CREATE TABLE ingredients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category ingredient_category NOT NULL,
  default_unit TEXT,
  aliases TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_ingredients_category ON ingredients(category);
CREATE INDEX idx_ingredients_name ON ingredients USING GIN (to_tsvector('english', name));

-- ============================================================
-- RECIPES
-- ============================================================

CREATE TABLE recipes (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,

  -- Timing
  prep_time_minutes INTEGER NOT NULL DEFAULT 0,
  cook_time_minutes INTEGER NOT NULL DEFAULT 0,
  total_time_minutes INTEGER GENERATED ALWAYS AS (prep_time_minutes + cook_time_minutes) STORED,

  -- Serving
  servings INTEGER NOT NULL DEFAULT 1,

  -- Categorization
  meal_type meal_type NOT NULL,
  cuisine TEXT DEFAULT 'Mediterranean',
  dietary_tags dietary_tag[] DEFAULT '{}',
  difficulty difficulty_level NOT NULL DEFAULT 'easy',

  -- Content (instructions stored as JSONB - read-only, always fetched together)
  instructions JSONB NOT NULL DEFAULT '[]'::JSONB,
  tips TEXT,

  -- Nutrition (optional JSONB)
  nutrition JSONB,

  -- Ownership & Visibility
  owner_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_public BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_system BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_recipes_meal_type ON recipes(meal_type);
CREATE INDEX idx_recipes_owner ON recipes(owner_id) WHERE owner_id IS NOT NULL;
CREATE INDEX idx_recipes_featured ON recipes(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_recipes_dietary ON recipes USING GIN (dietary_tags);
CREATE INDEX idx_recipes_name_search ON recipes USING GIN (to_tsvector('english', name || ' ' || description));

-- ============================================================
-- RECIPE INGREDIENTS (Junction table, normalized for aggregation)
-- ============================================================

CREATE TABLE recipe_ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id TEXT NOT NULL REFERENCES ingredients(id),

  -- Display data (denormalized for convenience)
  display_name TEXT NOT NULL,
  category ingredient_category NOT NULL,

  -- Quantity
  quantity DECIMAL(10,3),
  unit TEXT,
  preparation TEXT,
  notes TEXT,

  -- Ordering
  sort_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);
CREATE INDEX idx_recipe_ingredients_ingredient ON recipe_ingredients(ingredient_id);

-- ============================================================
-- MEAL PLANS (User's calendar)
-- ============================================================

CREATE TABLE meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Date and meal type
  plan_date DATE NOT NULL,
  meal_type meal_slot_type NOT NULL,

  -- Recipe reference
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  servings INTEGER NOT NULL DEFAULT 1,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Unique constraint: one recipe per meal slot per day per user
  CONSTRAINT unique_meal_slot UNIQUE (user_id, plan_date, meal_type)
);

CREATE INDEX idx_meal_plans_user_date ON meal_plans(user_id, plan_date);
CREATE INDEX idx_meal_plans_date_range ON meal_plans(user_id, plan_date DESC);

-- ============================================================
-- COOKING SESSIONS (Cooking log / history)
-- ============================================================

CREATE TABLE cooking_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,

  -- Optional link to meal plan
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE SET NULL,

  -- Cooking details
  cooked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  actual_servings INTEGER NOT NULL,
  scale_factor DECIMAL(4,2) NOT NULL DEFAULT 1.0,

  -- User feedback
  rating SMALLINT CHECK (rating >= 1 AND rating <= 5),
  notes TEXT DEFAULT '',
  photo_url TEXT,

  -- Cooking metrics (optional)
  prep_time_actual INTEGER,
  cook_time_actual INTEGER,
  meal_type meal_slot_type,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_cooking_sessions_user ON cooking_sessions(user_id);
CREATE INDEX idx_cooking_sessions_recipe ON cooking_sessions(user_id, recipe_id);
CREATE INDEX idx_cooking_sessions_date ON cooking_sessions(user_id, cooked_at DESC);
CREATE INDEX idx_cooking_sessions_meal_plan ON cooking_sessions(meal_plan_id) WHERE meal_plan_id IS NOT NULL;

-- ============================================================
-- SHOPPING PREFERENCES (User settings for shopping list)
-- ============================================================

CREATE TABLE shopping_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,

  -- Checked items stored as JSONB array of ingredient keys
  checked_items JSONB DEFAULT '[]'::JSONB,

  -- Date range preferences
  default_range_days INTEGER DEFAULT 7,

  -- Sorting/filtering preferences
  sort_by TEXT DEFAULT 'category',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- UPDATED_AT TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_recipes_updated_at
  BEFORE UPDATE ON recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_meal_plans_updated_at
  BEFORE UPDATE ON meal_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_cooking_sessions_updated_at
  BEFORE UPDATE ON cooking_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_shopping_preferences_updated_at
  BEFORE UPDATE ON shopping_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
