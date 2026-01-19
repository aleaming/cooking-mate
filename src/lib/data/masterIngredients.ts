// Master Ingredient Data - Extracted from all recipes
// Lazy initialization with memoization for performance

import { allRecipes } from '@/data/recipes';
import { MasterIngredient, IngredientOverlap } from '@/types';

// Cached values - computed once on first access
let _masterIngredients: MasterIngredient[] | null = null;
let _overlapMatrix: Map<string, IngredientOverlap[]> | null = null;

/**
 * Generate search aliases for an ingredient name
 * Helps with fuzzy matching when users type variations
 */
function generateAliases(name: string, ingredientId: string): string[] {
  const lower = name.toLowerCase();
  const aliases: string[] = [lower];

  // Add the ingredientId as an alias (without hyphens)
  aliases.push(ingredientId.replace(/-/g, ' '));

  // Common ingredient variations
  const aliasMap: Record<string, string[]> = {
    'greek yogurt': ['yogurt', 'yoghurt', 'greek'],
    'olive oil': ['evoo', 'oil', 'extra virgin'],
    'extra virgin olive oil': ['olive oil', 'evoo', 'oil'],
    'feta cheese': ['feta', 'cheese'],
    'parmesan cheese': ['parmesan', 'parm', 'parmigiano'],
    'red onion': ['onion', 'red'],
    'yellow onion': ['onion', 'yellow'],
    'garlic cloves': ['garlic'],
    'cherry tomatoes': ['tomatoes', 'cherry', 'tomato'],
    'roma tomatoes': ['tomatoes', 'roma', 'tomato'],
    'fresh basil': ['basil', 'fresh'],
    'dried oregano': ['oregano', 'dried'],
    'fresh parsley': ['parsley', 'fresh'],
    'fresh mint': ['mint', 'fresh'],
    'fresh dill': ['dill', 'fresh'],
    'lemon juice': ['lemon', 'juice'],
    'lemon zest': ['lemon', 'zest'],
    'chicken breast': ['chicken', 'breast'],
    'ground lamb': ['lamb', 'ground'],
    'salmon fillets': ['salmon', 'fish'],
    'shrimp': ['prawns', 'seafood'],
    'chickpeas': ['garbanzo', 'beans'],
    'cannellini beans': ['white beans', 'beans'],
    'quinoa': ['grain'],
    'couscous': ['grain'],
    'pita bread': ['pita', 'bread'],
    'flatbread': ['bread', 'flat'],
  };

  // Add specific aliases if we have them
  for (const [key, values] of Object.entries(aliasMap)) {
    if (lower.includes(key) || key.includes(lower)) {
      aliases.push(...values);
    }
  }

  // Add singular/plural variations
  if (lower.endsWith('s') && lower.length > 3) {
    aliases.push(lower.slice(0, -1));
  } else if (!lower.endsWith('s')) {
    aliases.push(lower + 's');
  }

  // Remove duplicates
  return [...new Set(aliases)];
}

/**
 * Build master ingredient list from all recipes
 * Called once on first access, then cached
 */
export function buildMasterIngredientList(): MasterIngredient[] {
  const ingredientMap = new Map<string, MasterIngredient>();

  for (const recipe of allRecipes) {
    for (const ing of recipe.ingredients) {
      // Skip ingredients without an ingredientId (user-imported recipes)
      if (!ing.ingredientId) continue;
      const existing = ingredientMap.get(ing.ingredientId);

      if (existing) {
        // Add recipe ID if not already present
        if (!existing.recipeIds.includes(recipe.id)) {
          existing.recipeIds.push(recipe.id);
          existing.frequency++;
        }
      } else {
        // Create new master ingredient entry
        ingredientMap.set(ing.ingredientId, {
          id: ing.ingredientId,
          name: ing.name,
          category: ing.category,
          aliases: generateAliases(ing.name, ing.ingredientId),
          recipeIds: [recipe.id],
          frequency: 1,
        });
      }
    }
  }

  // Sort by frequency (most common first) for better UX in autocomplete
  return Array.from(ingredientMap.values()).sort(
    (a, b) => b.frequency - a.frequency
  );
}

/**
 * Calculate ingredient overlap between two recipes using Jaccard similarity
 */
export function calculateOverlap(
  recipeAId: string,
  recipeBId: string
): IngredientOverlap | null {
  const recipeA = allRecipes.find((r) => r.id === recipeAId);
  const recipeB = allRecipes.find((r) => r.id === recipeBId);

  if (!recipeA || !recipeB) return null;

  const idsA = new Set(recipeA.ingredients.map((i) => i.ingredientId).filter((id): id is string => id !== null));
  const idsB = new Set(recipeB.ingredients.map((i) => i.ingredientId).filter((id): id is string => id !== null));

  const sharedIngredients = [...idsA].filter((id) => idsB.has(id));
  const totalUnique = new Set([...idsA, ...idsB]).size;

  // Jaccard similarity coefficient: intersection / union
  const overlapScore = totalUnique > 0 ? sharedIngredients.length / totalUnique : 0;

  return {
    recipeA: recipeAId,
    recipeB: recipeBId,
    sharedIngredients,
    overlapScore,
    sharedCount: sharedIngredients.length,
    totalUniqueIngredients: totalUnique,
  };
}

/**
 * Build overlap matrix for all recipe pairs
 * Precomputed for fast suggestions
 */
export function buildOverlapMatrix(): Map<string, IngredientOverlap[]> {
  const matrix = new Map<string, IngredientOverlap[]>();

  for (let i = 0; i < allRecipes.length; i++) {
    const overlaps: IngredientOverlap[] = [];

    for (let j = 0; j < allRecipes.length; j++) {
      if (i !== j) {
        const overlap = calculateOverlap(allRecipes[i].id, allRecipes[j].id);
        if (overlap) {
          overlaps.push(overlap);
        }
      }
    }

    // Sort by overlap score descending (best matches first)
    matrix.set(
      allRecipes[i].id,
      overlaps.sort((a, b) => b.overlapScore - a.overlapScore)
    );
  }

  return matrix;
}

// ============== Public API with lazy initialization ==============

/**
 * Get the master ingredient list (cached)
 */
export function getMasterIngredients(): MasterIngredient[] {
  if (!_masterIngredients) {
    _masterIngredients = buildMasterIngredientList();
  }
  return _masterIngredients;
}

/**
 * Get the recipe overlap matrix (cached)
 */
export function getOverlapMatrix(): Map<string, IngredientOverlap[]> {
  if (!_overlapMatrix) {
    _overlapMatrix = buildOverlapMatrix();
  }
  return _overlapMatrix;
}

/**
 * Get ingredient by ID
 */
export function getIngredientById(id: string): MasterIngredient | undefined {
  return getMasterIngredients().find((ing) => ing.id === id);
}

/**
 * Get ingredients by category
 */
export function getIngredientsByCategory(
  category: MasterIngredient['category']
): MasterIngredient[] {
  return getMasterIngredients().filter((ing) => ing.category === category);
}

/**
 * Get statistics about the ingredient database
 */
export function getIngredientStats() {
  const ingredients = getMasterIngredients();

  const byCategory = ingredients.reduce(
    (acc, ing) => {
      acc[ing.category] = (acc[ing.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    totalUniqueIngredients: ingredients.length,
    totalRecipes: allRecipes.length,
    mostCommon: ingredients.slice(0, 10).map((i) => ({
      name: i.name,
      frequency: i.frequency,
    })),
    byCategory,
  };
}

/**
 * Clear the cache (useful for testing or when recipes change)
 */
export function clearIngredientCache(): void {
  _masterIngredients = null;
  _overlapMatrix = null;
}
