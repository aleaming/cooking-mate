'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns';
import { ShoppingList } from '@/components/shopping';
import { Button } from '@/components/ui';
import { useMealPlanStore } from '@/stores/useMealPlanStore';
import { useShoppingStore } from '@/stores/useShoppingStore';
import { aggregateIngredients, groupByCategory } from '@/lib/utils/ingredients';
import { pageVariants } from '@/lib/constants/animations';

type DateRangeOption = 'this-week' | 'next-week' | 'this-month' | 'custom';

const dateRangeOptions: { value: DateRangeOption; label: string }[] = [
  { value: 'this-week', label: 'This Week' },
  { value: 'next-week', label: 'Next Week' },
  { value: 'this-month', label: 'This Month' },
];

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

  const [selectedRange, setSelectedRange] = useState<DateRangeOption>('this-week');

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

  // Get meals for the date range and aggregate ingredients
  const shoppingCategories = useMemo(() => {
    const meals = getMealsForDateRange(startDate, endDate);

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
  }, [getMealsForDateRange, startDate, endDate]);

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

            {/* Date Range Selector */}
            <div className="flex gap-2">
              {dateRangeOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={selectedRange === option.value ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => handleRangeChange(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Shopping List */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ShoppingList
          categories={shoppingCategories}
          checkedItems={checkedSet}
          onToggleItem={toggleItem}
          onClearChecked={clearChecked}
        />

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
