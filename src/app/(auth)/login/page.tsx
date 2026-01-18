'use client';

import { Suspense, useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AuthForm, PasswordInput } from '@/components/auth';
import { Button, Input } from '@/components/ui';
import { login } from '@/lib/auth/actions';
import { AUTH_ERROR_MESSAGES, type AuthErrorCode } from '@/types/auth';
import { staggerContainer, staggerItem } from '@/lib/constants/animations';
import { IconMail } from '@tabler/icons-react';

function LoginForm() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('error') as AuthErrorCode | null;
  const resetSuccess = searchParams.get('reset') === 'success';
  const returnUrl = searchParams.get('returnUrl');

  const [, formAction, isPending] = useActionState(
    async (_prevState: unknown, formData: FormData) => {
      await login(formData);
      return null;
    },
    null
  );

  const errorMessage = errorCode ? AUTH_ERROR_MESSAGES[errorCode] : null;
  const successMessage = resetSuccess
    ? 'Password reset successfully. Please sign in with your new password.'
    : null;

  return (
    <AuthForm
      title="Welcome back"
      description="Sign in to your Cooking Mate account"
      error={errorMessage}
      success={successMessage}
      footer={
        <p className="text-sand-600">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="text-olive-600 hover:text-olive-700 font-medium hover:underline"
          >
            Sign up
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
        {/* Hidden return URL field */}
        {returnUrl && (
          <input type="hidden" name="returnUrl" value={returnUrl} />
        )}

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
            placeholder="Enter your password"
            autoComplete="current-password"
            required
          />
        </motion.div>

        <motion.div variants={staggerItem} className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-olive-600 hover:text-olive-700 hover:underline"
          >
            Forgot password?
          </Link>
        </motion.div>

        <motion.div variants={staggerItem}>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isPending}
            className="w-full"
          >
            {isPending ? 'Signing in...' : 'Sign in'}
          </Button>
        </motion.div>
      </motion.form>
    </AuthForm>
  );
}

function LoginFallback() {
  return (
    <AuthForm title="Welcome back" description="Sign in to your Cooking Mate account">
      <div className="space-y-4">
        <div className="h-[72px] bg-sand-100 rounded-xl animate-pulse" />
        <div className="h-[72px] bg-sand-100 rounded-xl animate-pulse" />
        <div className="h-[48px] bg-sand-100 rounded-xl animate-pulse" />
      </div>
    </AuthForm>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
