// Recipe Types

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'any';
export type Difficulty = 'easy' | 'medium' | 'hard';

export type DietaryTag =
  | 'vegetarian'
  | 'vegan'
  | 'gluten-free'
  | 'dairy-free'
  | 'nut-free'
  | 'low-carb'
  | 'high-protein';

export type IngredientCategory =
  | 'produce'
  | 'dairy'
  | 'protein'
  | 'grains'
  | 'pantry'
  | 'oils-vinegars'
  | 'herbs-spices'
  | 'nuts-seeds'
  | 'seafood'
  | 'beverages'
  | 'other';

export interface Ingredient {
  id: string;
  name: string;
  category: IngredientCategory;
  defaultUnit?: string;
}

export interface RecipeIngredient {
  id: string;
  ingredientId: string;
  name: string;
  category: IngredientCategory;
  quantity: number | null; // null for "to taste"
  unit: string | null;
  preparation?: string; // "diced", "minced", etc.
  notes?: string; // "optional", etc.
}

export interface Instruction {
  step: number;
  text: string;
  duration?: number; // minutes, optional
  tip?: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number; // grams
  carbohydrates: number; // grams
  fat: number; // grams
  fiber: number; // grams
  sodium?: number; // mg
  sugar?: number; // grams
}

export interface Recipe {
  id: string;
  slug: string;
  name: string;
  description: string;
  imageUrl: string;

  // Timing
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  totalTimeMinutes: number;

  // Serving
  servings: number;

  // Categorization
  mealType: MealType;
  cuisine: string;
  dietaryTags: DietaryTag[];
  difficulty: Difficulty;

  // Content
  ingredients: RecipeIngredient[];
  instructions: Instruction[];
  tips?: string;

  // Nutrition
  nutrition?: NutritionInfo;

  // Metadata
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

// For seeding/creating recipes without id and timestamps
export interface RecipeSeedData extends Omit<Recipe, 'id' | 'totalTimeMinutes' | 'createdAt' | 'updatedAt'> {}
