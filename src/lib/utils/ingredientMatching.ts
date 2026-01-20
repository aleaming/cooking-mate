// Ingredient Matching Utilities - Pantry Finder
// Find recipes based on available ingredients

import { allRecipes } from '@/data/recipes';
import { getMasterIngredients } from '@/lib/data/masterIngredients';
import {
  MasterIngredient,
  RecipeMatch,
  IngredientMatchResult,
  IngredientSuggestion,
  PantryFinderPreferences,
} from '@/types';

/**
 * Fuzzy search ingredients by name or alias
 * Returns matching ingredients sorted by relevance
 */
export function searchIngredients(
  query: string,
  masterList?: MasterIngredient[],
  limit: number = 20
): MasterIngredient[] {
  const ingredients = masterList || getMasterIngredients();
  const lowerQuery = query.toLowerCase().trim();

  // Return top ingredients by frequency if no query
  if (!lowerQuery) {
    return ingredients.slice(0, limit);
  }

  // Score each ingredient by match quality
  const scored = ingredients.map((ing) => {
    let score = 0;

    // Exact name match (highest priority)
    if (ing.name.toLowerCase() === lowerQuery) {
      score = 100;
    }
    // Name starts with query
    else if (ing.name.toLowerCase().startsWith(lowerQuery)) {
      score = 80;
    }
    // Name contains query
    else if (ing.name.toLowerCase().includes(lowerQuery)) {
      score = 60;
    }
    // ID matches
    else if (ing.id.includes(lowerQuery.replace(/\s+/g, '-'))) {
      score = 50;
    }
    // Alias matches
    else if (ing.aliases.some((alias) => alias.includes(lowerQuery))) {
      score = 40;
    }
    // Alias starts with query
    else if (ing.aliases.some((alias) => alias.startsWith(lowerQuery))) {
      score = 45;
    }

    // Boost by frequency (common ingredients rank higher)
    if (score > 0) {
      score += Math.min(ing.frequency * 2, 10);
    }

    return { ingredient: ing, score };
  });

  // Filter out non-matches and sort by score
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.ingredient);
}

/**
 * Find recipes that match available ingredients
 * Returns recipes sorted by match percentage
 */
export function findMatchingRecipes(
  availableIngredients: Set<string> | string[],
  options: Partial<PantryFinderPreferences> = {}
): IngredientMatchResult {
  const {
    minimumMatchPercentage = 0,
    sortBy = 'matchPercentage',
    sortDirection = 'desc',
  } = options;

  // Convert to Set if array provided
  const ingredientSet =
    availableIngredients instanceof Set
      ? availableIngredients
      : new Set(availableIngredients);

  const matches: RecipeMatch[] = [];

  for (const recipe of allRecipes) {
    const recipeIngredientIds = recipe.ingredients.map((i) => i.ingredientId).filter((id): id is string => id !== null);
    const matchedIds = recipeIngredientIds.filter((id) => ingredientSet.has(id));
    const missingIds = recipeIngredientIds.filter((id) => !ingredientSet.has(id));
    const percentage =
      recipeIngredientIds.length > 0
        ? (matchedIds.length / recipeIngredientIds.length) * 100
        : 0;

    if (percentage >= minimumMatchPercentage) {
      matches.push({
        recipeId: recipe.id,
        recipe,
        matchedIngredients: matchedIds,
        missingIngredients: missingIds,
        matchPercentage: Math.round(percentage),
        missingCount: missingIds.length,
      });
    }
  }

  // Sort based on preferences
  matches.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'matchPercentage':
        comparison = a.matchPercentage - b.matchPercentage;
        break;
      case 'missingCount':
        comparison = a.missingCount - b.missingCount;
        break;
      case 'cookTime':
        comparison = a.recipe.totalTimeMinutes - b.recipe.totalTimeMinutes;
        break;
      case 'name':
        comparison = a.recipe.name.localeCompare(b.recipe.name);
        break;
    }

    return sortDirection === 'desc' ? -comparison : comparison;
  });

  return {
    matches,
    totalRecipes: allRecipes.length,
    perfectMatches: matches.filter((m) => m.matchPercentage === 100).length,
    goodMatches: matches.filter((m) => m.matchPercentage >= 75).length,
    partialMatches: matches.filter(
      (m) => m.matchPercentage >= 50 && m.matchPercentage < 75
    ).length,
  };
}

/**
 * Suggest ingredients that would unlock the most new recipes
 * Helps users decide what to buy next
 */
export function suggestNextIngredients(
  currentIngredients: Set<string> | string[],
  limit: number = 5
): IngredientSuggestion[] {
  const ingredientSet =
    currentIngredients instanceof Set
      ? currentIngredients
      : new Set(currentIngredients);

  const masterList = getMasterIngredients();

  // Find recipes that are close to being unlocked (missing 1-3 ingredients)
  const currentMatches = findMatchingRecipes(ingredientSet, {
    minimumMatchPercentage: 50,
  });

  // Track how much each ingredient would help
  const ingredientImpact = new Map<
    string,
    { unlockCount: number; improveCount: number }
  >();

  for (const match of currentMatches.matches) {
    // Skip perfect matches
    if (match.matchPercentage === 100) continue;

    // Only consider recipes missing 1-3 ingredients (close to unlock)
    if (match.missingCount > 3) continue;

    for (const missingId of match.missingIngredients) {
      const current = ingredientImpact.get(missingId) || {
        unlockCount: 0,
        improveCount: 0,
      };

      // Would this ingredient unlock the recipe (make it 100%)?
      if (match.missingCount === 1) {
        current.unlockCount++;
      }
      // Would it improve the match?
      current.improveCount++;

      ingredientImpact.set(missingId, current);
    }
  }

  // Build suggestions from ingredients not already selected
  const suggestions: IngredientSuggestion[] = [];

  for (const ingredient of masterList) {
    if (ingredientSet.has(ingredient.id)) continue;

    const impact = ingredientImpact.get(ingredient.id);
    if (!impact) continue;

    suggestions.push({
      ingredient,
      unlockCount: impact.unlockCount,
      improveCount: impact.improveCount,
    });
  }

  // Sort by unlock count (primary) then improve count (secondary)
  return suggestions
    .sort((a, b) => {
      if (b.unlockCount !== a.unlockCount) {
        return b.unlockCount - a.unlockCount;
      }
      return b.improveCount - a.improveCount;
    })
    .slice(0, limit);
}

/**
 * Get recipes that can be made with only common pantry staples
 * Useful for "quick meal" suggestions
 */
export function getEasyRecipes(maxMissingIngredients: number = 3): RecipeMatch[] {
  // Common Mediterranean pantry staples that most people have
  const pantryStaples = new Set([
    'olive-oil',
    'salt',
    'black-pepper',
    'garlic',
    'onion',
    'lemon',
    'dried-oregano',
    'cumin',
    'paprika',
  ]);

  const result = findMatchingRecipes(pantryStaples, {
    minimumMatchPercentage: 0,
    sortBy: 'missingCount',
    sortDirection: 'asc',
  });

  return result.matches.filter((m) => m.missingCount <= maxMissingIngredients);
}

/**
 * Check if a recipe can be made with available ingredients
 */
export function canMakeRecipe(
  recipeId: string,
  availableIngredients: Set<string> | string[]
): { canMake: boolean; matchPercentage: number; missing: string[] } {
  const ingredientSet =
    availableIngredients instanceof Set
      ? availableIngredients
      : new Set(availableIngredients);

  const recipe = allRecipes.find((r) => r.id === recipeId);
  if (!recipe) {
    return { canMake: false, matchPercentage: 0, missing: [] };
  }

  const recipeIngredientIds = recipe.ingredients.map((i) => i.ingredientId).filter((id): id is string => id !== null);
  const missing = recipeIngredientIds.filter((id) => !ingredientSet.has(id));
  const matchPercentage = recipeIngredientIds.length > 0
    ? Math.round(((recipeIngredientIds.length - missing.length) / recipeIngredientIds.length) * 100)
    : 0;

  return {
    canMake: missing.length === 0,
    matchPercentage,
    missing,
  };
}

/**
 * Get the most common ingredients across all recipes
 * Useful for quick-start ingredient selection
 */
export function getMostCommonIngredients(limit: number = 8): MasterIngredient[] {
  const masterList = getMasterIngredients();

  // Sort by frequency (number of recipes that use this ingredient)
  return [...masterList]
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, limit);
}
