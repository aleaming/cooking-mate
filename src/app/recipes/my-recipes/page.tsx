'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  IconPlus,
  IconFileText,
  IconLink,
  IconLoader2,
  IconSearch,
  IconChefHat,
} from '@tabler/icons-react';
import { Button, Input, Modal } from '@/components/ui';
import { RecipeCard } from '@/components/recipes';
import { getUserRecipes, deleteUserRecipe } from '@/lib/actions/userRecipes';
import { pageVariants, staggerContainer, staggerItem } from '@/lib/constants/animations';
import type { Recipe, RecipeSourceType } from '@/types/recipe';

type FilterType = 'all' | 'markdown' | 'url_import' | 'manual';

const SOURCE_TYPE_LABELS: Record<RecipeSourceType, { label: string; icon: typeof IconFileText }> = {
  markdown: { label: 'Markdown', icon: IconFileText },
  url_import: { label: 'URL Import', icon: IconLink },
  manual: { label: 'Manual', icon: IconChefHat },
};

export default function MyRecipesPage() {
  const router = useRouter();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [deleteTarget, setDeleteTarget] = useState<Recipe | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch recipes - only runs once on mount
  useEffect(() => {
    let isMounted = true;

    async function loadRecipes() {
      try {
        const result = await getUserRecipes();
        if (!isMounted) return;

        if (result.error) {
          setError(result.error);
          setRecipes([]);
        } else {
          setRecipes(result.data || []);
          setError(null);
        }
      } catch (err) {
        if (!isMounted) return;
        setError('Failed to load recipes');
        setRecipes([]);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadRecipes();

    return () => {
      isMounted = false;
    };
  }, []);

  // Refetch function for retry button
  const fetchRecipes = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getUserRecipes();
      if (result.error) {
        setError(result.error);
        setRecipes([]);
      } else {
        setRecipes(result.data || []);
      }
    } catch (err) {
      setError('Failed to load recipes');
      setRecipes([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and search recipes
  const filteredRecipes = recipes.filter((recipe) => {
    // Filter by source type
    if (filter !== 'all') {
      const recipeWithSource = recipe as Recipe & { sourceType?: RecipeSourceType };
      if (recipeWithSource.sourceType !== filter) {
        return false;
      }
    }

    // Search by name
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        recipe.name.toLowerCase().includes(query) ||
        recipe.description?.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Handle delete
  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      const result = await deleteUserRecipe(deleteTarget.id);
      if (result.success) {
        setRecipes((prev) => prev.filter((r) => r.id !== deleteTarget.id));
        setDeleteTarget(null);
      } else {
        setError(result.error || 'Failed to delete recipe');
      }
    } catch (err) {
      setError('Failed to delete recipe');
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget]);

  const getSourceInfo = (recipe: Recipe) => {
    const recipeWithSource = recipe as Recipe & { sourceType?: RecipeSourceType; sourceUrl?: string };
    if (!recipeWithSource.sourceType) return null;
    return {
      type: recipeWithSource.sourceType,
      url: recipeWithSource.sourceUrl,
      ...SOURCE_TYPE_LABELS[recipeWithSource.sourceType],
    };
  };

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
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-display font-semibold text-foreground">
                My Recipes
              </h1>
              <p className="text-sm text-muted">
                {recipes.length} recipe{recipes.length !== 1 ? 's' : ''} in your collection
              </p>
            </div>
            <Link href="/recipes/import">
              <Button variant="primary" leftIcon={<IconPlus className="w-4 h-4" />}>
                Import Recipe
              </Button>
            </Link>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search recipes..."
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              {(['all', 'markdown', 'url_import', 'manual'] as FilterType[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${filter === f
                      ? 'bg-olive-100 text-olive-700'
                      : 'text-muted hover:bg-foreground/5'
                    }
                  `}
                >
                  {f === 'all' ? 'All' : SOURCE_TYPE_LABELS[f as RecipeSourceType].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-16">
            <IconLoader2 className="w-8 h-8 text-olive-600 animate-spin mx-auto mb-4" />
            <p className="text-muted">Loading your recipes...</p>
          </div>
        )}

        {/* Error state */}
        {error && !isLoading && (
          <div className="text-center py-16">
            <p className="text-error mb-4">{error}</p>
            <Button variant="outline" onClick={fetchRecipes}>
              Try Again
            </Button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && recipes.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-sand-100 flex items-center justify-center mx-auto mb-4">
              <IconChefHat className="w-8 h-8 text-sand-400" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No recipes yet
            </h3>
            <p className="text-muted mb-6">
              Start building your collection by importing recipes
            </p>
            <Link href="/recipes/import">
              <Button variant="primary" leftIcon={<IconPlus className="w-4 h-4" />}>
                Import Your First Recipe
              </Button>
            </Link>
          </div>
        )}

        {/* No results state */}
        {!isLoading && !error && recipes.length > 0 && filteredRecipes.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted mb-4">No recipes match your search</p>
            <Button variant="outline" onClick={() => { setSearchQuery(''); setFilter('all'); }}>
              Clear Filters
            </Button>
          </div>
        )}

        {/* Recipe grid */}
        {!isLoading && !error && filteredRecipes.length > 0 && (
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {filteredRecipes.map((recipe) => {
              const sourceInfo = getSourceInfo(recipe);

              return (
                <motion.div key={recipe.id} variants={staggerItem}>
                  <RecipeCard
                    recipe={recipe}
                    showActions={true}
                    onEdit={() => router.push(`/recipes/${recipe.id}/edit?from=my-recipes`)}
                    onDelete={() => setDeleteTarget(recipe)}
                    sourceLabel={sourceInfo?.label}
                    linkQuery="from=my-recipes"
                  />
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Recipe"
      >
        <div className="p-4">
          <p className="text-muted mb-6">
            Are you sure you want to delete "{deleteTarget?.name}"? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-error hover:bg-error/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
