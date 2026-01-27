'use client';

import { useState, useMemo } from 'react';
import { Modal, Input, Button, Badge } from '@/components/ui';
import { Recipe, MealSlotType } from '@/types';
import {
  IconSearch,
  IconClock,
  IconChefHat,
  IconToolsKitchen2,
} from '@tabler/icons-react';

interface ReplacementRecipePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
  currentRecipeId: string;
  mealType: MealSlotType;
  onSelectRecipe: (recipe: Recipe) => void;
}

const mealTypeLabels: Record<MealSlotType | 'all', string> = {
  all: 'All',
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
};

const difficultyConfig: Record<string, { label: string; variant: 'olive' | 'warning' | 'error' }> = {
  easy: { label: 'Easy', variant: 'olive' },
  medium: { label: 'Medium', variant: 'warning' },
  hard: { label: 'Hard', variant: 'error' },
};

export function ReplacementRecipePickerModal({
  isOpen,
  onClose,
  recipes,
  currentRecipeId,
  mealType,
  onSelectRecipe,
}: ReplacementRecipePickerModalProps) {
  const [search, setSearch] = useState('');
  const [filterMealType, setFilterMealType] = useState<MealSlotType | 'all'>(mealType);

  const filteredRecipes = useMemo(() => {
    return recipes
      .filter((r) => r.id !== currentRecipeId)
      .filter((r) => {
        if (filterMealType !== 'all' && r.mealType !== filterMealType) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          return (
            r.name.toLowerCase().includes(q) ||
            r.description?.toLowerCase().includes(q) ||
            r.cuisine?.toLowerCase().includes(q)
          );
        }
        return true;
      });
  }, [recipes, currentRecipeId, filterMealType, search]);

  const handleSelect = (recipe: Recipe) => {
    onSelectRecipe(recipe);
    setSearch('');
    setFilterMealType(mealType);
  };

  const handleClose = () => {
    setSearch('');
    setFilterMealType(mealType);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Suggest Replacement" size="xl">
      {/* Search */}
      <div className="mb-3">
        <Input
          placeholder="Search recipes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<IconSearch size={18} />}
        />
      </div>

      {/* Meal Type Filters */}
      <div className="flex gap-2 mb-4">
        {(['all', 'breakfast', 'lunch', 'dinner'] as const).map((type) => (
          <Button
            key={type}
            variant={filterMealType === type ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setFilterMealType(type)}
          >
            {mealTypeLabels[type]}
          </Button>
        ))}
      </div>

      {/* Recipe List */}
      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-8 text-sand-500">
            <IconToolsKitchen2 size={32} className="mx-auto mb-2 text-sand-300" />
            <p className="text-sm">No recipes found</p>
          </div>
        ) : (
          filteredRecipes.map((recipe) => {
            const difficulty = recipe.difficulty ? difficultyConfig[recipe.difficulty] : null;

            return (
              <button
                key={recipe.id}
                onClick={() => handleSelect(recipe)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-sand-200 hover:border-olive-300 hover:bg-olive-50/50 transition-colors text-left"
              >
                {/* Thumbnail */}
                <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-sand-100">
                  {recipe.imageUrl ? (
                    <img
                      src={recipe.imageUrl}
                      alt={recipe.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <IconToolsKitchen2 size={20} className="text-sand-300" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-olive-900 truncate">
                    {recipe.name}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {recipe.totalTimeMinutes > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-sand-500">
                        <IconClock size={12} />
                        {recipe.totalTimeMinutes} min
                      </span>
                    )}
                    {difficulty && (
                      <span className="flex items-center gap-0.5 text-xs text-sand-500">
                        <IconChefHat size={12} />
                        <Badge variant={difficulty.variant} size="sm">
                          {difficulty.label}
                        </Badge>
                      </span>
                    )}
                    {recipe.cuisine && (
                      <Badge variant="aegean" size="sm">
                        {recipe.cuisine}
                      </Badge>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </Modal>
  );
}
