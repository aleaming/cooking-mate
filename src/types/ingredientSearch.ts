// Ingredient Search Types - Pantry Finder

import { Recipe, IngredientCategory } from './recipe';

export interface MasterIngredient {
  id: string; // Normalized ingredient ID (e.g., "olive-oil")
  name: string; // Display name (e.g., "Olive oil")
  category: IngredientCategory;
  aliases: string[]; // Alternative names for fuzzy matching
  recipeIds: string[]; // Recipes that use this ingredient
  frequency: number; // How many recipes use this
}

export interface IngredientSearchState {
  selectedIngredients: string[]; // Array of ingredientIds
  searchQuery: string; // Current text input
}

export interface RecipeMatch {
  recipeId: string;
  recipe: Recipe;
  matchedIngredients: string[]; // ingredientIds that matched
  missingIngredients: string[]; // ingredientIds not available
  matchPercentage: number; // 0-100
  missingCount: number;
}

export interface IngredientMatchResult {
  matches: RecipeMatch[];
  totalRecipes: number;
  perfectMatches: number; // 100% match count
  goodMatches: number; // 75%+ match count
  partialMatches: number; // 50-74% match count
}

export interface IngredientSuggestion {
  ingredient: MasterIngredient;
  unlockCount: number; // How many new recipes would be fully available
  improveCount: number; // How many recipes would improve in match %
}

export interface PantryFinderPreferences {
  includePartialMatches: boolean;
  minimumMatchPercentage: number; // Default: 50
  sortBy: 'matchPercentage' | 'missingCount' | 'cookTime' | 'name';
  sortDirection: 'asc' | 'desc';
}
