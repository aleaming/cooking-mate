'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { IconRefresh } from '@tabler/icons-react';
import { Button } from '@/components/ui';

interface FamilyRefreshButtonProps {
  updateCount: number;
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function FamilyRefreshButton({ updateCount, isRefreshing, onRefresh }: FamilyRefreshButtonProps) {
  const hasUpdates = updateCount > 0;

  return (
    <Button
      variant={hasUpdates ? 'outline' : 'ghost'}
      size="sm"
      onClick={onRefresh}
      disabled={isRefreshing}
      className={`relative gap-1.5 ${hasUpdates ? 'bg-olive-50 text-olive-700 border-olive-300 hover:bg-olive-100' : ''}`}
    >
      <motion.span
        animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
        transition={isRefreshing ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : { duration: 0 }}
        className="inline-flex"
      >
        <IconRefresh size={16} />
      </motion.span>
      <span className="hidden sm:inline">Refresh</span>

      {/* Update count badge */}
      <AnimatePresence>
        {hasUpdates && !isRefreshing && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1
                       bg-aegean-500 text-white text-[10px] font-bold
                       rounded-full flex items-center justify-center"
          >
            {updateCount > 99 ? '99+' : updateCount}
          </motion.span>
        )}
      </AnimatePresence>
    </Button>
  );
}
