import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Recipe, MealSlotType } from '@/types';

interface MealPlanEntry {
  date: string; // YYYY-MM-DD
  mealType: MealSlotType;
  recipe: Recipe;
  servings: number;
}

interface MealPlanState {
  // Meal plans stored by key: "YYYY-MM-DD-mealType"
  mealPlans: Record<string, MealPlanEntry>;

  // Current view state
  currentYear: number;
  currentMonth: number; // 0-11

  // Actions
  addMeal: (date: string, mealType: MealSlotType, recipe: Recipe, servings?: number) => void;
  removeMeal: (date: string, mealType: MealSlotType) => void;
  updateServings: (date: string, mealType: MealSlotType, servings: number) => void;
  getMeal: (date: string, mealType: MealSlotType) => MealPlanEntry | null;
  getMealsForDate: (date: string) => { breakfast: MealPlanEntry | null; lunch: MealPlanEntry | null; dinner: MealPlanEntry | null };
  getMealsForDateRange: (startDate: string, endDate: string) => MealPlanEntry[];
  clearAllMeals: () => void;

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

export const useMealPlanStore = create<MealPlanState>()(
  persist(
    (set, get) => ({
      mealPlans: {},
      currentYear: today.getFullYear(),
      currentMonth: today.getMonth(),

      addMeal: (date, mealType, recipe, servings = 1) => {
        const key = getMealKey(date, mealType);
        set((state) => ({
          mealPlans: {
            ...state.mealPlans,
            [key]: { date, mealType, recipe, servings },
          },
        }));
      },

      removeMeal: (date, mealType) => {
        const key = getMealKey(date, mealType);
        set((state) => {
          const { [key]: _, ...rest } = state.mealPlans;
          return { mealPlans: rest };
        });
      },

      updateServings: (date, mealType, servings) => {
        const key = getMealKey(date, mealType);
        set((state) => {
          const existing = state.mealPlans[key];
          if (!existing) return state;
          return {
            mealPlans: {
              ...state.mealPlans,
              [key]: { ...existing, servings },
            },
          };
        });
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

      clearAllMeals: () => {
        set({ mealPlans: {} });
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
    }),
    {
      name: 'meddiet-meal-plans',
      partialize: (state) => ({ mealPlans: state.mealPlans }),
    }
  )
);
