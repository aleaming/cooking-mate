'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui';
import { suggestNextIngredients } from '@/lib/utils/ingredientMatching';
import { MasterIngredient } from '@/types';
import { staggerContainer, staggerItem } from '@/lib/constants/animations';

interface NextIngredientSuggestionsProps {
  currentIngredients: Set<string>;
  onAdd: (ingredient: MasterIngredient) => void;
}

export function NextIngredientSuggestions({
  currentIngredients,
  onAdd,
}: NextIngredientSuggestionsProps) {
  const suggestions = useMemo(
    () => suggestNextIngredients(currentIngredients, 5),
    [currentIngredients]
  );

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-sand-100">
      <h3 className="font-display font-semibold text-olive-900 mb-3">
        What to Buy Next
      </h3>
      <p className="text-sm text-sand-600 mb-4">
        These ingredients would unlock the most new recipes
      </p>

      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-2"
      >
        {suggestions.map((suggestion) => (
          <motion.div
            key={suggestion.ingredient.id}
            variants={staggerItem}
            className="flex items-center justify-between p-2 rounded-lg bg-sand-50 hover:bg-olive-50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="font-medium text-olive-800 truncate">
                {suggestion.ingredient.name}
              </p>
              <p className="text-xs text-sand-500">
                {suggestion.unlockCount > 0 && (
                  <span className="text-success font-medium">
                    Unlocks {suggestion.unlockCount} recipe{suggestion.unlockCount !== 1 ? 's' : ''}
                  </span>
                )}
                {suggestion.unlockCount > 0 && suggestion.improveCount > suggestion.unlockCount && ' · '}
                {suggestion.improveCount > suggestion.unlockCount && (
                  <span>
                    Improves {suggestion.improveCount - suggestion.unlockCount} more
                  </span>
                )}
              </p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAdd(suggestion.ingredient)}
              className="flex-shrink-0"
            >
              Add
            </Button>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
