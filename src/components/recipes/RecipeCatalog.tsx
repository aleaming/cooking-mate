'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Recipe, MealType, Difficulty, DietaryTag } from '@/types';
import { RecipeCard } from './RecipeCard';
import { Input, Badge, Button } from '@/components/ui';
import { staggerContainer, staggerItem, fadeInUp } from '@/lib/constants/animations';
import { IconToolsKitchen2 } from '@tabler/icons-react';

interface RecipeCatalogProps {
  recipes: Recipe[];
  compact?: boolean;
  draggable?: boolean;
}

type FilterState = {
  search: string;
  mealType: MealType | 'all';
  difficulty: Difficulty | 'all';
  dietaryTags: DietaryTag[];
};

const mealTypeOptions: { value: MealType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Meals' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
];

const difficultyOptions: { value: Difficulty | 'all'; label: string }[] = [
  { value: 'all', label: 'Any Difficulty' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const dietaryTagOptions: DietaryTag[] = [
  'vegetarian',
  'vegan',
  'gluten-free',
  'dairy-free',
  'high-protein',
];

export function RecipeCatalog({ recipes, compact = false }: RecipeCatalogProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    mealType: 'all',
    difficulty: 'all',
    dietaryTags: [],
  });

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          recipe.name.toLowerCase().includes(searchLower) ||
          recipe.description.toLowerCase().includes(searchLower) ||
          recipe.ingredients.some((ing) =>
            ing.name.toLowerCase().includes(searchLower)
          );
        if (!matchesSearch) return false;
      }

      // Meal type filter
      if (filters.mealType !== 'all' && recipe.mealType !== filters.mealType) {
        return false;
      }

      // Difficulty filter
      if (filters.difficulty !== 'all' && recipe.difficulty !== filters.difficulty) {
        return false;
      }

      // Dietary tags filter
      if (filters.dietaryTags.length > 0) {
        const hasAllTags = filters.dietaryTags.every((tag) =>
          recipe.dietaryTags.includes(tag)
        );
        if (!hasAllTags) return false;
      }

      return true;
    });
  }, [recipes, filters]);

  const handleToggleDietaryTag = (tag: DietaryTag) => {
    setFilters((prev) => ({
      ...prev,
      dietaryTags: prev.dietaryTags.includes(tag)
        ? prev.dietaryTags.filter((t) => t !== tag)
        : [...prev.dietaryTags, tag],
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      mealType: 'all',
      difficulty: 'all',
      dietaryTags: [],
    });
  };

  const hasActiveFilters =
    filters.search ||
    filters.mealType !== 'all' ||
    filters.difficulty !== 'all' ||
    filters.dietaryTags.length > 0;

  return (
    <div className="space-y-6">
      {/* Filters */}
      {!compact && (
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="space-y-4"
        >
          {/* Search */}
          <Input
            placeholder="Search recipes..."
            value={filters.search}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, search: e.target.value }))
            }
            leftIcon={<SearchIcon className="w-5 h-5" />}
          />

          {/* Filter Row */}
          <div className="flex flex-wrap gap-3">
            {/* Meal Type Pills */}
            <div className="flex gap-1.5">
              {mealTypeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, mealType: option.value }))
                  }
                  className={`
                    px-3 py-1.5 text-sm font-medium rounded-full
                    transition-all duration-200
                    ${
                      filters.mealType === option.value
                        ? 'bg-olive-500 text-white shadow-md'
                        : 'bg-sand-100 text-sand-700 hover:bg-sand-200'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Difficulty Pills */}
            <div className="flex gap-1.5">
              {difficultyOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() =>
                    setFilters((prev) => ({ ...prev, difficulty: option.value }))
                  }
                  className={`
                    px-3 py-1.5 text-sm font-medium rounded-full
                    transition-all duration-200
                    ${
                      filters.difficulty === option.value
                        ? 'bg-terracotta-500 text-white shadow-md'
                        : 'bg-sand-100 text-sand-700 hover:bg-sand-200'
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary Tags */}
          <div className="flex flex-wrap gap-2">
            {dietaryTagOptions.map((tag) => (
              <Badge
                key={tag}
                variant={filters.dietaryTags.includes(tag) ? 'olive' : 'sand'}
                size="md"
                removable={filters.dietaryTags.includes(tag)}
                onRemove={() => handleToggleDietaryTag(tag)}
                className="cursor-pointer"
                onClick={() => handleToggleDietaryTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear all filters
              </Button>
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Results Count */}
      <div className="text-sm text-sand-600">
        {filteredRecipes.length} recipe{filteredRecipes.length !== 1 ? 's' : ''}{' '}
        found
      </div>

      {/* Recipe Grid */}
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className={`
          grid gap-6
          ${
            compact
              ? 'grid-cols-1'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }
        `}
      >
        <AnimatePresence mode="popLayout">
          {filteredRecipes.map((recipe) => (
            <motion.div
              key={recipe.id}
              variants={staggerItem}
              layout
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <RecipeCard recipe={recipe} compact={compact} />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {filteredRecipes.length === 0 && (
        <motion.div
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="text-center py-12"
        >
          <IconToolsKitchen2 size={64} className="mx-auto mb-4 text-sand-400" />
          <h3 className="text-lg font-medium text-olive-800 mb-2">
            No recipes found
          </h3>
          <p className="text-sand-600 mb-4">
            Try adjusting your filters or search terms
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Clear filters
          </Button>
        </motion.div>
      )}
    </div>
  );
}

// Search Icon Component
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}
