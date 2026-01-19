'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';
import { motion } from 'framer-motion';
import { SPRING } from '@/lib/constants/animations';

type ToggleSize = 'sm' | 'md' | 'lg';

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  size?: ToggleSize;
  label?: string;
  description?: string;
}

const sizeStyles: Record<ToggleSize, { track: string; thumb: string; translate: string }> = {
  sm: {
    track: 'w-9 h-5',
    thumb: 'w-4 h-4',
    translate: 'translateX(16px)',
  },
  md: {
    track: 'w-11 h-6',
    thumb: 'w-5 h-5',
    translate: 'translateX(20px)',
  },
  lg: {
    track: 'w-14 h-7',
    thumb: 'w-6 h-6',
    translate: 'translateX(28px)',
  },
};

const Toggle = forwardRef<HTMLInputElement, ToggleProps>(
  (
    {
      checked = false,
      onCheckedChange,
      size = 'md',
      label,
      description,
      disabled,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const toggleId = id || `toggle-${Math.random().toString(36).substr(2, 9)}`;
    const styles = sizeStyles[size];

    const handleChange = () => {
      if (!disabled && onCheckedChange) {
        onCheckedChange(!checked);
      }
    };

    return (
      <div className={`flex items-start gap-3 ${className}`}>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-labelledby={label ? `${toggleId}-label` : undefined}
          aria-describedby={description ? `${toggleId}-description` : undefined}
          disabled={disabled}
          onClick={handleChange}
          className={`
            relative inline-flex shrink-0 cursor-pointer items-center rounded-full
            transition-colors duration-200
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive-500 focus-visible:ring-offset-2
            disabled:cursor-not-allowed disabled:opacity-50
            ${styles.track}
            ${checked ? 'bg-olive-500' : 'bg-foreground/20'}
          `}
        >
          <motion.span
            initial={false}
            animate={{
              x: checked ? (size === 'sm' ? 16 : size === 'md' ? 20 : 28) : 2,
            }}
            transition={SPRING.bouncy}
            className={`
              pointer-events-none inline-block rounded-full
              bg-white shadow-lg ring-0
              ${styles.thumb}
            `}
          />
        </button>

        {/* Hidden input for form compatibility */}
        <input
          ref={ref}
          type="checkbox"
          id={toggleId}
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
          className="sr-only"
          {...props}
        />

        {(label || description) && (
          <div className="flex-1 min-w-0">
            {label && (
              <label
                id={`${toggleId}-label`}
                htmlFor={toggleId}
                className={`
                  block text-sm font-medium cursor-pointer
                  ${disabled ? 'text-foreground/40' : 'text-foreground'}
                `}
              >
                {label}
              </label>
            )}
            {description && (
              <p
                id={`${toggleId}-description`}
                className={`text-sm ${disabled ? 'text-foreground/30' : 'text-foreground/60'}`}
              >
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';

export { Toggle };
export type { ToggleProps, ToggleSize };
