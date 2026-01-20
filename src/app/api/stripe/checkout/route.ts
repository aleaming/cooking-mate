import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import {
  getPriceId,
  validateStripeConfig,
  type PlanTier,
  type PlanPeriod,
} from '@/lib/stripe/config';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { tier, period } = (await request.json()) as {
      tier: PlanTier;
      period: PlanPeriod;
    };

    // Validate input
    if (!tier || !period) {
      return NextResponse.json(
        { error: 'Missing tier or period' },
        { status: 400 }
      );
    }

    if (!['basic', 'pro'].includes(tier)) {
      return NextResponse.json({ error: 'Invalid tier' }, { status: 400 });
    }

    if (!['monthly', 'yearly'].includes(period)) {
      return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
    }

    // Get or create Stripe customer
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email')
      .eq('id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      // Create a new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      // Save customer ID to profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Validate Stripe configuration
    const configValidation = validateStripeConfig();
    if (!configValidation.valid) {
      console.error('Missing Stripe price IDs:', configValidation.missing);
      return NextResponse.json(
        {
          error: `Stripe configuration incomplete. Missing: ${configValidation.missing.join(', ')}`,
        },
        { status: 500 }
      );
    }

    // Get the price ID
    const priceId = getPriceId(tier, period);

    // Check for empty string as well as null/undefined
    if (!priceId || priceId.trim() === '') {
      console.error(`Missing Stripe price ID for ${tier} ${period}`);
      return NextResponse.json(
        {
          error: `Price not configured for ${tier} ${period}. Please check environment variables.`,
        },
        { status: 500 }
      );
    }

    // Determine site URL
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/calendar?subscription=success`,
      cancel_url: `${siteUrl}/pricing?subscription=canceled`,
      metadata: {
        supabase_user_id: user.id,
        tier,
        period,
      },
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          tier,
          period,
        },
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error details:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
