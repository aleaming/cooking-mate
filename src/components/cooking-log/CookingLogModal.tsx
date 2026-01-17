'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui';
import { CookingLogForm, CookingLogFormData } from './CookingLogForm';
import { useCookingLogStore } from '@/stores/useCookingLogStore';
import { Recipe, MealSlotType } from '@/types';

interface CookingLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe;
  date: string; // YYYY-MM-DD
  mealType: MealSlotType;
  mealPlanKey: string; // YYYY-MM-DD-mealType
}

export function CookingLogModal({
  isOpen,
  onClose,
  recipe,
  date,
  mealType,
  mealPlanKey,
}: CookingLogModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const logCooking = useCookingLogStore((state) => state.logCooking);

  const handleSubmit = async (data: CookingLogFormData) => {
    setIsLoading(true);

    try {
      logCooking({
        recipeId: recipe.id,
        mealPlanKey,
        cookedAt: new Date(date + 'T12:00:00').toISOString(),
        actualServings: data.actualServings,
        scaleFactor: data.scaleFactor,
        rating: data.rating,
        notes: data.notes,
        mealType,
      });

      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Cooking Session" size="md">
      <CookingLogForm
        recipe={recipe}
        date={date}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isLoading={isLoading}
      />
    </Modal>
  );
}
