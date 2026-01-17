import { RecipeIngredient, IngredientCategory, AggregatedIngredient, ShoppingListByCategory } from '@/types';

// Category display order and labels
export const categoryOrder: IngredientCategory[] = [
  'produce',
  'protein',
  'seafood',
  'dairy',
  'grains',
  'pantry',
  'oils-vinegars',
  'herbs-spices',
  'nuts-seeds',
  'beverages',
  'other',
];

export const categoryLabels: Record<IngredientCategory, string> = {
  produce: 'Produce',
  protein: 'Meat & Protein',
  seafood: 'Seafood',
  dairy: 'Dairy & Eggs',
  grains: 'Grains & Bread',
  pantry: 'Pantry Staples',
  'oils-vinegars': 'Oils & Vinegars',
  'herbs-spices': 'Herbs & Spices',
  'nuts-seeds': 'Nuts & Seeds',
  beverages: 'Beverages',
  other: 'Other',
};

// Unit conversion to normalize quantities
const unitConversions: Record<string, { base: string; factor: number }> = {
  tbsp: { base: 'tbsp', factor: 1 },
  tablespoon: { base: 'tbsp', factor: 1 },
  tablespoons: { base: 'tbsp', factor: 1 },
  tsp: { base: 'tsp', factor: 1 },
  teaspoon: { base: 'tsp', factor: 1 },
  teaspoons: { base: 'tsp', factor: 1 },
  cup: { base: 'cup', factor: 1 },
  cups: { base: 'cup', factor: 1 },
  oz: { base: 'oz', factor: 1 },
  ounce: { base: 'oz', factor: 1 },
  ounces: { base: 'oz', factor: 1 },
  lb: { base: 'lb', factor: 1 },
  lbs: { base: 'lb', factor: 1 },
  pound: { base: 'lb', factor: 1 },
  pounds: { base: 'lb', factor: 1 },
  g: { base: 'g', factor: 1 },
  gram: { base: 'g', factor: 1 },
  grams: { base: 'g', factor: 1 },
  medium: { base: 'medium', factor: 1 },
  large: { base: 'large', factor: 1 },
  small: { base: 'small', factor: 1 },
  cloves: { base: 'cloves', factor: 1 },
  clove: { base: 'cloves', factor: 1 },
  pieces: { base: 'pieces', factor: 1 },
  piece: { base: 'pieces', factor: 1 },
  stalks: { base: 'stalks', factor: 1 },
  stalk: { base: 'stalks', factor: 1 },
  slices: { base: 'slices', factor: 1 },
  slice: { base: 'slices', factor: 1 },
};

function normalizeUnit(unit: string | null): string {
  if (!unit) return '';
  const lower = unit.toLowerCase().trim();
  return unitConversions[lower]?.base || lower;
}

/**
 * Aggregate ingredients from multiple recipe ingredients
 * Combines quantities for the same ingredient with the same unit
 */
export function aggregateIngredients(
  ingredients: Array<{ ingredient: RecipeIngredient; servings: number; recipeId: string }>
): AggregatedIngredient[] {
  const aggregated = new Map<string, AggregatedIngredient>();

  for (const { ingredient, servings, recipeId } of ingredients) {
    const normalizedUnit = normalizeUnit(ingredient.unit);
    const key = `${ingredient.name.toLowerCase()}-${normalizedUnit}`;

    if (aggregated.has(key)) {
      const existing = aggregated.get(key)!;
      if (ingredient.quantity !== null && existing.totalQuantity !== null) {
        existing.totalQuantity += ingredient.quantity * servings;
      }
      if (!existing.sourceRecipeIds.includes(recipeId)) {
        existing.sourceRecipeIds.push(recipeId);
      }
    } else {
      aggregated.set(key, {
        ingredientId: ingredient.ingredientId,
        name: ingredient.name,
        category: ingredient.category,
        totalQuantity: ingredient.quantity !== null ? ingredient.quantity * servings : null,
        unit: normalizedUnit || null,
        sourceRecipeIds: [recipeId],
      });
    }
  }

  return Array.from(aggregated.values());
}

/**
 * Group aggregated ingredients by category
 */
export function groupByCategory(ingredients: AggregatedIngredient[]): ShoppingListByCategory[] {
  const grouped = new Map<IngredientCategory, AggregatedIngredient[]>();

  // Initialize all categories
  for (const category of categoryOrder) {
    grouped.set(category, []);
  }

  // Group ingredients
  for (const ingredient of ingredients) {
    const category = ingredient.category || 'other';
    const list = grouped.get(category) || [];
    list.push(ingredient);
    grouped.set(category, list);
  }

  // Convert to array and filter empty categories
  return categoryOrder
    .filter((category) => (grouped.get(category) || []).length > 0)
    .map((category) => ({
      category,
      categoryLabel: categoryLabels[category],
      items: (grouped.get(category) || []).map((ing) => ({
        id: `${ing.ingredientId}-${ing.unit || 'unit'}`,
        shoppingListId: '',
        ingredientId: ing.ingredientId,
        ingredientName: ing.name,
        category: ing.category,
        totalQuantity: ing.totalQuantity,
        unit: ing.unit,
        isChecked: false,
        isManual: false,
        sourceRecipeIds: ing.sourceRecipeIds,
        createdAt: new Date().toISOString(),
      })),
    }));
}

/**
 * Format quantity for display
 */
export function formatQuantity(quantity: number | null, unit: string | null): string {
  if (quantity === null) {
    return 'to taste';
  }

  // Format the number nicely
  let formattedQty: string;
  if (quantity === Math.floor(quantity)) {
    formattedQty = quantity.toString();
  } else {
    // Convert to fractions for common values
    const fractions: Record<number, string> = {
      0.25: '¼',
      0.33: '⅓',
      0.5: '½',
      0.67: '⅔',
      0.75: '¾',
    };
    const decimal = quantity - Math.floor(quantity);
    const fraction = fractions[Math.round(decimal * 100) / 100];

    if (fraction && Math.floor(quantity) === 0) {
      formattedQty = fraction;
    } else if (fraction) {
      formattedQty = `${Math.floor(quantity)} ${fraction}`;
    } else {
      formattedQty = quantity.toFixed(1).replace(/\.0$/, '');
    }
  }

  if (unit) {
    return `${formattedQty} ${unit}`;
  }
  return formattedQty;
}
