'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Recipe } from '@/types';
import { Badge } from '@/components/ui';
import { SPRING } from '@/lib/constants/animations';

interface DraggableRecipeCardProps {
  recipe: Recipe & { ownerName?: string };
}

export function DraggableRecipeCard({ recipe }: DraggableRecipeCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `recipe-${recipe.id}`,
    data: {
      type: 'recipe',
      recipe,
    },
  });

  const style = transform
    ? {
        transform: CSS.Transform.toString(transform),
      }
    : undefined;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: isDragging ? 0.5 : 1,
        y: 0,
        scale: isDragging ? 1.05 : 1,
        boxShadow: isDragging
          ? '0 20px 40px rgba(0, 0, 0, 0.15)'
          : '0 2px 8px rgba(0, 0, 0, 0.08)',
      }}
      whileHover={{ scale: 1.02 }}
      transition={SPRING.gentle}
      className={`
        bg-card rounded-xl p-3 cursor-grab active:cursor-grabbing
        ${isDragging ? 'z-50' : ''}
      `}
    >
      {/* Recipe Image Placeholder */}
      <div className="w-full h-20 rounded-lg bg-gradient-to-br from-olive-100 to-sand-100 mb-2 overflow-hidden">
        {recipe.imageUrl && (
          <img
            src={recipe.imageUrl}
            alt={recipe.name}
            className="w-full h-full object-cover"
            draggable={false}
          />
        )}
      </div>

      {/* Recipe Info */}
      <h4 className="font-medium text-sm text-olive-900 line-clamp-1 mb-0.5">
        {recipe.name}
      </h4>
      {recipe.ownerName && (
        <p className="text-[10px] text-sand-400 truncate mb-0.5">
          By {recipe.ownerName}
        </p>
      )}

      <div className="flex items-center gap-2 text-xs text-sand-600">
        <span className="flex items-center gap-1">
          <ClockIcon className="w-3 h-3" />
          {recipe.totalTimeMinutes}m
        </span>
        <Badge
          variant={
            recipe.mealType === 'breakfast'
              ? 'terracotta'
              : recipe.mealType === 'lunch'
              ? 'aegean'
              : 'olive'
          }
          size="sm"
        >
          {recipe.mealType}
        </Badge>
      </div>
    </motion.div>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
