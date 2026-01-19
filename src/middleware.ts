import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/auth-error',
  '/auth/callback',
  '/pricing', // Pricing page is public
];

// Auth routes where logged-in users should be redirected away
const AUTH_ROUTES = ['/login', '/signup'];

// Routes that require auth but NOT subscription (for checkout flow)
const FREE_ROUTES = [
  '/pricing',
  '/api/stripe/checkout',
  '/api/stripe/portal',
];

// Webhook routes that bypass auth entirely (use signature verification)
const WEBHOOK_ROUTES = ['/api/stripe/webhook'];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTES.includes(pathname);
}

function isFreeRoute(pathname: string): boolean {
  return FREE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isWebhookRoute(pathname: string): boolean {
  return WEBHOOK_ROUTES.includes(pathname);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip webhook routes entirely (they use signature verification)
  if (isWebhookRoute(pathname)) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Always refresh session to keep cookies fresh
  // This is critical for security - stale sessions can cause issues
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Allow public routes
  if (isPublicRoute(pathname)) {
    // If logged in and trying to access auth pages, redirect to calendar
    if (user && isAuthRoute(pathname)) {
      return NextResponse.redirect(new URL('/calendar', request.url));
    }
    return supabaseResponse;
  }

  // Protected routes: redirect to login if not authenticated
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Allow free routes for authenticated users (checkout flow, etc.)
  if (isFreeRoute(pathname)) {
    return supabaseResponse;
  }

  // Check subscription status for all other protected routes
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, trial_ends_at')
    .eq('id', user.id)
    .single();

  // Check if user has active access (active subscription or active trial)
  const hasActiveSubscription =
    profile?.subscription_status === 'active' ||
    (profile?.subscription_status === 'trialing' &&
      profile?.trial_ends_at &&
      new Date(profile.trial_ends_at) > new Date());

  if (!hasActiveSubscription) {
    // Redirect to pricing page if no active subscription
    const pricingUrl = new URL('/pricing', request.url);
    // Add message for expired trial
    if (profile?.subscription_status === 'trialing') {
      pricingUrl.searchParams.set('trial', 'expired');
    }
    return NextResponse.redirect(pricingUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Public assets (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)',
  ],
};
