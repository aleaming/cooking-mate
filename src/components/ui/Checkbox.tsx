'use client';

import { motion } from 'framer-motion';
import { checkmarkVariants, SPRING } from '@/lib/constants/animations';

interface CheckboxProps {
  checked: boolean;
  onChange?: () => void;
  size?: 'sm' | 'md';
  disabled?: boolean;
  'aria-label'?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
};

/**
 * Animated checkbox component with Mediterranean theme styling.
 * Uses Framer Motion for smooth check/uncheck animations.
 */
export function Checkbox({
  checked,
  onChange,
  size = 'md',
  disabled = false,
  'aria-label': ariaLabel,
}: CheckboxProps) {
  return (
    <motion.button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onChange}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.9 }}
      transition={SPRING.gentle}
      className={`
        relative ${sizeClasses[size]} rounded-md border-2 flex-shrink-0
        transition-colors duration-200 focus:outline-none focus-visible:ring-2
        focus-visible:ring-olive-500 focus-visible:ring-offset-2
        ${checked
          ? 'bg-olive-500 border-olive-500'
          : 'border-sand-300 hover:border-olive-400'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <motion.svg
        className="absolute inset-0 w-full h-full text-white p-0.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={3}
      >
        <motion.path
          variants={checkmarkVariants}
          initial="unchecked"
          animate={checked ? 'checked' : 'unchecked'}
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M5 13l4 4L19 7"
        />
      </motion.svg>
    </motion.button>
  );
}
