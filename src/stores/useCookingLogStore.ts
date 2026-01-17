import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  CookingSession,
  CookingStats,
  MonthlyStats,
  CookingHistoryFilters,
  CookingRating,
  MealSlotType,
} from '@/types';

interface CookingLogState {
  // All cooking sessions keyed by session ID
  sessions: Record<string, CookingSession>;

  // Actions
  logCooking: (
    session: Omit<CookingSession, 'id' | 'createdAt' | 'updatedAt'>
  ) => string;
  updateSession: (id: string, updates: Partial<CookingSession>) => void;
  deleteSession: (id: string) => void;

  // Queries
  getSession: (id: string) => CookingSession | null;
  getSessionsForRecipe: (recipeId: string) => CookingSession[];
  getRecipeStats: (recipeId: string) => CookingStats;
  getSessionsInDateRange: (start: string, end: string) => CookingSession[];
  getMonthlyStats: (year: number, month: number) => MonthlyStats;
  getAllSessions: (filters?: CookingHistoryFilters) => CookingSession[];
  wasRecentlyCooked: (recipeId: string, days?: number) => boolean;
  isMealLogged: (mealPlanKey: string) => boolean;
  getSessionByMealPlanKey: (mealPlanKey: string) => CookingSession | null;
}

export const useCookingLogStore = create<CookingLogState>()(
  persist(
    (set, get) => ({
      sessions: {},

      logCooking: (sessionData) => {
        const id = `cook-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();
        const session: CookingSession = {
          ...sessionData,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          sessions: { ...state.sessions, [id]: session },
        }));
        return id;
      },

      updateSession: (id, updates) => {
        set((state) => {
          const existing = state.sessions[id];
          if (!existing) return state;
          return {
            sessions: {
              ...state.sessions,
              [id]: {
                ...existing,
                ...updates,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      deleteSession: (id) => {
        set((state) => {
          const { [id]: _, ...rest } = state.sessions;
          return { sessions: rest };
        });
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
    }),
    {
      name: 'meddiet-cooking-log',
      partialize: (state) => ({ sessions: state.sessions }),
    }
  )
);
