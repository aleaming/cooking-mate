import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

// Lazy initialization of Supabase admin client to avoid build-time errors
let _supabaseAdminInstance: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdminInstance) {
    _supabaseAdminInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  }
  return _supabaseAdminInstance;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id;

  if (!userId) {
    console.error('No supabase_user_id in checkout session metadata');
    return;
  }

  // Ensure customer ID is saved to profile
  if (session.customer) {
    await getSupabaseAdmin()
      .from('profiles')
      .update({ stripe_customer_id: session.customer as string })
      .eq('id', userId);
  }

  // Subscription details will be set via customer.subscription.created event
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  // Try to get user ID from subscription metadata
  let userId = subscription.metadata?.supabase_user_id;

  // If not in metadata, find by customer ID
  if (!userId) {
    const { data: profile } = await getSupabaseAdmin()
      .from('profiles')
      .select('id')
      .eq('stripe_customer_id', subscription.customer as string)
      .single();

    if (!profile) {
      console.error('No profile found for customer:', subscription.customer);
      return;
    }

    userId = profile.id;
  }

  const tier = subscription.metadata?.tier || 'basic';
  const period = subscription.metadata?.period || 'monthly';

  // Access subscription properties safely with type assertion for API changes
  const subscriptionAny = subscription as unknown as Record<string, unknown>;
  const currentPeriodEnd = subscriptionAny.current_period_end as number | undefined;
  const cancelAtPeriodEnd = subscriptionAny.cancel_at_period_end as boolean | undefined;

  const { error } = await getSupabaseAdmin()
    .from('profiles')
    .update({
      subscription_status: subscription.status,
      subscription_tier: tier,
      subscription_period: period,
      subscription_id: subscription.id,
      subscription_current_period_end: currentPeriodEnd
        ? new Date(currentPeriodEnd * 1000).toISOString()
        : null,
      subscription_cancel_at_period_end: cancelAtPeriodEnd ?? false,
    })
    .eq('id', userId);

  if (error) {
    console.error('Failed to update subscription:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { error } = await getSupabaseAdmin()
    .from('profiles')
    .update({
      subscription_status: 'canceled',
      subscription_tier: null,
      subscription_period: null,
      subscription_id: null,
      subscription_current_period_end: null,
      subscription_cancel_at_period_end: false,
    })
    .eq('stripe_customer_id', subscription.customer as string);

  if (error) {
    console.error('Failed to clear subscription on delete:', error);
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  // Access invoice properties safely with type assertion for API changes
  const invoiceAny = invoice as unknown as Record<string, unknown>;
  const subscriptionId = invoiceAny.subscription as string | undefined;

  if (subscriptionId) {
    const { error } = await getSupabaseAdmin()
      .from('profiles')
      .update({ subscription_status: 'past_due' })
      .eq('stripe_customer_id', invoice.customer as string);

    if (error) {
      console.error('Failed to update subscription status to past_due:', error);
    }
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Access invoice properties safely with type assertion for API changes
  const invoiceAny = invoice as unknown as Record<string, unknown>;
  const subscriptionId = invoiceAny.subscription as string | undefined;

  // On successful payment, ensure status is active
  if (subscriptionId) {
    const { error } = await getSupabaseAdmin()
      .from('profiles')
      .update({ subscription_status: 'active' })
      .eq('stripe_customer_id', invoice.customer as string);

    if (error) {
      console.error(
        'Failed to update subscription status to active:',
        error
      );
    }
  }
}
