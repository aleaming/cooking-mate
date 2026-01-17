'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { IconClock } from '@tabler/icons-react';
import { triggerNativeTimer, isMobileDevice, formatDuration, TimerConfig } from '@/lib/utils/timer';
import { TimerModal } from './TimerModal';
import { SPRING } from '@/lib/constants/animations';

interface TimerButtonProps {
  config: TimerConfig;
}

/**
 * Timer button that triggers native device timer on mobile
 * or shows in-app timer modal on desktop
 */
export function TimerButton({ config }: TimerButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const handleClick = () => {
    if (isMobileDevice()) {
      // Try to trigger native timer on mobile
      const triggered = triggerNativeTimer(config);
      // If native timer couldn't be triggered, fall back to modal
      if (!triggered) {
        setShowModal(true);
      }
    } else {
      // Show in-app timer modal on desktop
      setShowModal(true);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={SPRING.gentle}
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-olive-100
                   hover:bg-olive-200 active:bg-olive-300 text-olive-700
                   rounded-lg text-xs font-medium transition-colors
                   min-h-[32px]"
        title={`Set ${formatDuration(config.seconds)} timer`}
        aria-label={`Start ${config.label} timer`}
      >
        <IconClock size={14} className="flex-shrink-0" />
        <span>{formatDuration(config.seconds)}</span>
      </motion.button>

      {/* In-app timer modal (used on desktop or as fallback) */}
      <TimerModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        initialSeconds={config.seconds}
        label={config.label}
      />
    </>
  );
}
