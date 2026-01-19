'use client';

import { motion } from 'framer-motion';
import { IconCheck, IconSparkles } from '@tabler/icons-react';
import { Button } from '@/components/ui';
import { formatPrice, getMonthlyEquivalent, type PlanPeriod } from '@/lib/stripe/config';

interface PricingCardProps {
  name: string;
  description: string;
  features: string[];
  price: number;
  period: PlanPeriod;
  isPopular?: boolean;
  isCurrentPlan?: boolean;
  onSelect: () => void;
  isLoading?: boolean;
}

export function PricingCard({
  name,
  description,
  features,
  price,
  period,
  isPopular,
  isCurrentPlan,
  onSelect,
  isLoading,
}: PricingCardProps) {
  const monthlyEquivalent = getMonthlyEquivalent(price, period);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative h-full"
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span className="bg-terracotta-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1">
            <IconSparkles size={14} />
            Most Popular
          </span>
        </div>
      )}

      <div
        className={`
          h-full bg-card rounded-2xl shadow-lg shadow-black/10 p-6
          flex flex-col
          ${isPopular ? 'ring-2 ring-terracotta-500' : ''}
        `}
      >
        {/* Header */}
        <div className="mb-6">
          <h3 className="font-display text-xl font-semibold text-card-foreground">
            {name}
          </h3>
          <p className="text-sand-600 mt-1 text-sm">{description}</p>
        </div>

        {/* Price */}
        <div className="mb-6">
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-olive-900">
              {formatPrice(monthlyEquivalent)}
            </span>
            <span className="text-sand-600">/month</span>
          </div>
          {period === 'yearly' && (
            <p className="text-sm text-terracotta-600 mt-1">
              Billed annually ({formatPrice(price)}/year)
            </p>
          )}
        </div>

        {/* Features */}
        <ul className="space-y-3 mb-6 flex-1">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <IconCheck size={18} className="text-olive-600 mt-0.5 shrink-0" />
              <span className="text-sand-700 text-sm">{feature}</span>
            </li>
          ))}
        </ul>

        {/* CTA Button */}
        <Button
          onClick={onSelect}
          isLoading={isLoading}
          disabled={isCurrentPlan}
          variant={isPopular ? 'primary' : 'outline'}
          className="w-full"
        >
          {isCurrentPlan ? 'Current Plan' : 'Get Started'}
        </Button>
      </div>
    </motion.div>
  );
}
