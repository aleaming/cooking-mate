'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { StarRating } from './StarRating';
import { useCookingLogStore } from '@/stores/useCookingLogStore';
import { CookingRating, CookingStats } from '@/types';
import { staggerItem } from '@/lib/constants/animations';

interface RecipeCookingStatsProps {
  recipeId: string;
}

export function RecipeCookingStats({ recipeId }: RecipeCookingStatsProps) {
  // Get sessions directly to avoid infinite loop from function call in selector
  const sessions = useCookingLogStore((state) => state.sessions);

  // Calculate stats in useMemo to prevent recalculation on every render
  const stats: CookingStats = useMemo(() => {
    const recipeSessions = Object.values(sessions)
      .filter((s) => s.recipeId === recipeId)
      .sort((a, b) => new Date(b.cookedAt).getTime() - new Date(a.cookedAt).getTime());

    if (recipeSessions.length === 0) {
      return {
        recipeId,
        timesCooked: 0,
        averageRating: null,
        lastCooked: null,
        totalServingsMade: 0,
        favoriteScale: 1,
      };
    }

    const ratingsWithValue = recipeSessions
      .map((s) => s.rating)
      .filter((r): r is CookingRating => r !== null);
    const averageRating =
      ratingsWithValue.length > 0
        ? ratingsWithValue.reduce((sum, r) => sum + r, 0) / ratingsWithValue.length
        : null;

    const totalServings = recipeSessions.reduce((sum, s) => sum + s.actualServings, 0);

    return {
      recipeId,
      timesCooked: recipeSessions.length,
      averageRating: averageRating ? Math.round(averageRating * 10) / 10 : null,
      lastCooked: recipeSessions[0]?.cookedAt.split('T')[0] || null,
      totalServingsMade: totalServings,
      favoriteScale: 1,
    };
  }, [sessions, recipeId]);

  if (stats.timesCooked === 0) {
    return null;
  }

  const formatLastCooked = (date: string | null) => {
    if (!date) return 'Never';

    const lastDate = new Date(date);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
    return lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <motion.div
      variants={staggerItem}
      className="bg-olive-50 rounded-xl p-4"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-semibold text-olive-900 text-sm">
          Your Cooking History
        </h3>
        <Link
          href="/cooking-history"
          className="text-xs text-olive-600 hover:text-olive-800 hover:underline"
        >
          View all
        </Link>
      </div>

      <div className="space-y-3">
        {/* Times Cooked */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-sand-600">Times cooked</span>
          <span className="font-semibold text-olive-800">
            {stats.timesCooked} time{stats.timesCooked !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Average Rating */}
        {stats.averageRating !== null && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-sand-600">Your rating</span>
            <div className="flex items-center gap-1.5">
              <StarRating
                value={Math.round(stats.averageRating) as CookingRating}
                readonly
                size="sm"
              />
              <span className="text-sm font-medium text-olive-800">
                {stats.averageRating.toFixed(1)}
              </span>
            </div>
          </div>
        )}

        {/* Last Cooked */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-sand-600">Last cooked</span>
          <span className="text-sm font-medium text-olive-800">
            {formatLastCooked(stats.lastCooked)}
          </span>
        </div>

        {/* Total Servings */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-sand-600">Total servings made</span>
          <span className="text-sm font-medium text-olive-800">
            {stats.totalServingsMade}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
