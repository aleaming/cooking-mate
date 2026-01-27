'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Recipe } from '@/types';
import { Button } from '@/components/ui';
import { IconX } from '@tabler/icons-react';

interface PlacementBannerProps {
  recipe: (Recipe & { ownerName?: string }) | null;
  onCancel: () => void;
}

export function PlacementBanner({ recipe, onCancel }: PlacementBannerProps) {
  return (
    <AnimatePresence>
      {recipe && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-olive-50 border border-olive-200 rounded-xl px-4 py-3 flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-olive-500 animate-pulse" />
            <p className="text-sm text-olive-800">
              <span className="font-semibold">{recipe.name}</span>
              {' — '}
              Click a meal slot on the calendar to place it
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <IconX size={16} className="mr-1" />
            Cancel
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
