'use client';

import { motion } from 'framer-motion';
import { ScaledIngredient } from '@/types';

interface ScaledIngredientItemProps {
  ingredient: ScaledIngredient;
  index: number;
}

export function ScaledIngredientItem({
  ingredient,
  index,
}: ScaledIngredientItemProps) {
  const { original, displayText, wasConverted, conversionNote } = ingredient;

  return (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.05 * index }}
      className="flex items-start gap-2 text-sm group"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-olive-400 mt-2 flex-shrink-0" />
      <span className="text-olive-800 flex-1">
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
    </motion.li>
  );
}
