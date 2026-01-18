'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui';
import { fadeInUp } from '@/lib/constants/animations';
import { IconAlertCircle, IconCircleCheck } from '@tabler/icons-react';

interface AuthFormProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  error?: string | null;
  success?: string | null;
}

export function AuthForm({
  title,
  description,
  children,
  footer,
  error,
  success,
}: AuthFormProps) {
  return (
    <Card padding="lg" className="w-full">
      <CardHeader className="text-center">
        <CardTitle as="h1" className="text-2xl">
          {title}
        </CardTitle>
        {description && (
          <p className="text-sand-600 mt-2">{description}</p>
        )}
      </CardHeader>

      <CardContent>
        {/* Error/Success Messages */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mb-4 p-3 rounded-xl bg-error/10 border border-error/20 flex items-start gap-2"
            >
              <IconAlertCircle size={20} className="text-error flex-shrink-0 mt-0.5" />
              <p className="text-sm text-error">{error}</p>
            </motion.div>
          )}
          {success && (
            <motion.div
              key="success"
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mb-4 p-3 rounded-xl bg-success/10 border border-success/20 flex items-start gap-2"
            >
              <IconCircleCheck size={20} className="text-success flex-shrink-0 mt-0.5" />
              <p className="text-sm text-success">{success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {children}
      </CardContent>

      {footer && (
        <CardFooter className="text-center">
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}
