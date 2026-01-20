'use client';

import { Suspense, useActionState, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AuthForm } from '@/components/auth';
import { Button, Input } from '@/components/ui';
import { resendConfirmation } from '@/lib/auth/actions';
import { AUTH_ERROR_MESSAGES, type AuthErrorCode } from '@/types/auth';
import { staggerContainer, staggerItem } from '@/lib/constants/animations';
import { IconMail, IconArrowLeft, IconCheck } from '@tabler/icons-react';

function ConfirmEmailForm() {
  const searchParams = useSearchParams();
  const errorCode = searchParams.get('error') as AuthErrorCode | null;
  const emailSent = searchParams.get('sent') === 'true';
  const returnTo = searchParams.get('returnTo');
  const [showResendForm, setShowResendForm] = useState(false);

  const [, formAction, isPending] = useActionState(
    async (_prevState: unknown, formData: FormData) => {
      await resendConfirmation(formData);
      return null;
    },
    null
  );

  const errorMessage = errorCode ? AUTH_ERROR_MESSAGES[errorCode] : null;
  const successMessage = emailSent ? 'Confirmation email sent! Check your inbox.' : null;

  return (
    <AuthForm
      title="Check your email"
      description="We've sent you a confirmation link"
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
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="text-center py-4"
      >
        <motion.div variants={staggerItem}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-aegean-50 flex items-center justify-center border border-aegean-200">
            {emailSent ? (
              <IconCheck size={32} className="text-aegean-600" />
            ) : (
              <IconMail size={32} className="text-aegean-600" />
            )}
          </div>
          <p className="text-sand-700 mb-2">
            Click the link in your email to confirm your account.
          </p>
          <p className="text-sm text-sand-500 mb-6">
            Don't see the email? Check your spam folder.
          </p>
        </motion.div>

        {showResendForm ? (
          <motion.form
            action={formAction}
            variants={staggerItem}
            className="space-y-4 text-left"
          >
            {/* Hidden field to preserve returnTo through resend flow */}
            {returnTo && <input type="hidden" name="returnTo" value={returnTo} />}

            <Input
              type="email"
              name="email"
              label="Email address"
              placeholder="your@email.com"
              autoComplete="email"
              required
              leftIcon={<IconMail size={20} />}
            />
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setShowResendForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isPending}
                className="flex-1"
              >
                {isPending ? 'Sending...' : 'Resend email'}
              </Button>
            </div>
          </motion.form>
        ) : (
          <motion.div variants={staggerItem}>
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowResendForm(true)}
            >
              Resend confirmation email
            </Button>
          </motion.div>
        )}
      </motion.div>
    </AuthForm>
  );
}

function ConfirmEmailFallback() {
  return (
    <AuthForm title="Check your email" description="We've sent you a confirmation link">
      <div className="space-y-4 text-center py-4">
        <div className="w-16 h-16 mx-auto bg-sand-100 rounded-full animate-pulse" />
        <div className="h-4 w-48 mx-auto bg-sand-100 rounded animate-pulse" />
        <div className="h-10 w-40 mx-auto bg-sand-100 rounded-xl animate-pulse" />
      </div>
    </AuthForm>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={<ConfirmEmailFallback />}>
      <ConfirmEmailForm />
    </Suspense>
  );
}
