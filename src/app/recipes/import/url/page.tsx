'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  IconArrowLeft,
  IconLink,
  IconSearch,
  IconLoader2,
  IconCheck,
  IconAlertCircle,
  IconSparkles,
} from '@tabler/icons-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { RecipePreviewCard } from '@/components/import/RecipePreviewCard';
import { scrapeRecipeFromUrl } from '@/lib/actions/scrapeRecipe';
import { createUserRecipe } from '@/lib/actions/userRecipes';
import { validateRecipeData } from '@/lib/utils/markdownParser';
import { inferIngredientCategory } from '@/lib/utils/ingredientCategory';
import { pageVariants } from '@/lib/constants/animations';
import type { ImportedRecipeData } from '@/types/recipe';

type ImportState = 'idle' | 'scraping' | 'preview' | 'saving' | 'success' | 'error';

export default function UrlImportPage() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [state, setState] = useState<ImportState>('idle');
  const [recipe, setRecipe] = useState<ImportedRecipeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedRecipeId, setSavedRecipeId] = useState<string | null>(null);
  const [wasCached, setWasCached] = useState(false);

  const handleScrape = useCallback(async () => {
    if (!url.trim()) {
      setError('Please enter a URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setError('Please enter a valid URL');
      return;
    }

    setState('scraping');
    setError(null);
    setRecipe(null);

    try {
      const result = await scrapeRecipeFromUrl(url);

      if (result.error) {
        setState('error');
        setError(result.error);
        return;
      }

      if (result.data) {
        setRecipe(result.data);
        setWasCached(result.cached || false);
        setState('preview');
      }
    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Failed to extract recipe');
    }
  }, [url]);

  const handleRecipeChange = useCallback((data: ImportedRecipeData) => {
    setRecipe(data);
  }, []);

  const handleSave = useCallback(async () => {
    if (!recipe) return;

    // Validate
    const validation = validateRecipeData(recipe);
    if (!validation.valid) {
      setError(validation.errors.join('. '));
      return;
    }

    setState('saving');
    setError(null);

    try {
      const result = await createUserRecipe({
        name: recipe.title,
        description: recipe.description || '',
        ingredients: recipe.ingredients.map((ing, idx) => ({
          id: `temp-${idx}`,
          ingredientId: null,
          name: ing.name || ing.text,
          category: inferIngredientCategory(ing.name || ing.text),
          quantity: ing.quantity ?? null,
          unit: ing.unit ?? null,
          preparation: ing.preparation,
          notes: ing.notes,
        })),
        instructions: recipe.instructions.map((inst) => ({
          step: inst.step,
          text: inst.text,
          duration: inst.duration,
          tip: inst.tip,
        })),
        prepTimeMinutes: recipe.prepTime || 0,
        cookTimeMinutes: recipe.cookTime || 0,
        servings: recipe.servings || 4,
        mealType: recipe.mealType || 'any',
        cuisine: recipe.cuisine || 'Other',
        dietaryTags: recipe.dietaryTags,
        difficulty: recipe.difficulty || 'medium',
        sourceUrl: recipe.sourceUrl,
        sourceType: 'url_import',
        imageUrl: recipe.imageUrl,
      });

      if (result.error) {
        setState('preview');
        setError(result.error);
        return;
      }

      if (result.data) {
        setSavedRecipeId(result.data.id);
        setState('success');
      }
    } catch (err) {
      setState('preview');
      setError(err instanceof Error ? err.message : 'Failed to save recipe');
    }
  }, [recipe]);

  const handleReset = useCallback(() => {
    setUrl('');
    setState('idle');
    setRecipe(null);
    setError(null);
    setSavedRecipeId(null);
    setWasCached(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && state === 'idle') {
        handleScrape();
      }
    },
    [state, handleScrape]
  );

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
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 rounded-lg hover:bg-foreground/5 transition-colors"
              aria-label="Go back"
            >
              <IconArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div>
              <h1 className="text-xl font-display font-semibold text-foreground">
                Import from URL
              </h1>
              <p className="text-sm text-muted">
                Paste a recipe URL and let AI extract the details
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* URL Input */}
        {(state === 'idle' || state === 'error') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="https://example.com/recipe/..."
                  error={error || undefined}
                />
              </div>
              <Button
                variant="primary"
                onClick={handleScrape}
                disabled={!url.trim()}
              >
                <IconSearch className="w-4 h-4 mr-2" />
                Extract
              </Button>
            </div>

            {/* AI Badge */}
            <div className="flex items-center gap-2 text-sm text-muted">
              <IconSparkles className="w-4 h-4 text-olive-500" />
              <span>Powered by AI - works with most recipe websites</span>
            </div>

            {/* Tips */}
            <div className="bg-sand-50 dark:bg-foreground/5 rounded-xl p-4">
              <h3 className="font-medium text-foreground mb-2">Tips</h3>
              <ul className="text-sm text-muted space-y-1">
                <li>• Paste the full URL of a recipe page</li>
                <li>• Works best with dedicated recipe pages (not search results)</li>
                <li>• You can edit the extracted data before saving</li>
                <li>• Rate limit: 10 imports per minute</li>
              </ul>
            </div>
          </motion.div>
        )}

        {/* Scraping state */}
        <AnimatePresence>
          {state === 'scraping' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 rounded-full bg-olive-100 flex items-center justify-center mx-auto mb-4">
                <IconLoader2 className="w-8 h-8 text-olive-600 animate-spin" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Analyzing page...
              </h3>
              <p className="text-muted">
                AI is extracting recipe details from the page
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview state */}
        <AnimatePresence>
          {(state === 'preview' || state === 'saving') && recipe && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              {/* Cached badge */}
              {wasCached && state === 'preview' && (
                <div className="flex items-center gap-2 text-sm text-olive-600 bg-olive-50 dark:bg-olive-900/20 p-3 rounded-lg">
                  <IconCheck className="w-4 h-4" />
                  <span>Loaded from cache (previously extracted)</span>
                </div>
              )}

              {/* Back/Reset button */}
              {state === 'preview' && (
                <button
                  onClick={handleReset}
                  className="flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
                >
                  <IconArrowLeft className="w-4 h-4" />
                  Try a different URL
                </button>
              )}

              {/* Recipe preview */}
              <RecipePreviewCard
                recipe={recipe}
                onChange={handleRecipeChange}
                onSave={handleSave}
                onRemove={handleReset}
                isSaving={state === 'saving'}
                saveError={error || undefined}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Saving indicator overlay */}
        <AnimatePresence>
          {state === 'saving' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/50 flex items-center justify-center z-50"
            >
              <div className="bg-card p-6 rounded-xl shadow-lg flex items-center gap-4">
                <IconLoader2 className="w-6 h-6 text-olive-600 animate-spin" />
                <span className="text-foreground font-medium">Saving recipe...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success state */}
        <AnimatePresence>
          {state === 'success' && recipe && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 rounded-full bg-olive-100 flex items-center justify-center mx-auto mb-4">
                <IconCheck className="w-8 h-8 text-olive-600" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                Recipe imported!
              </h3>
              <p className="text-muted mb-6">
                "{recipe.title}" has been added to your collection
              </p>
              <div className="flex items-center justify-center gap-4">
                <Button variant="outline" onClick={handleReset}>
                  Import Another
                </Button>
                <Link href="/recipes/my-recipes">
                  <Button variant="primary">View My Recipes</Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
