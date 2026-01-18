'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { AuthForm } from '@/components/auth';
import { staggerContainer, staggerItem, SPRING } from '@/lib/constants/animations';
import { IconAlertTriangle } from '@tabler/icons-react';

export default function AuthErrorPage() {
  return (
    <AuthForm
      title="Something went wrong"
      description="We couldn't complete your request"
    >
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="text-center py-4 space-y-6"
      >
        <motion.div variants={staggerItem}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-error/10 flex items-center justify-center">
            <IconAlertTriangle size={32} className="text-error" />
          </div>
          <p className="text-sand-600">
            The authentication link may have expired or is invalid.
            Please try again.
          </p>
        </motion.div>

        <motion.div variants={staggerItem} className="flex flex-col gap-3">
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={SPRING.gentle}>
            <Link
              href="/forgot-password"
              className="inline-flex items-center justify-center w-full px-6 py-3 text-lg font-medium text-white bg-olive-500 rounded-2xl hover:bg-olive-600 active:bg-olive-700 shadow-md shadow-olive-500/20 transition-colors min-h-[48px]"
            >
              Request new link
            </Link>
          </motion.div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} transition={SPRING.gentle}>
            <Link
              href="/login"
              className="inline-flex items-center justify-center w-full px-4 py-2.5 text-base font-medium text-olive-700 rounded-xl hover:bg-olive-100 active:bg-olive-200 transition-colors min-h-[44px]"
            >
              Back to sign in
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </AuthForm>
  );
}
