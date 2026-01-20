'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  IconThumbUp,
  IconThumbDown,
  IconMinus,
  IconCheck,
  IconX,
  IconMessageCircle,
} from '@tabler/icons-react';
import { Button, Badge } from '@/components/ui';
import { VotingProgress } from './VotingProgress';
import { castVoteAndCheckThreshold } from '@/lib/actions/familyVoting';
import type { VoteSummary, VoteType, MealPlanStatus } from '@/types/family';

interface MealVoteCardProps {
  mealPlanId: string;
  votes: VoteSummary;
  status: MealPlanStatus;
  totalVoters?: number;
  canVote: boolean;
  canApprove: boolean;
  onVoteSuccess?: () => void;
  onStatusChange?: (status: MealPlanStatus) => void;
  className?: string;
}

export function MealVoteCard({
  mealPlanId,
  votes,
  status,
  totalVoters,
  canVote,
  canApprove,
  onVoteSuccess,
  onStatusChange,
  className = '',
}: MealVoteCardProps) {
  const [isVoting, setIsVoting] = useState(false);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [comment, setComment] = useState('');
  const [pendingVote, setPendingVote] = useState<VoteType | null>(null);

  const handleVote = async (vote: VoteType) => {
    if (!canVote || isVoting) return;

    // If same vote, just submit without comment
    if (votes.userVote === vote) {
      return;
    }

    setPendingVote(vote);

    // For reject, optionally allow comment
    if (vote === 'reject' && !showCommentInput) {
      setShowCommentInput(true);
      return;
    }

    await submitVote(vote);
  };

  const submitVote = async (vote: VoteType) => {
    setIsVoting(true);
    try {
      const result = await castVoteAndCheckThreshold({
        mealPlanId,
        vote,
        comment: comment || undefined,
      });

      if (!result.error && result.data) {
        onVoteSuccess?.();

        if (result.data.autoApproved) {
          onStatusChange?.('approved');
        } else if (result.data.autoRejected) {
          onStatusChange?.('rejected');
        }
      }
    } finally {
      setIsVoting(false);
      setShowCommentInput(false);
      setComment('');
      setPendingVote(null);
    }
  };

  const cancelComment = () => {
    setShowCommentInput(false);
    setComment('');
    setPendingVote(null);
  };

  // Status badge
  const getStatusBadge = () => {
    switch (status) {
      case 'approved':
        return (
          <Badge variant="olive" className="gap-1">
            <IconCheck size={12} />
            Approved
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="terracotta" className="gap-1">
            <IconX size={12} />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge variant="sand" className="gap-1">
            Voting
          </Badge>
        );
    }
  };

  const isFinalized = status !== 'proposed';

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Status & Progress */}
      <div className="flex items-center justify-between gap-2">
        {getStatusBadge()}
        {!isFinalized && totalVoters !== undefined && (
          <span className="text-xs text-sand-500">
            {votes.totalVotes}/{totalVoters} voted
          </span>
        )}
      </div>

      {/* Voting Progress */}
      <VotingProgress
        votes={votes}
        totalVoters={totalVoters}
        showLabels={!isFinalized}
        size="sm"
      />

      {/* Vote Buttons (only for proposed meals) */}
      {!isFinalized && canVote && (
        <div className="space-y-2">
          {!showCommentInput ? (
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleVote('approve')}
                disabled={isVoting}
                className={`
                  flex-1 flex items-center justify-center gap-1.5
                  px-3 py-2 rounded-lg text-sm font-medium
                  transition-colors disabled:opacity-50
                  ${votes.userVote === 'approve'
                    ? 'bg-olive-500 text-white'
                    : 'bg-olive-100 text-olive-700 hover:bg-olive-200'
                  }
                `}
              >
                <IconThumbUp size={16} />
                Approve
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleVote('abstain')}
                disabled={isVoting}
                className={`
                  flex items-center justify-center gap-1.5
                  px-3 py-2 rounded-lg text-sm font-medium
                  transition-colors disabled:opacity-50
                  ${votes.userVote === 'abstain'
                    ? 'bg-sand-400 text-white'
                    : 'bg-sand-100 text-sand-600 hover:bg-sand-200'
                  }
                `}
              >
                <IconMinus size={16} />
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleVote('reject')}
                disabled={isVoting}
                className={`
                  flex-1 flex items-center justify-center gap-1.5
                  px-3 py-2 rounded-lg text-sm font-medium
                  transition-colors disabled:opacity-50
                  ${votes.userVote === 'reject'
                    ? 'bg-terracotta-500 text-white'
                    : 'bg-terracotta-100 text-terracotta-700 hover:bg-terracotta-200'
                  }
                `}
              >
                <IconThumbDown size={16} />
                Reject
              </motion.button>
            </div>
          ) : (
            /* Comment Input for Reject */
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <div className="flex items-center gap-2 text-sm text-sand-600">
                <IconMessageCircle size={14} />
                <span>Add a reason (optional)</span>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Why do you want to reject this meal?"
                className="
                  w-full px-3 py-2 text-sm
                  border border-sand-200 rounded-lg
                  focus:outline-none focus:ring-2 focus:ring-terracotta-300
                  resize-none
                "
                rows={2}
              />
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelComment}
                  disabled={isVoting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => submitVote('reject')}
                  disabled={isVoting}
                  className="flex-1 bg-terracotta-500 hover:bg-terracotta-600"
                >
                  {isVoting ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* User's current vote indicator */}
      {!isFinalized && votes.userVote && !showCommentInput && (
        <p className="text-xs text-sand-500 text-center">
          You voted: {votes.userVote === 'approve' ? '👍' : votes.userVote === 'reject' ? '👎' : '➖'}
        </p>
      )}
    </div>
  );
}
