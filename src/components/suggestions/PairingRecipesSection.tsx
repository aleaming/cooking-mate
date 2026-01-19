'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { findPairingRecipes } from '@/lib/utils/recipeOverlap';
import { staggerContainer, staggerItem } from '@/lib/constants/animations';
import { RecipePairing } from '@/types';

interface PairingRecipesSectionProps {
  recipeId: string;
  limit?: number;
}

export function PairingRecipesSection({
  recipeId,
  limit = 4,
}: PairingRecipesSectionProps) {
  const pairings = useMemo(
    () => findPairingRecipes(recipeId, limit),
    [recipeId, limit]
  );

  if (pairings.length === 0) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 mb-4">
        <h3 className="font-display text-lg sm:text-xl font-semibold text-olive-900">
          Pairs Well With
        </h3>
        <span className="text-xs sm:text-sm text-sand-500">For efficient meal prep</span>
      </div>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-3"
      >
        {pairings.map((pairing) => (
          <PairingCard key={pairing.recipe.id} pairing={pairing} />
        ))}
      </motion.div>
    </motion.div>
  );
}

function PairingCard({ pairing }: { pairing: RecipePairing }) {
  const { recipe, shoppingEfficiency, sharedIngredients, newIngredientsNeeded } = pairing;
  const efficiencyPercent = Math.round(shoppingEfficiency * 100);

  return (
    <motion.div variants={staggerItem}>
      <Link href={`/recipes/${recipe.id}`}>
        <div className="bg-white rounded-xl p-3 border border-sand-100 hover:border-olive-200 hover:shadow-sm transition-all">
          <div className="flex items-center gap-3">
            {/* Image */}
            {recipe.imageUrl && (
              <img
                src={recipe.imageUrl}
                alt={recipe.name}
                className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
              />
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-olive-900 truncate">{recipe.name}</h4>

              {/* Efficiency Bar */}
              <div className="mt-1 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-sand-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${efficiencyPercent}%` }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className={`h-full rounded-full ${
                      efficiencyPercent > 70
                        ? 'bg-success'
                        : efficiencyPercent > 40
                        ? 'bg-olive-400'
                        : 'bg-sand-300'
                    }`}
                  />
                </div>
                <span className="text-xs text-olive-600 font-medium">
                  {efficiencyPercent}%
                </span>
              </div>

              {/* Shared Ingredients */}
              <div className="mt-1 flex items-center gap-2 text-xs text-sand-500">
                <span className="text-olive-600">
                  {sharedIngredients.length} shared
                </span>
                <span>·</span>
                <span>
                  {newIngredientsNeeded > 0
                    ? `${newIngredientsNeeded} new needed`
                    : 'No new ingredients!'}
                </span>
              </div>
            </div>

            {/* Arrow */}
            <svg
              className="w-5 h-5 text-sand-400 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
