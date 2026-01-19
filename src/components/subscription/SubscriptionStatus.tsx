'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { IconCreditCard, IconExternalLink } from '@tabler/icons-react';
import { Button, Card, CardContent } from '@/components/ui';
import { PLANS } from '@/lib/stripe/config';
import type { SubscriptionInfo, SubscriptionTier } from '@/types/subscription';

interface SubscriptionStatusProps {
  subscription: SubscriptionInfo;
}

const statusColors: Record<string, string> = {
  active: 'bg-olive-100 text-olive-700',
  trialing: 'bg-aegean-100 text-aegean-700',
  past_due: 'bg-terracotta-100 text-terracotta-700',
  canceled: 'bg-sand-200 text-sand-700',
  inactive: 'bg-sand-200 text-sand-700',
  unpaid: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  active: 'Active',
  trialing: 'Trial',
  past_due: 'Past Due',
  canceled: 'Canceled',
  inactive: 'Inactive',
  unpaid: 'Unpaid',
};

export function SubscriptionStatus({ subscription }: SubscriptionStatusProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleManageSubscription() {
    setIsLoading(true);
    try {
      const response = await fetch('/api/stripe/portal', { method: 'POST' });
      const { url, error } = await response.json();

      if (error) {
        console.error('Portal error:', error);
        return;
      }

      window.location.href = url;
    } catch (error) {
      console.error('Portal error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  const plan = subscription.tier ? PLANS[subscription.tier as SubscriptionTier] : null;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-olive-100 flex items-center justify-center">
            <IconCreditCard size={20} className="text-olive-600" />
          </div>
          <div>
            <h3 className="font-semibold text-olive-900">Subscription</h3>
            <span
              className={`
                inline-block px-2 py-0.5 rounded-full text-xs font-medium
                ${statusColors[subscription.status] || statusColors.inactive}
              `}
            >
              {statusLabels[subscription.status] || 'Unknown'}
            </span>
          </div>
        </div>

        {plan && subscription.status !== 'inactive' && (
          <div className="space-y-2 mb-4">
            <p className="text-sand-700">
              <span className="font-medium">{plan.name}</span>
              {subscription.period && (
                <span className="text-sand-500"> ({subscription.period})</span>
              )}
            </p>
            {subscription.currentPeriodEnd && (
              <p className="text-sm text-sand-600">
                {subscription.cancelAtPeriodEnd ? 'Cancels on ' : 'Renews on '}
                {format(new Date(subscription.currentPeriodEnd), 'MMMM d, yyyy')}
              </p>
            )}
          </div>
        )}

        {subscription.status === 'inactive' && (
          <p className="text-sand-600 mb-4">
            No active subscription. Subscribe to access all features.
          </p>
        )}

        {subscription.status !== 'inactive' && (
          <Button
            onClick={handleManageSubscription}
            isLoading={isLoading}
            variant="outline"
            rightIcon={<IconExternalLink size={16} />}
          >
            Manage Subscription
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
