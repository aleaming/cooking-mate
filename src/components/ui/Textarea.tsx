'use client';

import { forwardRef, type TextareaHTMLAttributes, useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeInUp } from '@/lib/constants/animations';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

const resizeStyles: Record<NonNullable<TextareaProps['resize']>, string> = {
  none: 'resize-none',
  vertical: 'resize-y',
  horizontal: 'resize-x',
  both: 'resize',
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      resize = 'vertical',
      className = '',
      id,
      onFocus,
      onBlur,
      rows = 3,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const generatedId = useId();
    const textareaId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          className={`
            w-full px-4 py-2.5 rounded-xl
            border-2 bg-card
            text-base text-foreground placeholder:text-sand-400
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-olive-500/20
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-sand-50
            ${resizeStyles[resize]}
            ${error ? 'border-error focus:ring-error/20' : isFocused ? 'border-olive-500' : 'border-foreground/20'}
            ${className}
          `}
          {...props}
        />
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

Textarea.displayName = 'Textarea';

export { Textarea };
export type { TextareaProps };
