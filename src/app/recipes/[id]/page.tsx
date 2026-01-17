'use client';

import { useState, useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button, Badge, Card } from '@/components/ui';
import { AddToMealPlanDrawer } from '@/components/recipes/AddToMealPlanDrawer';
import { RecipeCookingStats } from '@/components/cooking-log';
import { ServingsSelector, ScaledIngredientsList } from '@/components/scaling';
import { SimilarRecipesSection, PairingRecipesSection } from '@/components/suggestions';
import { getRecipeById } from '@/data/recipes';
import { scaleRecipe } from '@/lib/utils/recipeScaling';
import { pageVariants, staggerContainer, staggerItem } from '@/lib/constants/animations';
import { IconBulb } from '@tabler/icons-react';

export default function RecipeDetailPage() {
  const params = useParams();
  const recipeId = params.id as string;
  const recipe = getRecipeById(recipeId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetServings, setTargetServings] = useState(recipe?.servings ?? 4);

  if (!recipe) {
    notFound();
  }

  const scalingResult = useMemo(
    () => scaleRecipe(recipe.ingredients, recipe.servings, targetServings),
    [recipe.ingredients, recipe.servings, targetServings]
  );

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-sand-50"
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
          <Link href="/recipes">
            <Button variant="ghost" size="sm" className="bg-white/90 hover:bg-white">
              <ChevronLeftIcon className="w-4 h-4 mr-1" />
              Back
            </Button>
          </Link>
        </div>

        {/* Recipe Title */}
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="max-w-4xl mx-auto">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-3xl md:text-4xl font-bold mb-2"
            >
              {recipe.name}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-white/90 max-w-2xl"
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
          className="flex flex-wrap items-center gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-sand-500" />
            <div>
              <p className="text-xs text-sand-500">Total Time</p>
              <p className="font-medium text-olive-900">{recipe.totalTimeMinutes} min</p>
            </div>
          </div>

          <div className="w-px h-8 bg-sand-200" />

          <div className="flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-sand-500" />
            <div>
              <p className="text-xs text-sand-500">Servings</p>
              <p className="font-medium text-olive-900">{targetServings}</p>
            </div>
          </div>

          <div className="w-px h-8 bg-sand-200" />

          <div className="flex items-center gap-2">
            <ChefHatIcon className="w-5 h-5 text-sand-500" />
            <div>
              <p className="text-xs text-sand-500">Difficulty</p>
              <p className="font-medium text-olive-900 capitalize">{recipe.difficulty}</p>
            </div>
          </div>

          <div className="flex-1" />

          <Button onClick={() => setIsModalOpen(true)}>
            <CalendarIcon className="w-4 h-4 mr-2" />
            Add to Plan
          </Button>
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
            className="md:col-span-1"
          >
            <Card padding="lg" className="sticky top-24 space-y-6">
              <div>
                <h2 className="font-display text-xl font-semibold text-olive-900 mb-4">
                  Ingredients
                </h2>

                {/* Enhanced Servings Selector */}
                <ServingsSelector
                  originalServings={recipe.servings}
                  targetServings={targetServings}
                  onChange={setTargetServings}
                />
              </div>

              {/* Scaled Ingredients List */}
              <ScaledIngredientsList scalingResult={scalingResult} />

              {/* Cooking Stats */}
              <RecipeCookingStats recipeId={recipe.id} />
            </Card>
          </motion.div>

          {/* Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="md:col-span-2"
          >
            <Card padding="lg">
              <h2 className="font-display text-xl font-semibold text-olive-900 mb-6">
                Instructions
              </h2>

              <motion.ol
                variants={staggerContainer}
                initial="initial"
                animate="animate"
                className="space-y-6"
              >
                {recipe.instructions.map((instruction) => (
                  <motion.li
                    key={instruction.step}
                    variants={staggerItem}
                    className="flex gap-4"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-olive-100 flex items-center justify-center font-semibold text-olive-700">
                      {instruction.step}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-olive-800 leading-relaxed">
                        {instruction.text}
                      </p>
                      {instruction.tip && (
                        <p className="mt-2 text-sm text-aegean-600 bg-aegean-50 p-2 rounded-lg flex items-start gap-1.5">
                          <IconBulb size={16} className="flex-shrink-0 mt-0.5" />
                          <span>{instruction.tip}</span>
                        </p>
                      )}
                    </div>
                  </motion.li>
                ))}
              </motion.ol>
            </Card>

            {/* Tips */}
            {recipe.tips && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-6 bg-olive-50 rounded-2xl p-6"
              >
                <h3 className="font-display font-semibold text-olive-900 mb-2 flex items-center gap-2">
                  <IconBulb size={20} className="text-olive-600" />
                  Tips
                </h3>
                <p className="text-olive-700">{recipe.tips}</p>
              </motion.div>
            )}

            {/* Nutrition */}
            {recipe.nutrition && (
              <Card
                padding="lg"
                className="mt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                <h3 className="font-display font-semibold text-olive-900 mb-4">
                  Nutrition (per serving)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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
    <div className="text-center p-3 bg-sand-50 rounded-xl">
      <p className="text-2xl font-semibold text-olive-800">{value}</p>
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
