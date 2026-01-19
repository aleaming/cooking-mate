'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  IconChevronDown,
  IconChevronUp,
  IconClock,
  IconUsers,
  IconChefHat,
  IconX,
  IconCheck,
  IconAlertCircle,
} from '@tabler/icons-react';
import { Input, Button, Badge, Select, Textarea } from '@/components/ui';
import { IngredientEditor } from './IngredientEditor';
import { InstructionEditor } from './InstructionEditor';
import type {
  ImportedRecipeData,
  ParsedIngredient,
  ParsedInstruction,
  MealType,
  Difficulty,
  DietaryTag,
} from '@/types/recipe';

export interface RecipePreviewCardProps {
  recipe: ImportedRecipeData;
  onChange: (recipe: ImportedRecipeData) => void;
  onSave: () => void;
  onRemove: () => void;
  isSaving?: boolean;
  saveError?: string;
  fileName?: string;
}

const MEAL_TYPE_OPTIONS: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
  { value: 'any', label: 'Any' },
];

const DIFFICULTY_OPTIONS: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const DIETARY_TAG_OPTIONS: { value: DietaryTag; label: string }[] = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten-free', label: 'Gluten-Free' },
  { value: 'dairy-free', label: 'Dairy-Free' },
  { value: 'nut-free', label: 'Nut-Free' },
  { value: 'low-carb', label: 'Low Carb' },
  { value: 'high-protein', label: 'High Protein' },
];

export function RecipePreviewCard({
  recipe,
  onChange,
  onSave,
  onRemove,
  isSaving = false,
  saveError,
  fileName,
}: RecipePreviewCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFieldChange = useCallback(
    <K extends keyof ImportedRecipeData>(field: K, value: ImportedRecipeData[K]) => {
      onChange({ ...recipe, [field]: value });
    },
    [recipe, onChange]
  );

  const handleIngredientsChange = useCallback(
    (ingredients: ParsedIngredient[]) => {
      onChange({ ...recipe, ingredients });
    },
    [recipe, onChange]
  );

  const handleInstructionsChange = useCallback(
    (instructions: ParsedInstruction[]) => {
      onChange({ ...recipe, instructions });
    },
    [recipe, onChange]
  );

  const toggleDietaryTag = useCallback(
    (tag: DietaryTag) => {
      const currentTags = recipe.dietaryTags || [];
      const newTags = currentTags.includes(tag)
        ? currentTags.filter((t) => t !== tag)
        : [...currentTags, tag];
      onChange({ ...recipe, dietaryTags: newTags.length > 0 ? newTags : undefined });
    },
    [recipe, onChange]
  );

  const hasErrors =
    !recipe.title ||
    recipe.ingredients.length === 0 ||
    recipe.instructions.length === 0;

  return (
    <motion.div
      layout
      className="border border-border rounded-xl overflow-hidden bg-card"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 bg-sand-50 dark:bg-foreground/5 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div
            className={`
              w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0
              ${hasErrors ? 'bg-amber-100' : 'bg-olive-100'}
            `}
          >
            {hasErrors ? (
              <IconAlertCircle className="w-5 h-5 text-amber-600" />
            ) : (
              <IconCheck className="w-5 h-5 text-olive-600" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium text-foreground truncate">
              {recipe.title || 'Untitled Recipe'}
            </h3>
            {fileName && (
              <p className="text-xs text-muted truncate">{fileName}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-2 rounded-lg hover:bg-error/10 text-error/60 hover:text-error transition-colors"
            aria-label="Remove recipe"
          >
            <IconX className="w-5 h-5" />
          </button>
          {isExpanded ? (
            <IconChevronUp className="w-5 h-5 text-muted" />
          ) : (
            <IconChevronDown className="w-5 h-5 text-muted" />
          )}
        </div>
      </div>

      {/* Content */}
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="p-4 space-y-6"
        >
          {/* Basic Info */}
          <div className="space-y-4">
            <Input
              label="Recipe Title"
              value={recipe.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="Enter recipe title"
              error={!recipe.title ? 'Title is required' : undefined}
            />

            <Textarea
              label="Description"
              value={recipe.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value || undefined)}
              placeholder="Brief description of the recipe..."
              rows={2}
              resize="none"
            />
          </div>

          {/* Timing & Servings */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="flex items-center gap-1 text-sm font-medium text-foreground mb-1">
                <IconClock className="w-4 h-4" />
                Prep Time
              </label>
              <Input
                type="number"
                value={recipe.prepTime || ''}
                onChange={(e) =>
                  handleFieldChange('prepTime', e.target.value ? parseInt(e.target.value, 10) : undefined)
                }
                placeholder="min"
                min={0}
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-sm font-medium text-foreground mb-1">
                <IconClock className="w-4 h-4" />
                Cook Time
              </label>
              <Input
                type="number"
                value={recipe.cookTime || ''}
                onChange={(e) =>
                  handleFieldChange('cookTime', e.target.value ? parseInt(e.target.value, 10) : undefined)
                }
                placeholder="min"
                min={0}
              />
            </div>
            <div>
              <label className="flex items-center gap-1 text-sm font-medium text-foreground mb-1">
                <IconUsers className="w-4 h-4" />
                Servings
              </label>
              <Input
                type="number"
                value={recipe.servings || ''}
                onChange={(e) =>
                  handleFieldChange('servings', e.target.value ? parseInt(e.target.value, 10) : undefined)
                }
                placeholder="4"
                min={1}
              />
            </div>
          </div>

          {/* Ingredients */}
          <IngredientEditor
            ingredients={recipe.ingredients}
            onChange={handleIngredientsChange}
          />

          {/* Instructions */}
          <InstructionEditor
            instructions={recipe.instructions}
            onChange={handleInstructionsChange}
          />

          {/* Advanced Options Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            {showAdvanced ? (
              <IconChevronUp className="w-4 h-4" />
            ) : (
              <IconChevronDown className="w-4 h-4" />
            )}
            {showAdvanced ? 'Hide' : 'Show'} advanced options
          </button>

          {/* Advanced Options */}
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="space-y-4 pt-2"
            >
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Meal Type"
                  value={recipe.mealType || ''}
                  onChange={(e) =>
                    handleFieldChange('mealType', (e.target.value as MealType) || undefined)
                  }
                  placeholder="Select..."
                  options={MEAL_TYPE_OPTIONS}
                  size="sm"
                />
                <Select
                  label="Difficulty"
                  value={recipe.difficulty || ''}
                  onChange={(e) =>
                    handleFieldChange('difficulty', (e.target.value as Difficulty) || undefined)
                  }
                  placeholder="Select..."
                  options={DIFFICULTY_OPTIONS}
                  size="sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Cuisine
                </label>
                <Input
                  value={recipe.cuisine || ''}
                  onChange={(e) => handleFieldChange('cuisine', e.target.value || undefined)}
                  placeholder="e.g., Italian, Mediterranean"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Dietary Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_TAG_OPTIONS.map((tag) => {
                    const isSelected = recipe.dietaryTags?.includes(tag.value);
                    return (
                      <button
                        key={tag.value}
                        onClick={() => toggleDietaryTag(tag.value)}
                        className={`
                          px-3 py-1 rounded-full text-sm border transition-colors
                          ${
                            isSelected
                              ? 'bg-olive-100 border-olive-300 text-olive-700'
                              : 'bg-background border-border text-muted hover:border-olive-300'
                          }
                        `}
                      >
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {recipe.sourceUrl && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Source URL
                  </label>
                  <p className="text-sm text-muted truncate">{recipe.sourceUrl}</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Error message */}
          {saveError && (
            <div className="p-3 bg-error/10 border border-error/30 rounded-lg text-sm text-error">
              {saveError}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button variant="ghost" onClick={onRemove}>
              Remove
            </Button>
            <Button
              variant="primary"
              onClick={onSave}
              disabled={isSaving || hasErrors}
            >
              {isSaving ? 'Saving...' : 'Save Recipe'}
            </Button>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
