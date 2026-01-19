import { create } from 'zustand';
import {
  CookingSession,
  CookingStats,
  MonthlyStats,
  CookingHistoryFilters,
  CookingRating,
  MealSlotType,
} from '@/types';
import {
  logCooking as logCookingToDatabase,
  updateCookingSession as updateCookingSessionInDatabase,
  deleteCookingSession as deleteCookingSessionFromDatabase,
  getAllCookingSessions as getAllCookingSessionsFromDatabase,
  getCookingSessionsForRecipe as getCookingSessionsForRecipeFromDatabase,
  getRecipeStats as getRecipeStatsFromDatabase,
  getMonthlyStats as getMonthlyStatsFromDatabase,
  getCookingSessionsInDateRange as getCookingSessionsInDateRangeFromDatabase,
  isMealLogged as isMealLoggedFromDatabase,
  getCookingSessionByMealPlan as getCookingSessionByMealPlanFromDatabase,
  type CookingSession as DatabaseCookingSession,
  type CookingStats as DatabaseCookingStats,
  type MonthlyStats as DatabaseMonthlyStats,
  type LogCookingInput,
} from '@/lib/actions/cookingLog';

interface CookingLogState {
  // All cooking sessions keyed by session ID
  sessions: Record<string, CookingSession>;

  // Loading and sync state
  isLoading: boolean;
  isSyncing: boolean;
  lastSynced: string | null;
  error: string | null;

  // Actions
  logCooking: (
    session: Omit<CookingSession, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<string | null>;
  updateSession: (id: string, updates: Partial<CookingSession>) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;

  // Queries - local cache based
  getSession: (id: string) => CookingSession | null;
  getSessionsForRecipe: (recipeId: string) => CookingSession[];
  getRecipeStats: (recipeId: string) => CookingStats;
  getSessionsInDateRange: (start: string, end: string) => CookingSession[];
  getMonthlyStats: (year: number, month: number) => MonthlyStats;
  getAllSessions: (filters?: CookingHistoryFilters) => CookingSession[];
  wasRecentlyCooked: (recipeId: string, days?: number) => boolean;
  isMealLogged: (mealPlanKey: string) => boolean;
  getSessionByMealPlanKey: (mealPlanKey: string) => CookingSession | null;

  // Sync actions
  fetchAllSessions: (limit?: number) => Promise<void>;
  fetchSessionsForRecipe: (recipeId: string) => Promise<void>;
  fetchRecipeStats: (recipeId: string) => Promise<CookingStats | null>;
  fetchMonthlyStats: (year: number, month: number) => Promise<MonthlyStats | null>;
  clearLocalState: () => void;
}

// Convert database session to frontend session
function mapDatabaseToFrontend(session: DatabaseCookingSession): CookingSession {
  return {
    id: session.id,
    recipeId: session.recipe_id,
    mealPlanKey: session.meal_plan_id || undefined,
    cookedAt: session.cooked_at,
    actualServings: session.actual_servings,
    scaleFactor: session.scale_factor,
    rating: session.rating as CookingRating | null,
    notes: session.notes,
    photoUrl: session.photo_url || undefined,
    prepTimeActual: session.prep_time_actual || undefined,
    cookTimeActual: session.cook_time_actual || undefined,
    mealType: session.meal_type || undefined,
    createdAt: session.created_at,
    updatedAt: session.updated_at,
  };
}

// Convert database stats to frontend stats
function mapDatabaseStatsToFrontend(stats: DatabaseCookingStats, recipeId: string): CookingStats {
  return {
    recipeId,
    timesCooked: stats.times_cooked,
    averageRating: stats.average_rating,
    lastCooked: stats.last_cooked,
    totalServingsMade: stats.total_servings_made,
    favoriteScale: stats.favorite_scale,
  };
}

// Convert database monthly stats to frontend
function mapDatabaseMonthlyStatsToFrontend(
  stats: DatabaseMonthlyStats,
  year: number,
  month: number
): MonthlyStats {
  return {
    year,
    month,
    recipesCooked: stats.recipes_cooked,
    uniqueRecipes: stats.unique_recipes,
    totalServings: stats.total_servings,
    averageRating: stats.average_rating,
  };
}

export const useCookingLogStore = create<CookingLogState>()((set, get) => ({
  sessions: {},
  isLoading: false,
  isSyncing: false,
  lastSynced: null,
  error: null,

  logCooking: async (sessionData) => {
    const tempId = `cook-temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const optimisticSession: CookingSession = {
      ...sessionData,
      id: tempId,
      createdAt: now,
      updatedAt: now,
    };

    // Optimistic update
    set((state) => ({
      sessions: { ...state.sessions, [tempId]: optimisticSession },
      isSyncing: true,
      error: null,
    }));

    try {
      const input: LogCookingInput = {
        recipeId: sessionData.recipeId,
        mealPlanId: sessionData.mealPlanKey || undefined,
        cookedAt: sessionData.cookedAt,
        actualServings: sessionData.actualServings,
        scaleFactor: sessionData.scaleFactor,
        rating: sessionData.rating || undefined,
        notes: sessionData.notes || undefined,
        photoUrl: sessionData.photoUrl || undefined,
        prepTimeActual: sessionData.prepTimeActual || undefined,
        cookTimeActual: sessionData.cookTimeActual || undefined,
        mealType: sessionData.mealType || undefined,
      };

      const { data, error } = await logCookingToDatabase(input);

      if (error) {
        // Rollback on error
        set((state) => {
          const { [tempId]: _, ...rest } = state.sessions;
          return { sessions: rest, isSyncing: false, error };
        });
        return null;
      }

      if (data) {
        // Replace temp session with real session
        const realSession = mapDatabaseToFrontend(data);
        set((state) => {
          const { [tempId]: _, ...rest } = state.sessions;
          return {
            sessions: { ...rest, [realSession.id]: realSession },
            isSyncing: false,
            lastSynced: new Date().toISOString(),
          };
        });
        return realSession.id;
      }

      return null;
    } catch (err) {
      // Rollback on error
      set((state) => {
        const { [tempId]: _, ...rest } = state.sessions;
        return {
          sessions: rest,
          isSyncing: false,
          error: err instanceof Error ? err.message : 'Failed to log cooking',
        };
      });
      return null;
    }
  },

  updateSession: async (id, updates) => {
    const existing = get().sessions[id];
    if (!existing) return;

    const previousSession = { ...existing };

    // Optimistic update
    set((state) => ({
      sessions: {
        ...state.sessions,
        [id]: {
          ...existing,
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      },
      isSyncing: true,
      error: null,
    }));

    try {
      const { error } = await updateCookingSessionInDatabase(id, {
        actualServings: updates.actualServings,
        scaleFactor: updates.scaleFactor,
        rating: updates.rating || undefined,
        notes: updates.notes || undefined,
        photoUrl: updates.photoUrl || undefined,
        prepTimeActual: updates.prepTimeActual || undefined,
        cookTimeActual: updates.cookTimeActual || undefined,
        mealType: updates.mealType || undefined,
      });

      if (error) {
        // Rollback on error
        set((state) => ({
          sessions: { ...state.sessions, [id]: previousSession },
          isSyncing: false,
          error,
        }));
        return;
      }

      set({ isSyncing: false, lastSynced: new Date().toISOString() });
    } catch (err) {
      // Rollback on error
      set((state) => ({
        sessions: { ...state.sessions, [id]: previousSession },
        isSyncing: false,
        error: err instanceof Error ? err.message : 'Failed to update session',
      }));
    }
  },

  deleteSession: async (id) => {
    const previousSession = get().sessions[id];

    // Optimistic update
    set((state) => {
      const { [id]: _, ...rest } = state.sessions;
      return { sessions: rest, isSyncing: true, error: null };
    });

    try {
      const { error } = await deleteCookingSessionFromDatabase(id);

      if (error) {
        // Rollback on error
        if (previousSession) {
          set((state) => ({
            sessions: { ...state.sessions, [id]: previousSession },
            isSyncing: false,
            error,
          }));
        }
        return;
      }

      set({ isSyncing: false, lastSynced: new Date().toISOString() });
    } catch (err) {
      // Rollback on error
      if (previousSession) {
        set((state) => ({
          sessions: { ...state.sessions, [id]: previousSession },
          isSyncing: false,
          error: err instanceof Error ? err.message : 'Failed to delete session',
        }));
      }
    }
  },

  getSession: (id) => {
    return get().sessions[id] || null;
  },

  getSessionsForRecipe: (recipeId) => {
    const { sessions } = get();
    return Object.values(sessions)
      .filter((s) => s.recipeId === recipeId)
      .sort((a, b) => new Date(b.cookedAt).getTime() - new Date(a.cookedAt).getTime());
  },

  getRecipeStats: (recipeId) => {
    const sessions = get().getSessionsForRecipe(recipeId);

    if (sessions.length === 0) {
      return {
        recipeId,
        timesCooked: 0,
        averageRating: null,
        lastCooked: null,
        totalServingsMade: 0,
        favoriteScale: 1,
      };
    }

    // Calculate stats
    const ratingsWithValue = sessions
      .map((s) => s.rating)
      .filter((r): r is CookingRating => r !== null);
    const averageRating =
      ratingsWithValue.length > 0
        ? ratingsWithValue.reduce((sum, r) => sum + r, 0) / ratingsWithValue.length
        : null;

    const totalServings = sessions.reduce((sum, s) => sum + s.actualServings, 0);

    // Find most common scale factor
    const scaleFactorCounts = new Map<number, number>();
    for (const session of sessions) {
      const count = scaleFactorCounts.get(session.scaleFactor) || 0;
      scaleFactorCounts.set(session.scaleFactor, count + 1);
    }
    let favoriteScale = 1;
    let maxCount = 0;
    for (const [scale, count] of scaleFactorCounts) {
      if (count > maxCount) {
        maxCount = count;
        favoriteScale = scale;
      }
    }

    return {
      recipeId,
      timesCooked: sessions.length,
      averageRating: averageRating ? Math.round(averageRating * 10) / 10 : null,
      lastCooked: sessions[0]?.cookedAt.split('T')[0] || null,
      totalServingsMade: totalServings,
      favoriteScale,
    };
  },

  getSessionsInDateRange: (start, end) => {
    const { sessions } = get();
    const startDate = new Date(start);
    const endDate = new Date(end);
    endDate.setHours(23, 59, 59, 999);

    return Object.values(sessions)
      .filter((s) => {
        const cookedDate = new Date(s.cookedAt);
        return cookedDate >= startDate && cookedDate <= endDate;
      })
      .sort((a, b) => new Date(b.cookedAt).getTime() - new Date(a.cookedAt).getTime());
  },

  getMonthlyStats: (year, month) => {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);
    const sessions = get().getSessionsInDateRange(
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    );

    if (sessions.length === 0) {
      return {
        year,
        month,
        recipesCooked: 0,
        uniqueRecipes: 0,
        totalServings: 0,
        averageRating: null,
      };
    }

    const uniqueRecipeIds = new Set(sessions.map((s) => s.recipeId));
    const totalServings = sessions.reduce((sum, s) => sum + s.actualServings, 0);
    const ratingsWithValue = sessions
      .map((s) => s.rating)
      .filter((r): r is CookingRating => r !== null);
    const averageRating =
      ratingsWithValue.length > 0
        ? Math.round(
            (ratingsWithValue.reduce((sum, r) => sum + r, 0) / ratingsWithValue.length) * 10
          ) / 10
        : null;

    return {
      year,
      month,
      recipesCooked: sessions.length,
      uniqueRecipes: uniqueRecipeIds.size,
      totalServings,
      averageRating,
    };
  },

  getAllSessions: (filters) => {
    const { sessions } = get();
    let result = Object.values(sessions);

    if (filters) {
      if (filters.dateRange) {
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        result = result.filter((s) => {
          const cookedDate = new Date(s.cookedAt);
          return cookedDate >= startDate && cookedDate <= endDate;
        });
      }

      if (filters.minRating) {
        result = result.filter((s) => s.rating !== null && s.rating >= filters.minRating!);
      }

      if (filters.recipeId) {
        result = result.filter((s) => s.recipeId === filters.recipeId);
      }

      if (filters.mealType) {
        result = result.filter((s) => s.mealType === filters.mealType);
      }
    }

    return result.sort(
      (a, b) => new Date(b.cookedAt).getTime() - new Date(a.cookedAt).getTime()
    );
  },

  wasRecentlyCooked: (recipeId, days = 7) => {
    const sessions = get().getSessionsForRecipe(recipeId);
    if (sessions.length === 0) return false;

    const lastCooked = new Date(sessions[0].cookedAt);
    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);

    return lastCooked >= daysAgo;
  },

  isMealLogged: (mealPlanKey) => {
    const { sessions } = get();
    return Object.values(sessions).some((s) => s.mealPlanKey === mealPlanKey);
  },

  getSessionByMealPlanKey: (mealPlanKey) => {
    const { sessions } = get();
    return Object.values(sessions).find((s) => s.mealPlanKey === mealPlanKey) || null;
  },

  // Sync actions
  fetchAllSessions: async (limit) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await getAllCookingSessionsFromDatabase(limit);

      if (error) {
        set({ isLoading: false, error });
        return;
      }

      const sessions: Record<string, CookingSession> = {};
      for (const session of data) {
        const frontendSession = mapDatabaseToFrontend(session);
        sessions[frontendSession.id] = frontendSession;
      }

      set({
        sessions,
        isLoading: false,
        lastSynced: new Date().toISOString(),
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch sessions',
      });
    }
  },

  fetchSessionsForRecipe: async (recipeId) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await getCookingSessionsForRecipeFromDatabase(recipeId);

      if (error) {
        set({ isLoading: false, error });
        return;
      }

      // Merge with existing sessions
      set((state) => {
        const newSessions = { ...state.sessions };
        for (const session of data) {
          const frontendSession = mapDatabaseToFrontend(session);
          newSessions[frontendSession.id] = frontendSession;
        }
        return {
          sessions: newSessions,
          isLoading: false,
          lastSynced: new Date().toISOString(),
        };
      });
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch sessions',
      });
    }
  },

  fetchRecipeStats: async (recipeId) => {
    try {
      const { data, error } = await getRecipeStatsFromDatabase(recipeId);

      if (error) {
        return null;
      }

      return mapDatabaseStatsToFrontend(data, recipeId);
    } catch {
      return null;
    }
  },

  fetchMonthlyStats: async (year, month) => {
    try {
      const { data, error } = await getMonthlyStatsFromDatabase(year, month);

      if (error) {
        return null;
      }

      return mapDatabaseMonthlyStatsToFrontend(data, year, month);
    } catch {
      return null;
    }
  },

  clearLocalState: () => {
    set({
      sessions: {},
      isLoading: false,
      isSyncing: false,
      lastSynced: null,
      error: null,
    });
  },
}));
