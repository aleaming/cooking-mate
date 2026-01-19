-- ============================================================
-- SHOPPING LIST AGGREGATION FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION get_shopping_list(
  p_user_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  ingredient_id TEXT,
  ingredient_name TEXT,
  category ingredient_category,
  total_quantity DECIMAL,
  unit TEXT,
  recipe_ids TEXT[],
  recipe_names TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ri.ingredient_id,
    ri.display_name AS ingredient_name,
    ri.category,
    SUM(COALESCE(ri.quantity, 0) * mp.servings)::DECIMAL AS total_quantity,
    ri.unit,
    ARRAY_AGG(DISTINCT ri.recipe_id) AS recipe_ids,
    ARRAY_AGG(DISTINCT r.name) AS recipe_names
  FROM meal_plans mp
  JOIN recipe_ingredients ri ON mp.recipe_id = ri.recipe_id
  JOIN recipes r ON r.id = ri.recipe_id
  WHERE mp.user_id = p_user_id
    AND mp.plan_date BETWEEN p_start_date AND p_end_date
  GROUP BY ri.ingredient_id, ri.display_name, ri.category, ri.unit
  ORDER BY ri.category, ri.display_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- RECIPE STATS FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION get_recipe_stats(
  p_user_id UUID,
  p_recipe_id TEXT
)
RETURNS TABLE (
  times_cooked BIGINT,
  average_rating DECIMAL,
  last_cooked TIMESTAMPTZ,
  total_servings_made BIGINT,
  favorite_scale DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS times_cooked,
    ROUND(AVG(cs.rating)::DECIMAL, 1) AS average_rating,
    MAX(cs.cooked_at) AS last_cooked,
    SUM(cs.actual_servings)::BIGINT AS total_servings_made,
    MODE() WITHIN GROUP (ORDER BY cs.scale_factor) AS favorite_scale
  FROM cooking_sessions cs
  WHERE cs.user_id = p_user_id AND cs.recipe_id = p_recipe_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- MONTHLY COOKING STATS FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION get_monthly_stats(
  p_user_id UUID,
  p_year INTEGER,
  p_month INTEGER
)
RETURNS TABLE (
  recipes_cooked BIGINT,
  unique_recipes BIGINT,
  total_servings BIGINT,
  average_rating DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS recipes_cooked,
    COUNT(DISTINCT cs.recipe_id)::BIGINT AS unique_recipes,
    SUM(cs.actual_servings)::BIGINT AS total_servings,
    ROUND(AVG(cs.rating)::DECIMAL, 1) AS average_rating
  FROM cooking_sessions cs
  WHERE cs.user_id = p_user_id
    AND EXTRACT(YEAR FROM cs.cooked_at) = p_year
    AND EXTRACT(MONTH FROM cs.cooked_at) = p_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- CHECK IF MEAL IS LOGGED FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION is_meal_logged(
  p_user_id UUID,
  p_meal_plan_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM cooking_sessions
    WHERE user_id = p_user_id AND meal_plan_id = p_meal_plan_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- GET RECIPES BY INGREDIENTS (Pantry Finder)
-- ============================================================

CREATE OR REPLACE FUNCTION find_recipes_by_ingredients(
  p_ingredient_ids TEXT[],
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  recipe_id TEXT,
  recipe_name TEXT,
  recipe_slug TEXT,
  image_url TEXT,
  total_time_minutes INTEGER,
  difficulty difficulty_level,
  meal_type meal_type,
  total_ingredients INTEGER,
  matched_ingredients INTEGER,
  match_percentage DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH recipe_matches AS (
    SELECT
      r.id,
      r.name,
      r.slug,
      r.image_url,
      r.total_time_minutes,
      r.difficulty,
      r.meal_type,
      COUNT(ri.id)::INTEGER AS total_ingredients,
      COUNT(CASE WHEN ri.ingredient_id = ANY(p_ingredient_ids) THEN 1 END)::INTEGER AS matched_ingredients
    FROM recipes r
    JOIN recipe_ingredients ri ON r.id = ri.recipe_id
    WHERE r.is_system = TRUE OR r.is_public = TRUE
    GROUP BY r.id
  )
  SELECT
    rm.id AS recipe_id,
    rm.name AS recipe_name,
    rm.slug AS recipe_slug,
    rm.image_url,
    rm.total_time_minutes,
    rm.difficulty,
    rm.meal_type,
    rm.total_ingredients,
    rm.matched_ingredients,
    ROUND((rm.matched_ingredients::DECIMAL / rm.total_ingredients) * 100, 1) AS match_percentage
  FROM recipe_matches rm
  WHERE rm.matched_ingredients > 0
  ORDER BY match_percentage DESC, rm.matched_ingredients DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- SEARCH RECIPES FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION search_recipes(
  p_query TEXT,
  p_meal_types meal_type[] DEFAULT NULL,
  p_dietary_tags dietary_tag[] DEFAULT NULL,
  p_difficulty difficulty_level DEFAULT NULL,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id TEXT,
  slug TEXT,
  name TEXT,
  description TEXT,
  image_url TEXT,
  total_time_minutes INTEGER,
  servings INTEGER,
  meal_type meal_type,
  difficulty difficulty_level,
  dietary_tags dietary_tag[],
  is_featured BOOLEAN,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.slug,
    r.name,
    r.description,
    r.image_url,
    r.total_time_minutes,
    r.servings,
    r.meal_type,
    r.difficulty,
    r.dietary_tags,
    r.is_featured,
    ts_rank(
      to_tsvector('english', r.name || ' ' || r.description),
      plainto_tsquery('english', p_query)
    ) AS relevance
  FROM recipes r
  WHERE
    (r.is_system = TRUE OR r.is_public = TRUE)
    AND (
      p_query IS NULL
      OR p_query = ''
      OR to_tsvector('english', r.name || ' ' || r.description) @@ plainto_tsquery('english', p_query)
    )
    AND (p_meal_types IS NULL OR r.meal_type = ANY(p_meal_types))
    AND (p_dietary_tags IS NULL OR r.dietary_tags @> p_dietary_tags)
    AND (p_difficulty IS NULL OR r.difficulty = p_difficulty)
  ORDER BY
    r.is_featured DESC,
    relevance DESC,
    r.name ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
