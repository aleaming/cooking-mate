'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui';
import { RecipeSuggestion } from '@/types';
import { SPRING } from '@/lib/constants/animations';

interface SuggestionCardProps {
  suggestion: RecipeSuggestion;
  compact?: boolean;
  showEfficiency?: boolean;
  onClick?: () => void;
}

const reasonTypeLabels: Record<string, string> = {
  'ingredient-overlap': 'Shared ingredients',
  'cuisine-match': 'Same cuisine',
  'time-efficient': 'Quick to make',
  variety: 'Great variety',
};

const reasonTypeColors: Record<string, 'olive' | 'terracotta' | 'aegean' | 'sand'> = {
  'ingredient-overlap': 'olive',
  'cuisine-match': 'terracotta',
  'time-efficient': 'aegean',
  variety: 'sand',
};

export function SuggestionCard({
  suggestion,
  compact = false,
  showEfficiency = false,
  onClick,
}: SuggestionCardProps) {
  const { recipe, score, reasons, primaryReason } = suggestion;

  const content = (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={SPRING.gentle}
      onClick={onClick}
      className={`
        bg-card rounded-xl shadow-sm
        overflow-hidden cursor-pointer hover:shadow-md transition-shadow
        ${compact ? 'flex gap-3 p-2' : 'flex flex-col'}
      `}
    >
      {/* Image */}
      {recipe.imageUrl && (
        <div className={compact ? 'w-16 h-16 flex-shrink-0' : 'h-32'}>
          <img
            src={recipe.imageUrl}
            alt={recipe.name}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
      )}

      {/* Content */}
      <div className={compact ? 'flex-1 min-w-0 py-0.5' : 'p-3'}>
        <h4
          className={`font-medium text-olive-900 ${compact ? 'text-sm truncate' : 'text-base mb-1'}`}
        >
          {recipe.name}
        </h4>

        {/* Primary Reason Badge */}
        <div className={compact ? 'hidden' : 'flex items-center gap-2 mb-2'}>
          <Badge variant={reasonTypeColors[primaryReason] || 'sand'} size="sm">
            {reasonTypeLabels[primaryReason] || primaryReason}
          </Badge>
          {score > 0 && (
            <span className="text-xs text-sand-500">{score}% match</span>
          )}
        </div>

        {/* Quick Info */}
        <div className="flex items-center gap-2 text-xs text-sand-500">
          <span>{recipe.totalTimeMinutes} min</span>
          <span>·</span>
          <span className="capitalize">{recipe.difficulty}</span>
          {showEfficiency && reasons[0]?.type === 'ingredient-overlap' && (
            <>
              <span>·</span>
              <span className="text-olive-600 font-medium">
                {reasons[0].description}
              </span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );

  if (onClick) {
    return content;
  }

  return (
    <Link href={`/recipes/${recipe.id}`}>
      {content}
    </Link>
  );
}
