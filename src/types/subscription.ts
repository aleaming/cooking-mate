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
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  trialDaysRemaining: number | null;
  isInTrial: boolean;
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
  trial_started_at: string | null;
  trial_ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export function hasActiveSubscription(status: SubscriptionStatus | null | undefined): boolean {
  return status === 'active' || status === 'trialing';
}

/**
 * Calculate days remaining in trial
 */
export function getTrialDaysRemaining(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0;
  const days = Math.ceil(
    (new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(0, days);
}

/**
 * Check if user is currently in an active trial
 */
export function isInActiveTrial(
  status: SubscriptionStatus | null,
  trialEndsAt: string | null
): boolean {
  return (
    status === 'trialing' &&
    !!trialEndsAt &&
    new Date(trialEndsAt) > new Date()
  );
}

/**
 * Check if user has any form of active access (subscription or trial)
 */
export function hasActiveAccess(
  status: SubscriptionStatus | null,
  trialEndsAt: string | null
): boolean {
  if (status === 'active') return true;
  return isInActiveTrial(status, trialEndsAt);
}
