'use client';

import { ComponentType } from 'react';
import { motion } from 'framer-motion';
import { MealSlotType, Recipe } from '@/types';
import { SPRING } from '@/lib/constants/animations';
import { MarkAsCookedButton } from '@/components/cooking-log';
import { IconSunrise, IconSun, IconMoon } from '@tabler/icons-react';

interface MealSlotProps {
  mealType: MealSlotType;
  recipe: Recipe | null;
  date: string; // YYYY-MM-DD
  isOver?: boolean;
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

export function MealSlot({ mealType, recipe, date, isOver, onClick, onRemove }: MealSlotProps) {
  const colors = mealTypeColors[mealType];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{
        opacity: 1,
        scale: isOver ? 1.02 : 1,
        borderColor: isOver ? 'rgb(34, 197, 94)' : undefined,
        backgroundColor: isOver ? 'var(--olive-100)' : undefined,
      }}
      transition={SPRING.gentle}
      onClick={onClick}
      className={`
        relative rounded-lg border-2 border-dashed p-1.5 min-h-[52px]
        cursor-pointer transition-colors
        ${recipe ? `${colors.bg} ${colors.border} border-solid` : 'border-sand-200 hover:border-sand-300 hover:bg-sand-50'}
        ${isOver ? 'border-olive-400 bg-olive-50' : ''}
      `}
    >
      {recipe ? (
        <div className="flex items-start gap-1.5">
          {/* Recipe Info */}
          <div className="flex-1 min-w-0">
            <p className={`text-xs font-medium ${colors.text} truncate`}>
              {recipe.name}
            </p>
            <p className="text-[10px] text-sand-500 flex items-center gap-1">
              {(() => { const Icon = mealTypeIcons[mealType]; return <Icon size={12} className="text-sand-400" />; })()}
              <span>{recipe.totalTimeMinutes} min</span>
            </p>
          </div>

          {/* Mark as Cooked Button */}
          <MarkAsCookedButton
            recipe={recipe}
            date={date}
            mealType={mealType}
            size="sm"
          />

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
