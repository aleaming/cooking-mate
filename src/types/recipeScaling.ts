// Recipe Scaling Types - AI-Powered Scaling

import { RecipeIngredient } from './recipe';

export type ScalingWarningType =
  | 'non-linear'
  | 'minimum-threshold'
  | 'technique-change'
  | 'timing-adjustment'
  | 'equipment-change';

export interface UnitConversion {
  fromUnit: string;
  fromQuantity: number;
  toUnit: string;
  toQuantity: number;
}

export interface ScaledIngredient {
  original: RecipeIngredient;
  scaledQuantity: number | null;
  scaledUnit: string | null;
  displayText: string; // Human-readable (e.g., "1.5 cups")
  wasConverted: boolean; // Was unit simplified/converted?
  conversionNote?: string; // E.g., "24 tbsp converted to 1.5 cups"
}

export interface ScalingWarning {
  ingredientId: string;
  ingredientName: string;
  type: ScalingWarningType;
  message: string;
  suggestion?: string;
}

export interface ScalingResult {
  originalServings: number;
  targetServings: number;
  scaleFactor: number;
  ingredients: ScaledIngredient[];
  warnings: ScalingWarning[];
  aiAdvice?: string; // LLM-generated advice for complex cases
  timingAdjustments?: TimingAdjustment[];
}

export interface TimingAdjustment {
  step: number;
  originalTime?: number;
  adjustedTime?: number;
  note: string;
}

export interface ScalingRequest {
  recipeId: string;
  recipeName: string;
  originalServings: number;
  targetServings: number;
  ingredients: RecipeIngredient[];
  cookingMethod?: string; // Extracted from instructions
}

export interface AIScalingAdvice {
  generalAdvice: string;
  ingredientSpecificAdvice: {
    ingredientId: string;
    ingredientName: string;
    advice: string;
  }[];
  cookingAdjustments: string[];
  timingAdjustments: TimingAdjustment[];
  equipmentNotes?: string[];
}

// Common preset scale factors
export type PresetScaleFactor = 0.5 | 1 | 2 | 4;

export interface ScalingPreset {
  value: PresetScaleFactor;
  label: string; // "½×", "1×", "2×", "4×"
}

export const SCALING_PRESETS: ScalingPreset[] = [
  { value: 0.5, label: '½×' },
  { value: 1, label: '1×' },
  { value: 2, label: '2×' },
  { value: 4, label: '4×' },
];

// Ingredients that don't scale linearly
export const NON_LINEAR_INGREDIENTS = new Set([
  'yeast',
  'active-dry-yeast',
  'instant-yeast',
  'baking-powder',
  'baking-soda',
  'salt',
  'eggs',
  'egg',
  'cayenne',
  'cayenne-pepper',
  'red-pepper-flakes',
  'chili-flakes',
  'hot-sauce',
]);

// Minimum thresholds (can't use less than this)
export const MINIMUM_QUANTITIES: Record<string, { quantity: number; unit: string }> = {
  yeast: { quantity: 0.25, unit: 'tsp' },
  'active-dry-yeast': { quantity: 0.25, unit: 'tsp' },
  'baking-powder': { quantity: 0.25, unit: 'tsp' },
  'baking-soda': { quantity: 0.125, unit: 'tsp' },
  eggs: { quantity: 1, unit: '' },
  egg: { quantity: 1, unit: '' },
};
