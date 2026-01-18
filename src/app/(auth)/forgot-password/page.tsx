'use client';

import { Suspense, useActionState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AuthForm } from '@/components/auth';
import { Button, Input } from '@/components/ui';
import { forgotPassword } from '@/lib/auth/actions';
import { AUTH_ERROR_MESSAGES, type AuthErrorCode } from '@/types/auth';
import { staggerContainer, staggerItem } from '@/lib/constants/animations';
import { IconMail, IconArrowLeft } from '@tabler/icons-react';

function ForgotPasswordForm() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('error') as AuthErrorCode | null;
  const emailSent = searchParams.get('sent') === 'true';

  const [, formAction, isPending] = useActionState(
    async (_prevState: unknown, formData: FormData) => {
      await forgotPassword(formData);
      return null;
    },
    null
  );

  const errorMessage = errorCode ? AUTH_ERROR_MESSAGES[errorCode] : null;
  const successMessage = emailSent
    ? 'If an account exists with this email, you will receive a password reset link shortly.'
    : null;

  return (
    <AuthForm
      title="Reset password"
      description="Enter your email and we'll send you a reset link"
      error={errorMessage}
      success={successMessage}
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
      {emailSent ? (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="text-center py-4"
        >
          <motion.div variants={staggerItem}>
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success/10 flex items-center justify-center">
              <IconMail size={32} className="text-success" />
            </div>
            <p className="text-sand-600">
              Check your email inbox for the password reset link.
            </p>
          </motion.div>
        </motion.div>
      ) : (
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
            <Button
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isPending}
              className="w-full"
            >
              {isPending ? 'Sending...' : 'Send reset link'}
            </Button>
          </motion.div>
        </motion.form>
      )}
    </AuthForm>
  );
}

function ForgotPasswordFallback() {
  return (
    <AuthForm title="Reset password" description="Enter your email and we'll send you a reset link">
      <div className="space-y-4">
        <div className="h-[72px] bg-sand-100 rounded-xl animate-pulse" />
        <div className="h-[48px] bg-sand-100 rounded-xl animate-pulse" />
      </div>
    </AuthForm>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<ForgotPasswordFallback />}>
      <ForgotPasswordForm />
    </Suspense>
  );
}
