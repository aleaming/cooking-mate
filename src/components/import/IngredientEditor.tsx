'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  IconPlus,
  IconTrash,
  IconGripVertical,
} from '@tabler/icons-react';
import { Input, Button } from '@/components/ui';
import type { ParsedIngredient } from '@/types/recipe';

export interface IngredientEditorProps {
  ingredients: ParsedIngredient[];
  onChange: (ingredients: ParsedIngredient[]) => void;
  disabled?: boolean;
}

export function IngredientEditor({
  ingredients,
  onChange,
  disabled = false,
}: IngredientEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAdd = useCallback(() => {
    const newIngredient: ParsedIngredient = {
      text: '',
      name: '',
    };
    onChange([...ingredients, newIngredient]);
    setEditingIndex(ingredients.length);
  }, [ingredients, onChange]);

  const handleRemove = useCallback(
    (index: number) => {
      const newIngredients = ingredients.filter((_, i) => i !== index);
      onChange(newIngredients);
      if (editingIndex === index) {
        setEditingIndex(null);
      }
    },
    [ingredients, onChange, editingIndex]
  );

  const handleUpdate = useCallback(
    (index: number, field: keyof ParsedIngredient, value: string | number | undefined) => {
      const newIngredients = [...ingredients];
      newIngredients[index] = {
        ...newIngredients[index],
        [field]: value,
      };

      // Also update the text field to reflect changes
      if (field !== 'text') {
        const ing = newIngredients[index];
        const parts = [];
        if (ing.quantity) parts.push(ing.quantity);
        if (ing.unit) parts.push(ing.unit);
        if (ing.name) parts.push(ing.name);
        if (ing.preparation) parts.push(`, ${ing.preparation}`);
        newIngredients[index].text = parts.join(' ');
      }

      onChange(newIngredients);
    },
    [ingredients, onChange]
  );

  const handleReorder = useCallback(
    (newOrder: ParsedIngredient[]) => {
      onChange(newOrder);
    },
    [onChange]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">
          Ingredients ({ingredients.length})
        </h4>
        {!disabled && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleAdd}
            leftIcon={<IconPlus className="w-4 h-4" />}
          >
            Add
          </Button>
        )}
      </div>

      {ingredients.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-sand-200 rounded-lg">
          <p className="text-sm text-muted mb-2">No ingredients</p>
          {!disabled && (
            <Button variant="ghost" size="sm" onClick={handleAdd}>
              Add your first ingredient
            </Button>
          )}
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={ingredients}
          onReorder={handleReorder}
          className="space-y-2"
        >
          {ingredients.map((ingredient, index) => (
            <Reorder.Item
              key={`${ingredient.text}-${index}`}
              value={ingredient}
              drag={!disabled}
            >
              <motion.div
                layout
                className={`
                  flex items-start gap-2 p-3 bg-sand-50 dark:bg-foreground/5 rounded-lg group
                  ${!disabled ? 'cursor-grab active:cursor-grabbing' : ''}
                `}
              >
                {/* Drag handle */}
                {!disabled && (
                  <div className="pt-2 opacity-30 group-hover:opacity-60 transition-opacity">
                    <IconGripVertical className="w-4 h-4 text-muted" />
                  </div>
                )}

                {/* Ingredient fields */}
                <div className="flex-1 space-y-2">
                  {editingIndex === index ? (
                    // Expanded edit mode
                    <div className="grid grid-cols-4 gap-2">
                      <Input
                        type="number"
                        value={ingredient.quantity || ''}
                        onChange={(e) =>
                          handleUpdate(
                            index,
                            'quantity',
                            e.target.value ? parseFloat(e.target.value) : undefined
                          )
                        }
                        placeholder="Qty"
                        disabled={disabled}
                      />
                      <Input
                        value={ingredient.unit || ''}
                        onChange={(e) => handleUpdate(index, 'unit', e.target.value || undefined)}
                        placeholder="Unit"
                        disabled={disabled}
                      />
                      <div className="col-span-2">
                        <Input
                          value={ingredient.name || ''}
                          onChange={(e) => handleUpdate(index, 'name', e.target.value || undefined)}
                          placeholder="Ingredient name"
                          disabled={disabled}
                        />
                      </div>
                      <div className="col-span-4">
                        <Input
                          value={ingredient.preparation || ''}
                          onChange={(e) =>
                            handleUpdate(index, 'preparation', e.target.value || undefined)
                          }
                          placeholder="Preparation (e.g., diced, minced)"
                          disabled={disabled}
                        />
                      </div>
                    </div>
                  ) : (
                    // Collapsed view
                    <div
                      onClick={() => !disabled && setEditingIndex(index)}
                      className={!disabled ? 'cursor-pointer' : ''}
                    >
                      <p className="text-sm text-foreground">
                        {ingredient.text || ingredient.name || 'Empty ingredient'}
                      </p>
                      {!disabled && (
                        <p className="text-xs text-muted mt-0.5">Click to edit</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {!disabled && (
                  <div className="flex items-center gap-1">
                    {editingIndex === index && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingIndex(null)}
                      >
                        Done
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleRemove(index)}
                      aria-label="Remove ingredient"
                      className="text-error hover:bg-error/10"
                    >
                      <IconTrash className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </motion.div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}
    </div>
  );
}
