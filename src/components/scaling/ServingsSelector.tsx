'use client';

import { motion } from 'framer-motion';
import { SPRING } from '@/lib/constants/animations';
import { formatScaleFactor } from '@/lib/utils/recipeScaling';

interface ServingsSelectorProps {
  originalServings: number;
  targetServings: number;
  onChange: (servings: number) => void;
}

const presets = [
  { label: '½×', factor: 0.5 },
  { label: '1×', factor: 1 },
  { label: '2×', factor: 2 },
  { label: 'Party', factor: null, targetServings: 8 },
];

export function ServingsSelector({
  originalServings,
  targetServings,
  onChange,
}: ServingsSelectorProps) {
  const scaleFactor = targetServings / originalServings;

  const handlePresetClick = (preset: (typeof presets)[number]) => {
    if (preset.targetServings !== undefined) {
      onChange(preset.targetServings);
    } else if (preset.factor !== null) {
      onChange(Math.round(originalServings * preset.factor));
    }
  };

  const isPresetActive = (preset: (typeof presets)[number]) => {
    if (preset.targetServings !== undefined) {
      return targetServings === preset.targetServings;
    }
    if (preset.factor !== null) {
      return Math.abs(scaleFactor - preset.factor) < 0.01;
    }
    return false;
  };

  return (
    <div className="space-y-3">
      {/* Preset Buttons */}
      <div className="flex gap-2">
        {presets.map((preset) => (
          <motion.button
            key={preset.label}
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={SPRING.gentle}
            onClick={() => handlePresetClick(preset)}
            className={`
              flex-1 py-2 text-xs font-medium rounded-lg transition-colors
              ${isPresetActive(preset)
                ? 'bg-olive-500 text-white'
                : 'bg-sand-100 text-sand-600 hover:bg-sand-200'
              }
            `}
          >
            {preset.label}
          </motion.button>
        ))}
      </div>

      {/* Custom Selector */}
      <div className="flex items-center justify-between">
        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={SPRING.gentle}
          onClick={() => onChange(Math.max(1, targetServings - 1))}
          className="w-8 h-8 rounded-full bg-sand-100 hover:bg-sand-200 flex items-center justify-center text-olive-700 font-medium"
        >
          −
        </motion.button>

        <div className="text-center min-w-[60px]">
          <motion.span
            key={targetServings}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl font-semibold text-olive-800 block"
          >
            {targetServings}
          </motion.span>
          <span className="text-xs text-sand-500">
            {formatScaleFactor(scaleFactor)}
          </span>
        </div>

        <motion.button
          type="button"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={SPRING.gentle}
          onClick={() => onChange(targetServings + 1)}
          className="w-8 h-8 rounded-full bg-sand-100 hover:bg-sand-200 flex items-center justify-center text-olive-700 font-medium"
        >
          +
        </motion.button>
      </div>
    </div>
  );
}
