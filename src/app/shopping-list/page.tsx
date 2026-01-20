'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ShoppingList } from '@/components/shopping';
import { Button } from '@/components/ui';
import { FamilyModeToggle, FamilyContextBanner } from '@/components/family';
import { useMealPlanStore } from '@/stores/useMealPlanStore';
import { useShoppingStore } from '@/stores/useShoppingStore';
import { useFamilyStore } from '@/stores/useFamilyStore';
import { useAuth } from '@/providers/AuthProvider';
import { aggregateIngredients, groupByCategory } from '@/lib/utils/ingredients';
import { pageVariants } from '@/lib/constants/animations';
import { getFamilyMealPlans } from '@/lib/actions/familyMealPlans';
import { getRecipeById } from '@/data/recipes';
import { getUserRecipeById } from '@/lib/actions/userRecipes';
import type { Recipe } from '@/types';
import type { FamilyMealPlanWithDetails } from '@/types/family';

type DateRangeOption = 'this-week' | 'next-week' | 'this-month' | 'custom';

const dateRangeOptions: { value: DateRangeOption; label: string }[] = [
  { value: 'this-week', label: 'This Week' },
  { value: 'next-week', label: 'Next Week' },
  { value: 'this-month', label: 'This Month' },
];

// Helper to resolve recipe from ID (handles both static and user recipes)
async function resolveRecipe(recipeId: string): Promise<Recipe | null> {
  // Check if it's a user recipe
  if (recipeId.startsWith('user-')) {
    const result = await getUserRecipeById(recipeId);
    if (result.data) {
      return result.data as Recipe;
    }
    return null;
  }
  // Static recipe
  return getRecipeById(recipeId) || null;
}

export default function ShoppingListPage() {
  const { getMealsForDateRange } = useMealPlanStore();
  const {
    startDate,
    endDate,
    setDateRange,
    toggleItem,
    clearChecked,
    getCheckedSet,
  } = useShoppingStore();
  const { familyModeEnabled, activeFamily } = useFamilyStore();
  const { user } = useAuth();

  const [selectedRange, setSelectedRange] = useState<DateRangeOption>('this-week');
  const [familyMeals, setFamilyMeals] = useState<{ recipe: Recipe; servings: number }[]>([]);
  const [isLoadingFamilyMeals, setIsLoadingFamilyMeals] = useState(false);

  // Handle date range selection
  const handleRangeChange = (range: DateRangeOption) => {
    setSelectedRange(range);
    const today = new Date();

    let start: Date;
    let end: Date;

    switch (range) {
      case 'this-week':
        start = startOfWeek(today, { weekStartsOn: 0 });
        end = endOfWeek(today, { weekStartsOn: 0 });
        break;
      case 'next-week':
        start = startOfWeek(addDays(today, 7), { weekStartsOn: 0 });
        end = endOfWeek(addDays(today, 7), { weekStartsOn: 0 });
        break;
      case 'this-month':
        start = startOfMonth(today);
        end = endOfMonth(today);
        break;
      default:
        return;
    }

    setDateRange(format(start, 'yyyy-MM-dd'), format(end, 'yyyy-MM-dd'));
  };

  // Fetch family meals when in family mode
  const fetchFamilyMeals = useCallback(async () => {
    if (!familyModeEnabled || !activeFamily || !user) {
      setFamilyMeals([]);
      return;
    }

    setIsLoadingFamilyMeals(true);
    try {
      const result = await getFamilyMealPlans({
        familyId: activeFamily.id,
        startDate,
        endDate,
        status: 'approved', // Only include approved meals in shopping list
      });

      if (result.data) {
        // Resolve all recipes
        const mealsWithRecipes = await Promise.all(
          result.data.map(async (meal: FamilyMealPlanWithDetails) => {
            const recipe = await resolveRecipe(meal.recipeId);
            if (recipe) {
              return { recipe, servings: meal.servings };
            }
            return null;
          })
        );

        // Filter out null results
        setFamilyMeals(mealsWithRecipes.filter((m): m is { recipe: Recipe; servings: number } => m !== null));
      }
    } catch (error) {
      console.error('Error fetching family meals:', error);
    } finally {
      setIsLoadingFamilyMeals(false);
    }
  }, [familyModeEnabled, activeFamily, user, startDate, endDate]);

  useEffect(() => {
    fetchFamilyMeals();
  }, [fetchFamilyMeals]);

  // Get meals for the date range and aggregate ingredients
  const shoppingCategories = useMemo(() => {
    // Use family meals when in family mode, otherwise personal meals
    const meals = familyModeEnabled && activeFamily
      ? familyMeals.map((m) => ({ recipe: m.recipe, servings: m.servings }))
      : getMealsForDateRange(startDate, endDate).map((m) => ({ recipe: m.recipe, servings: m.servings }));

    // Collect all ingredients with their servings
    const ingredientsList = meals.flatMap((meal) =>
      meal.recipe.ingredients.map((ingredient) => ({
        ingredient,
        servings: meal.servings,
        recipeId: meal.recipe.id,
      }))
    );

    // Aggregate and group
    const aggregated = aggregateIngredients(ingredientsList);
    return groupByCategory(aggregated);
  }, [getMealsForDateRange, startDate, endDate, familyModeEnabled, activeFamily, familyMeals]);

  const checkedSet = getCheckedSet();
  const displayDateRange = `${format(new Date(startDate), 'MMM d')} - ${format(new Date(endDate), 'MMM d, yyyy')}`;

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-sand-50"
    >
      {/* Page Header */}
      <div className="bg-white border-b border-sand-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-olive-900">
                Shopping List
              </h1>
              <p className="text-sand-600 mt-1">
                {displayDateRange}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              {/* Family Mode Toggle */}
              <FamilyModeToggle compact />

              {/* Date Range Selector */}
              <div className="flex gap-2 overflow-x-auto pb-2 -mb-2 sm:pb-0 sm:mb-0 sm:overflow-visible">
                {dateRangeOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={selectedRange === option.value ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleRangeChange(option.value)}
                    className="whitespace-nowrap flex-shrink-0"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Family Context Banner */}
          <FamilyContextBanner className="mt-4" />
        </div>
      </div>

      {/* Shopping List */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading state for family meals */}
        {isLoadingFamilyMeals && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-olive-500 border-t-transparent" />
            <p className="mt-4 text-sand-600">Loading family meal plans...</p>
          </div>
        )}

        {/* Empty state for family mode with no approved meals */}
        {!isLoadingFamilyMeals && familyModeEnabled && activeFamily && familyMeals.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sand-600">
              No approved family meals found for this date range.
            </p>
            <p className="text-sm text-sand-500 mt-2">
              Meals need to be approved by family members before they appear in the shopping list.
            </p>
          </div>
        )}

        {/* Shopping list content */}
        {!isLoadingFamilyMeals && (
          <ShoppingList
            categories={shoppingCategories}
            checkedItems={checkedSet}
            onToggleItem={toggleItem}
            onClearChecked={clearChecked}
          />
        )}

        {/* Print Button */}
        {shoppingCategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <Button
              variant="outline"
              onClick={() => window.print()}
              leftIcon={<PrintIcon className="w-4 h-4" />}
            >
              Print Shopping List
            </Button>
          </motion.div>
        )}
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          header,
          nav,
          .no-print {
            display: none !important;
          }

          body {
            background: white !important;
          }

          .print-only {
            display: block !important;
          }
        }
      `}</style>
    </motion.div>
  );
}

function PrintIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
      />
    </svg>
  );
}
