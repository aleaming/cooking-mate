'use client';

import { ComponentType, useMemo } from 'react';
import { motion } from 'framer-motion';
import { MealSlotType, Recipe } from '@/types';
import type { FamilyMealPlanWithDetails } from '@/types/family';
import { SPRING } from '@/lib/constants/animations';
import { MarkAsCookedButton } from '@/components/cooking-log';
import { VotingResultsBadge } from '@/components/family';
import { IconSunrise, IconSun, IconMoon, IconUsers } from '@tabler/icons-react';

interface MealSlotProps {
  mealType: MealSlotType;
  recipe: Recipe | null;
  familyMeal?: FamilyMealPlanWithDetails | null;
  familyModeEnabled?: boolean;
  recipeMap?: Map<string, Recipe>;
  date: string; // YYYY-MM-DD
  isOver?: boolean;
  isPlacementMode?: boolean;
  onPlacementClick?: () => void;
  isPlacementSuccess?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}

const mealTypeLabels: Record<MealSlotType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

const mealTypeIcons: Record<MealSlotType, ComponentType<{ size?: number; className?: string }>> = {
  breakfast: IconSunrise,
  lunch: IconSun,
  dinner: IconMoon,
};

const mealTypeColors: Record<MealSlotType, { bg: string; border: string; text: string }> = {
  breakfast: {
    bg: 'bg-terracotta-50',
    border: 'border-terracotta-200',
    text: 'text-terracotta-700',
  },
  lunch: {
    bg: 'bg-aegean-50',
    border: 'border-aegean-200',
    text: 'text-aegean-700',
  },
  dinner: {
    bg: 'bg-olive-50',
    border: 'border-olive-200',
    text: 'text-olive-700',
  },
};

export function MealSlot({
  mealType,
  recipe,
  familyMeal,
  familyModeEnabled = false,
  recipeMap,
  date,
  isOver,
  isPlacementMode,
  onPlacementClick,
  isPlacementSuccess,
  onClick,
  onRemove,
}: MealSlotProps) {
  const colors = mealTypeColors[mealType];

  // Resolve recipe for family meal — O(1) Map lookup
  const resolvedRecipe = useMemo(() => {
    if (!familyModeEnabled || !familyMeal) return recipe;
    return recipeMap?.get(familyMeal.recipeId) ?? null;
  }, [recipe, familyMeal, familyModeEnabled, recipeMap]);

  const displayRecipe = familyModeEnabled ? resolvedRecipe : recipe;
  const isFamilyMeal = familyModeEnabled && familyMeal;
  const isRejected = isFamilyMeal && familyMeal?.status === 'rejected';

  // Color-code family indicator by meal plan status
  const familyIndicatorColor = isFamilyMeal
    ? familyMeal.status === 'approved'
      ? 'bg-olive-500'
      : familyMeal.status === 'rejected'
        ? 'bg-terracotta-400'
        : 'bg-aegean-500'
    : 'bg-aegean-500';

  // In placement mode, empty slots respond to clicks to place the recipe
  const handleClick = () => {
    if (!displayRecipe && isPlacementMode && onPlacementClick) {
      onPlacementClick();
    } else if (onClick) {
      onClick();
    }
  };

  const isEmptyPlacement = !displayRecipe && isPlacementMode;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: 1,
        scale: isOver || isPlacementSuccess ? 1.02 : 1,
        borderColor: isOver ? 'rgb(34, 197, 94)' : undefined,
        backgroundColor: isOver ? 'var(--olive-100)' : undefined,
      }}
      transition={SPRING.gentle}
      onClick={handleClick}
      className={`
        relative rounded-lg border-2 border-dashed p-1.5 min-h-[52px]
        cursor-pointer transition-colors
        ${displayRecipe ? `${colors.bg} ${colors.border} border-solid` : 'border-sand-200 hover:border-sand-300 hover:bg-sand-50'}
        ${isOver ? 'border-olive-400 bg-olive-50' : ''}
        ${isRejected ? 'opacity-50' : ''}
        ${isEmptyPlacement ? 'ring-2 ring-dashed ring-olive-300 bg-olive-50/30 hover:bg-olive-100/50' : ''}
        ${isPlacementSuccess ? 'bg-olive-100 ring-2 ring-olive-500 border-olive-500' : ''}
      `}
    >
      {displayRecipe ? (
        <div className="flex items-start gap-1.5">
          {/* Family indicator */}
          {isFamilyMeal && (
            <div className={`absolute -top-1 -left-1 ${familyIndicatorColor} rounded-full p-0.5`} title="Family meal">
              <IconUsers size={10} className="text-white" />
            </div>
          )}

          {/* Recipe Info */}
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-medium ${colors.text} truncate`}>
              {displayRecipe.name}
            </p>
            <p className="text-[10px] text-sand-500 flex items-center gap-1">
              {(() => { const Icon = mealTypeIcons[mealType]; return <Icon size={12} className="text-sand-400" />; })()}
              {displayRecipe.totalTimeMinutes > 0 && <span>{displayRecipe.totalTimeMinutes} min</span>}
            </p>
            {isFamilyMeal && familyMeal && (
              <VotingResultsBadge votes={familyMeal.votes} status={familyMeal.status} size="sm" />
            )}
          </div>

          {/* Mark as Cooked Button - only for non-family meals for now */}
          {!isFamilyMeal && (
            <MarkAsCookedButton
              recipe={displayRecipe}
              date={date}
              mealType={mealType}
              size="sm"
            />
          )}

          {/* Remove Button */}
          {onRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="flex-shrink-0 p-0.5 rounded hover:bg-black/10 transition-colors"
              aria-label="Remove meal"
            >
              <svg className="w-3.5 h-3.5 text-sand-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center h-full text-sand-400">
          {(() => { const Icon = mealTypeIcons[mealType]; return <Icon size={14} className="text-sand-300" />; })()}
        </div>
      )}
    </motion.div>
  );
}
