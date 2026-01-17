'use client';

import { forwardRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Recipe } from '@/types';
import { Badge } from '@/components/ui';
import { cardVariants, SPRING } from '@/lib/constants/animations';

interface RecipeCardProps {
  recipe: Recipe;
  compact?: boolean;
  onClick?: () => void;
}

const RecipeCard = forwardRef<HTMLDivElement, RecipeCardProps>(
  ({ recipe, compact = false, onClick }, ref) => {
    const content = (
      <motion.div
        ref={ref}
        variants={cardVariants}
        initial="initial"
        animate="animate"
        whileHover="hover"
        whileTap="tap"
        transition={SPRING.gentle}
        className={`
          group bg-white rounded-2xl overflow-hidden
          shadow-lg shadow-sand-200/50
          cursor-pointer
          ${compact ? '' : 'h-full'}
        `}
        onClick={onClick}
      >
        {/* Image Container */}
        <div className={`relative overflow-hidden ${compact ? 'h-32' : 'aspect-[4/3]'}`}>
          {/* Placeholder gradient for missing images */}
          <div className="absolute inset-0 bg-gradient-to-br from-olive-100 via-olive-50 to-sand-100" />

          {recipe.imageUrl && (
            <motion.img
              src={recipe.imageUrl}
              alt={recipe.name}
              className="absolute inset-0 w-full h-full object-cover"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.4 }}
            />
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

          {/* Time Badge */}
          <div className="absolute bottom-2 left-2">
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-white/90 backdrop-blur-sm rounded-lg text-olive-800">
              <ClockIcon className="w-3.5 h-3.5" />
              {recipe.totalTimeMinutes} min
            </span>
          </div>

          {/* Featured Badge */}
          {recipe.isFeatured && (
            <div className="absolute top-2 right-2">
              <span className="px-2 py-1 text-xs font-medium bg-terracotta-500 text-white rounded-lg">
                Featured
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className={compact ? 'p-3' : 'p-4'}>
          {/* Title */}
          <h3
            className={`
              font-display font-semibold text-olive-900
              line-clamp-2 group-hover:text-olive-700 transition-colors
              ${compact ? 'text-sm' : 'text-lg mb-1'}
            `}
          >
            {recipe.name}
          </h3>

          {!compact && (
            <>
              {/* Description */}
              <p className="text-sand-600 text-sm line-clamp-2 mb-3">
                {recipe.description}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                <Badge
                  variant={
                    recipe.mealType === 'breakfast'
                      ? 'terracotta'
                      : recipe.mealType === 'lunch'
                      ? 'aegean'
                      : 'olive'
                  }
                  size="sm"
                >
                  {recipe.mealType}
                </Badge>
                <Badge variant="sand" size="sm">
                  {recipe.difficulty}
                </Badge>
                {recipe.dietaryTags.slice(0, 2).map((tag) => (
                  <Badge key={tag} variant="olive" size="sm">
                    {tag}
                  </Badge>
                ))}
              </div>
            </>
          )}

          {compact && (
            <div className="flex items-center gap-2 mt-1">
              <Badge
                variant={
                  recipe.mealType === 'breakfast'
                    ? 'terracotta'
                    : recipe.mealType === 'lunch'
                    ? 'aegean'
                    : 'olive'
                }
                size="sm"
              >
                {recipe.mealType}
              </Badge>
            </div>
          )}
        </div>
      </motion.div>
    );

    // If no onClick handler, wrap in Link
    if (!onClick) {
      return (
        <Link href={`/recipes/${recipe.id}`} className="block h-full">
          {content}
        </Link>
      );
    }

    return content;
  }
);

RecipeCard.displayName = 'RecipeCard';

// Clock Icon Component
function ClockIcon({ className }: { className?: string }) {
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
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

export { RecipeCard };
export type { RecipeCardProps };
