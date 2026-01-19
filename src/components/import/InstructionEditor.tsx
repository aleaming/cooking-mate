'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  IconPlus,
  IconTrash,
  IconGripVertical,
} from '@tabler/icons-react';
import { Textarea, Button } from '@/components/ui';
import type { ParsedInstruction } from '@/types/recipe';

export interface InstructionEditorProps {
  instructions: ParsedInstruction[];
  onChange: (instructions: ParsedInstruction[]) => void;
  disabled?: boolean;
}

export function InstructionEditor({
  instructions,
  onChange,
  disabled = false,
}: InstructionEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAdd = useCallback(() => {
    const newInstruction: ParsedInstruction = {
      step: instructions.length + 1,
      text: '',
    };
    onChange([...instructions, newInstruction]);
    setEditingIndex(instructions.length);
  }, [instructions, onChange]);

  const handleRemove = useCallback(
    (index: number) => {
      const newInstructions = instructions
        .filter((_, i) => i !== index)
        .map((inst, i) => ({ ...inst, step: i + 1 }));
      onChange(newInstructions);
      if (editingIndex === index) {
        setEditingIndex(null);
      }
    },
    [instructions, onChange, editingIndex]
  );

  const handleUpdate = useCallback(
    (index: number, field: keyof ParsedInstruction, value: string | number | undefined) => {
      const newInstructions = [...instructions];
      newInstructions[index] = {
        ...newInstructions[index],
        [field]: value,
      };
      onChange(newInstructions);
    },
    [instructions, onChange]
  );

  const handleReorder = useCallback(
    (newOrder: ParsedInstruction[]) => {
      // Update step numbers after reorder
      const reordered = newOrder.map((inst, i) => ({
        ...inst,
        step: i + 1,
      }));
      onChange(reordered);
    },
    [onChange]
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">
          Instructions ({instructions.length})
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

      {instructions.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed border-sand-200 rounded-lg">
          <p className="text-sm text-muted mb-2">No instructions</p>
          {!disabled && (
            <Button variant="ghost" size="sm" onClick={handleAdd}>
              Add your first step
            </Button>
          )}
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={instructions}
          onReorder={handleReorder}
          className="space-y-2"
        >
          {instructions.map((instruction, index) => (
            <Reorder.Item
              key={`${instruction.step}-${index}`}
              value={instruction}
              drag={!disabled}
            >
              <motion.div
                layout
                className={`
                  flex items-start gap-3 p-3 bg-sand-50 dark:bg-foreground/5 rounded-lg group
                  ${!disabled ? 'cursor-grab active:cursor-grabbing' : ''}
                `}
              >
                {/* Drag handle */}
                {!disabled && (
                  <div className="pt-1 opacity-30 group-hover:opacity-60 transition-opacity">
                    <IconGripVertical className="w-4 h-4 text-muted" />
                  </div>
                )}

                {/* Step number */}
                <div className="flex-shrink-0 w-7 h-7 rounded-full bg-olive-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-olive-700">
                    {instruction.step}
                  </span>
                </div>

                {/* Instruction content */}
                <div className="flex-1">
                  {editingIndex === index ? (
                    <div className="space-y-2">
                      <Textarea
                        value={instruction.text}
                        onChange={(e) => handleUpdate(index, 'text', e.target.value)}
                        placeholder="Describe this step..."
                        rows={3}
                        resize="none"
                        disabled={disabled}
                        autoFocus
                        className="text-sm"
                      />
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 text-xs text-muted">
                          <span>Duration (min):</span>
                          <input
                            type="number"
                            value={instruction.duration || ''}
                            onChange={(e) =>
                              handleUpdate(
                                index,
                                'duration',
                                e.target.value ? parseInt(e.target.value, 10) : undefined
                              )
                            }
                            className="w-16 px-2 py-1 bg-background border border-border rounded text-sm"
                            min="0"
                            disabled={disabled}
                          />
                        </label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingIndex(null)}
                        >
                          Done
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => !disabled && setEditingIndex(index)}
                      className={!disabled ? 'cursor-pointer' : ''}
                    >
                      <p className="text-sm text-foreground whitespace-pre-wrap">
                        {instruction.text || 'Empty step'}
                      </p>
                      {instruction.duration && (
                        <p className="text-xs text-muted mt-1">
                          ~{instruction.duration} min
                        </p>
                      )}
                      {instruction.tip && (
                        <p className="text-xs text-olive-600 mt-1 italic">
                          Tip: {instruction.tip}
                        </p>
                      )}
                      {!disabled && (
                        <p className="text-xs text-muted mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          Click to edit
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                {!disabled && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleRemove(index)}
                    aria-label="Remove step"
                    className="text-error hover:bg-error/10 opacity-0 group-hover:opacity-100"
                  >
                    <IconTrash className="w-4 h-4" />
                  </Button>
                )}
              </motion.div>
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}
    </div>
  );
}
