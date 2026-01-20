'use client';

import { motion } from 'framer-motion';
import { useAuth } from '@/providers/AuthProvider';
import { FamilyDashboard } from '@/components/family';
import { Button, Skeleton } from '@/components/ui';
import { pageVariants } from '@/lib/constants/animations';
import { IconUsers, IconLogin } from '@tabler/icons-react';
import Link from 'next/link';

export default function FamilyPage() {
  const { user, isLoading } = useAuth();

  // Loading state
  if (isLoading) {
    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen bg-sand-50"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <Skeleton className="h-10 w-48 mb-2" />
            <Skeleton className="h-5 w-72" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Skeleton className="h-64 w-full rounded-2xl" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-32 w-full rounded-2xl" />
                <Skeleton className="h-40 w-full rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Not logged in state
  if (!user) {
    return (
      <motion.div
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="min-h-screen bg-sand-50"
      >
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="
            bg-white rounded-2xl shadow-lg shadow-sand-200/50
            p-8 text-center
          ">
            <div className="
              w-20 h-20 mx-auto mb-6 rounded-full
              bg-olive-100 text-olive-600
              flex items-center justify-center
            ">
              <IconUsers size={40} />
            </div>
            <h1 className="font-display text-2xl font-bold text-olive-900 mb-3">
              Family Meal Planning
            </h1>
            <p className="text-sand-600 mb-6 max-w-md mx-auto">
              Sign in to create or join a family, share meal plans, coordinate
              cooking, and vote on meals together with your household.
            </p>
            <Link href="/login">
              <Button variant="primary" size="lg" className="gap-2">
                <IconLogin size={20} />
                Sign In to Get Started
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    );
  }

  // Logged in - show dashboard
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen bg-sand-50"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="font-display text-3xl font-bold text-olive-900 mb-2">
            Family
          </h1>
          <p className="text-sand-600">
            Manage your family, invite members, and plan meals together
          </p>
        </motion.div>

        {/* Dashboard */}
        <FamilyDashboard userId={user.id} />
      </div>
    </motion.div>
  );
}
