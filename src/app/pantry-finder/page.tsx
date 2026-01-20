'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Select } from '@/components/ui';
import {
  IngredientSearch,
  IngredientChip,
  RecipeMatchCard,
  NextIngredientSuggestions,
} from '@/components/pantry';
import { findMatchingRecipes, getMostCommonIngredients } from '@/lib/utils/ingredientMatching';
import { MasterIngredient } from '@/types';
import { pageVariants, staggerContainer, staggerItem } from '@/lib/constants/animations';
import { IconSalad, IconChefHat, IconCheck, IconArrowRight, IconX } from '@tabler/icons-react';

export default function PantryFinderPage() {
  const [selectedIngredients, setSelectedIngredients] = useState<Map<string, MasterIngredient>>(
    new Map()
  );
  const [pendingQuickSelections, setPendingQuickSelections] = useState<Set<string>>(new Set());
  const [minMatch, setMinMatch] = useState(30);
  const [sortBy, setSortBy] = useState<'matchPercentage' | 'missingCount'>('matchPercentage');

  // Get the most common ingredients for quick selection
  const quickOptions = useMemo(() => getMostCommonIngredients(8), []);

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
    setPendingQuickSelections(new Set());
    setMinMatch(30);
    setSortBy('matchPercentage');
  };

  const handleQuickOptionToggle = (ingredient: MasterIngredient) => {
    setPendingQuickSelections((prev) => {
      const next = new Set(prev);
      if (next.has(ingredient.id)) {
        next.delete(ingredient.id);
      } else {
        next.add(ingredient.id);
      }
      return next;
    });
  };

  const handleApplyQuickSelections = () => {
    const newSelected = new Map(selectedIngredients);
    pendingQuickSelections.forEach((id) => {
      const ingredient = quickOptions.find((i) => i.id === id);
      if (ingredient) newSelected.set(id, ingredient);
    });
    setSelectedIngredients(newSelected);
    setPendingQuickSelections(new Set());
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearAll}
                className="text-sand-600 border-sand-300"
              >
                <IconX size={14} className="mr-1" />
                Clear all
              </Button>
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
                  <Select
                    value={minMatch}
                    onChange={(e) => setMinMatch(Number(e.target.value))}
                    size="sm"
                    options={[
                      { value: 0, label: 'Any' },
                      { value: 30, label: '30%+' },
                      { value: 50, label: '50%+' },
                      { value: 70, label: '70%+' },
                    ]}
                    className="w-auto"
                  />
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-sand-600">Sort by:</span>
                  <Select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as 'matchPercentage' | 'missingCount')
                    }
                    size="sm"
                    options={[
                      { value: 'matchPercentage', label: 'Best match' },
                      { value: 'missingCount', label: 'Fewest missing' },
                    ]}
                    className="w-auto"
                  />
                </div>

                {/* Stats */}
                {results && (
                  <div className="flex-1 text-right text-sm text-sand-500">
                    {results.perfectMatches > 0 && (
                      <span className="text-success font-medium">
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
            className="text-center py-12 bg-white rounded-2xl shadow-sm"
          >
            <IconChefHat size={64} className="mx-auto mb-4 text-sand-400" />
            <h3 className="font-display text-xl font-semibold text-olive-900 mb-2">
              What&apos;s in your kitchen?
            </h3>
            <p className="text-sand-600 max-w-md mx-auto mb-6">
              Select the ingredients you have, then click &quot;Find Recipes&quot; to see
              what delicious Mediterranean dishes you can make!
            </p>

            {/* Quick Select Grid */}
            <div className="max-w-2xl mx-auto px-4">
              <p className="text-sm text-sand-500 mb-3">
                Popular ingredients to start:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-6">
                {quickOptions.map((ingredient) => {
                  const isSelected = pendingQuickSelections.has(ingredient.id);
                  return (
                    <button
                      key={ingredient.id}
                      onClick={() => handleQuickOptionToggle(ingredient)}
                      className={`
                        relative flex items-center gap-2 px-3 py-2.5 rounded-xl
                        text-left text-sm font-medium transition-all
                        ${
                          isSelected
                            ? 'bg-olive-500 text-white shadow-md shadow-olive-500/20'
                            : 'bg-sand-100 text-olive-800 hover:bg-sand-200'
                        }
                      `}
                    >
                      <span
                        className={`
                          w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0
                          ${isSelected ? 'bg-olive-400' : 'bg-white border border-sand-300'}
                        `}
                      >
                        {isSelected && <IconCheck size={14} className="text-white" />}
                      </span>
                      <span className="flex-1 truncate">{ingredient.name}</span>
                      <span
                        className={`
                          text-xs px-1.5 py-0.5 rounded-md
                          ${isSelected ? 'bg-olive-400 text-olive-100' : 'bg-sand-200 text-sand-600'}
                        `}
                      >
                        {ingredient.frequency}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Find Recipes Button */}
              <AnimatePresence>
                {pendingQuickSelections.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={handleApplyQuickSelections}
                      className="px-8"
                    >
                      Find Recipes with {pendingQuickSelections.size} ingredient
                      {pendingQuickSelections.size !== 1 ? 's' : ''}
                      <IconArrowRight size={18} className="ml-2" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
