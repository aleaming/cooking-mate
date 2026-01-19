'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  IconArrowLeft,
  IconFileText,
  IconCheck,
  IconAlertCircle,
  IconLoader2,
} from '@tabler/icons-react';
import { FileInput, Button } from '@/components/ui';
import { RecipePreviewCard } from '@/components/import/RecipePreviewCard';
import { parseMultipleRecipes, validateRecipeData } from '@/lib/utils/markdownParser';
import { createUserRecipe } from '@/lib/actions/userRecipes';
import { inferIngredientCategory } from '@/lib/utils/ingredientCategory';
import { pageVariants } from '@/lib/constants/animations';
import type { ImportedRecipeData } from '@/types/recipe';

interface ParsedRecipeWithMeta {
  id: string;
  data: ImportedRecipeData;
  fileName: string;
  parseError?: string;
  saveError?: string;
  isSaving: boolean;
  isSaved: boolean;
}

export default function MarkdownImportPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<ParsedRecipeWithMeta[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);

  const handleFileSelect = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    setIsParsing(true);

    try {
      // Read all files
      const fileContents = await Promise.all(
        files.map(async (file) => ({
          name: file.name,
          content: await file.text(),
        }))
      );

      // Parse all recipes
      const parsed = parseMultipleRecipes(fileContents);

      // Convert to our internal format with metadata
      const recipesWithMeta: ParsedRecipeWithMeta[] = parsed.map((result, index) => ({
        id: `recipe-${Date.now()}-${index}`,
        data: result.data,
        fileName: result.fileName,
        parseError: result.error,
        isSaving: false,
        isSaved: false,
      }));

      setRecipes((prev) => [...prev, ...recipesWithMeta]);
    } catch (error) {
      console.error('Error parsing files:', error);
    } finally {
      setIsParsing(false);
    }
  }, []);

  const handleRecipeChange = useCallback((id: string, data: ImportedRecipeData) => {
    setRecipes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, data } : r))
    );
  }, []);

  const handleRecipeRemove = useCallback((id: string) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleSaveRecipe = useCallback(async (id: string) => {
    const recipe = recipes.find((r) => r.id === id);
    if (!recipe) return;

    // Validate
    const validation = validateRecipeData(recipe.data);
    if (!validation.valid) {
      setRecipes((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, saveError: validation.errors.join('. ') } : r
        )
      );
      return;
    }

    // Mark as saving
    setRecipes((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isSaving: true, saveError: undefined } : r))
    );

    try {
      // Convert ImportedRecipeData to CreateRecipeInput
      const result = await createUserRecipe({
        name: recipe.data.title,
        description: recipe.data.description || '',
        ingredients: recipe.data.ingredients.map((ing, idx) => ({
          id: `temp-${idx}`,
          ingredientId: null,
          name: ing.name || ing.text,
          category: inferIngredientCategory(ing.name || ing.text),
          quantity: ing.quantity ?? null,
          unit: ing.unit ?? null,
          preparation: ing.preparation,
          notes: ing.notes,
        })),
        instructions: recipe.data.instructions.map((inst) => ({
          step: inst.step,
          text: inst.text,
          duration: inst.duration,
          tip: inst.tip,
        })),
        prepTimeMinutes: recipe.data.prepTime || 0,
        cookTimeMinutes: recipe.data.cookTime || 0,
        servings: recipe.data.servings || 4,
        mealType: recipe.data.mealType || 'any',
        cuisine: recipe.data.cuisine || 'Other',
        dietaryTags: recipe.data.dietaryTags,
        difficulty: recipe.data.difficulty || 'medium',
        sourceType: 'markdown',
        imageUrl: recipe.data.imageUrl,
      });

      if (result.error) {
        setRecipes((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, isSaving: false, saveError: result.error } : r
          )
        );
      } else {
        setRecipes((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, isSaving: false, isSaved: true } : r
          )
        );
      }
    } catch (error) {
      setRecipes((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, isSaving: false, saveError: 'Failed to save recipe' }
            : r
        )
      );
    }
  }, [recipes]);

  const handleSaveAll = useCallback(async () => {
    const unsavedRecipes = recipes.filter((r) => !r.isSaved && !r.parseError);
    if (unsavedRecipes.length === 0) return;

    setIsSavingAll(true);

    for (const recipe of unsavedRecipes) {
      await handleSaveRecipe(recipe.id);
    }

    setIsSavingAll(false);
  }, [recipes, handleSaveRecipe]);

  const unsavedCount = recipes.filter((r) => !r.isSaved && !r.parseError).length;
  const savedCount = recipes.filter((r) => r.isSaved).length;
  const errorCount = recipes.filter((r) => r.parseError || r.saveError).length;

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                aria-label="Go back"
                className="-ml-2"
              >
                <IconArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-display font-semibold text-foreground">
                  Import from Markdown
                </h1>
                <p className="text-sm text-muted">
                  Upload .md files containing recipes
                </p>
              </div>
            </div>

            {recipes.length > 0 && unsavedCount > 0 && (
              <Button
                variant="primary"
                onClick={handleSaveAll}
                disabled={isSavingAll}
              >
                {isSavingAll ? (
                  <>
                    <IconLoader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  `Save All (${unsavedCount})`
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* File Upload */}
        <div className="mb-8">
          <FileInput
            accept=".md,.markdown,text/markdown"
            multiple={true}
            onFileSelect={handleFileSelect}
            preview={false}
            dragDrop={true}
            label="Upload markdown files"
            hint="Drag and drop .md files or click to browse"
            disabled={isParsing}
          />
        </div>

        {/* Parsing indicator */}
        <AnimatePresence>
          {isParsing && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center gap-3 py-8"
            >
              <IconLoader2 className="w-6 h-6 text-olive-600 animate-spin" />
              <span className="text-muted">Parsing recipes...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Status Summary */}
        {recipes.length > 0 && (
          <div className="flex items-center gap-4 mb-6 text-sm">
            <span className="text-muted">
              {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} loaded
            </span>
            {savedCount > 0 && (
              <span className="flex items-center gap-1 text-olive-600">
                <IconCheck className="w-4 h-4" />
                {savedCount} saved
              </span>
            )}
            {errorCount > 0 && (
              <span className="flex items-center gap-1 text-amber-600">
                <IconAlertCircle className="w-4 h-4" />
                {errorCount} with issues
              </span>
            )}
          </div>
        )}

        {/* Recipe List */}
        <div className="space-y-4">
          <AnimatePresence>
            {recipes.map((recipe) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {recipe.isSaved ? (
                  // Saved recipe summary
                  <div className="flex items-center gap-3 p-4 bg-olive-50 border border-olive-200 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-olive-100 flex items-center justify-center">
                      <IconCheck className="w-5 h-5 text-olive-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-olive-700">
                        {recipe.data.title}
                      </p>
                      <p className="text-sm text-olive-600">
                        Saved successfully
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRecipeRemove(recipe.id)}
                    >
                      Dismiss
                    </Button>
                  </div>
                ) : recipe.parseError ? (
                  // Parse error
                  <div className="flex items-center gap-3 p-4 bg-error/10 border border-error/30 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-error/20 flex items-center justify-center">
                      <IconAlertCircle className="w-5 h-5 text-error" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-error">
                        {recipe.fileName}
                      </p>
                      <p className="text-sm text-error/80">
                        {recipe.parseError}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRecipeRemove(recipe.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  // Editable recipe card
                  <RecipePreviewCard
                    recipe={recipe.data}
                    onChange={(data) => handleRecipeChange(recipe.id, data)}
                    onSave={() => handleSaveRecipe(recipe.id)}
                    onRemove={() => handleRecipeRemove(recipe.id)}
                    isSaving={recipe.isSaving}
                    saveError={recipe.saveError}
                    fileName={recipe.fileName}
                  />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Empty state */}
        {recipes.length === 0 && !isParsing && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-sand-100 flex items-center justify-center mx-auto mb-4">
              <IconFileText className="w-8 h-8 text-sand-400" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No recipes loaded
            </h3>
            <p className="text-muted mb-4">
              Upload markdown files to get started
            </p>
          </div>
        )}

        {/* Success state - all saved */}
        {recipes.length > 0 && unsavedCount === 0 && savedCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center"
          >
            <div className="w-16 h-16 rounded-full bg-olive-100 flex items-center justify-center mx-auto mb-4">
              <IconCheck className="w-8 h-8 text-olive-600" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              All recipes imported!
            </h3>
            <p className="text-muted mb-4">
              {savedCount} recipe{savedCount !== 1 ? 's have' : ' has'} been added to your collection
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button variant="outline" onClick={() => setRecipes([])}>
                Import More
              </Button>
              <Link href="/recipes/my-recipes">
                <Button variant="primary">View My Recipes</Button>
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
