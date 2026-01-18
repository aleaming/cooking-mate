'use client';

import { motion } from 'framer-motion';
import type { PasswordValidation } from '@/types/auth';
import { SPRING } from '@/lib/constants/animations';

interface PasswordStrengthBarProps {
  strength: PasswordValidation['strength'];
  className?: string;
}

const strengthConfig = {
  weak: {
    width: '33%',
    color: 'bg-error',
    label: 'Weak',
    textColor: 'text-error',
  },
  medium: {
    width: '66%',
    color: 'bg-warning',
    label: 'Medium',
    textColor: 'text-warning',
  },
  strong: {
    width: '100%',
    color: 'bg-success',
    label: 'Strong',
    textColor: 'text-success',
  },
};

export function PasswordStrengthBar({
  strength,
  className = '',
}: PasswordStrengthBarProps) {
  const config = strengthConfig[strength];

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="h-1.5 bg-sand-200 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${config.color}`}
          initial={{ width: 0 }}
          animate={{ width: config.width }}
          transition={SPRING.gentle}
        />
      </div>
      <p className={`text-xs font-medium ${config.textColor}`}>
        Password strength: {config.label}
      </p>
    </div>
  );
}
