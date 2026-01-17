'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button, Badge } from '@/components/ui';
import { StarRating } from '@/components/cooking-log';
import { useCookingLogStore } from '@/stores/useCookingLogStore';
import { getRecipeById } from '@/data/recipes';
import { pageVariants, staggerContainer, staggerItem } from '@/lib/constants/animations';
import { CookingSession, CookingRating, MealSlotType } from '@/types';
import { IconChefHat } from '@tabler/icons-react';

type DateFilter = 'all' | 'week' | 'month' | 'year';
type SortBy = 'date' | 'rating';

export default function CookingHistoryPage() {
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [minRating, setMinRating] = useState<CookingRating | null>(null);
  const [sortBy, setSortBy] = useState<SortBy>('date');

  const getAllSessions = useCookingLogStore((state) => state.getAllSessions);
  const getMonthlyStats = useCookingLogStore((state) => state.getMonthlyStats);

  const sessions = useMemo(() => {
    const now = new Date();
    let startDate: string | undefined;

    switch (dateFilter) {
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        break;
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
        break;
      case 'year':
        const yearAgo = new Date(now);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        startDate = yearAgo.toISOString().split('T')[0];
        break;
    }

    const filters = {
      ...(startDate && {
        dateRange: { start: startDate, end: now.toISOString().split('T')[0] },
      }),
      ...(minRating && { minRating }),
    };

    const result = getAllSessions(Object.keys(filters).length > 0 ? filters : undefined);

    if (sortBy === 'rating') {
      return result.sort((a, b) => {
        const ratingA = a.rating ?? 0;
        const ratingB = b.rating ?? 0;
        return ratingB - ratingA;
      });
    }

    return result;
  }, [dateFilter, minRating, sortBy, getAllSessions]);

  // Get current month stats
  const now = new Date();
  const currentMonthStats = getMonthlyStats(now.getFullYear(), now.getMonth());

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-sand-50"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl font-bold text-olive-900 mb-2">
            Cooking History
          </h1>
          <p className="text-sand-600">
            Track your cooking journey and see your progress
          </p>
        </motion.div>

        {/* Monthly Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg shadow-sand-200/50 p-6 mb-8"
        >
          <h2 className="font-display text-lg font-semibold text-olive-900 mb-4">
            This Month
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard
              label="Meals Cooked"
              value={currentMonthStats.recipesCooked}
            />
            <StatCard
              label="Unique Recipes"
              value={currentMonthStats.uniqueRecipes}
            />
            <StatCard
              label="Total Servings"
              value={currentMonthStats.totalServings}
            />
            <StatCard
              label="Avg Rating"
              value={
                currentMonthStats.averageRating !== null
                  ? currentMonthStats.averageRating.toFixed(1)
                  : '-'
              }
              suffix="★"
            />
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center gap-3 mb-6"
        >
          {/* Date Filter */}
          <div className="flex gap-1 bg-white rounded-xl p-1 shadow-sm">
            {(['all', 'week', 'month', 'year'] as DateFilter[]).map((filter) => (
              <button
                key={filter}
                onClick={() => setDateFilter(filter)}
                className={`
                  px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                  ${dateFilter === filter
                    ? 'bg-olive-500 text-white'
                    : 'text-sand-600 hover:bg-sand-100'
                  }
                `}
              >
                {filter === 'all' ? 'All Time' : `Last ${filter}`}
              </button>
            ))}
          </div>

          {/* Rating Filter */}
          <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm">
            <span className="text-sm text-sand-600">Min rating:</span>
            <StarRating
              value={minRating}
              onChange={setMinRating}
              size="sm"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="px-3 py-2 text-sm bg-white rounded-xl border-none shadow-sm text-olive-800"
          >
            <option value="date">Sort by date</option>
            <option value="rating">Sort by rating</option>
          </select>
        </motion.div>

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <IconChefHat size={64} className="mx-auto mb-4 text-sand-400" />
            <h3 className="font-display text-xl font-semibold text-olive-900 mb-2">
              No cooking sessions yet
            </h3>
            <p className="text-sand-600 mb-6">
              Start cooking and log your meals to build your history
            </p>
            <Link href="/calendar">
              <Button>Go to Meal Plan</Button>
            </Link>
          </motion.div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-4"
          >
            {sessions.map((session) => (
              <CookingSessionCard key={session.id} session={session} />
            ))}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function StatCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number | string;
  suffix?: string;
}) {
  return (
    <div className="text-center p-3 bg-olive-50 rounded-xl">
      <p className="text-2xl font-semibold text-olive-800">
        {value}
        {suffix && <span className="text-lg text-amber-500 ml-1">{suffix}</span>}
      </p>
      <p className="text-xs text-sand-600">{label}</p>
    </div>
  );
}

function CookingSessionCard({ session }: { session: CookingSession }) {
  const recipe = getRecipeById(session.recipeId);

  if (!recipe) return null;

  const cookedDate = new Date(session.cookedAt);
  const formattedDate = cookedDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const mealTypeColors: Record<MealSlotType, 'terracotta' | 'aegean' | 'olive'> = {
    breakfast: 'terracotta',
    lunch: 'aegean',
    dinner: 'olive',
  };

  return (
    <motion.div
      variants={staggerItem}
      className="bg-white rounded-xl shadow-sm p-4 flex gap-4"
    >
      {/* Recipe Image */}
      {recipe.imageUrl && (
        <Link href={`/recipes/${recipe.id}`} className="flex-shrink-0">
          <img
            src={recipe.imageUrl}
            alt={recipe.name}
            className="w-20 h-20 rounded-lg object-cover"
          />
        </Link>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <Link
              href={`/recipes/${recipe.id}`}
              className="font-medium text-olive-900 hover:text-olive-700"
            >
              {recipe.name}
            </Link>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-sand-500">{formattedDate}</span>
              {session.mealType && (
                <Badge variant={mealTypeColors[session.mealType]} size="sm">
                  {session.mealType}
                </Badge>
              )}
            </div>
          </div>

          {session.rating && (
            <StarRating value={session.rating} readonly size="sm" />
          )}
        </div>

        {/* Details */}
        <div className="flex items-center gap-4 mt-2 text-sm text-sand-600">
          <span>{session.actualServings} servings</span>
          {session.scaleFactor !== 1 && (
            <span>{session.scaleFactor}x scaled</span>
          )}
        </div>

        {/* Notes */}
        {session.notes && (
          <p className="mt-2 text-sm text-sand-600 italic line-clamp-2">
            &ldquo;{session.notes}&rdquo;
          </p>
        )}
      </div>
    </motion.div>
  );
}
