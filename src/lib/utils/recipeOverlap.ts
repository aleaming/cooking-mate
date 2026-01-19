// Recipe Overlap Utilities - Smart Suggestions
// Find recipes that pair well together based on shared ingredients

import { allRecipes } from '@/data/recipes';
import { getOverlapMatrix, getMasterIngredients } from '@/lib/data/masterIngredients';
import {
  Recipe,
  RecipePairing,
  RecipeSuggestion,
  SuggestionReason,
  WeeklyPlanSuggestion,
  DaySuggestion,
  SuggestionPreferences,
  PairingSuggestionContext,
  MealSlotType,
  IngredientOverlap,
} from '@/types';

/**
 * Find recipes that pair well with a given recipe
 * Based on shared ingredients for efficient shopping
 */
export function findPairingRecipes(
  recipeId: string,
  limit: number = 5
): RecipePairing[] {
  const overlapMatrix = getOverlapMatrix();
  const overlaps = overlapMatrix.get(recipeId) || [];
  const baseRecipe = allRecipes.find((r) => r.id === recipeId);

  if (!baseRecipe) return [];

  const baseIngredients = new Set(
    baseRecipe.ingredients.map((i) => i.ingredientId)
  );

  return overlaps.slice(0, limit).map((overlap) => {
    const pairedRecipe = allRecipes.find((r) => r.id === overlap.recipeB)!;
    const pairedIngredients = pairedRecipe.ingredients.map((i) => i.ingredientId);
    const newIngredients = pairedIngredients.filter(
      (id) => !baseIngredients.has(id)
    );

    // Get shared ingredient details
    const sharedDetails = overlap.sharedIngredients.map((id) => {
      const ing = pairedRecipe.ingredients.find((i) => i.ingredientId === id);
      return {
        ingredientId: id,
        name: ing?.name || id,
      };
    });

    return {
      recipe: pairedRecipe,
      overlapScore: overlap.overlapScore,
      sharedIngredients: sharedDetails,
      shoppingEfficiency: 1 - newIngredients.length / pairedIngredients.length,
      newIngredientsNeeded: newIngredients.length,
    };
  });
}

/**
 * Find recipes similar to a given recipe
 * For "You might also like" section
 */
export function findSimilarRecipes(
  recipeId: string,
  limit: number = 6
): RecipeSuggestion[] {
  const overlapMatrix = getOverlapMatrix();
  const overlaps = overlapMatrix.get(recipeId) || [];
  const baseRecipe = allRecipes.find((r) => r.id === recipeId);

  if (!baseRecipe) return [];

  return overlaps.slice(0, limit).map((overlap) => {
    const recipe = allRecipes.find((r) => r.id === overlap.recipeB)!;
    const reasons: SuggestionReason[] = [];

    // Add ingredient overlap reason
    if (overlap.overlapScore > 0.3) {
      reasons.push({
        type: 'ingredient-overlap',
        description: `Shares ${overlap.sharedCount} ingredients`,
        score: overlap.overlapScore,
      });
    }

    // Add cuisine match reason
    if (recipe.cuisine === baseRecipe.cuisine) {
      reasons.push({
        type: 'cuisine-match',
        description: `Same ${recipe.cuisine} cuisine`,
        score: 0.3,
      });
    }

    // Add time efficiency reason
    if (recipe.totalTimeMinutes <= baseRecipe.totalTimeMinutes) {
      reasons.push({
        type: 'time-efficient',
        description: `Ready in ${recipe.totalTimeMinutes} min`,
        score: 0.2,
      });
    }

    // Calculate overall score
    const score = Math.min(
      100,
      Math.round(
        reasons.reduce((sum, r) => sum + r.score * 100, 0) / Math.max(reasons.length, 1)
      )
    );

    return {
      recipe,
      score,
      reasons,
      primaryReason: reasons[0]?.type || 'ingredient-overlap',
    };
  });
}

/**
 * Get suggestions for a meal slot based on existing meals
 * Used for calendar pairing suggestions
 */
export function getPairingSuggestions(
  context: PairingSuggestionContext,
  limit: number = 3
): RecipeSuggestion[] {
  const { existingMeals, targetMealType } = context;

  if (existingMeals.length === 0) {
    // No context, suggest popular recipes for the meal type
    return getPopularRecipesForMealType(targetMealType, limit);
  }

  // Collect all ingredients from existing meals
  const existingIngredients = new Set<string>();
  for (const meal of existingMeals) {
    for (const ing of meal.recipe.ingredients) {
      if (ing.ingredientId) existingIngredients.add(ing.ingredientId);
    }
  }

  // Find recipes that share ingredients with existing meals
  const candidates: Array<{ recipe: Recipe; sharedCount: number; newCount: number }> = [];

  for (const recipe of allRecipes) {
    // Filter by meal type if it matters
    if (
      targetMealType === 'breakfast' &&
      recipe.mealType !== 'breakfast' &&
      recipe.mealType !== 'any'
    ) {
      continue;
    }
    if (
      targetMealType === 'dinner' &&
      recipe.mealType !== 'dinner' &&
      recipe.mealType !== 'any'
    ) {
      continue;
    }

    // Skip recipes already in the meal plan
    if (existingMeals.some((m) => m.recipe.id === recipe.id)) {
      continue;
    }

    const recipeIngredients = recipe.ingredients.map((i) => i.ingredientId).filter((id): id is string => id !== null);
    const sharedCount = recipeIngredients.filter((id) =>
      existingIngredients.has(id)
    ).length;
    const newCount = recipeIngredients.filter(
      (id) => !existingIngredients.has(id)
    ).length;

    candidates.push({ recipe, sharedCount, newCount });
  }

  // Sort by shared count (descending) then new count (ascending)
  candidates.sort((a, b) => {
    if (b.sharedCount !== a.sharedCount) {
      return b.sharedCount - a.sharedCount;
    }
    return a.newCount - b.newCount;
  });

  return candidates.slice(0, limit).map((c) => ({
    recipe: c.recipe,
    score: Math.round((c.sharedCount / (c.sharedCount + c.newCount)) * 100),
    reasons: [
      {
        type: 'ingredient-overlap' as const,
        description: `Uses ${c.sharedCount} ingredients you already have`,
        score: c.sharedCount / (c.sharedCount + c.newCount),
      },
    ],
    primaryReason: 'ingredient-overlap' as const,
  }));
}

/**
 * Get popular recipes for a specific meal type
 */
function getPopularRecipesForMealType(
  mealType: MealSlotType,
  limit: number = 3
): RecipeSuggestion[] {
  const mealTypeMapping: Record<MealSlotType, string[]> = {
    breakfast: ['breakfast', 'any'],
    lunch: ['lunch', 'any'],
    dinner: ['dinner', 'any'],
  };

  const validMealTypes = mealTypeMapping[mealType];

  const recipes = allRecipes
    .filter((r) => validMealTypes.includes(r.mealType))
    .slice(0, limit);

  return recipes.map((recipe) => ({
    recipe,
    score: 70,
    reasons: [
      {
        type: 'variety' as const,
        description: 'Popular choice for this meal',
        score: 0.7,
      },
    ],
    primaryReason: 'variety' as const,
  }));
}

/**
 * Suggest an efficient weekly meal plan that maximizes ingredient reuse
 * Uses a greedy algorithm to minimize shopping list size
 */
export function suggestEfficientWeeklyPlan(
  mealCount: number = 7,
  preferences?: SuggestionPreferences
): WeeklyPlanSuggestion {
  const { excludeRecipeIds = [], dietaryTags = [] } = preferences || {};

  // Filter recipes based on preferences
  let availableRecipes = allRecipes.filter((r) => {
    if (excludeRecipeIds.includes(r.id)) return false;
    if (dietaryTags.length > 0) {
      // Recipe must have at least one of the required dietary tags
      const hasTag = dietaryTags.some((tag) => r.dietaryTags.includes(tag));
      if (!hasTag) return false;
    }
    return true;
  });

  const overlapMatrix = getOverlapMatrix();
  const selected: Recipe[] = [];
  const usedIngredients = new Set<string>();

  // Calculate versatility score for each recipe
  // (how well it connects to other recipes)
  const versatilityScores = availableRecipes.map((recipe) => {
    const overlaps = overlapMatrix.get(recipe.id) || [];
    const score = overlaps.reduce((sum, o) => sum + o.overlapScore, 0);
    return { recipe, score };
  });

  // Start with the most versatile recipe
  versatilityScores.sort((a, b) => b.score - a.score);
  if (versatilityScores.length > 0) {
    const first = versatilityScores[0].recipe;
    selected.push(first);
    first.ingredients.forEach((i) => { if (i.ingredientId) usedIngredients.add(i.ingredientId); });
    availableRecipes = availableRecipes.filter((r) => r.id !== first.id);
  }

  // Greedily add recipes that minimize new ingredients
  while (selected.length < mealCount && availableRecipes.length > 0) {
    let bestCandidate: Recipe | null = null;
    let bestNewIngredients = Infinity;
    let bestSharedIngredients = 0;

    for (const recipe of availableRecipes) {
      const newIngredients = recipe.ingredients.filter(
        (i) => i.ingredientId && !usedIngredients.has(i.ingredientId)
      ).length;
      const sharedIngredients = recipe.ingredients.filter((i) =>
        i.ingredientId && usedIngredients.has(i.ingredientId)
      ).length;

      // Prefer recipes with fewer new ingredients and more shared
      if (
        newIngredients < bestNewIngredients ||
        (newIngredients === bestNewIngredients &&
          sharedIngredients > bestSharedIngredients)
      ) {
        bestNewIngredients = newIngredients;
        bestSharedIngredients = sharedIngredients;
        bestCandidate = recipe;
      }
    }

    if (bestCandidate) {
      selected.push(bestCandidate);
      bestCandidate.ingredients.forEach((i) => {
        if (i.ingredientId) usedIngredients.add(i.ingredientId);
      });
      availableRecipes = availableRecipes.filter(
        (r) => r.id !== bestCandidate!.id
      );
    } else {
      break;
    }
  }

  // Calculate statistics
  const totalUsages = selected.reduce((sum, r) => sum + r.ingredients.length, 0);

  return {
    recipes: selected,
    totalUniqueIngredients: usedIngredients.size,
    totalIngredientUsages: totalUsages,
    efficiencyScore: usedIngredients.size > 0 ? totalUsages / usedIngredients.size : 0,
    estimatedShoppingItems: usedIngredients.size,
  };
}

/**
 * Generate a full week plan with meals assigned to slots
 */
export function generateWeekPlan(
  startDate: string,
  preferences?: SuggestionPreferences
): DaySuggestion[] {
  const plan = suggestEfficientWeeklyPlan(21, preferences); // 7 days * 3 meals
  const days: DaySuggestion[] = [];

  // Separate recipes by meal type
  const breakfasts = plan.recipes.filter(
    (r) => r.mealType === 'breakfast' || r.mealType === 'any'
  );
  const lunches = plan.recipes.filter(
    (r) => r.mealType === 'lunch' || r.mealType === 'any'
  );
  const dinners = plan.recipes.filter(
    (r) => r.mealType === 'dinner' || r.mealType === 'any'
  );

  // Assign to days
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    const breakfast = breakfasts[i % breakfasts.length];
    const lunch = lunches[i % lunches.length];
    const dinner = dinners[i % dinners.length];

    days.push({
      date: dateStr,
      breakfast: breakfast
        ? {
            recipe: breakfast,
            score: 80,
            reasons: [{ type: 'variety', description: 'Suggested for variety', score: 0.8 }],
            primaryReason: 'variety',
          }
        : undefined,
      lunch: lunch
        ? {
            recipe: lunch,
            score: 80,
            reasons: [{ type: 'variety', description: 'Suggested for variety', score: 0.8 }],
            primaryReason: 'variety',
          }
        : undefined,
      dinner: dinner
        ? {
            recipe: dinner,
            score: 80,
            reasons: [{ type: 'variety', description: 'Suggested for variety', score: 0.8 }],
            primaryReason: 'variety',
          }
        : undefined,
    });
  }

  return days;
}
