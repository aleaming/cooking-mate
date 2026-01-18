/**
 * Data Migration Utilities
 *
 * This module provides utilities for migrating local data (stored in localStorage)
 * to user-associated cloud storage in Supabase when users sign up or log in.
 *
 * Currently a stub implementation - will be expanded when database tables are created.
 */

// localStorage keys used by the app
const STORAGE_KEYS = {
  mealPlans: 'meddiet-meal-plans',
  cookingLog: 'meddiet-cooking-log',
  shopping: 'meddiet-shopping',
  deviceId: 'meddiet-device-id',
  migrationUserId: 'meddiet-migration-user-id',
} as const;

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
      mealPlans: mealPlansRaw ? JSON.parse(mealPlansRaw) : null,
      cookingLog: cookingLogRaw ? JSON.parse(cookingLogRaw) : null,
      shopping: shoppingRaw ? JSON.parse(shoppingRaw) : null,
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
 * @returns Promise<boolean> - true if migration was successful
 *
 * TODO: Implement actual migration when database tables are created:
 * 1. Read local data from localStorage
 * 2. Transform data to match database schema
 * 3. Upload to Supabase with user_id association
 * 4. Mark migration as complete
 */
export async function migrateLocalDataToUser(userId: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const localData = getLocalData();

    if (!localData) {
      console.log('No local data to migrate');
      return true;
    }

    // TODO: Implement actual migration logic here
    // This is a stub that will be expanded when database tables are created
    //
    // Example implementation:
    // const supabase = getSupabaseClient();
    //
    // if (localData.mealPlans) {
    //   await supabase.from('meal_plans').insert(
    //     transformMealPlans(localData.mealPlans, userId)
    //   );
    // }
    //
    // if (localData.cookingLog) {
    //   await supabase.from('cooking_sessions').insert(
    //     transformCookingLog(localData.cookingLog, userId)
    //   );
    // }

    console.log(`Data migration for user ${userId}:`, {
      hasMealPlans: !!localData.mealPlans,
      hasCookingLog: !!localData.cookingLog,
      hasShopping: !!localData.shopping,
    });

    // Mark migration as complete to prevent duplicate migrations
    localStorage.setItem(STORAGE_KEYS.migrationUserId, userId);

    return true;
  } catch (error) {
    console.error('Error migrating local data:', error);
    return false;
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
 * Get stats about local data for display to user.
 */
export function getLocalDataStats() {
  if (typeof window === 'undefined') return null;

  try {
    const localData = getLocalData();
    if (!localData) return null;

    return {
      mealPlanCount: localData.mealPlans?.state?.meals
        ? Object.keys(localData.mealPlans.state.meals).length
        : 0,
      cookingSessionCount: localData.cookingLog?.state?.sessions
        ? localData.cookingLog.state.sessions.length
        : 0,
      hasShoppingPreferences: !!localData.shopping,
    };
  } catch (error) {
    console.error('Error getting local data stats:', error);
    return null;
  }
}
