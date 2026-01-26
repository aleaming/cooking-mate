'use client';

import Link from 'next/link';
import { Modal, Button, Badge } from '@/components/ui';
import { MarkAsCookedButton } from '@/components/cooking-log';
import { Recipe, MealSlotType } from '@/types';
import type { FamilyMealPlanWithDetails } from '@/types/family';
import {
  IconClock,
  IconFlame,
  IconUsers,
  IconToolsKitchen2,
  IconChefHat,
  IconX,
  IconExternalLink,
  IconTrash,
} from '@tabler/icons-react';

interface MealDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe;
  date: string;
  mealType: MealSlotType;
  familyMeal?: FamilyMealPlanWithDetails | null;
  onRemove: () => void;
}

const difficultyConfig: Record<string, { label: string; variant: 'olive' | 'warning' | 'error' }> = {
  easy: { label: 'Easy', variant: 'olive' },
  medium: { label: 'Medium', variant: 'warning' },
  hard: { label: 'Hard', variant: 'error' },
};

const mealTypeLabels: Record<MealSlotType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

export function MealDetailModal({
  isOpen,
  onClose,
  recipe,
  date,
  mealType,
  familyMeal,
  onRemove,
}: MealDetailModalProps) {
  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const handleRemove = () => {
    onRemove();
    onClose();
  };

  const difficulty = recipe.difficulty ? difficultyConfig[recipe.difficulty] : null;
  const hasTimingInfo = recipe.prepTimeMinutes > 0 || recipe.cookTimeMinutes > 0 || recipe.totalTimeMinutes > 0;
  const hasIngredients = recipe.ingredients && recipe.ingredients.length > 0;
  const hasDietaryTags = recipe.dietaryTags && recipe.dietaryTags.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      {/* Edge-to-edge Image */}
      <div className="-mx-4 -mt-4 relative">
        <div className="aspect-video overflow-hidden rounded-t-2xl">
          {recipe.imageUrl ? (
            <img
              src={recipe.imageUrl}
              alt={recipe.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-olive-100 via-olive-50 to-sand-100 flex items-center justify-center">
              <IconToolsKitchen2 size={64} className="text-olive-200" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors backdrop-blur-sm"
          aria-label="Close"
        >
          <IconX size={18} className="text-white" />
        </button>

        {/* Recipe name overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 pb-3">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="sand" size="sm">
              {mealTypeLabels[mealType]}
            </Badge>
            {familyMeal && (
              <Badge variant="aegean" size="sm">
                <IconUsers size={12} className="mr-0.5" />
                Family Meal
              </Badge>
            )}
          </div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-white leading-tight">
            {recipe.name}
          </h2>
          <p className="text-white/70 text-sm mt-0.5">{formattedDate}</p>
        </div>
      </div>

      {/* Content */}
      <div className="mt-4 space-y-4">
        {/* Description */}
        {recipe.description && (
          <p className="text-sand-700 text-sm leading-relaxed">
            {recipe.description}
          </p>
        )}

        {/* Quick Stats */}
        {(hasTimingInfo || recipe.servings > 0) && (
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {recipe.prepTimeMinutes > 0 && (
              <div className="flex items-center gap-1.5 text-sand-600">
                <IconClock size={16} className="text-olive-500" />
                <span><span className="font-medium text-olive-800">{recipe.prepTimeMinutes}</span> min prep</span>
              </div>
            )}
            {recipe.cookTimeMinutes > 0 && (
              <div className="flex items-center gap-1.5 text-sand-600">
                <IconFlame size={16} className="text-terracotta-500" />
                <span><span className="font-medium text-olive-800">{recipe.cookTimeMinutes}</span> min cook</span>
              </div>
            )}
            {recipe.totalTimeMinutes > 0 && !recipe.prepTimeMinutes && !recipe.cookTimeMinutes && (
              <div className="flex items-center gap-1.5 text-sand-600">
                <IconClock size={16} className="text-olive-500" />
                <span><span className="font-medium text-olive-800">{recipe.totalTimeMinutes}</span> min total</span>
              </div>
            )}
            {recipe.servings > 0 && (
              <div className="flex items-center gap-1.5 text-sand-600">
                <IconToolsKitchen2 size={16} className="text-aegean-500" />
                <span><span className="font-medium text-olive-800">{recipe.servings}</span> servings</span>
              </div>
            )}
            {difficulty && (
              <div className="flex items-center gap-1.5">
                <IconChefHat size={16} className="text-sand-500" />
                <Badge variant={difficulty.variant} size="sm">{difficulty.label}</Badge>
              </div>
            )}
          </div>
        )}

        {/* Dietary Tags */}
        {hasDietaryTags && (
          <div className="flex flex-wrap gap-1.5">
            {recipe.dietaryTags.map((tag) => (
              <Badge key={tag} variant="olive" size="sm">
                {tag.replace('-', ' ')}
              </Badge>
            ))}
            {recipe.cuisine && (
              <Badge variant="aegean" size="sm">
                {recipe.cuisine}
              </Badge>
            )}
          </div>
        )}

        {/* Family Proposer */}
        {familyMeal?.createdByProfile && (
          <div className="flex items-center gap-2 p-3 bg-aegean-50 rounded-xl border border-aegean-100">
            <IconUsers size={16} className="text-aegean-600 flex-shrink-0" />
            <span className="text-sm text-aegean-800">
              Proposed by{' '}
              <span className="font-medium">
                {familyMeal.createdByProfile.displayName || familyMeal.createdByProfile.email}
              </span>
            </span>
          </div>
        )}

        {/* Ingredients Preview */}
        {hasIngredients && (
          <div>
            <h3 className="font-display text-sm font-semibold text-olive-900 mb-2">
              Ingredients ({recipe.ingredients.length})
            </h3>
            <ul className="space-y-1 max-h-44 overflow-y-auto pr-1">
              {recipe.ingredients.slice(0, 10).map((ing) => (
                <li
                  key={ing.id}
                  className="text-sm text-sand-700 flex items-baseline gap-1.5 py-0.5"
                >
                  <span className="w-1 h-1 rounded-full bg-olive-400 flex-shrink-0 mt-1.5" />
                  {ing.quantity != null && (
                    <span className="text-olive-700 font-medium whitespace-nowrap">
                      {ing.quantity}{ing.unit ? ` ${ing.unit}` : ''}
                    </span>
                  )}
                  <span>{ing.name}</span>
                  {ing.preparation && (
                    <span className="text-sand-400 italic text-xs">, {ing.preparation}</span>
                  )}
                </li>
              ))}
              {recipe.ingredients.length > 10 && (
                <li className="text-sm text-olive-500 font-medium pt-1">
                  +{recipe.ingredients.length - 10} more ingredients...
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="mt-6 pt-4 border-t border-sand-200 flex flex-col sm:flex-row gap-2">
        <Link href={`/recipes/${recipe.id}`} className="flex-1">
          <Button
            variant="primary"
            size="md"
            className="w-full"
            leftIcon={<IconExternalLink size={18} />}
          >
            View Full Recipe
          </Button>
        </Link>
        <div className="flex gap-2">
          <MarkAsCookedButton
            recipe={recipe}
            date={date}
            mealType={mealType}
            size="md"
          />
          <Button
            variant="outline"
            size="md"
            onClick={handleRemove}
            leftIcon={<IconTrash size={18} />}
          >
            Remove
          </Button>
        </div>
      </div>
    </Modal>
  );
}
