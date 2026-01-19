'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconAlertTriangle, IconX } from '@tabler/icons-react';
import Link from 'next/link';
import { Button } from '@/components/ui';
import { SPRING } from '@/lib/constants/animations';

interface TrialBannerProps {
  daysRemaining: number;
  onDismiss?: () => void;
}

export function TrialBanner({ daysRemaining, onDismiss }: TrialBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Only show banner when 3 or fewer days remaining
  if (daysRemaining > 3 || isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  // Urgent styling for 1 day or less
  const isUrgent = daysRemaining <= 1;
  const bgColor = isUrgent ? 'bg-red-50' : 'bg-terracotta-50';
  const borderColor = isUrgent ? 'border-red-200' : 'border-terracotta-200';
  const textColor = isUrgent ? 'text-red-800' : 'text-terracotta-800';
  const iconColor = isUrgent ? 'text-red-500' : 'text-terracotta-500';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={SPRING.gentle}
        className={`
          ${bgColor} ${borderColor} border rounded-xl p-4
          flex items-center gap-3 mb-4
        `}
        role="alert"
      >
        <IconAlertTriangle size={24} className={iconColor} />

        <div className="flex-1">
          <p className={`font-semibold ${textColor}`}>
            {daysRemaining === 0
              ? 'Your free trial expires today!'
              : daysRemaining === 1
                ? 'Your free trial expires tomorrow!'
                : `${daysRemaining} days left in your free trial`}
          </p>
          <p className={`text-sm ${isUrgent ? 'text-red-600' : 'text-terracotta-600'} mt-0.5`}>
            Subscribe now to keep access to all features.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/pricing">
            <Button size="sm" variant="primary">
              Subscribe Now
            </Button>
          </Link>

          <button
            onClick={handleDismiss}
            className={`
              p-1.5 rounded-lg transition-colors
              ${isUrgent ? 'hover:bg-red-100' : 'hover:bg-terracotta-100'}
            `}
            aria-label="Dismiss"
          >
            <IconX size={18} className={iconColor} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
