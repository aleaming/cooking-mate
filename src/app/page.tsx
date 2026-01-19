'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui';
import { RecipeCard } from '@/components/recipes';
import { getFeaturedRecipes } from '@/data/recipes';
import { pageVariants, staggerContainer, staggerItem } from '@/lib/constants/animations';
import { IconBook, IconCalendar, IconShoppingCart, IconLeaf, IconFridge, IconDownload, IconChartBar } from '@tabler/icons-react';

export default function HomePage() {
  const featuredRecipes = getFeaturedRecipes();

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-olive-50 via-sand-50 to-terracotta-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="max-w-3xl">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-olive-900 leading-tight"
            >
              Plan meals.
              <span className="text-terracotta-500"> Shop smarter. </span>
              Cook more.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 text-lg text-sand-700 max-w-2xl"
            >
              CookingMate helps you plan your week, build shopping lists automatically,
              and discover recipes you&apos;ll actually make.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4"
            >
              <Link href="/calendar" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto justify-center" rightIcon={<ArrowRightIcon className="w-5 h-5" />}>
                  Start Planning
                </Button>
              </Link>
              <Link href="/recipes" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto justify-center">
                  Browse Recipes
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Decorative elements - hidden on mobile to prevent scroll overflow */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="hidden sm:block absolute -top-20 -right-20 w-96 h-96 bg-olive-500 rounded-full blur-3xl pointer-events-none"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="hidden sm:block absolute -bottom-20 -left-20 w-80 h-80 bg-terracotta-500 rounded-full blur-3xl pointer-events-none"
        />
      </section>

      {/* Features Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            <motion.div variants={staggerItem} className="text-center">
              <div className="w-16 h-16 mx-auto bg-olive-100 rounded-2xl flex items-center justify-center mb-4">
                <IconBook size={32} className="text-olive-600" />
              </div>
              <h3 className="font-display text-xl font-semibold text-olive-900 mb-2">
                50+ pre-loaded recipes
              </h3>
              <p className="text-sand-600">
                From quick breakfasts to impressive dinners. Filter by meal type,
                difficulty, or dietary needs.
              </p>
            </motion.div>

            <motion.div variants={staggerItem} className="text-center">
              <div className="w-16 h-16 mx-auto bg-terracotta-100 rounded-2xl flex items-center justify-center mb-4">
                <IconCalendar size={32} className="text-terracotta-600" />
              </div>
              <h3 className="font-display text-xl font-semibold text-olive-900 mb-2">
                Drag-and-drop planning
              </h3>
              <p className="text-sand-600">
                Drag recipes onto your calendar. Plan breakfast, lunch, and dinner
                for the whole month.
              </p>
            </motion.div>

            <motion.div variants={staggerItem} className="text-center">
              <div className="w-16 h-16 mx-auto bg-aegean-100 rounded-2xl flex items-center justify-center mb-4">
                <IconShoppingCart size={32} className="text-aegean-600" />
              </div>
              <h3 className="font-display text-xl font-semibold text-olive-900 mb-2">
                Auto-generated lists
              </h3>
              <p className="text-sand-600">
                Ingredients aggregate automatically from your meal plan, organized
                by category.
              </p>
            </motion.div>

            <motion.div variants={staggerItem} className="text-center">
              <div className="w-16 h-16 mx-auto bg-sand-200 rounded-2xl flex items-center justify-center mb-4">
                <IconFridge size={32} className="text-sand-700" />
              </div>
              <h3 className="font-display text-xl font-semibold text-olive-900 mb-2">
                Cook with what you have
              </h3>
              <p className="text-sand-600">
                Tell us what&apos;s in your kitchen. We&apos;ll show recipes you can make
                right now.
              </p>
            </motion.div>

            <motion.div variants={staggerItem} className="text-center">
              <div className="w-16 h-16 mx-auto bg-terracotta-50 rounded-2xl flex items-center justify-center mb-4">
                <IconDownload size={32} className="text-terracotta-500" />
              </div>
              <h3 className="font-display text-xl font-semibold text-olive-900 mb-2">
                Import your favorites
              </h3>
              <p className="text-sand-600">
                Add recipes from any website or markdown file to your personal
                collection.
              </p>
            </motion.div>

            <motion.div variants={staggerItem} className="text-center">
              <div className="w-16 h-16 mx-auto bg-olive-50 rounded-2xl flex items-center justify-center mb-4">
                <IconChartBar size={32} className="text-olive-500" />
              </div>
              <h3 className="font-display text-xl font-semibold text-olive-900 mb-2">
                Track your progress
              </h3>
              <p className="text-sand-600">
                Log meals, rate recipes, and see your cooking stats over time.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Featured Recipes Section */}
      <section className="py-16 lg:py-24 bg-sand-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-olive-900">
                Popular recipes
              </h2>
              <p className="mt-2 text-sand-600">
                Favorites from our collection
              </p>
            </div>
            <Link href="/recipes" className="self-start sm:self-auto">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRightIcon className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {featuredRecipes.slice(0, 4).map((recipe) => (
              <motion.div key={recipe.id} variants={staggerItem}>
                <RecipeCard recipe={recipe} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-olive-500 to-olive-600 rounded-3xl p-8 lg:p-12 text-center text-white"
          >
            <h2 className="font-display text-3xl lg:text-4xl font-bold mb-4">
              Start cooking in minutes
            </h2>
            <p className="text-olive-100 text-lg mb-8 max-w-2xl mx-auto">
              No account required. Your meal plans save locally.
              Sign up anytime to sync across devices.
            </p>
            <Link href="/calendar">
              <Button
                variant="secondary"
                size="lg"
                className="bg-white text-olive-700 hover:bg-sand-50"
              >
                Plan your first week
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-sand-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sand-500 text-sm">
          <p className="flex items-center justify-center gap-1">
            Made with <IconLeaf size={16} className="text-olive-500" /> for home cooks who love good food
          </p>
        </div>
      </footer>
    </motion.div>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 7l5 5m0 0l-5 5m5-5H6"
      />
    </svg>
  );
}
