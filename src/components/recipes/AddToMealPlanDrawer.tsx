'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Drawer, Button, Badge } from '@/components/ui';
import { Recipe, MealSlotType } from '@/types';
import { useMealPlanStore } from '@/stores/useMealPlanStore';
import { getCalendarDays, getMonthYearDisplay, getWeekDayNames } from '@/lib/utils/dates';
import { staggerContainer, staggerItem, SPRING } from '@/lib/constants/animations';

interface AddToMealPlanDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe;
}

// Heroicons-style SVG icons
function SunriseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19h16" />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
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

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

const mealTypes: { value: MealSlotType; label: string; icon: React.ReactNode; color: string }[] = [
  { value: 'breakfast', label: 'Breakfast', icon: <SunriseIcon className="w-4 h-4" />, color: 'terracotta' },
  { value: 'lunch', label: 'Lunch', icon: <SunIcon className="w-4 h-4" />, color: 'amber' },
  { value: 'dinner', label: 'Dinner', icon: <MoonIcon className="w-4 h-4" />, color: 'aegean' },
];

const mealTypeColors: Record<MealSlotType, { bg: string; border: string; text: string; hover: string }> = {
  breakfast: {
    bg: 'bg-terracotta-50',
    border: 'border-terracotta-300',
    text: 'text-terracotta-700',
    hover: 'hover:bg-terracotta-100',
  },
  lunch: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    text: 'text-amber-700',
    hover: 'hover:bg-amber-100',
  },
  dinner: {
    bg: 'bg-aegean-50',
    border: 'border-aegean-300',
    text: 'text-aegean-700',
    hover: 'hover:bg-aegean-100',
  },
};

export function AddToMealPlanDrawer({ isOpen, onClose, recipe }: AddToMealPlanDrawerProps) {
  const { addMeal, getMeal, getMealsForDate } = useMealPlanStore();
  const [currentYear, setCurrentYear] = useState(() => new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => new Date().getMonth());
  const [isAdded, setIsAdded] = useState(false);
  const [addedTo, setAddedTo] = useState<{ date: string; mealType: MealSlotType } | null>(null);

  const calendarDays = useMemo(
    () => getCalendarDays(currentYear, currentMonth),
    [currentYear, currentMonth]
  );

  const monthYearDisplay = getMonthYearDisplay(currentYear, currentMonth);
  const weekDays = getWeekDayNames();

  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return prev - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return prev + 1;
    });
  }, []);

  const goToToday = useCallback(() => {
    const today = new Date();
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
  }, []);

  const handleAddMeal = (dateString: string, mealType: MealSlotType) => {
    addMeal(dateString, mealType, recipe);
    setAddedTo({ date: dateString, mealType });
    setIsAdded(true);
    setTimeout(() => {
      onClose();
      setIsAdded(false);
      setAddedTo(null);
    }, 1200);
  };

  const handleClose = () => {
    setIsAdded(false);
    setAddedTo(null);
    onClose();
  };

  return (
    <Drawer isOpen={isOpen} onClose={handleClose} title="Add to Meal Plan" height="75%">
      <AnimatePresence mode="wait">
        {isAdded ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center h-full py-12"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
            >
              <CheckCircleIcon className="w-20 h-20 text-green-500 mb-4" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl font-medium text-olive-800"
            >
              Added to your meal plan!
            </motion.p>
            {addedTo && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-sand-600 mt-2"
              >
                {new Date(addedTo.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })} • {addedTo.mealType.charAt(0).toUpperCase() + addedTo.mealType.slice(1)}
              </motion.p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col h-full"
          >
            {/* Recipe Preview */}
            <div className="px-6 py-4 bg-gradient-to-r from-olive-50 to-sand-50 border-b border-sand-200">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-olive-100 to-sand-100 flex-shrink-0 overflow-hidden shadow-md">
                  {recipe.imageUrl && (
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-olive-900 text-lg truncate">
                    {recipe.name}
                  </h3>
                  <p className="text-sm text-sand-600 mt-0.5">
                    {recipe.totalTimeMinutes} min • {recipe.difficulty}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {recipe.dietaryTags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="sand" size="sm">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-sm text-sand-600 mt-3">
                Select a meal slot on the calendar below to add this recipe
              </p>
            </div>

            {/* Calendar Section */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="bg-white rounded-2xl shadow-lg shadow-sand-200/50 overflow-hidden">
                {/* Calendar Header */}
                <div className="flex items-center justify-between p-4 border-b border-sand-200 bg-sand-50/50">
                  <div className="flex items-center gap-1">
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

                  <h2 className="font-display text-lg font-semibold text-olive-900">
                    {monthYearDisplay}
                  </h2>

                  <Button variant="outline" size="sm" onClick={goToToday}>
                    Today
                  </Button>
                </div>

                {/* Week Day Headers */}
                <div className="grid grid-cols-7 border-b border-sand-200 bg-sand-50/30">
                  {weekDays.map((day) => (
                    <div
                      key={day}
                      className="py-2 text-center text-xs font-medium text-sand-500 border-r border-sand-100 last:border-r-0"
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
                    <CalendarDayCell
                      key={day.dateString}
                      day={day}
                      recipe={recipe}
                      onSelectMeal={handleAddMeal}
                      getMeal={getMeal}
                    />
                  ))}
                </motion.div>
              </div>

              {/* Legend */}
              <div className="mt-4 p-4 bg-sand-50 rounded-xl">
                <p className="text-xs font-medium text-sand-500 mb-2">Tap a meal slot to add recipe:</p>
                <div className="flex flex-wrap gap-3">
                  {mealTypes.map((meal) => (
                    <div key={meal.value} className="flex items-center gap-1.5">
                      <span className={`${mealTypeColors[meal.value].text}`}>
                        {meal.icon}
                      </span>
                      <span className="text-xs text-sand-600">{meal.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Drawer>
  );
}

// Calendar Day Cell Component
interface CalendarDayCellProps {
  day: {
    dateString: string;
    dayOfMonth: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isWeekend: boolean;
  };
  recipe: Recipe;
  onSelectMeal: (dateString: string, mealType: MealSlotType) => void;
  getMeal: (dateString: string, mealType: MealSlotType) => any;
}

function CalendarDayCell({ day, recipe, onSelectMeal, getMeal }: CalendarDayCellProps) {
  const isPast = new Date(day.dateString) < new Date(new Date().toDateString());

  return (
    <motion.div
      variants={staggerItem}
      className={`
        min-h-[100px] p-1.5 border-b border-r border-sand-100
        ${day.isCurrentMonth ? 'bg-white' : 'bg-sand-50/50'}
        ${day.isToday ? 'ring-2 ring-inset ring-olive-400' : ''}
        ${isPast && !day.isToday ? 'opacity-50' : ''}
      `}
    >
      {/* Day Number */}
      <div className="flex items-center justify-center mb-1">
        <span
          className={`
            text-xs font-medium
            ${day.isToday ? 'bg-olive-500 text-white w-5 h-5 rounded-full flex items-center justify-center' : ''}
            ${day.isCurrentMonth ? 'text-olive-900' : 'text-sand-400'}
            ${day.isWeekend && day.isCurrentMonth && !day.isToday ? 'text-terracotta-600' : ''}
          `}
        >
          {day.dayOfMonth}
        </span>
      </div>

      {/* Meal Slots */}
      <div className="space-y-0.5">
        {(['breakfast', 'lunch', 'dinner'] as MealSlotType[]).map((mealType) => {
          const existingMeal = getMeal(day.dateString, mealType);
          const colors = mealTypeColors[mealType];
          const isDisabled = isPast && !day.isToday;

          return (
            <motion.button
              key={mealType}
              whileHover={!isDisabled ? { scale: 1.02 } : {}}
              whileTap={!isDisabled ? { scale: 0.98 } : {}}
              onClick={() => !isDisabled && onSelectMeal(day.dateString, mealType)}
              disabled={isDisabled}
              className={`
                w-full py-1 px-1.5 rounded text-[10px] font-medium
                transition-all duration-150 text-left truncate
                ${existingMeal
                  ? `${colors.bg} ${colors.text} ${colors.border} border`
                  : `border border-dashed border-sand-200 text-sand-400 ${!isDisabled ? colors.hover : ''}`
                }
                ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}
              `}
              title={existingMeal ? `Replace ${existingMeal.recipe.name}` : `Add to ${mealType}`}
            >
              {existingMeal ? (
                <span className="truncate block">{existingMeal.recipe.name}</span>
              ) : (
                <span className="flex items-center gap-0.5 justify-center">
                  {mealType === 'breakfast' && <SunriseIcon className="w-2.5 h-2.5" />}
                  {mealType === 'lunch' && <SunIcon className="w-2.5 h-2.5" />}
                  {mealType === 'dinner' && <MoonIcon className="w-2.5 h-2.5" />}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
