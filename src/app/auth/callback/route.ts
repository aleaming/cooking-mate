import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  // Security: Validate that 'next' is a relative URL (only if provided)
  const safeNext = next && next.startsWith('/') ? next : null;

  if (code) {
    const supabase = await createServerSupabaseClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Determine redirect URL based on subscription status
      let redirectTo = safeNext;

      // Only check subscription status if no explicit next URL was provided
      // (explicit next URLs are used for password reset, etc.)
      if (!redirectTo) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('subscription_status, trial_ends_at')
          .eq('id', data.user.id)
          .single();

        // Check if user has active access (active subscription or active trial)
        const hasAccess =
          profile?.subscription_status === 'active' ||
          (profile?.subscription_status === 'trialing' &&
            profile?.trial_ends_at &&
            new Date(profile.trial_ends_at) > new Date());

        redirectTo = hasAccess ? '/calendar' : '/pricing';
      }

      // Handle production load balancer scenario
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${redirectTo}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectTo}`);
      }
      return NextResponse.redirect(`${origin}${redirectTo}`);
    }
  }

  // Auth callback error - redirect to error page
  return NextResponse.redirect(`${origin}/auth-error`);
}
