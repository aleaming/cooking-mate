'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Recipe, MealType } from '@/types';
import { DraggableRecipeCard } from './DraggableRecipeCard';
import { Input } from '@/components/ui';
import { staggerContainer, staggerItem } from '@/lib/constants/animations';

interface RecipeSidebarProps {
  recipes: Recipe[];
}

const mealTypeFilters: { value: MealType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'breakfast', label: '🌅' },
  { value: 'lunch', label: '☀️' },
  { value: 'dinner', label: '🌙' },
];

export function RecipeSidebar({ recipes }: RecipeSidebarProps) {
  const [search, setSearch] = useState('');
  const [mealFilter, setMealFilter] = useState<MealType | 'all'>('all');

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        if (!recipe.name.toLowerCase().includes(searchLower)) {
          return false;
        }
      }

      // Meal type filter
      if (mealFilter !== 'all' && recipe.mealType !== mealFilter) {
        return false;
      }

      return true;
    });
  }, [recipes, search, mealFilter]);

  return (
    <div className="h-full flex flex-col bg-sand-50 border-r border-sand-200">
      {/* Header */}
      <div className="p-4 border-b border-sand-200 bg-white">
        <h2 className="font-display text-lg font-semibold text-olive-900 mb-3">
          Recipes
        </h2>

        {/* Search */}
        <Input
          placeholder="Search recipes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<SearchIcon className="w-4 h-4" />}
          className="text-sm"
        />

        {/* Meal Type Filter */}
        <div className="flex gap-1 mt-3">
          {mealTypeFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setMealFilter(filter.value)}
              className={`
                flex-1 min-h-[44px] py-2 text-sm font-medium rounded-lg
                transition-all duration-200 active:scale-95
                ${
                  mealFilter === filter.value
                    ? 'bg-olive-500 text-white'
                    : 'bg-sand-100 text-sand-600 hover:bg-sand-200 active:bg-sand-300'
                }
              `}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Recipe List */}
      <div className="flex-1 overflow-y-auto p-3">
        <p className="text-xs text-sand-500 mb-3">
          Drag recipes to the calendar
        </p>

        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-2"
        >
          {filteredRecipes.map((recipe) => (
            <motion.div key={recipe.id} variants={staggerItem}>
              <DraggableRecipeCard recipe={recipe} />
            </motion.div>
          ))}
        </motion.div>

        {filteredRecipes.length === 0 && (
          <div className="text-center py-8 text-sand-500">
            <p className="text-2xl mb-2">🍽️</p>
            <p className="text-sm">No recipes found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}
