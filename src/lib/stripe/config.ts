export const PLANS = {
  basic: {
    name: 'Basic',
    description: 'Perfect for individuals starting their Mediterranean diet journey',
    features: [
      'Browse all recipes',
      'Meal planning calendar',
      'Shopping list generation',
      'Recipe scaling',
      'Cooking history tracking',
    ],
    prices: {
      monthly: {
        id: process.env.STRIPE_PRICE_BASIC_MONTHLY || '',
        amount: 199, // $1.99 in cents
      },
      yearly: {
        id: process.env.STRIPE_PRICE_BASIC_YEARLY || '',
        amount: 1999, // $19.99 in cents
      },
    },
  },
  pro: {
    name: 'Pro',
    description: 'For serious home chefs and meal prep enthusiasts',
    features: [
      'Everything in Basic',
      'Import recipes from URLs',
      'Import recipes from markdown',
      'Pantry finder',
      'Smart recipe suggestions',
      'Priority support',
    ],
    prices: {
      monthly: {
        id: process.env.STRIPE_PRICE_PRO_MONTHLY || '',
        amount: 499, // $4.99 in cents
      },
      yearly: {
        id: process.env.STRIPE_PRICE_PRO_YEARLY || '',
        amount: 4999, // $49.99 in cents
      },
    },
  },
} as const;

export type PlanTier = keyof typeof PLANS;
export type PlanPeriod = 'monthly' | 'yearly';

export function getPriceId(tier: PlanTier, period: PlanPeriod): string {
  return PLANS[tier].prices[period].id;
}

export function formatPrice(amountInCents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountInCents / 100);
}

export function getMonthlyEquivalent(amountInCents: number, period: PlanPeriod): number {
  return period === 'yearly' ? Math.round(amountInCents / 12) : amountInCents;
}

export function getYearlySavingsPercent(tier: PlanTier): number {
  const monthly = PLANS[tier].prices.monthly.amount * 12;
  const yearly = PLANS[tier].prices.yearly.amount;
  return Math.round(((monthly - yearly) / monthly) * 100);
}
