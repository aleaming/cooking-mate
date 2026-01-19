'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { MealSlotType } from '@/types';

export interface CookingSession {
  id: string;
  user_id: string;
  recipe_id: string;
  meal_plan_id: string | null;
  cooked_at: string;
  actual_servings: number;
  scale_factor: number;
  rating: number | null;
  notes: string;
  photo_url: string | null;
  prep_time_actual: number | null;
  cook_time_actual: number | null;
  meal_type: MealSlotType | null;
  created_at: string;
  updated_at: string;
  recipe?: {
    id: string;
    slug: string;
    name: string;
    image_url: string | null;
    total_time_minutes: number;
  };
}

export interface CookingStats {
  times_cooked: number;
  average_rating: number | null;
  last_cooked: string | null;
  total_servings_made: number;
  favorite_scale: number;
}

export interface MonthlyStats {
  recipes_cooked: number;
  unique_recipes: number;
  total_servings: number;
  average_rating: number | null;
}

export interface LogCookingInput {
  recipeId: string;
  mealPlanId?: string;
  cookedAt?: string;
  actualServings: number;
  scaleFactor: number;
  rating?: number;
  notes?: string;
  photoUrl?: string;
  prepTimeActual?: number;
  cookTimeActual?: number;
  mealType?: MealSlotType;
}

/**
 * Log a cooking session
 */
export async function logCooking(input: LogCookingInput) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('cooking_sessions')
    .insert({
      user_id: user.id,
      recipe_id: input.recipeId,
      meal_plan_id: input.mealPlanId || null,
      cooked_at: input.cookedAt || new Date().toISOString(),
      actual_servings: input.actualServings,
      scale_factor: input.scaleFactor,
      rating: input.rating || null,
      notes: input.notes || '',
      photo_url: input.photoUrl || null,
      prep_time_actual: input.prepTimeActual || null,
      cook_time_actual: input.cookTimeActual || null,
      meal_type: input.mealType || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error logging cooking session:', error);
    return { data: null, error: error.message };
  }

  revalidatePath('/cooking-history');
  revalidatePath('/calendar');
  return { data: data as CookingSession, error: null };
}

/**
 * Update a cooking session
 */
export async function updateCookingSession(
  sessionId: string,
  updates: Partial<Omit<LogCookingInput, 'recipeId'>>
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  const updateData: Record<string, unknown> = {};
  if (updates.actualServings !== undefined) updateData.actual_servings = updates.actualServings;
  if (updates.scaleFactor !== undefined) updateData.scale_factor = updates.scaleFactor;
  if (updates.rating !== undefined) updateData.rating = updates.rating;
  if (updates.notes !== undefined) updateData.notes = updates.notes;
  if (updates.photoUrl !== undefined) updateData.photo_url = updates.photoUrl;
  if (updates.prepTimeActual !== undefined) updateData.prep_time_actual = updates.prepTimeActual;
  if (updates.cookTimeActual !== undefined) updateData.cook_time_actual = updates.cookTimeActual;
  if (updates.mealType !== undefined) updateData.meal_type = updates.mealType;

  const { data, error } = await supabase
    .from('cooking_sessions')
    .update(updateData)
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating cooking session:', error);
    return { data: null, error: error.message };
  }

  revalidatePath('/cooking-history');
  return { data: data as CookingSession, error: null };
}

/**
 * Delete a cooking session
 */
export async function deleteCookingSession(sessionId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Not authenticated' };
  }

  const { error } = await supabase
    .from('cooking_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting cooking session:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/cooking-history');
  return { success: true, error: null };
}

/**
 * Get a single cooking session
 */
export async function getCookingSession(sessionId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('cooking_sessions')
    .select(
      `
      *,
      recipe:recipes(id, slug, name, image_url, total_time_minutes)
    `
    )
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.error('Error getting cooking session:', error);
    return { data: null, error: error.message };
  }

  return { data: data as CookingSession, error: null };
}

/**
 * Get all cooking sessions for a recipe
 */
export async function getCookingSessionsForRecipe(recipeId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: [], error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('cooking_sessions')
    .select(
      `
      *,
      recipe:recipes(id, slug, name, image_url, total_time_minutes)
    `
    )
    .eq('user_id', user.id)
    .eq('recipe_id', recipeId)
    .order('cooked_at', { ascending: false });

  if (error) {
    console.error('Error getting cooking sessions:', error);
    return { data: [], error: error.message };
  }

  return { data: (data || []) as CookingSession[], error: null };
}

/**
 * Get cooking stats for a recipe using database function
 */
export async function getRecipeStats(recipeId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      data: {
        times_cooked: 0,
        average_rating: null,
        last_cooked: null,
        total_servings_made: 0,
        favorite_scale: 1,
      },
      error: 'Not authenticated',
    };
  }

  const { data, error } = await supabase.rpc('get_recipe_stats', {
    p_user_id: user.id,
    p_recipe_id: recipeId,
  });

  if (error) {
    console.error('Error getting recipe stats:', error);
    return {
      data: {
        times_cooked: 0,
        average_rating: null,
        last_cooked: null,
        total_servings_made: 0,
        favorite_scale: 1,
      },
      error: error.message,
    };
  }

  // The RPC returns an array with one row
  const stats = data?.[0] || {
    times_cooked: 0,
    average_rating: null,
    last_cooked: null,
    total_servings_made: 0,
    favorite_scale: 1,
  };

  return { data: stats as CookingStats, error: null };
}

/**
 * Get cooking sessions in a date range
 */
export async function getCookingSessionsInDateRange(startDate: string, endDate: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: [], error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('cooking_sessions')
    .select(
      `
      *,
      recipe:recipes(id, slug, name, image_url, total_time_minutes)
    `
    )
    .eq('user_id', user.id)
    .gte('cooked_at', startDate)
    .lte('cooked_at', endDate)
    .order('cooked_at', { ascending: false });

  if (error) {
    console.error('Error getting cooking sessions in date range:', error);
    return { data: [], error: error.message };
  }

  return { data: (data || []) as CookingSession[], error: null };
}

/**
 * Get monthly cooking stats using database function
 */
export async function getMonthlyStats(year: number, month: number) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      data: { recipes_cooked: 0, unique_recipes: 0, total_servings: 0, average_rating: null },
      error: 'Not authenticated',
    };
  }

  const { data, error } = await supabase.rpc('get_monthly_stats', {
    p_user_id: user.id,
    p_year: year,
    p_month: month,
  });

  if (error) {
    console.error('Error getting monthly stats:', error);
    return {
      data: { recipes_cooked: 0, unique_recipes: 0, total_servings: 0, average_rating: null },
      error: error.message,
    };
  }

  const stats = data?.[0] || {
    recipes_cooked: 0,
    unique_recipes: 0,
    total_servings: 0,
    average_rating: null,
  };

  return { data: stats as MonthlyStats, error: null };
}

/**
 * Get all cooking sessions for the user
 */
export async function getAllCookingSessions(limit?: number) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: [], error: 'Not authenticated' };
  }

  let query = supabase
    .from('cooking_sessions')
    .select(
      `
      *,
      recipe:recipes(id, slug, name, image_url, total_time_minutes)
    `
    )
    .eq('user_id', user.id)
    .order('cooked_at', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error getting all cooking sessions:', error);
    return { data: [], error: error.message };
  }

  return { data: (data || []) as CookingSession[], error: null };
}

/**
 * Check if a meal plan has been logged as cooked
 */
export async function isMealLogged(mealPlanId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { logged: false, error: 'Not authenticated' };
  }

  const { data, error } = await supabase.rpc('is_meal_logged', {
    p_user_id: user.id,
    p_meal_plan_id: mealPlanId,
  });

  if (error) {
    console.error('Error checking if meal is logged:', error);
    return { logged: false, error: error.message };
  }

  return { logged: data as boolean, error: null };
}

/**
 * Get cooking session by meal plan ID
 */
export async function getCookingSessionByMealPlan(mealPlanId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('cooking_sessions')
    .select(
      `
      *,
      recipe:recipes(id, slug, name, image_url, total_time_minutes)
    `
    )
    .eq('user_id', user.id)
    .eq('meal_plan_id', mealPlanId)
    .maybeSingle();

  if (error) {
    console.error('Error getting cooking session by meal plan:', error);
    return { data: null, error: error.message };
  }

  return { data: data as CookingSession | null, error: null };
}
