'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { IconArrowLeft, IconLoader2 } from '@tabler/icons-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { RecipePreviewCard } from '@/components/import/RecipePreviewCard';
import { getUserRecipeById, updateUserRecipe } from '@/lib/actions/userRecipes';
import { inferIngredientCategory } from '@/lib/utils/ingredientCategory';
import { pageVariants } from '@/lib/constants/animations';
import type { ImportedRecipeData, UserRecipe } from '@/types/recipe';

/**
 * Convert UserRecipe from database to ImportedRecipeData for editing
 */
function toEditableRecipe(recipe: UserRecipe): ImportedRecipeData {
  return {
    title: recipe.name,
    description: recipe.description,
    ingredients: recipe.ingredients.map(ing => ({
      text: [ing.quantity, ing.unit, ing.name, ing.preparation]
        .filter(Boolean)
        .join(' '),
      quantity: ing.quantity ?? undefined,
      unit: ing.unit ?? undefined,
      name: ing.name,
      preparation: ing.preparation,
      notes: ing.notes,
    })),
    instructions: recipe.instructions.map(inst => ({
      step: inst.step,
      text: inst.text,
      duration: inst.duration,
      tip: inst.tip,
    })),
    prepTime: recipe.prepTimeMinutes,
    cookTime: recipe.cookTimeMinutes,
    servings: recipe.servings,
    mealType: recipe.mealType,
    difficulty: recipe.difficulty,
    cuisine: recipe.cuisine,
    dietaryTags: recipe.dietaryTags,
    sourceUrl: recipe.sourceUrl,
    imageUrl: recipe.imageUrl,
  };
}

export default function EditRecipePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const recipeId = params.id as string;
  const fromSource = searchParams.get('from');

  const [originalRecipe, setOriginalRecipe] = useState<UserRecipe | null>(null);
  const [editableRecipe, setEditableRecipe] = useState<ImportedRecipeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load the recipe on mount
  useEffect(() => {
    async function loadRecipe() {
      setLoading(true);
      setError(null);

      const result = await getUserRecipeById(recipeId);

      if (result.error || !result.data) {
        setError(result.error || 'Recipe not found');
        setLoading(false);
        return;
      }

      setOriginalRecipe(result.data);
      setEditableRecipe(toEditableRecipe(result.data));
      setLoading(false);
    }

    loadRecipe();
  }, [recipeId]);

  // Handle save
  const handleSave = async () => {
    if (!editableRecipe || !originalRecipe) return;

    setSaving(true);
    setError(null);

    const result = await updateUserRecipe({
      id: recipeId,
      name: editableRecipe.title,
      description: editableRecipe.description || '',
      ingredients: editableRecipe.ingredients.map((ing, idx) => ({
        id: originalRecipe.ingredients[idx]?.id || `new-${idx}`,
        ingredientId: null,
        name: ing.name || ing.text,
        category: inferIngredientCategory(ing.name || ing.text),
        quantity: ing.quantity ?? null,
        unit: ing.unit ?? null,
        preparation: ing.preparation,
        notes: ing.notes,
      })),
      instructions: editableRecipe.instructions.map((inst, idx) => ({
        step: inst.step || idx + 1,
        text: inst.text,
        duration: inst.duration,
        tip: inst.tip,
      })),
      prepTimeMinutes: editableRecipe.prepTime || 0,
      cookTimeMinutes: editableRecipe.cookTime || 0,
      servings: editableRecipe.servings || 4,
      mealType: editableRecipe.mealType || 'any',
      cuisine: editableRecipe.cuisine,
      dietaryTags: editableRecipe.dietaryTags,
      difficulty: editableRecipe.difficulty,
    });

    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    // Navigate back to recipe detail page, preserving the from context
    const detailUrl = fromSource ? `/recipes/${recipeId}?from=${fromSource}` : `/recipes/${recipeId}`;
    router.push(detailUrl);
  };

  // Handle cancel/remove
  const handleCancel = () => {
    router.back();
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-sand-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-8 w-48" />
          </div>
          <Skeleton className="h-[600px] w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  // Error state
  if (error && !editableRecipe) {
    const backUrl = fromSource === 'my-recipes' ? '/recipes/my-recipes' : '/recipes';
    return (
      <div className="min-h-screen bg-sand-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <Link href={backUrl}>
              <Button variant="ghost" size="sm">
                <IconArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <h2 className="text-lg font-semibold text-red-800 mb-2">
              Unable to Load Recipe
            </h2>
            <p className="text-red-600">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push(backUrl)}
            >
              Return to Recipes
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!editableRecipe) {
    return null;
  }

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-sand-50"
    >
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleCancel}>
              <IconArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="font-display text-2xl font-bold text-olive-900">
              Edit Recipe
            </h1>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            leftIcon={saving ? <IconLoader2 className="w-4 h-4 animate-spin" /> : undefined}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>

        {/* Recipe Editor */}
        <RecipePreviewCard
          recipe={editableRecipe}
          onChange={setEditableRecipe}
          onSave={handleSave}
          onRemove={handleCancel}
          isSaving={saving}
          saveError={error || undefined}
        />
      </div>
    </motion.div>
  );
}
