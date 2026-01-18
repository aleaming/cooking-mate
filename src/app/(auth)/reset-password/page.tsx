'use client';

import { Suspense, useActionState, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AuthForm, PasswordInput, PasswordStrengthBar } from '@/components/auth';
import { Button } from '@/components/ui';
import { resetPassword } from '@/lib/auth/actions';
import { validatePassword, getPasswordRequirementsList } from '@/lib/auth/validation';
import { AUTH_ERROR_MESSAGES, type AuthErrorCode } from '@/types/auth';
import { staggerContainer, staggerItem } from '@/lib/constants/animations';
import { IconCheck, IconX, IconArrowLeft } from '@tabler/icons-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('error') as AuthErrorCode | null;

  const [password, setPassword] = useState('');
  const passwordValidation = validatePassword(password);
  const requirements = getPasswordRequirementsList();

  const [, formAction, isPending] = useActionState(
    async (_prevState: unknown, formData: FormData) => {
      await resetPassword(formData);
      return null;
    },
    null
  );

  const handlePasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(e.target.value);
    },
    []
  );

  const errorMessage = errorCode ? AUTH_ERROR_MESSAGES[errorCode] : null;

  return (
    <AuthForm
      title="Set new password"
      description="Choose a strong password for your account"
      error={errorMessage}
      footer={
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-olive-600 hover:text-olive-700 font-medium hover:underline"
        >
          <IconArrowLeft size={16} />
          Back to sign in
        </Link>
      }
    >
      <motion.form
        action={formAction}
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="space-y-4"
      >
        <motion.div variants={staggerItem}>
          <PasswordInput
            name="password"
            label="New password"
            placeholder="Create a new password"
            autoComplete="new-password"
            required
            value={password}
            onChange={handlePasswordChange}
          />
          {password.length > 0 && (
            <div className="mt-2 space-y-2">
              <PasswordStrengthBar strength={passwordValidation.strength} />
              <ul className="space-y-1">
                {requirements.map((req) => {
                  const isPassed = !passwordValidation.errors.includes(req);
                  return (
                    <li
                      key={req}
                      className={`flex items-center gap-1.5 text-xs ${
                        isPassed ? 'text-success' : 'text-sand-500'
                      }`}
                    >
                      {isPassed ? (
                        <IconCheck size={14} />
                      ) : (
                        <IconX size={14} />
                      )}
                      {req}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </motion.div>

        <motion.div variants={staggerItem}>
          <PasswordInput
            name="confirmPassword"
            label="Confirm new password"
            placeholder="Confirm your new password"
            autoComplete="new-password"
            required
          />
        </motion.div>

        <motion.div variants={staggerItem}>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isPending}
            className="w-full"
          >
            {isPending ? 'Updating password...' : 'Update password'}
          </Button>
        </motion.div>
      </motion.form>
    </AuthForm>
  );
}

function ResetPasswordFallback() {
  return (
    <AuthForm title="Set new password" description="Choose a strong password for your account">
      <div className="space-y-4">
        <div className="h-[72px] bg-sand-100 rounded-xl animate-pulse" />
        <div className="h-[72px] bg-sand-100 rounded-xl animate-pulse" />
        <div className="h-[48px] bg-sand-100 rounded-xl animate-pulse" />
      </div>
    </AuthForm>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
