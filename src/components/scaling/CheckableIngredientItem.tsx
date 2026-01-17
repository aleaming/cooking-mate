'use client';

import { motion } from 'framer-motion';
import { Checkbox } from '@/components/ui';
import { ScaledIngredient } from '@/types';

interface CheckableIngredientItemProps {
  ingredient: ScaledIngredient;
  index: number;
  checked: boolean;
  onToggle: () => void;
}

/**
 * Ingredient list item with checkbox for tracking gathered ingredients.
 * Entire row is clickable for better mobile UX.
 */
export function CheckableIngredientItem({
  ingredient,
  index,
  checked,
  onToggle,
}: CheckableIngredientItemProps) {
  const { original, displayText, wasConverted, conversionNote } = ingredient;

  return (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.03 * index }}
      className="group"
    >
      <button
        type="button"
        onClick={onToggle}
        className="
          w-full flex items-center gap-2 py-1 px-2 -mx-2 rounded-lg
          text-left transition-colors duration-200
          hover:bg-olive-50/50 active:bg-olive-100/50
          focus:outline-none focus-visible:ring-2 focus-visible:ring-olive-500 focus-visible:ring-offset-2
        "
        aria-label={`${checked ? 'Uncheck' : 'Check'} ${original.name}`}
      >
        <Checkbox
          checked={checked}
          size="sm"
          aria-label={`${original.name} checkbox`}
        />

        <span className="flex-1 min-w-0 text-xs sm:text-sm text-olive-800">
          {/* Quantity */}
          <motion.span
            key={displayText}
            initial={{ opacity: 0.5, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`font-medium ${wasConverted ? 'text-aegean-600' : ''}`}
            title={wasConverted ? conversionNote : undefined}
          >
            {displayText}{' '}
          </motion.span>

          {/* Ingredient Name */}
          {original.name}

          {/* Preparation */}
          {original.preparation && (
            <span className="text-sand-500">, {original.preparation}</span>
          )}

          {/* Notes */}
          {original.notes && (
            <span className="text-sand-500"> ({original.notes})</span>
          )}

          {/* Conversion indicator */}
          {wasConverted && (
            <span
              className="ml-1 text-xs text-aegean-500 opacity-0 group-hover:opacity-100 transition-opacity"
              title={conversionNote}
            >
              ⟳
            </span>
          )}
        </span>
      </button>
    </motion.li>
  );
}
