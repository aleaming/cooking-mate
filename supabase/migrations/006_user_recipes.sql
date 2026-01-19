-- Migration: 006_user_recipes.sql
-- Description: Add support for user-created recipes with multiple photos
-- Date: 2026-01-18

-- Create source_type enum
CREATE TYPE source_type AS ENUM ('manual', 'markdown', 'url_import');

-- Add new columns to recipes table
ALTER TABLE recipes
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS source_type source_type DEFAULT 'manual';

-- Create recipe_photos table for multiple photos per recipe
CREATE TABLE IF NOT EXISTS recipe_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id TEXT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  standard_url TEXT,
  is_primary BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure only one primary photo per recipe
  CONSTRAINT unique_primary_per_recipe EXCLUDE USING btree (recipe_id WITH =) WHERE (is_primary = true)
);

-- Create indexes for recipe_photos
CREATE INDEX IF NOT EXISTS idx_recipe_photos_recipe_id ON recipe_photos(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_photos_primary ON recipe_photos(recipe_id) WHERE is_primary = true;

-- RLS policies for recipe_photos

-- Enable RLS
ALTER TABLE recipe_photos ENABLE ROW LEVEL SECURITY;

-- Allow reading photos for visible recipes (system or user's own)
CREATE POLICY "Recipe photos readable for visible recipes"
ON recipe_photos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM recipes r
    WHERE r.id = recipe_photos.recipe_id
    AND (
      r.is_system = true
      OR r.is_public = true
      OR r.owner_id = auth.uid()
    )
  )
);

-- Allow users to insert photos for their own recipes
CREATE POLICY "Users can add photos to their recipes"
ON recipe_photos FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM recipes r
    WHERE r.id = recipe_photos.recipe_id
    AND r.owner_id = auth.uid()
    AND r.is_system = false
  )
);

-- Allow users to update photos on their own recipes
CREATE POLICY "Users can update photos on their recipes"
ON recipe_photos FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM recipes r
    WHERE r.id = recipe_photos.recipe_id
    AND r.owner_id = auth.uid()
    AND r.is_system = false
  )
);

-- Allow users to delete photos from their own recipes
CREATE POLICY "Users can delete photos from their recipes"
ON recipe_photos FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM recipes r
    WHERE r.id = recipe_photos.recipe_id
    AND r.owner_id = auth.uid()
    AND r.is_system = false
  )
);

-- Function to set primary photo (ensures only one primary per recipe)
CREATE OR REPLACE FUNCTION set_primary_photo(p_photo_id UUID, p_recipe_id TEXT)
RETURNS void AS $$
BEGIN
  -- Remove primary from all photos of this recipe
  UPDATE recipe_photos
  SET is_primary = false
  WHERE recipe_id = p_recipe_id;

  -- Set the specified photo as primary
  UPDATE recipe_photos
  SET is_primary = true
  WHERE id = p_photo_id AND recipe_id = p_recipe_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get recipe with photos
CREATE OR REPLACE FUNCTION get_recipe_with_photos(p_recipe_id TEXT)
RETURNS TABLE (
  recipe JSONB,
  photos JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    to_jsonb(r.*) as recipe,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', rp.id,
          'url', rp.url,
          'thumbnail_url', rp.thumbnail_url,
          'standard_url', rp.standard_url,
          'is_primary', rp.is_primary,
          'sort_order', rp.sort_order
        ) ORDER BY rp.sort_order
      ) FILTER (WHERE rp.id IS NOT NULL),
      '[]'::jsonb
    ) as photos
  FROM recipes r
  LEFT JOIN recipe_photos rp ON r.id = rp.recipe_id
  WHERE r.id = p_recipe_id
  GROUP BY r.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's recipes with primary photos
CREATE OR REPLACE FUNCTION get_user_recipes(p_user_id UUID)
RETURNS TABLE (
  id TEXT,
  slug TEXT,
  name TEXT,
  description TEXT,
  image_url TEXT,
  primary_photo_url TEXT,
  source_type source_type,
  source_url TEXT,
  prep_time_minutes INTEGER,
  cook_time_minutes INTEGER,
  total_time_minutes INTEGER,
  servings INTEGER,
  meal_type meal_type,
  difficulty difficulty_level,
  dietary_tags dietary_tag[],
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.slug,
    r.name,
    r.description,
    r.image_url,
    rp.url as primary_photo_url,
    r.source_type,
    r.source_url,
    r.prep_time_minutes,
    r.cook_time_minutes,
    r.total_time_minutes,
    r.servings,
    r.meal_type,
    r.difficulty,
    r.dietary_tags,
    r.created_at,
    r.updated_at
  FROM recipes r
  LEFT JOIN recipe_photos rp ON r.id = rp.recipe_id AND rp.is_primary = true
  WHERE r.owner_id = p_user_id
  AND r.is_system = false
  ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update recipes policy to allow users to create their own recipes
CREATE POLICY "Users can insert their own recipes"
ON recipes FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
  AND owner_id = auth.uid()
  AND is_system = false
);

-- Update policy to allow users to update their own non-system recipes
CREATE POLICY "Users can update their own recipes"
ON recipes FOR UPDATE
USING (
  owner_id = auth.uid()
  AND is_system = false
);

-- Update policy to allow users to delete their own non-system recipes
CREATE POLICY "Users can delete their own recipes"
ON recipes FOR DELETE
USING (
  owner_id = auth.uid()
  AND is_system = false
);
