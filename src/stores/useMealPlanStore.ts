import { create } from 'zustand';
import { Recipe, MealSlotType } from '@/types';
import {
  addMealToPlan as addMealToDatabase,
  removeMealFromPlan as removeMealFromDatabase,
  updateMealServings as updateMealServingsInDatabase,
  getMealsForDateRange as getMealsFromDatabase,
  clearAllMeals as clearAllMealsFromDatabase,
  type MealPlanEntry as DatabaseMealPlanEntry,
} from '@/lib/actions/mealPlans';

export interface MealPlanEntry {
  id: string;
  date: string; // YYYY-MM-DD
  mealType: MealSlotType;
  recipe: Recipe;
  servings: number;
}

interface MealPlanState {
  // Meal plans stored by key: "YYYY-MM-DD-mealType"
  mealPlans: Record<string, MealPlanEntry>;

  // Loading and sync state
  isLoading: boolean;
  isSyncing: boolean;
  lastSynced: string | null;
  error: string | null;

  // Current view state
  currentYear: number;
  currentMonth: number; // 0-11

  // Actions
  addMeal: (date: string, mealType: MealSlotType, recipe: Recipe, servings?: number) => Promise<void>;
  removeMeal: (date: string, mealType: MealSlotType) => Promise<void>;
  updateServings: (date: string, mealType: MealSlotType, servings: number) => Promise<void>;
  getMeal: (date: string, mealType: MealSlotType) => MealPlanEntry | null;
  getMealsForDate: (date: string) => { breakfast: MealPlanEntry | null; lunch: MealPlanEntry | null; dinner: MealPlanEntry | null };
  getMealsForDateRange: (startDate: string, endDate: string) => MealPlanEntry[];
  clearAllMeals: () => Promise<void>;

  // Sync actions
  fetchMeals: (startDate: string, endDate: string) => Promise<void>;
  clearLocalState: () => void;

  // Navigation
  setMonth: (year: number, month: number) => void;
  goToNextMonth: () => void;
  goToPreviousMonth: () => void;
  goToToday: () => void;
}

const getMealKey = (date: string, mealType: MealSlotType): string => {
  return `${date}-${mealType}`;
};

const today = new Date();

// Convert database entry to frontend entry
function mapDatabaseToFrontend(entry: DatabaseMealPlanEntry): MealPlanEntry | null {
  if (!entry.recipe) return null;

  const recipe = entry.recipe;
  return {
    id: entry.id,
    date: entry.plan_date,
    mealType: entry.meal_type,
    servings: entry.servings,
    recipe: {
      id: recipe.id,
      slug: recipe.slug,
      name: recipe.name,
      description: recipe.description,
      imageUrl: recipe.image_url || '',
      prepTimeMinutes: 0, // Not fetched in list view
      cookTimeMinutes: 0,
      totalTimeMinutes: recipe.total_time_minutes,
      servings: recipe.servings,
      mealType: recipe.meal_type as MealSlotType,
      cuisine: '',
      dietaryTags: recipe.dietary_tags as Recipe['dietaryTags'],
      difficulty: recipe.difficulty as Recipe['difficulty'],
      ingredients: (recipe.ingredients || []).map((ing) => ({
        id: ing.id,
        ingredientId: ing.ingredient_id,
        name: ing.display_name,
        category: ing.category as Recipe['ingredients'][0]['category'],
        quantity: ing.quantity,
        unit: ing.unit,
        preparation: ing.preparation || undefined,
        notes: ing.notes || undefined,
      })),
      instructions: [],
      isFeatured: recipe.is_featured,
      createdAt: '',
      updatedAt: '',
    },
  };
}

export const useMealPlanStore = create<MealPlanState>()((set, get) => ({
  mealPlans: {},
  isLoading: false,
  isSyncing: false,
  lastSynced: null,
  error: null,
  currentYear: today.getFullYear(),
  currentMonth: today.getMonth(),

  addMeal: async (date, mealType, recipe, servings = 1) => {
    const key = getMealKey(date, mealType);
    const optimisticEntry: MealPlanEntry = {
      id: `temp-${key}`,
      date,
      mealType,
      recipe,
      servings,
    };

    // Optimistic update
    set((state) => ({
      mealPlans: {
        ...state.mealPlans,
        [key]: optimisticEntry,
      },
      isSyncing: true,
      error: null,
    }));

    try {
      const { data, error } = await addMealToDatabase(date, mealType, recipe.id, servings);

      if (error) {
        // Rollback on error
        set((state) => {
          const { [key]: _, ...rest } = state.mealPlans;
          return { mealPlans: rest, isSyncing: false, error };
        });
        return;
      }

      // Update with real ID from database
      if (data) {
        set((state) => ({
          mealPlans: {
            ...state.mealPlans,
            [key]: { ...optimisticEntry, id: data.id },
          },
          isSyncing: false,
          lastSynced: new Date().toISOString(),
        }));
      }
    } catch (err) {
      // Rollback on error
      set((state) => {
        const { [key]: _, ...rest } = state.mealPlans;
        return {
          mealPlans: rest,
          isSyncing: false,
          error: err instanceof Error ? err.message : 'Failed to add meal',
        };
      });
    }
  },

  removeMeal: async (date, mealType) => {
    const key = getMealKey(date, mealType);
    const previousEntry = get().mealPlans[key];

    // Optimistic update
    set((state) => {
      const { [key]: _, ...rest } = state.mealPlans;
      return { mealPlans: rest, isSyncing: true, error: null };
    });

    try {
      const { error } = await removeMealFromDatabase(date, mealType);

      if (error) {
        // Rollback on error
        if (previousEntry) {
          set((state) => ({
            mealPlans: { ...state.mealPlans, [key]: previousEntry },
            isSyncing: false,
            error,
          }));
        }
        return;
      }

      set({ isSyncing: false, lastSynced: new Date().toISOString() });
    } catch (err) {
      // Rollback on error
      if (previousEntry) {
        set((state) => ({
          mealPlans: { ...state.mealPlans, [key]: previousEntry },
          isSyncing: false,
          error: err instanceof Error ? err.message : 'Failed to remove meal',
        }));
      }
    }
  },

  updateServings: async (date, mealType, servings) => {
    const key = getMealKey(date, mealType);
    const existing = get().mealPlans[key];

    if (!existing) return;

    const previousServings = existing.servings;

    // Optimistic update
    set((state) => ({
      mealPlans: {
        ...state.mealPlans,
        [key]: { ...existing, servings },
      },
      isSyncing: true,
      error: null,
    }));

    try {
      const { error } = await updateMealServingsInDatabase(date, mealType, servings);

      if (error) {
        // Rollback on error
        set((state) => ({
          mealPlans: {
            ...state.mealPlans,
            [key]: { ...existing, servings: previousServings },
          },
          isSyncing: false,
          error,
        }));
        return;
      }

      set({ isSyncing: false, lastSynced: new Date().toISOString() });
    } catch (err) {
      // Rollback on error
      set((state) => ({
        mealPlans: {
          ...state.mealPlans,
          [key]: { ...existing, servings: previousServings },
        },
        isSyncing: false,
        error: err instanceof Error ? err.message : 'Failed to update servings',
      }));
    }
  },

  getMeal: (date, mealType) => {
    const key = getMealKey(date, mealType);
    return get().mealPlans[key] || null;
  },

  getMealsForDate: (date) => {
    const { mealPlans } = get();
    return {
      breakfast: mealPlans[getMealKey(date, 'breakfast')] || null,
      lunch: mealPlans[getMealKey(date, 'lunch')] || null,
      dinner: mealPlans[getMealKey(date, 'dinner')] || null,
    };
  },

  getMealsForDateRange: (startDate, endDate) => {
    const { mealPlans } = get();
    const meals: MealPlanEntry[] = [];

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Iterate through each day in range
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      const mealTypes: MealSlotType[] = ['breakfast', 'lunch', 'dinner'];

      for (const mealType of mealTypes) {
        const key = getMealKey(dateStr, mealType);
        if (mealPlans[key]) {
          meals.push(mealPlans[key]);
        }
      }

      current.setDate(current.getDate() + 1);
    }

    return meals;
  },

  clearAllMeals: async () => {
    const previousMealPlans = get().mealPlans;

    // Optimistic update
    set({ mealPlans: {}, isSyncing: true, error: null });

    try {
      const { error } = await clearAllMealsFromDatabase();

      if (error) {
        // Rollback on error
        set({ mealPlans: previousMealPlans, isSyncing: false, error });
        return;
      }

      set({ isSyncing: false, lastSynced: new Date().toISOString() });
    } catch (err) {
      // Rollback on error
      set({
        mealPlans: previousMealPlans,
        isSyncing: false,
        error: err instanceof Error ? err.message : 'Failed to clear meals',
      });
    }
  },

  fetchMeals: async (startDate, endDate) => {
    set({ isLoading: true, error: null });

    try {
      const { data, error } = await getMealsFromDatabase(startDate, endDate);

      if (error) {
        set({ isLoading: false, error });
        return;
      }

      // Convert to frontend format and store by key
      const mealPlans: Record<string, MealPlanEntry> = {};
      for (const entry of data) {
        const frontendEntry = mapDatabaseToFrontend(entry);
        if (frontendEntry) {
          const key = getMealKey(frontendEntry.date, frontendEntry.mealType);
          mealPlans[key] = frontendEntry;
        }
      }

      set((state) => ({
        mealPlans: { ...state.mealPlans, ...mealPlans },
        isLoading: false,
        lastSynced: new Date().toISOString(),
      }));
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to fetch meals',
      });
    }
  },

  clearLocalState: () => {
    set({
      mealPlans: {},
      isLoading: false,
      isSyncing: false,
      lastSynced: null,
      error: null,
    });
  },

  setMonth: (year, month) => {
    set({ currentYear: year, currentMonth: month });
  },

  goToNextMonth: () => {
    set((state) => {
      let newMonth = state.currentMonth + 1;
      let newYear = state.currentYear;
      if (newMonth > 11) {
        newMonth = 0;
        newYear += 1;
      }
      return { currentMonth: newMonth, currentYear: newYear };
    });
  },

  goToPreviousMonth: () => {
    set((state) => {
      let newMonth = state.currentMonth - 1;
      let newYear = state.currentYear;
      if (newMonth < 0) {
        newMonth = 11;
        newYear -= 1;
      }
      return { currentMonth: newMonth, currentYear: newYear };
    });
  },

  goToToday: () => {
    const today = new Date();
    set({
      currentYear: today.getFullYear(),
      currentMonth: today.getMonth(),
    });
  },
}));
