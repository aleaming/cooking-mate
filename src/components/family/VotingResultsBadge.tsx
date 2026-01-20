'use client';

import { IconThumbUp, IconThumbDown, IconCheck, IconX, IconClock } from '@tabler/icons-react';
import type { VoteSummary, MealPlanStatus } from '@/types/family';

interface VotingResultsBadgeProps {
  votes: VoteSummary;
  status: MealPlanStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function VotingResultsBadge({
  votes,
  status,
  size = 'sm',
  className = '',
}: VotingResultsBadgeProps) {
  const sizeStyles = {
    sm: { icon: 10, text: 'text-[10px]', padding: 'px-1.5 py-0.5', gap: 'gap-0.5' },
    md: { icon: 12, text: 'text-xs', padding: 'px-2 py-1', gap: 'gap-1' },
  };

  const styles = sizeStyles[size];

  // Status-based badges
  if (status === 'approved') {
    return (
      <span
        className={`
          inline-flex items-center ${styles.gap} ${styles.padding}
          rounded-full bg-olive-100 text-olive-700
          font-medium ${styles.text} ${className}
        `}
      >
        <IconCheck size={styles.icon} />
        <span>Approved</span>
      </span>
    );
  }

  if (status === 'rejected') {
    return (
      <span
        className={`
          inline-flex items-center ${styles.gap} ${styles.padding}
          rounded-full bg-terracotta-100 text-terracotta-700
          font-medium ${styles.text} ${className}
        `}
      >
        <IconX size={styles.icon} />
        <span>Rejected</span>
      </span>
    );
  }

  // Voting in progress - show current tally
  const { approveCount, rejectCount, totalVotes } = votes;

  if (totalVotes === 0) {
    return (
      <span
        className={`
          inline-flex items-center ${styles.gap} ${styles.padding}
          rounded-full bg-sand-100 text-sand-500
          font-medium ${styles.text} ${className}
        `}
      >
        <IconClock size={styles.icon} />
        <span>Pending</span>
      </span>
    );
  }

  // Show vote counts
  return (
    <span
      className={`
        inline-flex items-center ${styles.gap} ${styles.padding}
        rounded-full bg-sand-100 text-sand-600
        font-medium ${styles.text} ${className}
      `}
    >
      <span className="flex items-center gap-0.5 text-olive-600">
        <IconThumbUp size={styles.icon} />
        {approveCount}
      </span>
      <span className="text-sand-300">/</span>
      <span className="flex items-center gap-0.5 text-terracotta-600">
        <IconThumbDown size={styles.icon} />
        {rejectCount}
      </span>
    </span>
  );
}
