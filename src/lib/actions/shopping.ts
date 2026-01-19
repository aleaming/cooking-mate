'use server';

import { createServerSupabaseClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { IngredientCategory } from '@/types';

export interface ShoppingListItem {
  ingredient_id: string;
  ingredient_name: string;
  category: IngredientCategory;
  total_quantity: number;
  unit: string | null;
  recipe_ids: string[];
  recipe_names: string[];
}

export interface ShoppingPreferences {
  id: string;
  user_id: string;
  checked_items: string[];
  default_range_days: number;
  sort_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * Get aggregated shopping list for a date range
 * Uses the database function for efficient aggregation
 */
export async function getShoppingList(startDate: string, endDate: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: [], error: 'Not authenticated' };
  }

  const { data, error } = await supabase.rpc('get_shopping_list', {
    p_user_id: user.id,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) {
    console.error('Error getting shopping list:', error);
    return { data: [], error: error.message };
  }

  return { data: (data || []) as ShoppingListItem[], error: null };
}

/**
 * Get or create shopping preferences for the user
 */
export async function getShoppingPreferences() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  // Try to get existing preferences
  const { data: existing, error: fetchError } = await supabase
    .from('shopping_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (fetchError) {
    console.error('Error fetching shopping preferences:', fetchError);
    return { data: null, error: fetchError.message };
  }

  // If preferences exist, return them
  if (existing) {
    return { data: existing as ShoppingPreferences, error: null };
  }

  // Create default preferences
  const { data: newPrefs, error: createError } = await supabase
    .from('shopping_preferences')
    .insert({
      user_id: user.id,
      checked_items: [],
      default_range_days: 7,
      sort_by: 'category',
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating shopping preferences:', createError);
    return { data: null, error: createError.message };
  }

  return { data: newPrefs as ShoppingPreferences, error: null };
}

/**
 * Toggle a shopping list item as checked/unchecked
 */
export async function toggleShoppingItem(itemId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  // Get current preferences
  const { data: prefs, error: fetchError } = await supabase
    .from('shopping_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (fetchError) {
    console.error('Error fetching shopping preferences:', fetchError);
    return { data: null, error: fetchError.message };
  }

  const currentChecked = (prefs?.checked_items as string[]) || [];
  let newChecked: string[];

  if (currentChecked.includes(itemId)) {
    // Remove the item
    newChecked = currentChecked.filter((id) => id !== itemId);
  } else {
    // Add the item
    newChecked = [...currentChecked, itemId];
  }

  // Upsert preferences with new checked items
  const { data, error } = await supabase
    .from('shopping_preferences')
    .upsert(
      {
        user_id: user.id,
        checked_items: newChecked,
        default_range_days: prefs?.default_range_days || 7,
        sort_by: prefs?.sort_by || 'category',
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Error toggling shopping item:', error);
    return { data: null, error: error.message };
  }

  revalidatePath('/shopping-list');
  return { data: data as ShoppingPreferences, error: null };
}

/**
 * Set a shopping item as checked or unchecked
 */
export async function setShoppingItemChecked(itemId: string, checked: boolean) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  // Get current preferences
  const { data: prefs, error: fetchError } = await supabase
    .from('shopping_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (fetchError) {
    console.error('Error fetching shopping preferences:', fetchError);
    return { data: null, error: fetchError.message };
  }

  const currentChecked = (prefs?.checked_items as string[]) || [];
  let newChecked: string[];

  if (checked && !currentChecked.includes(itemId)) {
    newChecked = [...currentChecked, itemId];
  } else if (!checked && currentChecked.includes(itemId)) {
    newChecked = currentChecked.filter((id) => id !== itemId);
  } else {
    // No change needed
    return { data: prefs as ShoppingPreferences, error: null };
  }

  // Upsert preferences
  const { data, error } = await supabase
    .from('shopping_preferences')
    .upsert(
      {
        user_id: user.id,
        checked_items: newChecked,
        default_range_days: prefs?.default_range_days || 7,
        sort_by: prefs?.sort_by || 'category',
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Error setting shopping item checked:', error);
    return { data: null, error: error.message };
  }

  revalidatePath('/shopping-list');
  return { data: data as ShoppingPreferences, error: null };
}

/**
 * Clear all checked items
 */
export async function clearCheckedItems() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  const { data, error } = await supabase
    .from('shopping_preferences')
    .upsert(
      {
        user_id: user.id,
        checked_items: [],
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Error clearing checked items:', error);
    return { data: null, error: error.message };
  }

  revalidatePath('/shopping-list');
  return { data: data as ShoppingPreferences, error: null };
}

/**
 * Update shopping preferences (date range, sort order)
 */
export async function updateShoppingPreferences(updates: {
  defaultRangeDays?: number;
  sortBy?: string;
}) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: null, error: 'Not authenticated' };
  }

  const updateData: Record<string, unknown> = {};
  if (updates.defaultRangeDays !== undefined) {
    updateData.default_range_days = updates.defaultRangeDays;
  }
  if (updates.sortBy !== undefined) {
    updateData.sort_by = updates.sortBy;
  }

  const { data, error } = await supabase
    .from('shopping_preferences')
    .upsert(
      {
        user_id: user.id,
        ...updateData,
      },
      {
        onConflict: 'user_id',
      }
    )
    .select()
    .single();

  if (error) {
    console.error('Error updating shopping preferences:', error);
    return { data: null, error: error.message };
  }

  revalidatePath('/shopping-list');
  return { data: data as ShoppingPreferences, error: null };
}

/**
 * Check if an item is checked
 */
export async function isItemChecked(itemId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { checked: false, error: 'Not authenticated' };
  }

  const { data: prefs, error } = await supabase
    .from('shopping_preferences')
    .select('checked_items')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error checking if item is checked:', error);
    return { checked: false, error: error.message };
  }

  const checkedItems = (prefs?.checked_items as string[]) || [];
  return { checked: checkedItems.includes(itemId), error: null };
}

/**
 * Get set of all checked item IDs
 */
export async function getCheckedItemIds() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { data: new Set<string>(), error: 'Not authenticated' };
  }

  const { data: prefs, error } = await supabase
    .from('shopping_preferences')
    .select('checked_items')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    console.error('Error getting checked item IDs:', error);
    return { data: new Set<string>(), error: error.message };
  }

  const checkedItems = (prefs?.checked_items as string[]) || [];
  return { data: new Set(checkedItems), error: null };
}
