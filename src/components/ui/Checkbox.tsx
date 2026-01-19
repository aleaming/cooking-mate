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
 *
 * When no onChange handler is provided, renders as a decorative span
 * to allow nesting inside clickable parents (like buttons).
 */
export function Checkbox({
  checked,
  onChange,
  size = 'md',
  disabled = false,
  'aria-label': ariaLabel,
}: CheckboxProps) {
  const baseClasses = `
    relative ${sizeClasses[size]} rounded-md border-2 flex-shrink-0
    transition-colors duration-200
    ${checked
      ? 'bg-olive-500 border-olive-500'
      : 'border-sand-300'}
    ${disabled ? 'opacity-50' : ''}
  `;

  const interactiveClasses = `
    focus:outline-none focus-visible:ring-2
    focus-visible:ring-olive-500 focus-visible:ring-offset-2
    ${!checked && !disabled ? 'hover:border-olive-400' : ''}
    ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
  `;

  const checkmarkSvg = (
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
  );

  // Render as decorative span when no onChange (parent handles interaction)
  if (!onChange) {
    return (
      <motion.span
        aria-hidden="true"
        className={baseClasses}
      >
        {checkmarkSvg}
      </motion.span>
    );
  }

  // Render as interactive button when onChange is provided
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
      className={`${baseClasses} ${interactiveClasses}`}
    >
      {checkmarkSvg}
    </motion.button>
  );
}
