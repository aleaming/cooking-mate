'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { MealSlotType, Recipe } from '@/types';
import { useMealPlanStore } from '@/stores/useMealPlanStore';
import { CalendarDay as CalendarDayType } from '@/lib/utils/dates';
import { MealSlot } from './MealSlot';
import { staggerItem } from '@/lib/constants/animations';
import type { FamilyMealPlanWithDetails } from '@/types/family';

interface MealClickData {
  recipe: Recipe;
  date: string;
  mealType: MealSlotType;
  familyMeal?: FamilyMealPlanWithDetails | null;
}

interface CalendarDayProps {
  day: CalendarDayType;
  activeDropId: string | null;
  familyModeEnabled?: boolean;
  familyMealsForDay?: FamilyMealPlanWithDetails[];
  recipeMap?: Map<string, Recipe>;
  onRemoveFamilyMeal?: (mealPlanId: string) => Promise<void>;
  onMealClick?: (data: MealClickData) => void;
  isPlacementMode?: boolean;
  onPlacementSlotClick?: (dateString: string, mealType: MealSlotType) => void;
  placementSuccess?: string | null;
}

const mealTypes: MealSlotType[] = ['breakfast', 'lunch', 'dinner'];

export const CalendarDay = memo(function CalendarDay({
  day,
  activeDropId,
  familyModeEnabled = false,
  familyMealsForDay,
  recipeMap,
  onRemoveFamilyMeal,
  onMealClick,
  isPlacementMode,
  onPlacementSlotClick,
  placementSuccess,
}: CalendarDayProps) {
  // Granular Zustand selectors — only re-render when THIS day's meals change
  const breakfastMeal = useMealPlanStore((state) => state.mealPlans[`${day.dateString}-breakfast`] ?? null);
  const lunchMeal = useMealPlanStore((state) => state.mealPlans[`${day.dateString}-lunch`] ?? null);
  const dinnerMeal = useMealPlanStore((state) => state.mealPlans[`${day.dateString}-dinner`] ?? null);
  const removeMeal = useMealPlanStore((state) => state.removeMeal);

  const personalMeals = useMemo(() => ({
    breakfast: breakfastMeal,
    lunch: lunchMeal,
    dinner: dinnerMeal,
  }), [breakfastMeal, lunchMeal, dinnerMeal]);

  // Convert pre-filtered family meals array to a record keyed by meal type
  const familyMealsRecord = useMemo((): Record<MealSlotType, FamilyMealPlanWithDetails | null> => {
    const record: Record<MealSlotType, FamilyMealPlanWithDetails | null> = {
      breakfast: null,
      lunch: null,
      dinner: null,
    };
    if (!familyModeEnabled || !familyMealsForDay) return record;
    for (const meal of familyMealsForDay) {
      record[meal.mealType] = meal;
    }
    return record;
  }, [familyModeEnabled, familyMealsForDay]);

  // Use family meals if in family mode, otherwise personal meals
  const meals = familyModeEnabled ? familyMealsRecord : personalMeals;

  return (
    <motion.div
      variants={staggerItem}
      className={`
        min-h-[140px] p-2 border-b border-r border-sand-200 dark:border-sand-700
        ${day.isCurrentMonth ? 'bg-card' : 'bg-muted/50'}
        ${day.isToday ? 'ring-2 ring-inset ring-olive-500' : ''}
      `}
    >
      {/* Day Number */}
      <div className="flex items-center justify-between mb-1.5">
        <span
          className={`
            text-sm font-medium
            ${day.isToday ? 'bg-olive-500 text-white w-6 h-6 rounded-full flex items-center justify-center' : ''}
            ${day.isCurrentMonth ? 'text-olive-900' : 'text-sand-400'}
            ${day.isWeekend && day.isCurrentMonth ? 'text-terracotta-600' : ''}
          `}
        >
          {day.dayOfMonth}
        </span>
      </div>

      {/* Meal Slots */}
      <div className="space-y-1">
        {mealTypes.map((mealType) => {
          const familyMeal = familyModeEnabled ? familyMealsRecord[mealType] : null;
          const personalMeal = !familyModeEnabled ? personalMeals[mealType] : null;

          // Resolve the display recipe for click handler — O(1) Map lookup
          let displayRecipe: Recipe | null = null;
          if (familyModeEnabled && familyMeal) {
            displayRecipe = recipeMap?.get(familyMeal.recipeId) ?? null;
          } else if (personalMeal?.recipe) {
            displayRecipe = personalMeal.recipe;
          }

          return (
            <DroppableMealSlot
              key={`${day.dateString}-${mealType}`}
              id={`${day.dateString}-${mealType}`}
              dateString={day.dateString}
              mealType={mealType}
              recipe={personalMeal?.recipe || null}
              familyMeal={familyMeal}
              familyModeEnabled={familyModeEnabled}
              recipeMap={recipeMap}
              isActiveDropTarget={activeDropId === `${day.dateString}-${mealType}`}
              isPlacementMode={isPlacementMode}
              onPlacementClick={
                isPlacementMode && onPlacementSlotClick
                  ? () => onPlacementSlotClick(day.dateString, mealType)
                  : undefined
              }
              isPlacementSuccess={placementSuccess === `${day.dateString}-${mealType}`}
              onRemove={
                familyMeal && onRemoveFamilyMeal
                  ? () => onRemoveFamilyMeal(familyMeal.id)
                  : personalMeal
                    ? () => removeMeal(day.dateString, mealType)
                    : undefined
              }
              onClick={
                displayRecipe && onMealClick
                  ? () => onMealClick({
                      recipe: displayRecipe!,
                      date: day.dateString,
                      mealType,
                      familyMeal,
                    })
                  : undefined
              }
            />
          );
        })}
      </div>
    </motion.div>
  );
});

interface DroppableMealSlotProps {
  id: string;
  dateString: string;
  mealType: MealSlotType;
  recipe: Recipe | null;
  familyMeal?: FamilyMealPlanWithDetails | null;
  familyModeEnabled?: boolean;
  recipeMap?: Map<string, Recipe>;
  isActiveDropTarget: boolean;
  isPlacementMode?: boolean;
  onPlacementClick?: () => void;
  isPlacementSuccess?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
}

function DroppableMealSlot({
  id,
  dateString,
  mealType,
  recipe,
  familyMeal,
  familyModeEnabled = false,
  recipeMap,
  isActiveDropTarget,
  isPlacementMode,
  onPlacementClick,
  isPlacementSuccess,
  onRemove,
  onClick,
}: DroppableMealSlotProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
    data: {
      dateString,
      mealType,
    },
  });

  const hasMeal = familyModeEnabled ? !!familyMeal : !!recipe;

  return (
    <div ref={setNodeRef}>
      <MealSlot
        mealType={mealType}
        recipe={recipe}
        familyMeal={familyMeal}
        familyModeEnabled={familyModeEnabled}
        recipeMap={recipeMap}
        date={dateString}
        isOver={isOver || isActiveDropTarget}
        isPlacementMode={isPlacementMode}
        onPlacementClick={onPlacementClick}
        isPlacementSuccess={isPlacementSuccess}
        onRemove={hasMeal ? onRemove : undefined}
        onClick={onClick}
      />
    </div>
  );
}
