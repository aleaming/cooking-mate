/**
 * Data Migration Utilities
 *
 * This module provides utilities for migrating local data (stored in localStorage)
 * to user-associated cloud storage in Supabase when users sign up or log in.
 */

import { getSupabaseClient } from '@/lib/supabase/client';
import type { MealSlotType, Recipe } from '@/types';

// localStorage keys used by the app (Zustand persist middleware format)
const STORAGE_KEYS = {
  mealPlans: 'meddiet-meal-plans',
  cookingLog: 'meddiet-cooking-log',
  shopping: 'meddiet-shopping',
  deviceId: 'meddiet-device-id',
  migrationUserId: 'meddiet-migration-user-id',
} as const;

// Types for localStorage data structures
interface LocalMealPlanEntry {
  date: string;
  mealType: MealSlotType;
  recipe: Recipe;
  servings: number;
}

interface LocalMealPlanState {
  state: {
    mealPlans: Record<string, LocalMealPlanEntry>;
  };
}

interface LocalCookingSession {
  id: string;
  recipeId: string;
  mealPlanKey?: string;
  cookedAt: string;
  actualServings: number;
  scaleFactor: number;
  rating: number | null;
  notes: string;
  photoUrl?: string;
  prepTimeActual?: number;
  cookTimeActual?: number;
  mealType?: MealSlotType;
  createdAt: string;
  updatedAt: string;
}

interface LocalCookingLogState {
  state: {
    sessions: Record<string, LocalCookingSession>;
  };
}

interface LocalShoppingState {
  state: {
    checkedItems: Record<string, boolean>;
    startDate: string;
    endDate: string;
  };
}

/**
 * Check if there is local data that could be migrated to the cloud.
 * Returns true if there's data in localStorage that hasn't been migrated.
 */
export function hasDataToMigrate(): boolean {
  if (typeof window === 'undefined') return false;

  const hasMealPlans = !!localStorage.getItem(STORAGE_KEYS.mealPlans);
  const hasCookingLog = !!localStorage.getItem(STORAGE_KEYS.cookingLog);
  const hasNotMigrated = !localStorage.getItem(STORAGE_KEYS.migrationUserId);

  return (hasMealPlans || hasCookingLog) && hasNotMigrated;
}

/**
 * Get local data that could be migrated.
 * Returns the parsed data from localStorage.
 */
export function getLocalData() {
  if (typeof window === 'undefined') return null;

  try {
    const mealPlansRaw = localStorage.getItem(STORAGE_KEYS.mealPlans);
    const cookingLogRaw = localStorage.getItem(STORAGE_KEYS.cookingLog);
    const shoppingRaw = localStorage.getItem(STORAGE_KEYS.shopping);

    return {
      mealPlans: mealPlansRaw ? (JSON.parse(mealPlansRaw) as LocalMealPlanState) : null,
      cookingLog: cookingLogRaw ? (JSON.parse(cookingLogRaw) as LocalCookingLogState) : null,
      shopping: shoppingRaw ? (JSON.parse(shoppingRaw) as LocalShoppingState) : null,
    };
  } catch (error) {
    console.error('Error reading local data:', error);
    return null;
  }
}

/**
 * Migrate local data to user's cloud storage.
 *
 * @param userId - The Supabase user ID to associate the data with
 * @returns Promise<{ success: boolean; error?: string; counts?: MigrationCounts }>
 */
export async function migrateLocalDataToUser(userId: string): Promise<{
  success: boolean;
  error?: string;
  counts?: {
    mealPlans: number;
    cookingSessions: number;
    shoppingPreferences: boolean;
  };
}> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Cannot migrate on server' };
  }

  try {
    const localData = getLocalData();

    if (!localData) {
      console.log('No local data to migrate');
      return { success: true, counts: { mealPlans: 0, cookingSessions: 0, shoppingPreferences: false } };
    }

    const supabase = getSupabaseClient();
    const counts = {
      mealPlans: 0,
      cookingSessions: 0,
      shoppingPreferences: false,
    };

    // Migrate meal plans
    if (localData.mealPlans?.state?.mealPlans) {
      const mealPlanEntries = Object.values(localData.mealPlans.state.mealPlans);

      if (mealPlanEntries.length > 0) {
        const mealPlanRecords = mealPlanEntries.map((entry) => ({
          user_id: userId,
          plan_date: entry.date,
          meal_type: entry.mealType,
          recipe_id: entry.recipe.id,
          servings: entry.servings,
        }));

        const { error: mealPlanError } = await supabase
          .from('meal_plans')
          .upsert(mealPlanRecords, {
            onConflict: 'user_id,plan_date,meal_type',
          });

        if (mealPlanError) {
          console.error('Error migrating meal plans:', mealPlanError);
          // Continue with other migrations
        } else {
          counts.mealPlans = mealPlanEntries.length;
        }
      }
    }

    // Migrate cooking sessions
    if (localData.cookingLog?.state?.sessions) {
      const sessions = Object.values(localData.cookingLog.state.sessions);

      if (sessions.length > 0) {
        const sessionRecords = sessions.map((session) => ({
          user_id: userId,
          recipe_id: session.recipeId,
          meal_plan_id: null, // Can't map old mealPlanKey to new IDs
          cooked_at: session.cookedAt,
          actual_servings: session.actualServings,
          scale_factor: session.scaleFactor,
          rating: session.rating,
          notes: session.notes || '',
          photo_url: session.photoUrl || null,
          prep_time_actual: session.prepTimeActual || null,
          cook_time_actual: session.cookTimeActual || null,
          meal_type: session.mealType || null,
        }));

        const { error: sessionsError } = await supabase
          .from('cooking_sessions')
          .insert(sessionRecords);

        if (sessionsError) {
          console.error('Error migrating cooking sessions:', sessionsError);
          // Continue with other migrations
        } else {
          counts.cookingSessions = sessions.length;
        }
      }
    }

    // Migrate shopping preferences
    if (localData.shopping?.state) {
      const { checkedItems } = localData.shopping.state;
      const checkedItemIds = Object.entries(checkedItems)
        .filter(([_, checked]) => checked)
        .map(([id]) => id);

      const { error: shoppingError } = await supabase
        .from('shopping_preferences')
        .upsert(
          {
            user_id: userId,
            checked_items: checkedItemIds,
            default_range_days: 7,
            sort_by: 'category',
          },
          {
            onConflict: 'user_id',
          }
        );

      if (shoppingError) {
        console.error('Error migrating shopping preferences:', shoppingError);
      } else {
        counts.shoppingPreferences = true;
      }
    }

    // Mark migration as complete to prevent duplicate migrations
    localStorage.setItem(STORAGE_KEYS.migrationUserId, userId);

    console.log('Data migration complete:', counts);
    return { success: true, counts };
  } catch (error) {
    console.error('Error migrating local data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during migration',
    };
  }
}

/**
 * Check if data has already been migrated for a specific user.
 */
export function hasBeenMigrated(userId: string): boolean {
  if (typeof window === 'undefined') return false;

  const migratedUserId = localStorage.getItem(STORAGE_KEYS.migrationUserId);
  return migratedUserId === userId;
}

/**
 * Clear the migration flag (useful for testing or re-migration).
 */
export function clearMigrationFlag(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEYS.migrationUserId);
}

/**
 * Clear all local storage data after successful migration.
 * Call this after confirming migration was successful and user wants to clear local data.
 */
export function clearLocalData(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(STORAGE_KEYS.mealPlans);
  localStorage.removeItem(STORAGE_KEYS.cookingLog);
  localStorage.removeItem(STORAGE_KEYS.shopping);
  // Keep deviceId and migrationUserId
}

/**
 * Get stats about local data for display to user.
 */
export function getLocalDataStats() {
  if (typeof window === 'undefined') return null;

  try {
    const localData = getLocalData();
    if (!localData) return null;

    const mealPlanCount = localData.mealPlans?.state?.mealPlans
      ? Object.keys(localData.mealPlans.state.mealPlans).length
      : 0;

    const cookingSessionCount = localData.cookingLog?.state?.sessions
      ? Object.keys(localData.cookingLog.state.sessions).length
      : 0;

    return {
      mealPlanCount,
      cookingSessionCount,
      hasShoppingPreferences:
        !!localData.shopping?.state?.checkedItems &&
        Object.keys(localData.shopping.state.checkedItems).length > 0,
    };
  } catch (error) {
    console.error('Error getting local data stats:', error);
    return null;
  }
}
