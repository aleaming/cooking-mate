'use client';

import { motion } from 'framer-motion';
import { useDroppable } from '@dnd-kit/core';
import { MealSlotType, Recipe } from '@/types';
import { useMealPlanStore } from '@/stores/useMealPlanStore';
import { CalendarDay as CalendarDayType } from '@/lib/utils/dates';
import { MealSlot } from './MealSlot';
import { staggerItem } from '@/lib/constants/animations';

interface CalendarDayProps {
  day: CalendarDayType;
  activeDropId: string | null;
}

const mealTypes: MealSlotType[] = ['breakfast', 'lunch', 'dinner'];

export function CalendarDay({ day, activeDropId }: CalendarDayProps) {
  const { getMealsForDate, removeMeal } = useMealPlanStore();
  const meals = getMealsForDate(day.dateString);

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
        {mealTypes.map((mealType) => (
          <DroppableMealSlot
            key={`${day.dateString}-${mealType}`}
            id={`${day.dateString}-${mealType}`}
            dateString={day.dateString}
            mealType={mealType}
            recipe={meals[mealType]?.recipe || null}
            isActiveDropTarget={activeDropId === `${day.dateString}-${mealType}`}
            onRemove={() => removeMeal(day.dateString, mealType)}
          />
        ))}
      </div>
    </motion.div>
  );
}

interface DroppableMealSlotProps {
  id: string;
  dateString: string;
  mealType: MealSlotType;
  recipe: Recipe | null;
  isActiveDropTarget: boolean;
  onRemove: () => void;
}

function DroppableMealSlot({
  id,
  dateString,
  mealType,
  recipe,
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

  return (
    <div ref={setNodeRef}>
      <MealSlot
        mealType={mealType}
        recipe={recipe}
        date={dateString}
        isOver={isOver || isActiveDropTarget}
        onRemove={recipe ? onRemove : undefined}
      />
    </div>
  );
}
