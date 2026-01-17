'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui';
import {
  IngredientSearch,
  IngredientChip,
  RecipeMatchCard,
  NextIngredientSuggestions,
} from '@/components/pantry';
import { findMatchingRecipes } from '@/lib/utils/ingredientMatching';
import { getMasterIngredients } from '@/lib/data/masterIngredients';
import { MasterIngredient } from '@/types';
import { pageVariants, staggerContainer, staggerItem } from '@/lib/constants/animations';
import { IconSalad, IconChefHat } from '@tabler/icons-react';

export default function PantryFinderPage() {
  const [selectedIngredients, setSelectedIngredients] = useState<Map<string, MasterIngredient>>(
    new Map()
  );
  const [minMatch, setMinMatch] = useState(30);
  const [sortBy, setSortBy] = useState<'matchPercentage' | 'missingCount'>('matchPercentage');

  const ingredientIds = useMemo(
    () => new Set(selectedIngredients.keys()),
    [selectedIngredients]
  );

  const results = useMemo(() => {
    if (selectedIngredients.size === 0) {
      return null;
    }
    return findMatchingRecipes(ingredientIds, {
      minimumMatchPercentage: minMatch,
      sortBy,
      sortDirection: sortBy === 'missingCount' ? 'asc' : 'desc',
    });
  }, [ingredientIds, minMatch, sortBy, selectedIngredients.size]);

  const handleAddIngredient = (ingredient: MasterIngredient) => {
    setSelectedIngredients((prev) => {
      const next = new Map(prev);
      next.set(ingredient.id, ingredient);
      return next;
    });
  };

  const handleRemoveIngredient = (id: string) => {
    setSelectedIngredients((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  };

  const handleClearAll = () => {
    setSelectedIngredients(new Map());
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-sand-50"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="font-display text-3xl font-bold text-olive-900 mb-2">
            Pantry Finder
          </h1>
          <p className="text-sand-600 max-w-xl mx-auto">
            Tell us what ingredients you have, and we&apos;ll find recipes you can make
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-xl mx-auto mb-6"
        >
          <IngredientSearch
            onSelect={handleAddIngredient}
            excludeIds={ingredientIds}
            placeholder="Search for ingredients you have..."
          />
        </motion.div>

        {/* Selected Ingredients */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          {selectedIngredients.size > 0 ? (
            <div className="flex flex-wrap items-center gap-2 justify-center">
              <AnimatePresence mode="popLayout">
                {Array.from(selectedIngredients.values()).map((ingredient) => (
                  <IngredientChip
                    key={ingredient.id}
                    name={ingredient.name}
                    onRemove={() => handleRemoveIngredient(ingredient.id)}
                  />
                ))}
              </AnimatePresence>
              {selectedIngredients.size >= 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className="text-sand-500"
                >
                  Clear all
                </Button>
              )}
            </div>
          ) : (
            <p className="text-center text-sand-500">
              Start typing to add ingredients from your pantry
            </p>
          )}
        </motion.div>

        {/* Results Section */}
        {selectedIngredients.size > 0 && (
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Main Results */}
            <div className="lg:col-span-3">
              {/* Filters */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-wrap items-center gap-4 mb-6"
              >
                {/* Match Threshold */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-sand-600">Min match:</span>
                  <select
                    value={minMatch}
                    onChange={(e) => setMinMatch(Number(e.target.value))}
                    className="px-2 py-1 text-sm bg-white rounded-lg border border-sand-200 text-olive-800"
                  >
                    <option value={0}>Any</option>
                    <option value={30}>30%+</option>
                    <option value={50}>50%+</option>
                    <option value={70}>70%+</option>
                  </select>
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-sand-600">Sort by:</span>
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as 'matchPercentage' | 'missingCount')
                    }
                    className="px-2 py-1 text-sm bg-white rounded-lg border border-sand-200 text-olive-800"
                  >
                    <option value="matchPercentage">Best match</option>
                    <option value="missingCount">Fewest missing</option>
                  </select>
                </div>

                {/* Stats */}
                {results && (
                  <div className="flex-1 text-right text-sm text-sand-500">
                    {results.perfectMatches > 0 && (
                      <span className="text-green-600 font-medium">
                        {results.perfectMatches} ready to cook
                      </span>
                    )}
                    {results.perfectMatches > 0 && results.goodMatches > 0 && ' · '}
                    {results.goodMatches > 0 && (
                      <span>{results.goodMatches} good matches</span>
                    )}
                  </div>
                )}
              </motion.div>

              {/* Recipe Grid */}
              {results && results.matches.length > 0 ? (
                <motion.div
                  variants={staggerContainer}
                  initial="initial"
                  animate="animate"
                  className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                  {results.matches.map((match) => (
                    <motion.div key={match.recipeId} variants={staggerItem}>
                      <RecipeMatchCard match={match} />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <div className="text-center py-16 bg-white rounded-2xl">
                  <IconSalad size={56} className="mx-auto mb-4 text-sand-400" />
                  <h3 className="font-display text-xl font-semibold text-olive-900 mb-2">
                    No matches yet
                  </h3>
                  <p className="text-sand-600">
                    {minMatch > 0
                      ? 'Try lowering the minimum match percentage'
                      : 'Add more ingredients to find matching recipes'}
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <NextIngredientSuggestions
                currentIngredients={ingredientIds}
                onAdd={handleAddIngredient}
              />
            </div>
          </div>
        )}

        {/* Empty State */}
        {selectedIngredients.size === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center py-16 bg-white rounded-2xl shadow-sm"
          >
            <IconChefHat size={64} className="mx-auto mb-4 text-sand-400" />
            <h3 className="font-display text-xl font-semibold text-olive-900 mb-2">
              What&apos;s in your kitchen?
            </h3>
            <p className="text-sand-600 max-w-md mx-auto mb-6">
              Start by adding the ingredients you have at home, and we&apos;ll show you
              what delicious Mediterranean dishes you can make!
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {['Olive oil', 'Garlic', 'Tomatoes', 'Feta cheese', 'Lemon'].map(
                (name) => {
                  const ingredients = getMasterIngredients();
                  const ingredient = ingredients.find(
                    (i) => i.name.toLowerCase() === name.toLowerCase()
                  );
                  if (!ingredient) return null;
                  return (
                    <Button
                      key={name}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddIngredient(ingredient)}
                    >
                      + {name}
                    </Button>
                  );
                }
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
