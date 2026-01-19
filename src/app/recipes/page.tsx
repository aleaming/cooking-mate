'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RecipeCatalog } from '@/components/recipes';
import { allRecipes } from '@/data/recipes';
import { getUserRecipes } from '@/lib/actions/userRecipes';
import { useAuth } from '@/providers/AuthProvider';
import { pageVariants } from '@/lib/constants/animations';
import type { Recipe } from '@/types';

export default function RecipesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [userRecipes, setUserRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user recipes when logged in (wait for auth to finish loading first)
  useEffect(() => {
    async function loadUserRecipes() {
      // Don't fetch until auth state is determined
      if (authLoading) return;

      // Not logged in - no user recipes to fetch
      if (!user) {
        setUserRecipes([]);
        setIsLoading(false);
        return;
      }

      try {
        const result = await getUserRecipes();
        if (result.error) {
          console.error('Failed to load user recipes:', result.error);
        } else if (result.data) {
          setUserRecipes(result.data);
        }
      } catch (error) {
        console.error('Failed to load user recipes:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadUserRecipes();
  }, [user, authLoading]);

  // Combine static and user recipes
  const allCombinedRecipes = useMemo(() => {
    return [...allRecipes, ...userRecipes];
  }, [userRecipes]);

  const totalCount = allCombinedRecipes.length;
  const userCount = userRecipes.length;

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen"
    >
      {/* Page Header */}
      <div className="bg-gradient-to-br from-olive-50 to-sand-50 py-12 lg:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-3xl lg:text-4xl font-bold text-olive-900"
          >
            Recipe Collection
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-2 text-lg text-sand-600"
          >
            {isLoading ? (
              `Discover ${allRecipes.length} delicious Mediterranean recipes`
            ) : userCount > 0 ? (
              `${totalCount} recipes (${allRecipes.length} curated + ${userCount} yours)`
            ) : (
              `Discover ${allRecipes.length} delicious Mediterranean recipes`
            )}
          </motion.p>
        </div>
      </div>

      {/* Recipe Catalog */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RecipeCatalog recipes={allCombinedRecipes} />
      </div>
    </motion.div>
  );
}
