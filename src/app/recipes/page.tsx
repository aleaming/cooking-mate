'use client';

import { motion } from 'framer-motion';
import { RecipeCatalog } from '@/components/recipes';
import { allRecipes } from '@/data/recipes';
import { pageVariants } from '@/lib/constants/animations';

export default function RecipesPage() {
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
            Discover {allRecipes.length} delicious Mediterranean recipes
          </motion.p>
        </div>
      </div>

      {/* Recipe Catalog */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RecipeCatalog recipes={allRecipes} />
      </div>
    </motion.div>
  );
}
