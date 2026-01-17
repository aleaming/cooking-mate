'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { fadeIn } from '@/lib/constants/animations';

type BadgeVariant =
  | 'olive'
  | 'terracotta'
  | 'aegean'
  | 'sand'
  | 'success'
  | 'warning'
  | 'error';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  children: React.ReactNode;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
  onClick?: () => void;
}

const variantStyles: Record<BadgeVariant, string> = {
  olive: 'bg-olive-100 text-olive-700 border-olive-200',
  terracotta: 'bg-terracotta-100 text-terracotta-700 border-terracotta-200',
  aegean: 'bg-aegean-100 text-aegean-700 border-aegean-200',
  sand: 'bg-sand-100 text-sand-700 border-sand-200',
  success: 'bg-green-100 text-green-700 border-green-200',
  warning: 'bg-amber-100 text-amber-700 border-amber-200',
  error: 'bg-red-100 text-red-700 border-red-200',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
};

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'olive',
      size = 'sm',
      children,
      removable = false,
      onRemove,
      className = '',
      onClick,
    },
    ref
  ) => {
    return (
      <motion.span
        ref={ref}
        variants={fadeIn}
        initial="initial"
        animate="animate"
        exit="exit"
        onClick={onClick}
        className={`
          inline-flex items-center gap-1
          font-medium rounded-full border
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
      >
        {children}
        {removable && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.();
            }}
            className="
              -mr-0.5 ml-0.5 p-0.5 rounded-full
              hover:bg-black/10 transition-colors
              focus:outline-none focus-visible:ring-2 focus-visible:ring-current
            "
            aria-label="Remove"
          >
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </motion.span>
    );
  }
);

Badge.displayName = 'Badge';

export { Badge };
export type { BadgeProps, BadgeVariant, BadgeSize };
