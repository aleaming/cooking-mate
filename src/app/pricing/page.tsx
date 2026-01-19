'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/providers/AuthProvider';
import { PricingCard } from '@/components/subscription';
import { Button } from '@/components/ui';
import { PLANS, getYearlySavingsPercent, type PlanTier, type PlanPeriod } from '@/lib/stripe/config';
import { pageVariants, staggerContainer, staggerItem } from '@/lib/constants/animations';

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [period, setPeriod] = useState<PlanPeriod>('monthly');
  const [loadingTier, setLoadingTier] = useState<PlanTier | null>(null);

  async function handleSelectPlan(tier: PlanTier) {
    if (!user) {
      // Redirect to signup with plan info
      router.push(`/signup?plan=${tier}&period=${period}`);
      return;
    }

    setLoadingTier(tier);
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, period }),
      });

      const { url, error } = await response.json();

      if (error) {
        console.error('Checkout error:', error);
        return;
      }

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoadingTier(null);
    }
  }

  const basicSavings = getYearlySavingsPercent('basic');
  const proSavings = getYearlySavingsPercent('pro');
  const maxSavings = Math.max(basicSavings, proSavings);

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="min-h-screen"
    >
      {/* Header Section */}
      <div className="bg-gradient-to-br from-olive-50 to-sand-50 py-16 lg:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl lg:text-5xl font-bold text-olive-900 mb-4"
          >
            Simple, Transparent Pricing
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-sand-600 max-w-2xl mx-auto mb-8"
          >
            Choose the plan that fits your Mediterranean lifestyle.
            Start your journey to healthier eating today.
          </motion.p>

          {/* Period Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-white p-1 rounded-xl shadow-sm"
          >
            <Button
              variant={period === 'monthly' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setPeriod('monthly')}
            >
              Monthly
            </Button>
            <Button
              variant={period === 'yearly' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setPeriod('yearly')}
            >
              Yearly
              {maxSavings > 0 && (
                <span className="ml-1 text-xs bg-terracotta-100 text-terracotta-700 px-1.5 py-0.5 rounded">
                  Save {maxSavings}%
                </span>
              )}
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 pb-16">
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid md:grid-cols-2 gap-8"
        >
          {/* Basic Plan */}
          <motion.div variants={staggerItem}>
            <PricingCard
              name={PLANS.basic.name}
              description={PLANS.basic.description}
              features={[...PLANS.basic.features]}
              price={PLANS.basic.prices[period].amount}
              period={period}
              onSelect={() => handleSelectPlan('basic')}
              isLoading={loadingTier === 'basic'}
            />
          </motion.div>

          {/* Pro Plan */}
          <motion.div variants={staggerItem}>
            <PricingCard
              name={PLANS.pro.name}
              description={PLANS.pro.description}
              features={[...PLANS.pro.features]}
              price={PLANS.pro.prices[period].amount}
              period={period}
              isPopular
              onSelect={() => handleSelectPlan('pro')}
              isLoading={loadingTier === 'pro'}
            />
          </motion.div>
        </motion.div>
      </div>

      {/* FAQ Section */}
      <div className="bg-sand-50 py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-olive-900 text-center mb-8">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-olive-900 mb-2">
                Can I cancel anytime?
              </h3>
              <p className="text-sand-600">
                Yes! You can cancel your subscription at any time. Your access will
                continue until the end of your current billing period.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-olive-900 mb-2">
                Can I switch plans?
              </h3>
              <p className="text-sand-600">
                Absolutely. You can upgrade or downgrade your plan at any time.
                Changes take effect at the start of your next billing cycle.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-olive-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-sand-600">
                We accept all major credit cards (Visa, Mastercard, American Express)
                as well as Apple Pay and Google Pay through our secure payment partner, Stripe.
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-olive-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-sand-600">
                We don&apos;t offer a free trial at this time, but you can cancel
                within the first 14 days for a full refund if you&apos;re not satisfied.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
