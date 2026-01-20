'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Modal, Button, Badge } from '@/components/ui';
import { useOnboardingStore } from '@/stores/useOnboardingStore';
import {
  IconCheck,
  IconCalendar,
  IconShoppingCart,
  IconChefHat,
  IconFileImport,
  IconSearch,
  IconSparkles,
} from '@tabler/icons-react';
import { staggerContainer, staggerItem } from '@/lib/constants/animations';
import type { SubscriptionTier } from '@/types/subscription';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: SubscriptionTier;
}

const BASIC_FEATURES = [
  { icon: IconChefHat, text: 'Browse 50+ Mediterranean recipes' },
  { icon: IconCalendar, text: 'Drag-and-drop meal planning' },
  { icon: IconShoppingCart, text: 'Auto-generated shopping lists' },
  { icon: IconSparkles, text: 'Recipe scaling & cooking history' },
];

const PRO_FEATURES = [
  { icon: IconChefHat, text: 'Everything in Basic, plus...' },
  { icon: IconFileImport, text: 'Import recipes from any URL' },
  { icon: IconFileImport, text: 'Import from markdown files' },
  { icon: IconSearch, text: 'Pantry Finder - cook with what you have' },
  { icon: IconSparkles, text: 'Smart recipe suggestions' },
];

export function WelcomeModal({ isOpen, onClose, tier }: WelcomeModalProps) {
  const router = useRouter();
  const markWelcomeSeen = useOnboardingStore((state) => state.markWelcomeSeen);

  const features = tier === 'pro' ? PRO_FEATURES : BASIC_FEATURES;
  const title = tier === 'pro' ? 'Welcome to Cooking Mate Pro!' : 'Welcome to Cooking Mate!';
  const badgeVariant = tier === 'pro' ? 'terracotta' : 'sand';

  const handleGetStarted = () => {
    markWelcomeSeen();
    onClose();
    if (tier === 'pro') {
      router.push('/recipes/import');
    }
  };

  const handleDismiss = () => {
    markWelcomeSeen();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleDismiss} size="md">
      <motion.div
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="text-center"
      >
        {/* Badge */}
        <motion.div variants={staggerItem} className="mb-4">
          <Badge variant={badgeVariant} size="md">
            {tier === 'pro' ? 'Pro' : 'Basic'} Plan
          </Badge>
        </motion.div>

        {/* Title */}
        <motion.h2
          variants={staggerItem}
          className="font-display text-2xl font-bold text-foreground mb-2"
        >
          {title}
        </motion.h2>

        {/* Subtitle */}
        <motion.p variants={staggerItem} className="text-foreground/60 mb-6">
          {tier === 'pro'
            ? "You've unlocked all features. Here's what you can do:"
            : "Your meal planning journey starts now. Here's what you can do:"}
        </motion.p>

        {/* Features List */}
        <motion.ul variants={staggerItem} className="space-y-3 text-left mb-8">
          {features.map((feature, index) => (
            <motion.li
              key={index}
              variants={staggerItem}
              className="flex items-center gap-3 text-foreground/80"
            >
              <div className="w-8 h-8 rounded-lg bg-olive-50 flex items-center justify-center flex-shrink-0">
                <feature.icon size={18} className="text-olive-600" />
              </div>
              <span className="text-sm">{feature.text}</span>
            </motion.li>
          ))}
        </motion.ul>

        {/* Actions */}
        <motion.div variants={staggerItem} className="flex flex-col gap-3">
          <Button variant="primary" size="lg" onClick={handleGetStarted} className="w-full">
            <IconCheck size={18} className="mr-2" />
            {tier === 'pro' ? 'Import Your First Recipe' : 'Get Started'}
          </Button>
          <button
            onClick={handleDismiss}
            className="text-sm text-foreground/50 hover:text-foreground/70 transition-colors"
          >
            Maybe later
          </button>
        </motion.div>
      </motion.div>
    </Modal>
  );
}
