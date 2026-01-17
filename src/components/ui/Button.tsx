'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { SPRING } from '@/lib/constants/animations';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps
  extends Omit<HTMLMotionProps<'button'>, 'children'>,
    Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled' | 'type'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-olive-500 text-white hover:bg-olive-600 active:bg-olive-700 shadow-md shadow-olive-500/20',
  secondary:
    'bg-terracotta-500 text-white hover:bg-terracotta-600 active:bg-terracotta-700 shadow-md shadow-terracotta-500/20',
  outline:
    'border-2 border-olive-500 text-olive-700 hover:bg-olive-50 active:bg-olive-100',
  ghost:
    'text-olive-700 hover:bg-olive-100 active:bg-olive-200',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-2.5 text-sm rounded-lg gap-1.5 min-h-[44px]',
  md: 'px-4 py-2.5 text-base rounded-xl gap-2 min-h-[44px]',
  lg: 'px-6 py-3 text-lg rounded-2xl gap-2.5 min-h-[48px]',
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;

    return (
      <motion.button
        ref={ref}
        disabled={isDisabled}
        whileHover={isDisabled ? undefined : { scale: 1.02 }}
        whileTap={isDisabled ? undefined : { scale: 0.98 }}
        transition={SPRING.gentle}
        className={`
          inline-flex items-center justify-center font-medium
          transition-colors duration-200
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-500 focus-visible:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {isLoading ? (
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="inline-block"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </motion.span>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps, ButtonVariant, ButtonSize };
