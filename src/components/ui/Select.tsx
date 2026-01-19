'use client';

import { forwardRef, type SelectHTMLAttributes, useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconChevronDown } from '@tabler/icons-react';
import { fadeInUp } from '@/lib/constants/animations';

type SelectSize = 'sm' | 'md' | 'lg';

interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  size?: SelectSize;
}

const sizeStyles: Record<SelectSize, string> = {
  sm: 'px-2.5 py-1.5 text-sm min-h-[36px] pr-8',
  md: 'px-4 py-2.5 text-base min-h-[44px] pr-10',
  lg: 'px-4 py-3 text-lg min-h-[52px] pr-12',
};

const iconSizes: Record<SelectSize, number> = {
  sm: 14,
  md: 18,
  lg: 20,
};

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      placeholder,
      size = 'md',
      className = '',
      id,
      onFocus,
      onBlur,
      value,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const generatedId = useId();
    const selectId = id || generatedId;

    // Check if a value is selected (for placeholder styling)
    const hasValue = value !== undefined && value !== '';

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            value={value}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            className={`
              w-full rounded-xl appearance-none
              border-2 bg-card cursor-pointer
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-olive-500/20
              disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-sand-50
              ${sizeStyles[size]}
              ${!hasValue && placeholder ? 'text-sand-400' : 'text-foreground'}
              ${error ? 'border-error focus:ring-error/20' : isFocused ? 'border-olive-500' : 'border-foreground/20'}
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-foreground/50">
            <IconChevronDown size={iconSizes[size]} />
          </div>
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

Select.displayName = 'Select';

export { Select };
export type { SelectProps, SelectOption, SelectSize };
