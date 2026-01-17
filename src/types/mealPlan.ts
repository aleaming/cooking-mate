// Meal Plan Types

import { Recipe } from './recipe';

export type MealSlotType = 'breakfast' | 'lunch' | 'dinner';

export interface MealPlan {
  id: string;
  deviceId: string;
  planDate: string; // ISO date string (YYYY-MM-DD)
  mealType: MealSlotType;
  recipeId: string | null;
  servings: number;
  createdAt: string;
  updatedAt: string;
}

export interface MealPlanWithRecipe extends MealPlan {
  recipe: Recipe | null;
}

export interface DayMealPlan {
  date: string; // ISO date string
  breakfast: MealPlanWithRecipe | null;
  lunch: MealPlanWithRecipe | null;
  dinner: MealPlanWithRecipe | null;
}

export interface MonthMealPlan {
  year: number;
  month: number; // 1-12
  days: DayMealPlan[];
}

// For calendar drag and drop
export interface DraggedRecipe {
  recipe: Recipe;
  sourceDate?: string;
  sourceMealType?: MealSlotType;
}

export interface DropTarget {
  date: string;
  mealType: MealSlotType;
}
