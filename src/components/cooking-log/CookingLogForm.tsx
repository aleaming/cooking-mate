'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, Textarea } from '@/components/ui';
import { StarRating } from './StarRating';
import { CookingRating, Recipe } from '@/types';
import { staggerContainer, staggerItem } from '@/lib/constants/animations';

interface CookingLogFormProps {
  recipe: Recipe;
  date: string; // YYYY-MM-DD
  onSubmit: (data: CookingLogFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface CookingLogFormData {
  rating: CookingRating | null;
  notes: string;
  actualServings: number;
  scaleFactor: number;
}

export function CookingLogForm({
  recipe,
  date,
  onSubmit,
  onCancel,
  isLoading = false,
}: CookingLogFormProps) {
  const [rating, setRating] = useState<CookingRating | null>(null);
  const [notes, setNotes] = useState('');
  const [actualServings, setActualServings] = useState(recipe.servings);

  const scaleFactor = actualServings / recipe.servings;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      rating,
      notes,
      actualServings,
      scaleFactor,
    });
  };

  const handleQuickLog = () => {
    onSubmit({
      rating: null,
      notes: '',
      actualServings: recipe.servings,
      scaleFactor: 1,
    });
  };

  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <motion.form
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {/* Recipe Info */}
      <motion.div variants={staggerItem} className="flex items-center gap-3">
        {recipe.imageUrl && (
          <img
            src={recipe.imageUrl}
            alt={recipe.name}
            className="w-16 h-16 rounded-xl object-cover"
          />
        )}
        <div>
          <h3 className="font-display font-semibold text-olive-900">{recipe.name}</h3>
          <p className="text-sm text-sand-500">{formattedDate}</p>
        </div>
      </motion.div>

      {/* Rating */}
      <motion.div variants={staggerItem}>
        <label className="block text-sm font-medium text-olive-800 mb-2">
          How was it?
        </label>
        <StarRating value={rating} onChange={setRating} size="lg" />
        <p className="text-xs text-sand-500 mt-1">
          {rating ? `${rating} star${rating > 1 ? 's' : ''}` : 'Click to rate (optional)'}
        </p>
      </motion.div>

      {/* Servings Made */}
      <motion.div variants={staggerItem}>
        <label className="block text-sm font-medium text-olive-800 mb-2">
          Servings made
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActualServings(Math.max(1, actualServings - 1))}
            className="w-10 h-10 rounded-full bg-sand-100 hover:bg-sand-200 flex items-center justify-center text-olive-700 transition-colors"
          >
            -
          </button>
          <div className="text-center">
            <span className="text-2xl font-semibold text-olive-800">{actualServings}</span>
            {scaleFactor !== 1 && (
              <p className="text-xs text-sand-500">
                {scaleFactor > 1 ? `${scaleFactor}x recipe` : `${scaleFactor}x recipe`}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setActualServings(actualServings + 1)}
            className="w-10 h-10 rounded-full bg-sand-100 hover:bg-sand-200 flex items-center justify-center text-olive-700 transition-colors"
          >
            +
          </button>
        </div>
      </motion.div>

      {/* Notes */}
      <motion.div variants={staggerItem}>
        <Textarea
          label="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any thoughts about this cooking session..."
          rows={3}
          resize="none"
        />
      </motion.div>

      {/* Actions */}
      <motion.div variants={staggerItem} className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isLoading}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleQuickLog}
          disabled={isLoading}
          className="flex-1"
        >
          Quick Log
        </Button>
        <Button type="submit" isLoading={isLoading} className="flex-1">
          Save
        </Button>
      </motion.div>
    </motion.form>
  );
}
