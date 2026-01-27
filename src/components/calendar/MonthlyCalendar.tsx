'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useMealPlanStore } from '@/stores/useMealPlanStore';
import { getCalendarDays, getMonthYearDisplay, getWeekDayNames } from '@/lib/utils/dates';
import { CalendarDay } from './CalendarDay';
import { Button } from '@/components/ui';
import { staggerContainer } from '@/lib/constants/animations';
import type { FamilyMealPlanWithDetails } from '@/types/family';
import { MealSlotType, Recipe } from '@/types';

interface MealClickData {
  recipe: Recipe;
  date: string;
  mealType: MealSlotType;
  familyMeal?: FamilyMealPlanWithDetails | null;
}

interface MonthlyCalendarProps {
  activeDropId: string | null;
  familyModeEnabled?: boolean;
  familyId?: string;
  familyMealPlans?: FamilyMealPlanWithDetails[];
  recipeMap?: Map<string, Recipe>;
  onRemoveFamilyMeal?: (mealPlanId: string) => Promise<void>;
  onMealClick?: (data: MealClickData) => void;
  isPlacementMode?: boolean;
  onPlacementSlotClick?: (dateString: string, mealType: MealSlotType) => void;
  placementSuccess?: string | null;
}

const EMPTY_FAMILY_MEALS: FamilyMealPlanWithDetails[] = [];

export function MonthlyCalendar({
  activeDropId,
  familyModeEnabled = false,
  familyId,
  familyMealPlans = [],
  recipeMap,
  onRemoveFamilyMeal,
  onMealClick,
  isPlacementMode,
  onPlacementSlotClick,
  placementSuccess,
}: MonthlyCalendarProps) {
  const {
    currentYear,
    currentMonth,
    goToNextMonth,
    goToPreviousMonth,
    goToToday,
  } = useMealPlanStore();

  const calendarDays = useMemo(
    () => getCalendarDays(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  // Pre-compute family meals by date for O(1) per-day lookup
  const familyMealsByDate = useMemo(() => {
    if (!familyMealPlans.length) return new Map<string, FamilyMealPlanWithDetails[]>();
    const map = new Map<string, FamilyMealPlanWithDetails[]>();
    for (const meal of familyMealPlans) {
      const existing = map.get(meal.planDate);
      if (existing) {
        existing.push(meal);
      } else {
        map.set(meal.planDate, [meal]);
      }
    }
    return map;
  }, [familyMealPlans]);

  const monthYearDisplay = getMonthYearDisplay(currentYear, currentMonth);
  const weekDays = getWeekDayNames();

  return (
    <div className="bg-card rounded-2xl shadow-lg shadow-sand-200/50 overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b border-sand-200">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousMonth}
            aria-label="Previous month"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextMonth}
            aria-label="Next month"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </Button>
        </div>

        <h2 className="font-display text-xl font-semibold text-olive-900">
          {monthYearDisplay}
        </h2>

        <Button variant="outline" size="sm" onClick={goToToday}>
          Today
        </Button>
      </div>

      {/* Week Day Headers */}
      <div className="grid grid-cols-7 border-b border-sand-200">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-sm font-medium text-sand-600 border-r border-sand-200 last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <motion.div
        key={`${currentYear}-${currentMonth}`}
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="grid grid-cols-7"
      >
        {calendarDays.map((day) => (
          <CalendarDay
            key={day.dateString}
            day={day}
            activeDropId={activeDropId}
            familyModeEnabled={familyModeEnabled}
            familyMealsForDay={familyMealsByDate.get(day.dateString) || EMPTY_FAMILY_MEALS}
            recipeMap={recipeMap}
            onRemoveFamilyMeal={onRemoveFamilyMeal}
            onMealClick={onMealClick}
            isPlacementMode={isPlacementMode}
            onPlacementSlotClick={onPlacementSlotClick}
            placementSuccess={placementSuccess}
          />
        ))}
      </motion.div>
    </div>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}
