'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMealPlanStore } from '@/stores/useMealPlanStore';
import { getCalendarDays, getMonthYearDisplay, getWeekDayNames } from '@/lib/utils/dates';
import { CalendarDay } from './CalendarDay';
import { Button } from '@/components/ui';
import { staggerContainer, slideLeft, slideRight } from '@/lib/constants/animations';
import type { FamilyMealPlanWithDetails } from '@/types/family';

interface MonthlyCalendarProps {
  activeDropId: string | null;
  familyModeEnabled?: boolean;
  familyId?: string;
  familyMealPlans?: FamilyMealPlanWithDetails[];
  onRemoveFamilyMeal?: (mealPlanId: string) => Promise<void>;
}

export function MonthlyCalendar({
  activeDropId,
  familyModeEnabled = false,
  familyId,
  familyMealPlans = [],
  onRemoveFamilyMeal,
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
            familyMealPlans={familyMealPlans}
            onRemoveFamilyMeal={onRemoveFamilyMeal}
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
