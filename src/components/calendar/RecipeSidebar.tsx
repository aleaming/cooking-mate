'use client';

import { useState, useMemo, ComponentType, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Recipe, MealType } from '@/types';
import { DraggableRecipeCard } from './DraggableRecipeCard';
import { Input } from '@/components/ui';
import { staggerContainer, staggerItem } from '@/lib/constants/animations';
import { IconSunrise, IconSun, IconMoon, IconToolsKitchen2, IconUsers } from '@tabler/icons-react';

type RecipeWithOwner = Recipe & { ownerName?: string };

interface RecipeSidebarProps {
  recipes: RecipeWithOwner[];
}

interface MealTypeFilter {
  value: MealType | 'all';
  label: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
}

const mealTypeFilters: MealTypeFilter[] = [
  { value: 'all', label: 'All' },
  { value: 'breakfast', label: '', icon: IconSunrise },
  { value: 'lunch', label: '', icon: IconSun },
  { value: 'dinner', label: '', icon: IconMoon },
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

  // Split into own recipes and family recipes
  const { myRecipes, familyMemberRecipes } = useMemo(() => {
    const mine: RecipeWithOwner[] = [];
    const family: RecipeWithOwner[] = [];
    filteredRecipes.forEach((r) => {
      if (r.ownerName) {
        family.push(r);
      } else {
        mine.push(r);
      }
    });
    return { myRecipes: mine, familyMemberRecipes: family };
  }, [filteredRecipes]);

  const hasFamilyRecipes = familyMemberRecipes.length > 0;

  return (
    <div className="h-full flex flex-col bg-muted border-r border-sand-200 dark:border-sand-700">
      {/* Header */}
      <div className="p-4 border-b border-sand-200 dark:border-sand-700 bg-card">
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
                transition-all duration-200 active:scale-95 flex items-center justify-center
                ${
                  mealFilter === filter.value
                    ? 'bg-olive-500 text-white'
                    : 'bg-sand-100 text-sand-600 hover:bg-sand-200 active:bg-sand-300'
                }
              `}
            >
              {filter.icon ? (
                <filter.icon size={18} className={mealFilter === filter.value ? 'text-white' : 'text-sand-600'} />
              ) : (
                filter.label
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Recipe List */}
      <div className="flex-1 overflow-y-auto p-3">
        <p className="text-xs text-sand-500 mb-3">
          Drag recipes to the calendar
        </p>

        {hasFamilyRecipes ? (
          <>
            {/* My Recipes Section */}
            {myRecipes.length > 0 && (
              <>
                <h3 className="text-xs font-semibold text-sand-500 uppercase tracking-wider mb-2">
                  My Recipes
                </h3>
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="space-y-2 mb-4"
                >
                  {myRecipes.map((recipe) => (
                    <motion.div key={recipe.id} variants={staggerItem}>
                      <DraggableRecipeCard recipe={recipe} />
                    </motion.div>
                  ))}
                </motion.div>
              </>
            )}

            {/* Family Recipes Section */}
            <h3 className="text-xs font-semibold text-sand-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <IconUsers size={12} className="text-sand-400" />
              Family Recipes
            </h3>
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="space-y-2"
            >
              {familyMemberRecipes.map((recipe) => (
                <motion.div key={recipe.id} variants={staggerItem}>
                  <DraggableRecipeCard recipe={recipe} />
                </motion.div>
              ))}
            </motion.div>
          </>
        ) : (
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
        )}

        {filteredRecipes.length === 0 && (
          <div className="text-center py-8 text-sand-500">
            <IconToolsKitchen2 size={32} className="mx-auto mb-2 text-sand-400" />
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
