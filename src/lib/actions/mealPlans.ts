'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { MealSlotType } from '@/types';

export interface MealPlanEntry {
  id: string;
  user_id: string;
  plan_date: string;
  meal_type: MealSlotType;
  recipe_id: string;
  servings: number;
  created_at: string;
  updated_at: string;
  recipe?: {
    id: string;
    slug: string;
    name: string;
    description: string;
    image_url: string | null;
    total_time_minutes: number;
    servings: number;
    meal_type: string;
    difficulty: string;
    dietary_tags: string[];
    is_featured: boolean;
    ingredients?: Array<{
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
  };
}

/**
 * Add or update a meal in the plan
 * Uses UPSERT to handle the unique constraint on (user_id, plan_date, meal_type)
 */
export async function addMealToPlan(
  planDate: string,
  mealType: MealSlotType,
  recipeId: string,
  servings: number = 1
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('meal_plans')
    .upsert(
      {
        user_id: user.id,
        plan_date: planDate,
        meal_type: mealType,
        recipe_id: recipeId,
        servings,
      },
      {
        onConflict: 'user_id,plan_date,meal_type',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Error adding meal to plan:', error);
    return { data: null, error: error.message };
  }

  revalidatePath('/calendar');
  return { data, error: null };
}

/**
 * Remove a meal from the plan
 */
export async function removeMealFromPlan(planDate: string, mealType: MealSlotType) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('meal_plans')
    .delete()
    .eq('user_id', user.id)
    .eq('plan_date', planDate)
    .eq('meal_type', mealType);

  if (error) {
    console.error('Error removing meal from plan:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/calendar');
  return { success: true, error: null };
}

/**
 * Update servings for a meal
 */
export async function updateMealServings(planDate: string, mealType: MealSlotType, servings: number) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('meal_plans')
    .update({ servings })
    .eq('user_id', user.id)
    .eq('plan_date', planDate)
    .eq('meal_type', mealType)
    .select()
    .single();

  if (error) {
    console.error('Error updating meal servings:', error);
    return { data: null, error: error.message };
  }

  revalidatePath('/calendar');
  return { data, error: null };
}

/**
 * Get a single meal for a date and meal type
 */
export async function getMeal(planDate: string, mealType: MealSlotType) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('meal_plans')
    .select(
      `
      *,
      recipe:recipes(
        id, slug, name, description, image_url, total_time_minutes,
        servings, meal_type, difficulty, dietary_tags, is_featured,
        ingredients:recipe_ingredients(
          id, ingredient_id, display_name, category,
          quantity, unit, preparation, notes, sort_order
        )
      )
    `
    )
    .eq('user_id', user.id)
    .eq('plan_date', planDate)
    .eq('meal_type', mealType)
    .maybeSingle();

  if (error) {
    console.error('Error getting meal:', error);
    return { data: null, error: error.message };
  }

  return { data: data as MealPlanEntry | null, error: null };
}

/**
 * Get all meals for a specific date
 */
export async function getMealsForDate(planDate: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: { breakfast: null, lunch: null, dinner: null }, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('meal_plans')
    .select(
      `
      *,
      recipe:recipes(
        id, slug, name, description, image_url, total_time_minutes,
        servings, meal_type, difficulty, dietary_tags, is_featured
      )
    `
    )
    .eq('user_id', user.id)
    .eq('plan_date', planDate);

  if (error) {
    console.error('Error getting meals for date:', error);
    return { data: { breakfast: null, lunch: null, dinner: null }, error: error.message };
  }

  const meals = {
    breakfast: (data || []).find((m) => m.meal_type === 'breakfast') as MealPlanEntry | null,
    lunch: (data || []).find((m) => m.meal_type === 'lunch') as MealPlanEntry | null,
    dinner: (data || []).find((m) => m.meal_type === 'dinner') as MealPlanEntry | null,
  };

  return { data: meals, error: null };
}

/**
 * Get all meals for a date range
 */
export async function getMealsForDateRange(startDate: string, endDate: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: [], error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('meal_plans')
    .select(
      `
      *,
      recipe:recipes(
        id, slug, name, description, image_url, total_time_minutes,
        servings, meal_type, difficulty, dietary_tags, is_featured,
        ingredients:recipe_ingredients(
          id, ingredient_id, display_name, category,
          quantity, unit, preparation, notes, sort_order
        )
      )
    `
    )
    .eq('user_id', user.id)
    .gte('plan_date', startDate)
    .lte('plan_date', endDate)
    .order('plan_date', { ascending: true });

  if (error) {
    console.error('Error getting meals for date range:', error);
    return { data: [], error: error.message };
  }

  return { data: (data || []) as MealPlanEntry[], error: null };
}

/**
 * Clear all meals in a date range
 */
export async function clearMealsInRange(startDate: string, endDate: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('meal_plans')
    .delete()
    .eq('user_id', user.id)
    .gte('plan_date', startDate)
    .lte('plan_date', endDate);

  if (error) {
    console.error('Error clearing meals:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/calendar');
  return { success: true, error: null };
}

/**
 * Clear all meals for the user
 */
export async function clearAllMeals() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase.from('meal_plans').delete().eq('user_id', user.id);

  if (error) {
    console.error('Error clearing all meals:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/calendar');
  return { success: true, error: null };
}
