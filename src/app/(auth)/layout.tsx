'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Logo } from '@/components/ui';
import { pageVariants } from '@/lib/constants/animations';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-olive-50 via-sand-50 to-terracotta-50/30 flex flex-col">
      {/* Logo Header */}
      <header className="py-6 px-4">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 min-h-[44px] group"
        >
          <motion.div
            whileHover={{ rotate: 10 }}
            transition={{ duration: 0.2 }}
          >
            <Logo size={32} />
          </motion.div>
          <span className="font-display text-2xl font-semibold text-olive-800">
            Cooking Mate
          </span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          variants={pageVariants}
          initial="initial"
          animate="animate"
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-sand-500">
        <p>Mediterranean recipes for healthy living</p>
      </footer>
    </div>
  );
}
