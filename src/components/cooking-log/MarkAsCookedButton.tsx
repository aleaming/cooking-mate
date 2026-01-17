'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { SPRING } from '@/lib/constants/animations';
import { useCookingLogStore } from '@/stores/useCookingLogStore';
import { CookingLogModal } from './CookingLogModal';
import { Recipe, MealSlotType } from '@/types';

interface MarkAsCookedButtonProps {
  recipe: Recipe;
  date: string; // YYYY-MM-DD
  mealType: MealSlotType;
  size?: 'sm' | 'md';
}

const sizeStyles = {
  sm: 'w-5 h-5 p-0.5',
  md: 'w-6 h-6 p-1',
};

export function MarkAsCookedButton({
  recipe,
  date,
  mealType,
  size = 'sm',
}: MarkAsCookedButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const mealPlanKey = `${date}-${mealType}`;
  const sessions = useCookingLogStore((state) => state.sessions);

  const isLogged = useMemo(() => {
    return Object.values(sessions).some((s) => s.mealPlanKey === mealPlanKey);
  }, [sessions, mealPlanKey]);

  if (isLogged) {
    // Show checkmark if already logged
    return (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={SPRING.bouncy}
        className={`${sizeStyles[size]} rounded-full bg-green-500 flex items-center justify-center`}
        title="Already logged"
      >
        <svg
          className="w-full h-full text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </motion.div>
    );
  }

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={SPRING.gentle}
        onClick={(e) => {
          e.stopPropagation();
          setIsModalOpen(true);
        }}
        className={`
          ${sizeStyles[size]} rounded-full
          bg-olive-100 hover:bg-green-100
          border-2 border-olive-300 hover:border-green-400
          flex items-center justify-center
          transition-colors
        `}
        title="Mark as cooked"
        aria-label="Mark as cooked"
      >
        <svg
          className="w-full h-full text-olive-500 hover:text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </motion.button>

      <CookingLogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recipe={recipe}
        date={date}
        mealType={mealType}
        mealPlanKey={mealPlanKey}
      />
    </>
  );
}
