'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { MealType, Difficulty, DietaryTag } from '@/types';

export interface RecipeFilters {
  mealTypes?: MealType[];
  dietaryTags?: DietaryTag[];
  difficulty?: Difficulty;
  query?: string;
  limit?: number;
}

export interface RecipeWithIngredients {
  id: string;
  slug: string;
  name: string;
  description: string;
  image_url: string | null;
  prep_time_minutes: number;
  cook_time_minutes: number;
  total_time_minutes: number;
  servings: number;
  meal_type: MealType;
  cuisine: string;
  dietary_tags: DietaryTag[];
  difficulty: Difficulty;
  instructions: Array<{ step: number; text: string; duration?: number; tip?: string }>;
  tips: string | null;
  nutrition: {
    calories: number;
    protein: number;
    carbohydrates: number;
    fat: number;
    fiber: number;
    sodium?: number;
    sugar?: number;
  } | null;
  is_featured: boolean;
  is_system: boolean;
  is_public: boolean;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
  ingredients: Array<{
    id: string;
    ingredient_id: string;
    display_name: string;
    category: string;
    quantity: number | null;
    unit: string | null;
    preparation: string | null;
    notes: string | null;
    sort_order: number;
  }>;
}

/**
 * Get all recipes with optional filtering
 */
export async function getRecipes(filters?: RecipeFilters) {
  const supabase = await createServerSupabaseClient();

  let query = supabase
    .from('recipes')
    .select(`
      *,
      ingredients:recipe_ingredients(
        id, ingredient_id, display_name, category,
        quantity, unit, preparation, notes, sort_order
      )
    `)
    .order('is_featured', { ascending: false })
    .order('name', { ascending: true });

  // Apply filters
  if (filters?.mealTypes && filters.mealTypes.length > 0) {
    query = query.in('meal_type', filters.mealTypes);
  }

  if (filters?.dietaryTags && filters.dietaryTags.length > 0) {
    query = query.contains('dietary_tags', filters.dietaryTags);
  }

  if (filters?.difficulty) {
    query = query.eq('difficulty', filters.difficulty);
  }

  if (filters?.query) {
    query = query.or(`name.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching recipes:', error);
    return { data: [], error: error.message };
  }

  // Sort ingredients by sort_order
  const sortedData = (data || []).map((recipe) => ({
    ...recipe,
    ingredients: (recipe.ingredients || []).sort(
      (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
    ),
  }));

  return { data: sortedData as RecipeWithIngredients[], error: null };
}

/**
 * Get a single recipe by ID
 */
export async function getRecipeById(id: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      ingredients:recipe_ingredients(
        id, ingredient_id, display_name, category,
        quantity, unit, preparation, notes, sort_order
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching recipe:', error);
    return { data: null, error: error.message };
  }

  // Sort ingredients by sort_order
  const sortedData = {
    ...data,
    ingredients: (data.ingredients || []).sort(
      (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
    ),
  };

  return { data: sortedData as RecipeWithIngredients, error: null };
}

/**
 * Get a single recipe by slug
 */
export async function getRecipeBySlug(slug: string) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      ingredients:recipe_ingredients(
        id, ingredient_id, display_name, category,
        quantity, unit, preparation, notes, sort_order
      )
    `)
    .eq('slug', slug)
    .single();

  if (error) {
    console.error('Error fetching recipe:', error);
    return { data: null, error: error.message };
  }

  // Sort ingredients by sort_order
  const sortedData = {
    ...data,
    ingredients: (data.ingredients || []).sort(
      (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order
    ),
  };

  return { data: sortedData as RecipeWithIngredients, error: null };
}

/**
 * Get featured recipes
 */
export async function getFeaturedRecipes(limit: number = 6) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      ingredients:recipe_ingredients(
        id, ingredient_id, display_name, category,
        quantity, unit, preparation, notes, sort_order
      )
    `)
    .eq('is_featured', true)
    .limit(limit);

  if (error) {
    console.error('Error fetching featured recipes:', error);
    return { data: [], error: error.message };
  }

  return { data: data as RecipeWithIngredients[], error: null };
}

/**
 * Get recipes by meal type
 */
export async function getRecipesByMealType(mealType: MealType) {
  return getRecipes({ mealTypes: [mealType] });
}

/**
 * Search recipes using the database function
 */
export async function searchRecipes(
  query: string,
  options?: {
    mealTypes?: MealType[];
    dietaryTags?: DietaryTag[];
    difficulty?: Difficulty;
    limit?: number;
  }
) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.rpc('search_recipes', {
    p_query: query || '',
    p_meal_types: options?.mealTypes || null,
    p_dietary_tags: options?.dietaryTags || null,
    p_difficulty: options?.difficulty || null,
    p_limit: options?.limit || 50,
  });

  if (error) {
    console.error('Error searching recipes:', error);
    return { data: [], error: error.message };
  }

  return { data: data || [], error: null };
}

/**
 * Find recipes by available ingredients (pantry finder)
 */
export async function findRecipesByIngredients(ingredientIds: string[], limit: number = 20) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.rpc('find_recipes_by_ingredients', {
    p_ingredient_ids: ingredientIds,
    p_limit: limit,
  });

  if (error) {
    console.error('Error finding recipes by ingredients:', error);
    return { data: [], error: error.message };
  }

  return { data: data || [], error: null };
}

/**
 * Get all unique ingredients for pantry finder
 */
export async function getAllIngredients() {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from('ingredients')
    .select('id, name, category')
    .order('category')
    .order('name');

  if (error) {
    console.error('Error fetching ingredients:', error);
    return { data: [], error: error.message };
  }

  return { data: data || [], error: null };
}
