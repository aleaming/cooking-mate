// Recipe Scaling Utilities - AI-Powered Scaling
// Smart unit conversion and scaling with edge case handling

import { formatQuantity } from './ingredients';
import {
  RecipeIngredient,
  ScaledIngredient,
  ScalingResult,
  ScalingWarning,
  ScalingWarningType,
  TimingAdjustment,
  NON_LINEAR_INGREDIENTS,
  MINIMUM_QUANTITIES,
} from '@/types';

// Volume unit conversions (in teaspoons as base unit)
const VOLUME_TO_TSP: Record<string, number> = {
  tsp: 1,
  teaspoon: 1,
  tbsp: 3,
  tablespoon: 3,
  cup: 48, // 16 tbsp = 48 tsp
  'fl oz': 6,
  ml: 0.2,
  l: 200,
};

// Weight unit conversions (in grams as base unit)
const WEIGHT_TO_G: Record<string, number> = {
  g: 1,
  gram: 1,
  grams: 1,
  oz: 28.35,
  ounce: 28.35,
  lb: 453.6,
  lbs: 453.6,
  pound: 453.6,
  kg: 1000,
};

// Preferred units for display (volume)
const VOLUME_DISPLAY_PREFERENCE = [
  { unit: 'cup', minTsp: 24 }, // Show cups for 0.5 cups or more
  { unit: 'tbsp', minTsp: 3 }, // Show tbsp for 1+ tbsp
  { unit: 'tsp', minTsp: 0 }, // Fallback to tsp
];

// Preferred units for display (weight)
const WEIGHT_DISPLAY_PREFERENCE = [
  { unit: 'lb', minG: 453.6 }, // Show lbs for 1+ lb
  { unit: 'oz', minG: 28.35 }, // Show oz for 1+ oz
  { unit: 'g', minG: 0 }, // Fallback to grams
];

/**
 * Check if a unit is a volume measurement
 */
function isVolumeUnit(unit: string): boolean {
  return unit.toLowerCase() in VOLUME_TO_TSP;
}

/**
 * Check if a unit is a weight measurement
 */
function isWeightUnit(unit: string): boolean {
  return unit.toLowerCase() in WEIGHT_TO_G;
}

/**
 * Convert a quantity to teaspoons (for volume units)
 */
function toTeaspoons(quantity: number, unit: string): number | null {
  const factor = VOLUME_TO_TSP[unit.toLowerCase()];
  return factor ? quantity * factor : null;
}

/**
 * Convert a quantity to grams (for weight units)
 */
function toGrams(quantity: number, unit: string): number | null {
  const factor = WEIGHT_TO_G[unit.toLowerCase()];
  return factor ? quantity * factor : null;
}

/**
 * Simplify a volume quantity to the most readable unit
 */
function simplifyVolume(tsp: number): { quantity: number; unit: string; note?: string } {
  for (const pref of VOLUME_DISPLAY_PREFERENCE) {
    if (tsp >= pref.minTsp) {
      const factor = VOLUME_TO_TSP[pref.unit];
      const quantity = tsp / factor;

      // Round to reasonable precision
      const rounded = Math.round(quantity * 4) / 4; // Round to nearest 1/4

      if (rounded > 0) {
        return {
          quantity: rounded,
          unit: pref.unit,
          note: pref.unit !== 'tsp' ? `Converted for readability` : undefined,
        };
      }
    }
  }

  return { quantity: tsp, unit: 'tsp' };
}

/**
 * Simplify a weight quantity to the most readable unit
 */
function simplifyWeight(g: number): { quantity: number; unit: string; note?: string } {
  for (const pref of WEIGHT_DISPLAY_PREFERENCE) {
    if (g >= pref.minG) {
      const factor = WEIGHT_TO_G[pref.unit];
      const quantity = g / factor;

      // Round to reasonable precision
      const rounded = Math.round(quantity * 4) / 4;

      if (rounded > 0) {
        return {
          quantity: rounded,
          unit: pref.unit,
          note: pref.unit !== 'g' ? `Converted for readability` : undefined,
        };
      }
    }
  }

  return { quantity: Math.round(g), unit: 'g' };
}

/**
 * Simplify a quantity and unit to a more readable format
 * Converts awkward amounts like "24 tbsp" to "1.5 cups"
 */
export function simplifyQuantity(
  quantity: number,
  unit: string
): { quantity: number; unit: string; note?: string } {
  const lowerUnit = unit.toLowerCase();

  // Try volume conversion
  const tsp = toTeaspoons(quantity, lowerUnit);
  if (tsp !== null) {
    const original = `${quantity} ${unit}`;
    const simplified = simplifyVolume(tsp);

    // Only report conversion if unit actually changed
    if (simplified.unit !== lowerUnit && simplified.note) {
      simplified.note = `${original} converted to ${simplified.quantity} ${simplified.unit}`;
    }

    return simplified;
  }

  // Try weight conversion
  const g = toGrams(quantity, lowerUnit);
  if (g !== null) {
    const original = `${quantity} ${unit}`;
    const simplified = simplifyWeight(g);

    if (simplified.unit !== lowerUnit && simplified.note) {
      simplified.note = `${original} converted to ${simplified.quantity} ${simplified.unit}`;
    }

    return simplified;
  }

  // Non-convertible units (pieces, cloves, etc.) - just round nicely
  let roundedQuantity = quantity;

  // Round to sensible values
  if (quantity < 1) {
    roundedQuantity = Math.round(quantity * 4) / 4; // Round to 1/4
  } else if (quantity < 10) {
    roundedQuantity = Math.round(quantity * 2) / 2; // Round to 1/2
  } else {
    roundedQuantity = Math.round(quantity);
  }

  return { quantity: roundedQuantity, unit };
}

/**
 * Check if an ingredient needs special handling when scaling
 */
function checkScalingWarning(
  ingredient: RecipeIngredient,
  scaleFactor: number,
  scaledQuantity: number | null
): ScalingWarning | null {
  const id = ingredient.ingredientId;

  // Skip ingredients without an ingredientId
  if (!id) return null;

  // Check for non-linear ingredients
  if (NON_LINEAR_INGREDIENTS.has(id)) {
    if (scaleFactor > 2) {
      return {
        ingredientId: id,
        ingredientName: ingredient.name,
        type: 'non-linear',
        message: `${ingredient.name} doesn't scale linearly for large batches`,
        suggestion:
          scaleFactor > 3
            ? 'Use 70-80% of calculated amount and adjust to taste'
            : 'You may need slightly less than calculated',
      };
    }
    if (scaleFactor < 0.5) {
      return {
        ingredientId: id,
        ingredientName: ingredient.name,
        type: 'non-linear',
        message: `${ingredient.name} may be difficult to measure accurately at this scale`,
        suggestion: 'Consider rounding up slightly for better results',
      };
    }
  }

  // Check minimum thresholds
  const minThreshold = MINIMUM_QUANTITIES[id];
  if (minThreshold && scaledQuantity !== null) {
    if (scaledQuantity < minThreshold.quantity) {
      return {
        ingredientId: id,
        ingredientName: ingredient.name,
        type: 'minimum-threshold',
        message: `${ingredient.name} quantity is below usable minimum`,
        suggestion: `Use at least ${minThreshold.quantity} ${minThreshold.unit}`,
      };
    }
  }

  return null;
}

/**
 * Scale a single ingredient with smart conversion
 */
export function scaleIngredient(
  ingredient: RecipeIngredient,
  scaleFactor: number
): ScaledIngredient {
  // Handle "to taste" ingredients
  if (ingredient.quantity === null) {
    return {
      original: ingredient,
      scaledQuantity: null,
      scaledUnit: ingredient.unit,
      displayText: 'to taste',
      wasConverted: false,
    };
  }

  // Calculate raw scaled quantity
  const rawScaled = ingredient.quantity * scaleFactor;

  // Simplify the quantity and unit if possible
  const unit = ingredient.unit || '';
  const simplified = simplifyQuantity(rawScaled, unit);

  return {
    original: ingredient,
    scaledQuantity: simplified.quantity,
    scaledUnit: simplified.unit,
    displayText: formatQuantity(simplified.quantity, simplified.unit || null),
    wasConverted: simplified.note !== undefined,
    conversionNote: simplified.note,
  };
}

/**
 * Scale an entire recipe
 */
export function scaleRecipe(
  ingredients: RecipeIngredient[],
  originalServings: number,
  targetServings: number
): ScalingResult {
  const scaleFactor = targetServings / originalServings;
  const scaledIngredients: ScaledIngredient[] = [];
  const warnings: ScalingWarning[] = [];

  for (const ingredient of ingredients) {
    const scaled = scaleIngredient(ingredient, scaleFactor);
    scaledIngredients.push(scaled);

    // Check for warnings
    const warning = checkScalingWarning(ingredient, scaleFactor, scaled.scaledQuantity);
    if (warning) {
      warnings.push(warning);
    }
  }

  // Add general warnings for extreme scaling
  if (scaleFactor > 4) {
    warnings.push({
      ingredientId: '__general__',
      ingredientName: 'General',
      type: 'technique-change',
      message: 'Scaling more than 4x may require technique adjustments',
      suggestion: 'Consider cooking in batches for best results',
    });
  }

  if (scaleFactor < 0.5) {
    warnings.push({
      ingredientId: '__general__',
      ingredientName: 'General',
      type: 'timing-adjustment',
      message: 'Smaller portions may cook faster',
      suggestion: 'Check doneness 20-30% earlier than original timing',
    });
  }

  // Generate timing adjustments for significant scaling
  const timingAdjustments: TimingAdjustment[] = [];
  if (scaleFactor >= 2) {
    timingAdjustments.push({
      step: 0,
      note: `Cooking time may increase by ${Math.round((scaleFactor - 1) * 10)}% for larger quantities`,
    });
  } else if (scaleFactor <= 0.5) {
    timingAdjustments.push({
      step: 0,
      note: `Cooking time may decrease by ${Math.round((1 - scaleFactor) * 30)}% for smaller quantities`,
    });
  }

  return {
    originalServings,
    targetServings,
    scaleFactor,
    ingredients: scaledIngredients,
    warnings,
    timingAdjustments: timingAdjustments.length > 0 ? timingAdjustments : undefined,
  };
}

/**
 * Get a recommended scale factor for common scenarios
 */
export function getRecommendedScaleFactor(
  currentServings: number,
  scenario: 'half' | 'double' | 'dinner-party' | 'meal-prep'
): number {
  switch (scenario) {
    case 'half':
      return 0.5;
    case 'double':
      return 2;
    case 'dinner-party':
      return Math.max(2, Math.ceil(8 / currentServings));
    case 'meal-prep':
      return Math.max(3, Math.ceil(12 / currentServings));
    default:
      return 1;
  }
}

/**
 * Calculate the target servings from a scale factor
 */
export function calculateTargetServings(
  originalServings: number,
  scaleFactor: number
): number {
  return Math.round(originalServings * scaleFactor);
}

/**
 * Format a scale factor for display
 */
export function formatScaleFactor(scaleFactor: number): string {
  if (scaleFactor === 0.5) return '½×';
  if (scaleFactor === 1) return '1×';
  if (scaleFactor === 2) return '2×';
  if (scaleFactor === 4) return '4×';
  if (scaleFactor === Math.floor(scaleFactor)) {
    return `${scaleFactor}×`;
  }
  return `${scaleFactor.toFixed(1)}×`;
}

/**
 * Determine if AI advice would be helpful for this scaling
 */
export function shouldSuggestAIAdvice(result: ScalingResult): boolean {
  // Suggest AI advice if there are warnings or extreme scaling
  return (
    result.warnings.length > 0 ||
    result.scaleFactor > 3 ||
    result.scaleFactor < 0.5
  );
}
