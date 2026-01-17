'use client';

import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { motion } from 'framer-motion';
import { Modal, Button } from '@/components/ui';
import { Recipe, MealSlotType } from '@/types';
import { useMealPlanStore } from '@/stores/useMealPlanStore';
import { staggerContainer, staggerItem } from '@/lib/constants/animations';

interface AddToCalendarModalProps {
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

const mealTypes: { value: MealSlotType; label: string; icon: React.ReactNode }[] = [
  { value: 'breakfast', label: 'Breakfast', icon: <SunriseIcon className="w-6 h-6 text-terracotta-500" /> },
  { value: 'lunch', label: 'Lunch', icon: <SunIcon className="w-6 h-6 text-amber-500" /> },
  { value: 'dinner', label: 'Dinner', icon: <MoonIcon className="w-6 h-6 text-aegean-500" /> },
];

// Generate next 14 days for quick selection
const getUpcomingDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const date = addDays(today, i);
    dates.push({
      date,
      dateString: format(date, 'yyyy-MM-dd'),
      display: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : format(date, 'EEE, MMM d'),
    });
  }
  return dates;
};

export function AddToCalendarModal({ isOpen, onClose, recipe }: AddToCalendarModalProps) {
  const { addMeal, getMeal } = useMealPlanStore();
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedMealType, setSelectedMealType] = useState<MealSlotType | null>(null);
  const [isAdded, setIsAdded] = useState(false);

  const upcomingDates = getUpcomingDates();

  const handleAdd = () => {
    if (selectedDate && selectedMealType) {
      addMeal(selectedDate, selectedMealType, recipe);
      setIsAdded(true);
      setTimeout(() => {
        onClose();
        setIsAdded(false);
        setSelectedDate('');
        setSelectedMealType(null);
      }, 1000);
    }
  };

  const existingMeal = selectedDate && selectedMealType
    ? getMeal(selectedDate, selectedMealType)
    : null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add to Meal Plan" size="lg">
      {isAdded ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="py-8 text-center"
        >
          <div className="text-5xl mb-4">✅</div>
          <p className="text-lg font-medium text-olive-800">
            Added to your meal plan!
          </p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Recipe Preview */}
          <div className="flex items-center gap-3 p-3 bg-sand-50 rounded-xl">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-olive-100 to-sand-100 flex-shrink-0 overflow-hidden">
              {recipe.imageUrl && (
                <img
                  src={recipe.imageUrl}
                  alt={recipe.name}
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div>
              <h4 className="font-medium text-olive-900">{recipe.name}</h4>
              <p className="text-sm text-sand-600">{recipe.totalTimeMinutes} min</p>
            </div>
          </div>

          {/* Meal Type Selection */}
          <div>
            <label className="block text-sm font-medium text-olive-800 mb-2">
              Meal Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {mealTypes.map((meal) => (
                <button
                  key={meal.value}
                  onClick={() => setSelectedMealType(meal.value)}
                  className={`
                    flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all
                    ${
                      selectedMealType === meal.value
                        ? 'border-olive-500 bg-olive-50'
                        : 'border-sand-200 hover:border-sand-300'
                    }
                  `}
                >
                  {meal.icon}
                  <span className="text-sm font-medium text-olive-800">{meal.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-olive-800 mb-2">
              Select Date
            </label>
            <motion.div
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto"
            >
              {upcomingDates.map((dateInfo) => {
                const hasExistingMeal = selectedMealType && getMeal(dateInfo.dateString, selectedMealType);
                return (
                  <motion.button
                    key={dateInfo.dateString}
                    variants={staggerItem}
                    onClick={() => setSelectedDate(dateInfo.dateString)}
                    className={`
                      p-2.5 rounded-lg border-2 text-left transition-all
                      ${
                        selectedDate === dateInfo.dateString
                          ? 'border-olive-500 bg-olive-50'
                          : 'border-sand-200 hover:border-sand-300'
                      }
                      ${hasExistingMeal ? 'opacity-50' : ''}
                    `}
                  >
                    <span className="text-sm font-medium text-olive-800 block">
                      {dateInfo.display}
                    </span>
                    {hasExistingMeal && (
                      <span className="text-xs text-sand-500">Has meal</span>
                    )}
                  </motion.button>
                );
              })}
            </motion.div>
          </div>

          {/* Warning for existing meal */}
          {existingMeal && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800"
            >
              This will replace <strong>{existingMeal.recipe.name}</strong> currently planned for this slot.
            </motion.div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={!selectedDate || !selectedMealType}
              className="flex-1"
            >
              Add to Plan
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
