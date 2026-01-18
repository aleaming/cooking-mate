'use client';

import { useState, forwardRef, type InputHTMLAttributes } from 'react';
import { Input } from '@/components/ui';
import { IconEye, IconEyeOff } from '@tabler/icons-react';

interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onDrag' | 'onDragStart' | 'onDragEnd'> {
  label?: string;
  error?: string;
  helperText?: string;
}

const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ label = 'Password', error, helperText, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);

    return (
      <Input
        ref={ref}
        type={showPassword ? 'text' : 'password'}
        label={label}
        error={error}
        helperText={helperText}
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="p-1 hover:bg-sand-100 rounded-lg transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <IconEyeOff size={20} className="text-sand-500" />
            ) : (
              <IconEye size={20} className="text-sand-500" />
            )}
          </button>
        }
        {...props}
      />
    );
  }
);

PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
