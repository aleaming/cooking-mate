'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { MonthlyCalendar, RecipeSidebar, DraggableRecipeCard } from '@/components/calendar';
import { allRecipes } from '@/data/recipes';
import { useMealPlanStore } from '@/stores/useMealPlanStore';
import { Recipe, MealSlotType } from '@/types';
import { pageVariants } from '@/lib/constants/animations';

export default function CalendarPage() {
  const { addMeal } = useMealPlanStore();
  const [activeRecipe, setActiveRecipe] = useState<Recipe | null>(null);
  const [activeDropId, setActiveDropId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const recipe = active.data.current?.recipe as Recipe | undefined;
    if (recipe) {
      setActiveRecipe(recipe);
    }
  }, []);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    if (over) {
      setActiveDropId(over.id as string);
    } else {
      setActiveDropId(null);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveRecipe(null);
      setActiveDropId(null);

      if (!over) return;

      const recipe = active.data.current?.recipe as Recipe | undefined;
      const dropData = over.data.current as { dateString: string; mealType: MealSlotType } | undefined;

      if (recipe && dropData) {
        addMeal(dropData.dateString, dropData.mealType, recipe);
      }
    },
    [addMeal]
  );

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="h-[calc(100vh-64px)] flex"
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {/* Recipe Sidebar */}
        <div className="w-72 flex-shrink-0">
          <RecipeSidebar recipes={allRecipes} />
        </div>

        {/* Calendar Area */}
        <div className="flex-1 p-6 overflow-auto bg-sand-50">
          <div className="max-w-6xl mx-auto">
            {/* Page Header */}
            <div className="mb-6">
              <h1 className="font-display text-2xl font-bold text-olive-900">
                Meal Planner
              </h1>
              <p className="text-sand-600 mt-1">
                Drag recipes from the sidebar to plan your meals
              </p>
            </div>

            {/* Calendar */}
            <MonthlyCalendar activeDropId={activeDropId} />

            {/* Legend */}
            <div className="mt-4 flex items-center gap-6 text-sm text-sand-600">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-terracotta-100 border border-terracotta-200" />
                <span>Breakfast</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-aegean-100 border border-aegean-200" />
                <span>Lunch</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-olive-100 border border-olive-200" />
                <span>Dinner</span>
              </div>
            </div>
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeRecipe && (
            <div className="opacity-90">
              <DraggableRecipeCard recipe={activeRecipe} />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </motion.div>
  );
}
