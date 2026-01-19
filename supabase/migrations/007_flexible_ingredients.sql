-- Migration: 007_flexible_ingredients.sql
-- Description: Allow user-imported recipes to have ingredients without master ingredient links
-- Date: 2026-01-18

-- Allow NULL for ingredient_id (user-imported ingredients don't link to master list)
ALTER TABLE recipe_ingredients
ALTER COLUMN ingredient_id DROP NOT NULL;

-- Drop the existing foreign key constraint
ALTER TABLE recipe_ingredients
DROP CONSTRAINT IF EXISTS recipe_ingredients_ingredient_id_fkey;

-- Add it back as optional (allows NULL, cascades to SET NULL on delete)
ALTER TABLE recipe_ingredients
ADD CONSTRAINT recipe_ingredients_ingredient_id_fkey
FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE SET NULL;

-- Add comment for documentation
COMMENT ON COLUMN recipe_ingredients.ingredient_id IS 'Reference to master ingredients table. NULL for user-imported ingredients that dont match master list.';
