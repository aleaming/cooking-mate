'use client';

import { forwardRef, type InputHTMLAttributes, useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp } from '@/lib/constants/animations';

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onDrag' | 'onDragStart' | 'onDragEnd'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      className = '',
      id,
      onFocus,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/50">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            className={`
              w-full px-4 py-2.5 min-h-[44px] rounded-xl
              border-2 bg-card
              text-base text-foreground placeholder:text-sand-400
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-olive-500/20
              disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-sand-50
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${error ? 'border-error focus:ring-error/20' : isFocused ? 'border-olive-500' : 'border-foreground/20'}
              ${className}
            `}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50">
              {rightIcon}
            </div>
          )}
        </div>
        <AnimatePresence mode="wait">
          {error ? (
            <motion.p
              key="error"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mt-1.5 text-sm text-error"
            >
              {error}
            </motion.p>
          ) : helperText ? (
            <motion.p
              key="helper"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mt-1.5 text-sm text-foreground/60"
            >
              {helperText}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };
