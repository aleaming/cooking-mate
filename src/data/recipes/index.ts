import { Recipe } from '@/types';
import { breakfastRecipes } from './breakfast';
import { lunchRecipes } from './lunch';
import { dinnerRecipes } from './dinner';

// Combine all recipes
export const allRecipes: Recipe[] = [
  ...breakfastRecipes,
  ...lunchRecipes,
  ...dinnerRecipes,
];

// Export by category
export { breakfastRecipes } from './breakfast';
export { lunchRecipes } from './lunch';
export { dinnerRecipes } from './dinner';

// Helper function to get recipe by ID
export function getRecipeById(id: string): Recipe | undefined {
  return allRecipes.find((recipe) => recipe.id === id);
}

// Helper function to get recipe by slug
export function getRecipeBySlug(slug: string): Recipe | undefined {
  return allRecipes.find((recipe) => recipe.slug === slug);
}

// Helper function to get featured recipes
export function getFeaturedRecipes(): Recipe[] {
  return allRecipes.filter((recipe) => recipe.isFeatured);
}

// Helper function to get recipes by meal type
export function getRecipesByMealType(mealType: Recipe['mealType']): Recipe[] {
  return allRecipes.filter((recipe) => recipe.mealType === mealType);
}

// Helper function to search recipes
export function searchRecipes(query: string): Recipe[] {
  const lowerQuery = query.toLowerCase();
  return allRecipes.filter(
    (recipe) =>
      recipe.name.toLowerCase().includes(lowerQuery) ||
      recipe.description.toLowerCase().includes(lowerQuery) ||
      recipe.ingredients.some((ing) =>
        ing.name.toLowerCase().includes(lowerQuery)
      )
  );
}
