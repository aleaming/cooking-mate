'use client';

import { motion } from 'framer-motion';
import { CookingRating } from '@/types';
import { SPRING } from '@/lib/constants/animations';

interface StarRatingProps {
  value: CookingRating | null;
  onChange?: (rating: CookingRating | null) => void;
  size?: 'sm' | 'md' | 'lg';
  readonly?: boolean;
}

const sizeStyles = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
};

const gapStyles = {
  sm: 'gap-0.5',
  md: 'gap-1',
  lg: 'gap-1.5',
};

export function StarRating({
  value,
  onChange,
  size = 'md',
  readonly = false,
}: StarRatingProps) {
  const stars = [1, 2, 3, 4, 5] as const;

  const handleClick = (rating: CookingRating) => {
    if (readonly || !onChange) return;
    // Click same star to clear
    if (value === rating) {
      onChange(null);
    } else {
      onChange(rating);
    }
  };

  return (
    <div
      className={`inline-flex ${gapStyles[size]}`}
      role="group"
      aria-label="Rating"
    >
      {stars.map((star) => {
        const isFilled = value !== null && star <= value;

        return (
          <motion.button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => handleClick(star)}
            whileHover={readonly ? undefined : { scale: 1.2 }}
            whileTap={readonly ? undefined : { scale: 0.9 }}
            transition={SPRING.gentle}
            className={`
              ${readonly ? 'cursor-default' : 'cursor-pointer'}
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-500 rounded
              transition-colors
            `}
            aria-label={`${star} star${star > 1 ? 's' : ''}`}
          >
            <motion.svg
              className={sizeStyles[size]}
              viewBox="0 0 24 24"
              fill={isFilled ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth={2}
              initial={false}
              animate={{
                scale: isFilled ? [1, 1.2, 1] : 1,
                color: isFilled ? '#f59e0b' : '#d1d5db',
              }}
              transition={{ duration: 0.2 }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </motion.svg>
          </motion.button>
        );
      })}
    </div>
  );
}
