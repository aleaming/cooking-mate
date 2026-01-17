'use client';

import { motion } from 'framer-motion';
import { SPRING } from '@/lib/constants/animations';

interface IngredientChipProps {
  name: string;
  onRemove: () => void;
}

export function IngredientChip({ name, onRemove }: IngredientChipProps) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={SPRING.gentle}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-olive-100 text-olive-800 rounded-full text-sm font-medium"
    >
      {name}
      <button
        onClick={onRemove}
        className="w-4 h-4 rounded-full bg-olive-200 hover:bg-olive-300 flex items-center justify-center transition-colors"
        aria-label={`Remove ${name}`}
      >
        <svg
          className="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </motion.span>
  );
}
