'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ScalingWarning } from '@/types';

interface ScalingWarningBannerProps {
  warnings: ScalingWarning[];
  scaleFactor: number;
}

export function ScalingWarningBanner({
  warnings,
  scaleFactor,
}: ScalingWarningBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter out general warnings for summary
  const ingredientWarnings = warnings.filter((w) => w.ingredientId !== '__general__');
  const generalWarnings = warnings.filter((w) => w.ingredientId === '__general__');

  const getWarningColor = (type: ScalingWarning['type']) => {
    switch (type) {
      case 'minimum-threshold':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'non-linear':
        return 'bg-amber-50 border-amber-200 text-amber-800';
      case 'technique-change':
      case 'timing-adjustment':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-amber-50 border-amber-200 text-amber-800';
    }
  };

  const getWarningIcon = (type: ScalingWarning['type']) => {
    switch (type) {
      case 'minimum-threshold':
        return '⚠️';
      case 'non-linear':
        return '📏';
      case 'technique-change':
        return '👨‍🍳';
      case 'timing-adjustment':
        return '⏱️';
      default:
        return '💡';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border bg-amber-50 border-amber-200 overflow-hidden"
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-amber-100/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">⚡</span>
          <span className="text-sm font-medium text-amber-800">
            {warnings.length} scaling {warnings.length === 1 ? 'tip' : 'tips'}
          </span>
        </div>
        <motion.svg
          animate={{ rotate: isExpanded ? 180 : 0 }}
          className="w-4 h-4 text-amber-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </motion.svg>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2">
              {/* General warnings first */}
              {generalWarnings.map((warning, index) => (
                <div
                  key={`general-${index}`}
                  className={`p-2 rounded-lg border text-xs ${getWarningColor(warning.type)}`}
                >
                  <div className="flex items-start gap-2">
                    <span>{getWarningIcon(warning.type)}</span>
                    <div>
                      <p className="font-medium">{warning.message}</p>
                      {warning.suggestion && (
                        <p className="mt-0.5 opacity-80">{warning.suggestion}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {/* Ingredient-specific warnings */}
              {ingredientWarnings.map((warning, index) => (
                <div
                  key={`${warning.ingredientId}-${index}`}
                  className={`p-2 rounded-lg border text-xs ${getWarningColor(warning.type)}`}
                >
                  <div className="flex items-start gap-2">
                    <span>{getWarningIcon(warning.type)}</span>
                    <div>
                      <p>
                        <span className="font-medium">{warning.ingredientName}:</span>{' '}
                        {warning.message}
                      </p>
                      {warning.suggestion && (
                        <p className="mt-0.5 opacity-80 italic">{warning.suggestion}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
