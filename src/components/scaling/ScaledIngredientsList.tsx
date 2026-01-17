'use client';

import { ScalingResult } from '@/types';
import { ScaledIngredientItem } from './ScaledIngredientItem';
import { ScalingWarningBanner } from './ScalingWarningBanner';
import { TimingAdjustmentNote } from './TimingAdjustmentNote';

interface ScaledIngredientsListProps {
  scalingResult: ScalingResult;
}

export function ScaledIngredientsList({ scalingResult }: ScaledIngredientsListProps) {
  const { ingredients, warnings, timingAdjustments, scaleFactor } = scalingResult;

  return (
    <div className="space-y-4">
      {/* Warnings */}
      {warnings.length > 0 && (
        <ScalingWarningBanner warnings={warnings} scaleFactor={scaleFactor} />
      )}

      {/* Ingredients List */}
      <ul className="space-y-3">
        {ingredients.map((ingredient, index) => (
          <ScaledIngredientItem
            key={ingredient.original.id}
            ingredient={ingredient}
            index={index}
          />
        ))}
      </ul>

      {/* Timing Adjustments */}
      {timingAdjustments && timingAdjustments.length > 0 && (
        <TimingAdjustmentNote adjustments={timingAdjustments} />
      )}
    </div>
  );
}
