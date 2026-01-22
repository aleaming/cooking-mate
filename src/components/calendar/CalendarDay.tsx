'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { MealSlotType, Recipe } from '@/types';
import { useMealPlanStore } from '@/stores/useMealPlanStore';
import { CalendarDay as CalendarDayType } from '@/lib/utils/dates';
import { MealSlot } from './MealSlot';
import { staggerItem } from '@/lib/constants/animations';
import type { FamilyMealPlanWithDetails } from '@/types/family';

interface CalendarDayProps {
  day: CalendarDayType;
  activeDropId: string | null;
  familyModeEnabled?: boolean;
  familyMealPlans?: FamilyMealPlanWithDetails[];
  onRemoveFamilyMeal?: (mealPlanId: string) => Promise<void>;
}

const mealTypes: MealSlotType[] = ['breakfast', 'lunch', 'dinner'];

export function CalendarDay({
  day,
  activeDropId,
  familyModeEnabled = false,
  familyMealPlans = [],
  onRemoveFamilyMeal,
}: CalendarDayProps) {
  const { getMealsForDate, removeMeal } = useMealPlanStore();
  const personalMeals = getMealsForDate(day.dateString);

  // Get family meals for this day
  const familyMealsForDay = useMemo((): Record<MealSlotType, FamilyMealPlanWithDetails | null> => {
    const mealsMap: Record<MealSlotType, FamilyMealPlanWithDetails | null> = {
      breakfast: null,
      lunch: null,
      dinner: null,
    };
    if (!familyModeEnabled) return mealsMap;
    familyMealPlans
      .filter((meal) => meal.planDate === day.dateString)
      .forEach((meal) => {
        mealsMap[meal.mealType] = meal;
      });
    return mealsMap;
  }, [familyModeEnabled, familyMealPlans, day.dateString]);

  // Use family meals if in family mode, otherwise personal meals
  const meals = familyModeEnabled ? familyMealsForDay : personalMeals;

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
          const familyMeal = familyModeEnabled ? familyMealsForDay[mealType] : null;
          const personalMeal = !familyModeEnabled ? personalMeals[mealType] : null;

          return (
            <DroppableMealSlot
              key={`${day.dateString}-${mealType}`}
              id={`${day.dateString}-${mealType}`}
              dateString={day.dateString}
              mealType={mealType}
              recipe={personalMeal?.recipe || null}
              familyMeal={familyMeal}
              familyModeEnabled={familyModeEnabled}
              isActiveDropTarget={activeDropId === `${day.dateString}-${mealType}`}
              onRemove={
                familyMeal && onRemoveFamilyMeal
                  ? () => onRemoveFamilyMeal(familyMeal.id)
                  : personalMeal
                    ? () => removeMeal(day.dateString, mealType)
                    : undefined
              }
            />
          );
        })}
      </div>
    </motion.div>
  );
}

interface DroppableMealSlotProps {
  id: string;
  dateString: string;
  mealType: MealSlotType;
  recipe: Recipe | null;
  familyMeal?: FamilyMealPlanWithDetails | null;
  familyModeEnabled?: boolean;
  isActiveDropTarget: boolean;
  onRemove?: () => void;
}

function DroppableMealSlot({
  id,
  dateString,
  mealType,
  recipe,
  familyMeal,
  familyModeEnabled = false,
  isActiveDropTarget,
  onRemove,
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
        date={dateString}
        isOver={isOver || isActiveDropTarget}
        onRemove={hasMeal ? onRemove : undefined}
      />
    </div>
  );
}
