// Recipe Suggestion Types - Smart Suggestions

import { Recipe, DietaryTag, MealType } from './recipe';
import { MealSlotType } from './mealPlan';

export interface IngredientOverlap {
  recipeA: string; // Recipe ID
  recipeB: string; // Recipe ID
  sharedIngredients: string[]; // Array of ingredientIds
  overlapScore: number; // Jaccard similarity (0-1)
  sharedCount: number;
  totalUniqueIngredients: number; // Union of both recipes' ingredients
}

export interface RecipePairing {
  recipe: Recipe;
  overlapScore: number;
  sharedIngredients: {
    ingredientId: string;
    name: string;
  }[];
  shoppingEfficiency: number; // Percentage of ingredients already available (0-1)
  newIngredientsNeeded: number; // Count of new ingredients to buy
}

export type SuggestionReasonType =
  | 'ingredient-overlap'
  | 'nutritional-balance'
  | 'cuisine-match'
  | 'time-efficient'
  | 'variety'
  | 'user-favorite'
  | 'seasonal';

export interface SuggestionReason {
  type: SuggestionReasonType;
  description: string;
  score: number; // Contribution to overall score (0-1)
}

export interface RecipeSuggestion {
  recipe: Recipe;
  score: number; // Overall suggestion score (0-100)
  reasons: SuggestionReason[];
  primaryReason: SuggestionReasonType;
}

export interface WeeklyPlanSuggestion {
  recipes: Recipe[];
  totalUniqueIngredients: number;
  totalIngredientUsages: number;
  efficiencyScore: number; // Higher = more ingredient reuse
  estimatedShoppingItems: number;
}

export interface DaySuggestion {
  date: string; // ISO date
  breakfast?: RecipeSuggestion;
  lunch?: RecipeSuggestion;
  dinner?: RecipeSuggestion;
}

export interface WeekPlan {
  startDate: string; // ISO date (Sunday)
  endDate: string; // ISO date (Saturday)
  days: DaySuggestion[];
  stats: WeeklyPlanSuggestion;
}

export interface SuggestionPreferences {
  dietaryTags?: DietaryTag[];
  maxCookTimeMinutes?: number;
  excludeRecipeIds?: string[];
  preferredMealTypes?: Record<MealSlotType, MealType[]>;
  prioritizeVariety: boolean;
  prioritizeEfficiency: boolean;
}

export interface PairingSuggestionContext {
  existingMeals: {
    date: string;
    mealType: MealSlotType;
    recipe: Recipe;
  }[];
  targetDate: string;
  targetMealType: MealSlotType;
}
