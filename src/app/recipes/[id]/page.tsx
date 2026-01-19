'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useSearchParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button, Badge, Card, Skeleton } from '@/components/ui';
import { AddToMealPlanDrawer, TimerButton } from '@/components/recipes';
import { RecipeCookingStats } from '@/components/cooking-log';
import { ServingsSelector, CheckableIngredientsList } from '@/components/scaling';
import { SimilarRecipesSection, PairingRecipesSection } from '@/components/suggestions';
import { getRecipeById } from '@/data/recipes';
import { getUserRecipeById } from '@/lib/actions/userRecipes';
import { scaleRecipe } from '@/lib/utils/recipeScaling';
import { parseTimeFromText } from '@/lib/utils/timer';
import { pageVariants, staggerContainer, staggerItem } from '@/lib/constants/animations';
import { IconBulb } from '@tabler/icons-react';
import type { Recipe } from '@/types';

export default function RecipeDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const recipeId = params.id as string;

  // Determine where to go back to
  const fromSource = searchParams.get('from');
  const backUrl = fromSource === 'my-recipes' ? '/recipes/my-recipes' : '/recipes';
  const backLabel = fromSource === 'my-recipes' ? 'My Recipes' : 'Recipes';

  // Check if this is a user-created recipe
  const isUserRecipe = recipeId.startsWith('user-');

  // For static recipes, get immediately
  const staticRecipe = !isUserRecipe ? getRecipeById(recipeId) : null;

  const [userRecipe, setUserRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(isUserRecipe);
  const [error, setError] = useState<string | null>(null);

  // Fetch user recipe from Supabase if needed
  useEffect(() => {
    if (!isUserRecipe) return;

    async function fetchUserRecipe() {
      setLoading(true);
      const result = await getUserRecipeById(recipeId);
      if (result.error || !result.data) {
        setError(result.error || 'Recipe not found');
      } else {
        setUserRecipe(result.data as Recipe);
      }
      setLoading(false);
    }

    fetchUserRecipe();
  }, [recipeId, isUserRecipe]);

  const recipe = staticRecipe || userRecipe;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetServings, setTargetServings] = useState(4);

  // Update target servings when recipe loads
  useEffect(() => {
    if (recipe?.servings) {
      setTargetServings(recipe.servings);
    }
  }, [recipe?.servings]);

  // Calculate scaling result - must be called before any returns (rules of hooks)
  const scalingResult = useMemo(
    () => recipe ? scaleRecipe(recipe.ingredients, recipe.servings, targetServings) : null,
    [recipe, targetServings]
  );

  // Show loading state for user recipes
  if (loading) {
    return (
      <div className="min-h-screen bg-sand-50 p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
          <div className="grid md:grid-cols-3 gap-8">
            <Skeleton className="h-96" />
            <Skeleton className="h-96 md:col-span-2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !recipe || !scalingResult) {
    notFound();
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-sand-50 overflow-x-hidden"
    >
      {/* Hero Section */}
      <div className="relative h-64 md:h-80 lg:h-96 bg-gradient-to-br from-olive-100 to-sand-100">
        {recipe.imageUrl && (
          <img
            src={recipe.imageUrl}
            alt={recipe.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* Back Button */}
        <div className="absolute top-4 left-4">
          <Link href={backUrl}>
            <Button
              variant="ghost"
              size="sm"
              className="bg-white/90 hover:bg-white"
              leftIcon={<ChevronLeftIcon className="w-4 h-4" />}
            >
              {backLabel}
            </Button>
          </Link>
        </div>

        {/* Recipe Title */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
          <div className="max-w-4xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-2xl sm:text-3xl md:text-4xl font-bold mb-1 sm:mb-2"
            >
              {recipe.name}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-white/90 max-w-2xl text-sm sm:text-base line-clamp-2 sm:line-clamp-none"
            >
              {recipe.description}
            </motion.p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Info Bar */}
        <Card
          padding="md"
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Stats Row */}
            <div className="flex items-center justify-between sm:justify-start sm:gap-6 flex-1">
              <div className="flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-sand-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-sand-500">Time</p>
                  <p className="font-medium text-olive-900 text-sm sm:text-base">{recipe.totalTimeMinutes} min</p>
                </div>
              </div>

              <div className="hidden sm:block w-px h-8 bg-sand-200" />

              <div className="flex items-center gap-2">
                <UsersIcon className="w-5 h-5 text-sand-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-sand-500">Servings</p>
                  <p className="font-medium text-olive-900 text-sm sm:text-base">{targetServings}</p>
                </div>
              </div>

              <div className="hidden sm:block w-px h-8 bg-sand-200" />

              <div className="flex items-center gap-2">
                <ChefHatIcon className="w-5 h-5 text-sand-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-sand-500">Difficulty</p>
                  <p className="font-medium text-olive-900 capitalize text-sm sm:text-base">{recipe.difficulty}</p>
                </div>
              </div>
            </div>

            {/* Add to Plan Button */}
            <Button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto"
              leftIcon={<CalendarIcon className="w-4 h-4" />}
            >
              Add to Plan
            </Button>
          </div>
        </Card>

        {/* Tags */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap gap-2 mb-8"
        >
          <Badge
            variant={
              recipe.mealType === 'breakfast'
                ? 'terracotta'
                : recipe.mealType === 'lunch'
                ? 'aegean'
                : 'olive'
            }
          >
            {recipe.mealType}
          </Badge>
          {recipe.dietaryTags.map((tag) => (
            <Badge key={tag} variant="sand">
              {tag}
            </Badge>
          ))}
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Ingredients */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="md:col-span-1 min-w-0"
          >
            <Card padding="md" className="sticky top-24 space-y-4 sm:space-y-6 sm:p-6">
              <div>
                <h2 className="font-display text-lg sm:text-xl font-semibold text-olive-900 mb-3 sm:mb-4">
                  Ingredients
                </h2>

                {/* Enhanced Servings Selector */}
                <ServingsSelector
                  originalServings={recipe.servings}
                  targetServings={targetServings}
                  onChange={setTargetServings}
                />
              </div>

              {/* Checkable Ingredients List */}
              <CheckableIngredientsList recipeId={recipe.id} scalingResult={scalingResult} />

              {/* Cooking Stats */}
              <RecipeCookingStats recipeId={recipe.id} />
            </Card>
          </motion.div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="md:col-span-2 min-w-0"
          >
            <Card padding="md" className="sm:p-6">
              <h2 className="font-display text-lg sm:text-xl font-semibold text-olive-900 mb-4 sm:mb-6">
                Instructions
              </h2>

              <motion.ol
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="space-y-6"
              >
                {recipe.instructions.map((instruction) => {
                  const timerConfig = parseTimeFromText(instruction.text);

                  return (
                    <motion.li
                      key={instruction.step}
                      variants={staggerItem}
                      className="flex gap-3 sm:gap-4"
                    >
                      <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-olive-100 flex items-center justify-center font-semibold text-olive-700 text-sm sm:text-base">
                        {instruction.step}
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5 sm:pt-1">
                        <p className="text-olive-800 leading-relaxed text-sm sm:text-base break-words">
                          {instruction.text}
                        </p>

                        {/* Timer button - shown when instruction contains a time */}
                        {timerConfig && (
                          <div className="mt-2">
                            <TimerButton config={timerConfig} />
                          </div>
                        )}

                        {instruction.tip && (
                          <p className="mt-2 text-xs sm:text-sm text-aegean-600 bg-aegean-50 p-2 rounded-lg flex items-start gap-1.5 min-w-0">
                            <IconBulb size={16} className="flex-shrink-0 mt-0.5" />
                            <span className="min-w-0 break-words overflow-wrap-anywhere">{instruction.tip}</span>
                          </p>
                        )}
                      </div>
                    </motion.li>
                  );
                })}
              </motion.ol>
            </Card>

            {/* Tips */}
            {recipe.tips && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-6 bg-olive-50 rounded-2xl p-4 sm:p-6"
              >
                <h3 className="font-display font-semibold text-olive-900 mb-2 flex items-center gap-2 text-base sm:text-lg">
                  <IconBulb size={20} className="text-olive-600 flex-shrink-0" />
                  Tips
                </h3>
                <p className="text-olive-700 text-sm sm:text-base break-words overflow-wrap-anywhere">{recipe.tips}</p>
              </motion.div>
            )}

            {/* Nutrition */}
            {recipe.nutrition && (
              <Card
                padding="md"
                className="mt-6 sm:p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <h3 className="font-display font-semibold text-olive-900 mb-3 sm:mb-4 text-base sm:text-lg">
                  Nutrition (per serving)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
                  <NutritionItem label="Calories" value={recipe.nutrition.calories} unit="kcal" />
                  <NutritionItem label="Protein" value={recipe.nutrition.protein} unit="g" />
                  <NutritionItem label="Carbs" value={recipe.nutrition.carbohydrates} unit="g" />
                  <NutritionItem label="Fat" value={recipe.nutrition.fat} unit="g" />
                </div>
              </Card>
            )}

            {/* Pairs Well With */}
            <PairingRecipesSection recipeId={recipe.id} limit={4} />

            {/* Similar Recipes */}
            <SimilarRecipesSection recipeId={recipe.id} limit={6} />
          </motion.div>
        </div>
      </div>

      {/* Add to Meal Plan Drawer */}
      <AddToMealPlanDrawer
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        recipe={recipe}
      />
    </motion.div>
  );
}

function NutritionItem({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="text-center p-2 sm:p-3 bg-sand-50 rounded-xl">
      <p className="text-xl sm:text-2xl font-semibold text-olive-800">{value}</p>
      <p className="text-xs text-sand-600">
        {unit} {label}
      </p>
    </div>
  );
}

// Icons
function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function ChefHatIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
