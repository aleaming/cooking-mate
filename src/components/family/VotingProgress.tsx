'use client';

import { motion } from 'framer-motion';
import { IconThumbUp, IconThumbDown, IconMinus } from '@tabler/icons-react';
import type { VoteSummary } from '@/types/family';

interface VotingProgressProps {
  votes: VoteSummary;
  totalVoters?: number;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function VotingProgress({
  votes,
  totalVoters,
  showLabels = true,
  size = 'md',
  className = '',
}: VotingProgressProps) {
  const { approveCount, rejectCount, abstainCount, totalVotes } = votes;

  // Calculate percentages
  const total = totalVotes || 1; // Prevent division by zero
  const approvePercent = (approveCount / total) * 100;
  const rejectPercent = (rejectCount / total) * 100;
  const abstainPercent = (abstainCount / total) * 100;

  const sizeStyles = {
    sm: { bar: 'h-1.5', text: 'text-xs', icon: 12 },
    md: { bar: 'h-2', text: 'text-sm', icon: 14 },
    lg: { bar: 'h-3', text: 'text-base', icon: 16 },
  };

  const styles = sizeStyles[size];

  if (totalVotes === 0) {
    return (
      <div className={`${className}`}>
        <div className={`flex items-center gap-2 ${styles.text} text-sand-400`}>
          <IconMinus size={styles.icon} />
          <span>No votes yet</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Progress Bar */}
      <div className={`flex rounded-full overflow-hidden bg-sand-100 ${styles.bar}`}>
        {approveCount > 0 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${approvePercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="bg-olive-500"
          />
        )}
        {abstainCount > 0 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${abstainPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
            className="bg-sand-300"
          />
        )}
        {rejectCount > 0 && (
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${rejectPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
            className="bg-terracotta-500"
          />
        )}
      </div>

      {/* Labels */}
      {showLabels && (
        <div className={`flex items-center justify-between ${styles.text}`}>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-olive-600">
              <IconThumbUp size={styles.icon} />
              {approveCount}
            </span>
            <span className="flex items-center gap-1 text-sand-500">
              <IconMinus size={styles.icon} />
              {abstainCount}
            </span>
            <span className="flex items-center gap-1 text-terracotta-600">
              <IconThumbDown size={styles.icon} />
              {rejectCount}
            </span>
          </div>

          {totalVoters !== undefined && (
            <span className="text-sand-400">
              {totalVotes}/{totalVoters} voted
            </span>
          )}
        </div>
      )}
    </div>
  );
}
