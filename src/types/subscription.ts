export type SubscriptionStatus =
  | 'inactive'
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid';

export type SubscriptionTier = 'basic' | 'pro';
export type SubscriptionPeriod = 'monthly' | 'yearly';

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  tier: SubscriptionTier | null;
  period: SubscriptionPeriod | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface PlanFeature {
  name: string;
  included: boolean;
}

export interface Plan {
  name: string;
  description: string;
  tier: SubscriptionTier;
  features: string[];
  prices: {
    monthly: { id: string; amount: number };
    yearly: { id: string; amount: number };
  };
}

export interface ProfileWithSubscription {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  stripe_customer_id: string | null;
  subscription_status: SubscriptionStatus;
  subscription_tier: SubscriptionTier | null;
  subscription_period: SubscriptionPeriod | null;
  subscription_id: string | null;
  subscription_current_period_end: string | null;
  subscription_cancel_at_period_end: boolean;
  created_at: string;
  updated_at: string;
}

export function hasActiveSubscription(status: SubscriptionStatus | null | undefined): boolean {
  return status === 'active' || status === 'trialing';
}
