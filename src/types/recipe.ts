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
  ingredientId: string | null; // null for user-imported ingredients without master link
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

// Recipe Photo types for user-uploaded images
export interface RecipePhoto {
  id: string;
  url: string;
  thumbnailUrl?: string;
  standardUrl?: string;
  isPrimary: boolean;
  sortOrder: number;
  createdAt?: string;
}

// Source types for imported recipes
export type RecipeSourceType = 'manual' | 'markdown' | 'url_import';

// User-created recipe with ownership and source tracking
export interface UserRecipe extends Recipe {
  ownerId: string;
  sourceUrl?: string;
  sourceType: RecipeSourceType;
  photos: RecipePhoto[];
  isSystem: false;
  isPublic: boolean;
}

// Parsed ingredient from markdown or URL scraping
export interface ParsedIngredient {
  text: string; // Full original text (e.g., "2 cups flour, sifted")
  quantity?: number;
  unit?: string;
  name?: string;
  preparation?: string;
  notes?: string;
}

// Parsed instruction from markdown or URL scraping
export interface ParsedInstruction {
  step: number;
  text: string;
  duration?: number;
  tip?: string;
}

// Data structure for imported recipes (before conversion to full Recipe)
export interface ImportedRecipeData {
  title: string;
  description?: string;
  ingredients: ParsedIngredient[];
  instructions: ParsedInstruction[];
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  sourceUrl?: string;
  imageUrl?: string;
  cuisine?: string;
  dietaryTags?: DietaryTag[];
  difficulty?: Difficulty;
  mealType?: MealType;
}

// Input for creating a user recipe
export interface CreateRecipeInput {
  name: string;
  slug?: string;
  description: string;
  ingredients: RecipeIngredient[];
  instructions: Instruction[];
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  servings: number;
  mealType: MealType;
  cuisine?: string;
  dietaryTags?: DietaryTag[];
  difficulty?: Difficulty;
  tips?: string;
  nutrition?: NutritionInfo;
  sourceUrl?: string;
  sourceType?: RecipeSourceType;
  imageUrl?: string;
}

// Input for updating a user recipe
export interface UpdateRecipeInput extends Partial<CreateRecipeInput> {
  id: string;
}
