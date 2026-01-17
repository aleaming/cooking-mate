// Cooking Log Types - Meal Tracking System

import { MealSlotType } from './mealPlan';

export type CookingRating = 1 | 2 | 3 | 4 | 5;

export interface CookingSession {
  id: string;
  recipeId: string;
  mealPlanKey?: string; // Optional link to meal plan entry (YYYY-MM-DD-mealType)

  // Cooking details
  cookedAt: string; // ISO timestamp
  actualServings: number;
  scaleFactor: number; // Recipe was scaled by this factor (1 = normal)

  // User feedback
  rating: CookingRating | null;
  notes: string;
  photoUrl?: string; // Local file path or blob URL

  // Cooking metrics (optional, for analytics)
  prepTimeActual?: number; // Actual prep time in minutes
  cookTimeActual?: number; // Actual cook time in minutes
  mealType?: MealSlotType;

  // Metadata
  createdAt: string;
  updatedAt: string;
}

export interface CookingSessionFormData {
  date: Date;
  rating: CookingRating | null;
  notes: string;
  photo: File | null;
  actualServings: number;
  prepTimeActual?: number;
  cookTimeActual?: number;
}

export interface CookingStats {
  recipeId: string;
  timesCooked: number;
  averageRating: number | null;
  lastCooked: string | null; // ISO date
  totalServingsMade: number;
  favoriteScale: number; // Most common scale factor used
}

export interface MonthlyStats {
  year: number;
  month: number;
  recipesCooked: number;
  uniqueRecipes: number;
  totalServings: number;
  averageRating: number | null;
}

export interface CookingHistoryFilters {
  dateRange?: { start: string; end: string };
  minRating?: CookingRating;
  recipeId?: string;
  mealType?: MealSlotType;
}
