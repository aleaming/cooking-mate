'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ScalingResult } from '@/types';
import { useCookingChecklist } from '@/hooks/useCookingChecklist';
import { CheckableIngredientItem } from './CheckableIngredientItem';
import { ScalingWarningBanner } from './ScalingWarningBanner';
import { TimingAdjustmentNote } from './TimingAdjustmentNote';
import { fadeIn } from '@/lib/constants/animations';

interface CheckableIngredientsListProps {
  recipeId: string;
  scalingResult: ScalingResult;
}

/**
 * Ingredient list with checkboxes for tracking gathered ingredients.
 * Includes progress indicator and reset functionality.
 */
export function CheckableIngredientsList({
  recipeId,
  scalingResult,
}: CheckableIngredientsListProps) {
  const { ingredients, warnings, timingAdjustments, scaleFactor } = scalingResult;
  const { isChecked, toggleItem, clearAll, checkedCount } = useCookingChecklist({
    recipeId,
  });

  const totalCount = ingredients.length;
  const allGathered = checkedCount === totalCount && totalCount > 0;
  const hasCheckedItems = checkedCount > 0;

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs sm:text-sm text-sand-600">
          <span className="font-medium text-olive-700">{checkedCount}</span>
          {' of '}
          <span className="font-medium text-olive-700">{totalCount}</span>
          {' gathered'}
        </p>

        {hasCheckedItems && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            type="button"
            onClick={clearAll}
            className="text-xs text-sand-500 hover:text-terracotta-600 transition-colors"
          >
            Reset
          </motion.button>
        )}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <ScalingWarningBanner warnings={warnings} scaleFactor={scaleFactor} />
      )}

      {/* Ingredients List */}
      <ul>
        {ingredients.map((ingredient, index) => (
          <CheckableIngredientItem
            key={ingredient.original.id}
            ingredient={ingredient}
            index={index}
            checked={isChecked(ingredient.original.id)}
            onToggle={() => toggleItem(ingredient.original.id)}
          />
        ))}
      </ul>

      {/* Completion Message */}
      <AnimatePresence>
        {allGathered && (
          <motion.div
            variants={fadeIn}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex items-center gap-2 p-3 bg-olive-50 rounded-xl text-olive-700"
          >
            <CheckCircleIcon className="w-5 h-5 text-olive-500 flex-shrink-0" />
            <span className="text-sm font-medium">All ingredients gathered!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timing Adjustments */}
      {timingAdjustments && timingAdjustments.length > 0 && (
        <TimingAdjustmentNote adjustments={timingAdjustments} />
      )}
    </div>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
