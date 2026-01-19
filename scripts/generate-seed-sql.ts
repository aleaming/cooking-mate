/**
 * Script to generate SQL seed data from TypeScript recipe files.
 * Run with: npx tsx scripts/generate-seed-sql.ts
 */

import { allRecipes } from '../src/data/recipes';
import { writeFileSync } from 'fs';
import { join } from 'path';

function escapeSQL(str: string | undefined | null): string {
  if (str === undefined || str === null) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

function generateIngredientInserts(): string {
  const ingredients = new Map<string, { name: string; category: string }>();

  for (const recipe of allRecipes) {
    for (const ing of recipe.ingredients) {
      // Skip ingredients without an ingredientId (user-imported recipes)
      if (!ing.ingredientId) continue;
      if (!ingredients.has(ing.ingredientId)) {
        ingredients.set(ing.ingredientId, {
          name: ing.name.split(',')[0].trim(), // Get base name without notes
          category: ing.category,
        });
      }
    }
  }

  let sql = '-- ============================================================\n';
  sql += '-- SEED INGREDIENTS\n';
  sql += '-- ============================================================\n\n';

  for (const [id, data] of ingredients) {
    sql += `INSERT INTO ingredients (id, name, category) VALUES (${escapeSQL(id)}, ${escapeSQL(data.name)}, '${data.category}') ON CONFLICT (id) DO NOTHING;\n`;
  }

  return sql + '\n';
}

function generateRecipeInserts(): string {
  let sql = '-- ============================================================\n';
  sql += '-- SEED RECIPES\n';
  sql += '-- ============================================================\n\n';

  for (const recipe of allRecipes) {
    const dietaryTags =
      recipe.dietaryTags.length > 0
        ? `ARRAY[${recipe.dietaryTags.map((t) => `'${t}'`).join(', ')}]::dietary_tag[]`
        : "'{}'::dietary_tag[]";

    const instructionsJson = JSON.stringify(recipe.instructions);
    const nutritionJson = recipe.nutrition ? JSON.stringify(recipe.nutrition) : null;

    sql += `INSERT INTO recipes (
  id, slug, name, description, image_url,
  prep_time_minutes, cook_time_minutes, servings,
  meal_type, cuisine, dietary_tags, difficulty,
  instructions, tips, nutrition,
  is_featured, is_system, is_public, owner_id
) VALUES (
  ${escapeSQL(recipe.id)},
  ${escapeSQL(recipe.slug)},
  ${escapeSQL(recipe.name)},
  ${escapeSQL(recipe.description)},
  ${escapeSQL(recipe.imageUrl)},
  ${recipe.prepTimeMinutes},
  ${recipe.cookTimeMinutes},
  ${recipe.servings},
  '${recipe.mealType}',
  ${escapeSQL(recipe.cuisine)},
  ${dietaryTags},
  '${recipe.difficulty}',
  ${escapeSQL(instructionsJson)},
  ${recipe.tips ? escapeSQL(recipe.tips) : 'NULL'},
  ${nutritionJson ? escapeSQL(nutritionJson) : 'NULL'},
  ${recipe.isFeatured},
  TRUE,
  TRUE,
  NULL
) ON CONFLICT (id) DO NOTHING;\n\n`;
  }

  return sql;
}

function generateRecipeIngredientInserts(): string {
  let sql = '-- ============================================================\n';
  sql += '-- SEED RECIPE INGREDIENTS\n';
  sql += '-- ============================================================\n\n';

  for (const recipe of allRecipes) {
    for (let i = 0; i < recipe.ingredients.length; i++) {
      const ing = recipe.ingredients[i];
      sql += `INSERT INTO recipe_ingredients (
  recipe_id, ingredient_id, display_name, category,
  quantity, unit, preparation, notes, sort_order
) VALUES (
  ${escapeSQL(recipe.id)},
  ${escapeSQL(ing.ingredientId)},
  ${escapeSQL(ing.name)},
  '${ing.category}',
  ${ing.quantity !== null ? ing.quantity : 'NULL'},
  ${ing.unit ? escapeSQL(ing.unit) : 'NULL'},
  ${ing.preparation ? escapeSQL(ing.preparation) : 'NULL'},
  ${ing.notes ? escapeSQL(ing.notes) : 'NULL'},
  ${i}
);\n`;
    }
    sql += '\n';
  }

  return sql;
}

function main() {
  console.log(`Found ${allRecipes.length} recipes to seed.`);

  const sql = [
    '-- Supabase Seed Data',
    '-- Generated from TypeScript recipe files',
    `-- Generated at: ${new Date().toISOString()}`,
    '',
    generateIngredientInserts(),
    generateRecipeInserts(),
    generateRecipeIngredientInserts(),
  ].join('\n');

  const outputPath = join(__dirname, '../supabase/migrations/004_seed_recipes.sql');
  writeFileSync(outputPath, sql, 'utf-8');

  console.log(`Seed SQL written to: ${outputPath}`);
}

main();
