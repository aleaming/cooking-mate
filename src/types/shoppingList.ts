// Shopping List Types

import { IngredientCategory } from './recipe';

export interface ShoppingList {
  id: string;
  deviceId: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  name?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShoppingListItem {
  id: string;
  shoppingListId: string;
  ingredientId: string | null;
  ingredientName: string;
  category: IngredientCategory;
  totalQuantity: number | null;
  unit: string | null;
  isChecked: boolean;
  isManual: boolean;
  sourceRecipeIds: string[];
  createdAt: string;
}

export interface AggregatedIngredient {
  ingredientId: string | null;
  name: string;
  category: IngredientCategory;
  totalQuantity: number | null;
  unit: string | null;
  sourceRecipeIds: string[];
}

export interface ShoppingListByCategory {
  category: IngredientCategory;
  categoryLabel: string;
  items: ShoppingListItem[];
}
