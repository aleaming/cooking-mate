'use client';

import { Suspense, useActionState, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AuthForm, PasswordInput, PasswordStrengthBar } from '@/components/auth';
import { Button, Input } from '@/components/ui';
import { signup } from '@/lib/auth/actions';
import { validatePassword, getPasswordRequirementsList } from '@/lib/auth/validation';
import { AUTH_ERROR_MESSAGES, type AuthErrorCode } from '@/types/auth';
import { staggerContainer, staggerItem } from '@/lib/constants/animations';
import { IconMail, IconCheck, IconX } from '@tabler/icons-react';

function SignupForm() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('error') as AuthErrorCode | null;

  const [password, setPassword] = useState('');
  const passwordValidation = validatePassword(password);
  const requirements = getPasswordRequirementsList();

  const [, formAction, isPending] = useActionState(
    async (_prevState: unknown, formData: FormData) => {
      await signup(formData);
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
      title="Create an account"
      description="Start your Mediterranean cooking journey"
      error={errorMessage}
      footer={
        <p className="text-sand-600">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-olive-600 hover:text-olive-700 font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
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
          <Input
            type="email"
            name="email"
            label="Email"
            placeholder="your@email.com"
            autoComplete="email"
            required
            leftIcon={<IconMail size={20} />}
          />
        </motion.div>

        <motion.div variants={staggerItem}>
          <PasswordInput
            name="password"
            label="Password"
            placeholder="Create a password"
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
            label="Confirm password"
            placeholder="Confirm your password"
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
            {isPending ? 'Creating account...' : 'Create account'}
          </Button>
        </motion.div>

        <motion.div variants={staggerItem}>
          <p className="text-xs text-center text-sand-500">
            By creating an account, you agree to our Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </motion.form>
    </AuthForm>
  );
}

function SignupFallback() {
  return (
    <AuthForm title="Create an account" description="Start your Mediterranean cooking journey">
      <div className="space-y-4">
        <div className="h-[72px] bg-sand-100 rounded-xl animate-pulse" />
        <div className="h-[72px] bg-sand-100 rounded-xl animate-pulse" />
        <div className="h-[72px] bg-sand-100 rounded-xl animate-pulse" />
        <div className="h-[48px] bg-sand-100 rounded-xl animate-pulse" />
      </div>
    </AuthForm>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupFallback />}>
      <SignupForm />
    </Suspense>
  );
}
