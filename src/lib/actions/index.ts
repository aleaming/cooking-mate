'use server';

// Recipe actions
export {
  getRecipes,
  getRecipeById,
  getRecipeBySlug,
  getFeaturedRecipes,
  getRecipesByMealType,
  searchRecipes,
  findRecipesByIngredients,
  getAllIngredients,
} from './recipes';
export type { RecipeFilters, RecipeWithIngredients } from './recipes';

// Meal plan actions
export {
  addMealToPlan,
  removeMealFromPlan,
  updateMealServings,
  getMeal,
  getMealsForDate,
  getMealsForDateRange,
  clearMealsInRange,
  clearAllMeals,
} from './mealPlans';
export type { MealPlanEntry } from './mealPlans';

// Cooking log actions
export {
  logCooking,
  updateCookingSession,
  deleteCookingSession,
  getCookingSession,
  getCookingSessionsForRecipe,
  getRecipeStats,
  getCookingSessionsInDateRange,
  getMonthlyStats,
  getAllCookingSessions,
  isMealLogged,
  getCookingSessionByMealPlan,
} from './cookingLog';
export type {
  CookingSession,
  CookingStats,
  MonthlyStats,
  LogCookingInput,
} from './cookingLog';

// Shopping actions
export {
  getShoppingList,
  getShoppingPreferences,
  toggleShoppingItem,
  setShoppingItemChecked,
  clearCheckedItems,
  updateShoppingPreferences,
  isItemChecked,
  getCheckedItemIds,
} from './shopping';
export type { ShoppingListItem, ShoppingPreferences } from './shopping';

// Profile actions
export {
  getProfile,
  updateProfile,
  updatePreferences,
  updatePassword,
  deleteAccount,
} from './profile';
export type { Profile, UserPreferences } from './profile';
