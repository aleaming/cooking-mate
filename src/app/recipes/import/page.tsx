'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  IconFileText,
  IconLink,
  IconArrowLeft,
  IconChevronRight,
} from '@tabler/icons-react';
import { Button } from '@/components/ui';
import { pageVariants, staggerContainer, staggerItem } from '@/lib/constants/animations';

const importOptions = [
  {
    id: 'markdown',
    title: 'Upload Markdown Files',
    description: 'Import recipes from .md files with ingredients and instructions',
    icon: IconFileText,
    href: '/recipes/import/markdown',
    features: ['Batch import multiple files', 'Auto-parse ingredients', 'Preview before saving'],
  },
  {
    id: 'url',
    title: 'Import from URL',
    description: 'Paste a recipe URL and let AI extract the details',
    icon: IconLink,
    href: '/recipes/import/url',
    features: ['Works with most recipe sites', 'Smart extraction', 'Edit before saving'],
  },
];

export default function ImportRecipesPage() {
  const router = useRouter();

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="min-h-screen bg-background"
    >
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              aria-label="Go back"
              className="-ml-2"
            >
              <IconArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-display font-semibold text-foreground">
                Import Recipe
              </h1>
              <p className="text-sm text-muted">
                Add recipes from markdown files or websites
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid gap-6 md:grid-cols-2"
        >
          {importOptions.map((option) => {
            const Icon = option.icon;
            return (
              <motion.div key={option.id} variants={staggerItem}>
                <Link href={option.href}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="h-full p-6 bg-card border border-border rounded-2xl hover:border-olive-300 hover:shadow-md transition-all cursor-pointer group"
                  >
                    {/* Icon */}
                    <div className="w-14 h-14 rounded-xl bg-olive-100 flex items-center justify-center mb-4 group-hover:bg-olive-200 transition-colors">
                      <Icon className="w-7 h-7 text-olive-700" />
                    </div>

                    {/* Title & Description */}
                    <div className="mb-4">
                      <h2 className="text-lg font-semibold text-foreground mb-1 flex items-center gap-2">
                        {option.title}
                        <IconChevronRight className="w-5 h-5 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h2>
                      <p className="text-sm text-muted">{option.description}</p>
                    </div>

                    {/* Features */}
                    <ul className="space-y-2">
                      {option.features.map((feature, index) => (
                        <li
                          key={index}
                          className="flex items-center gap-2 text-sm text-muted"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-olive-400" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Help text */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 text-center"
        >
          <p className="text-sm text-muted">
            Imported recipes will be saved to your personal collection.{' '}
            <Link
              href="/recipes/my-recipes"
              className="text-olive-600 hover:text-olive-700 underline"
            >
              View My Recipes
            </Link>
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
}
