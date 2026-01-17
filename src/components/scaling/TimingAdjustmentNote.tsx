'use client';

import { motion } from 'framer-motion';
import { TimingAdjustment } from '@/types';
import { IconClock } from '@tabler/icons-react';

interface TimingAdjustmentNoteProps {
  adjustments: TimingAdjustment[];
}

export function TimingAdjustmentNote({ adjustments }: TimingAdjustmentNoteProps) {
  if (adjustments.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 bg-aegean-50 rounded-xl border border-aegean-200"
    >
      <div className="flex items-start gap-2">
        <IconClock size={20} className="text-aegean-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-aegean-800">
          <p className="font-medium mb-1">Timing Note</p>
          {adjustments.map((adjustment, index) => (
            <p key={index} className="text-aegean-700">
              {adjustment.note}
            </p>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
