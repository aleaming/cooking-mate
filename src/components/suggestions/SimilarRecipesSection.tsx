'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { SuggestionCard } from './SuggestionCard';
import { findSimilarRecipes } from '@/lib/utils/recipeOverlap';
import { staggerContainer, staggerItem } from '@/lib/constants/animations';

interface SimilarRecipesSectionProps {
  recipeId: string;
  limit?: number;
}

export function SimilarRecipesSection({
  recipeId,
  limit = 6,
}: SimilarRecipesSectionProps) {
  const similarRecipes = useMemo(
    () => findSimilarRecipes(recipeId, limit),
    [recipeId, limit]
  );

  if (similarRecipes.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-8"
    >
      <h3 className="font-display text-xl font-semibold text-olive-900 mb-4">
        You Might Also Like
      </h3>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {similarRecipes.map((suggestion) => (
          <motion.div
            key={suggestion.recipe.id}
            variants={staggerItem}
            className="flex-shrink-0 w-48 snap-start"
          >
            <SuggestionCard suggestion={suggestion} />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
