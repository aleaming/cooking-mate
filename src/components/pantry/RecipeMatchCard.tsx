'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui';
import { RecipeMatch } from '@/types';
import { SPRING } from '@/lib/constants/animations';

interface RecipeMatchCardProps {
  match: RecipeMatch;
}

export function RecipeMatchCard({ match }: RecipeMatchCardProps) {
  const { recipe, matchPercentage, missingCount } = match;

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-olive-400';
    if (percentage >= 40) return 'bg-amber-400';
    return 'bg-sand-300';
  };

  const getMatchBadgeVariant = (percentage: number): 'success' | 'olive' | 'warning' | 'sand' => {
    if (percentage >= 80) return 'success';
    if (percentage >= 60) return 'olive';
    if (percentage >= 40) return 'warning';
    return 'sand';
  };

  return (
    <Link href={`/recipes/${recipe.id}`}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={SPRING.gentle}
        className="bg-white rounded-xl shadow-sm border border-sand-100 overflow-hidden hover:shadow-md transition-shadow"
      >
        {/* Image */}
        {recipe.imageUrl && (
          <div className="relative h-36">
            <img
              src={recipe.imageUrl}
              alt={recipe.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2">
              <Badge variant={getMatchBadgeVariant(matchPercentage)}>
                {matchPercentage}%
              </Badge>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-3">
          <h4 className="font-medium text-olive-900 truncate mb-2">
            {recipe.name}
          </h4>

          {/* Match Bar */}
          <div className="mb-2">
            <div className="h-1.5 bg-sand-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${matchPercentage}%` }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className={`h-full rounded-full ${getMatchColor(matchPercentage)}`}
              />
            </div>
          </div>

          {/* Missing Info */}
          <div className="text-xs text-sand-500">
            {missingCount === 0 ? (
              <span className="text-green-600 font-medium">
                Ready to cook!
              </span>
            ) : (
              <span>
                Missing {missingCount} ingredient{missingCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Quick Info */}
          <div className="flex items-center gap-2 mt-2 text-xs text-sand-500">
            <span>{recipe.totalTimeMinutes} min</span>
            <span>·</span>
            <span className="capitalize">{recipe.difficulty}</span>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
