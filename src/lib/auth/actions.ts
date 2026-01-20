'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { validatePassword, validateEmail } from './validation';
import type { AuthErrorCode } from '@/types/auth';

function redirectWithError(path: string, error: AuthErrorCode): never {
  redirect(`${path}?error=${error}`);
}

export async function login(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const returnUrl = formData.get('returnUrl') as string | null;

  // Basic validation
  if (!email || !password) {
    redirectWithError('/login', 'invalid_credentials');
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Check for unconfirmed email error from Supabase
    if (error.message.toLowerCase().includes('email not confirmed')) {
      redirectWithError('/login', 'email_not_confirmed');
    }
    // Always show generic error for security for other errors
    redirectWithError('/login', 'invalid_credentials');
  }

  revalidatePath('/', 'layout');

  // Redirect to return URL or default to calendar
  const destination = returnUrl && returnUrl.startsWith('/') ? returnUrl : '/calendar';
  redirect(destination);
}

export async function signup(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;
  const returnTo = formData.get('returnTo') as string | null;

  // Validate email
  if (!email || !validateEmail(email)) {
    redirectWithError('/signup', 'invalid_email');
  }

  // Validate passwords match
  if (password !== confirmPassword) {
    redirectWithError('/signup', 'passwords_mismatch');
  }

  // Validate password strength
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    redirectWithError('/signup', 'weak_password');
  }

  const supabase = await createServerSupabaseClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Build email redirect URL with returnTo as `next` param for auth callback
  const safeReturnTo = returnTo && returnTo.startsWith('/') ? returnTo : null;
  const emailRedirectUrl = safeReturnTo
    ? `${siteUrl}/auth/callback?next=${encodeURIComponent(safeReturnTo)}`
    : `${siteUrl}/auth/callback`;

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Enable email confirmation - redirect to auth callback after confirming
      emailRedirectTo: emailRedirectUrl,
    },
  });

  if (error) {
    // Check for specific errors we can safely reveal
    if (error.message.includes('already registered')) {
      redirectWithError('/signup', 'email_taken');
    }
    redirectWithError('/signup', 'signup_failed');
  }

  // Redirect to confirmation pending page with returnTo preserved
  const confirmEmailUrl = safeReturnTo
    ? `/confirm-email?returnTo=${encodeURIComponent(safeReturnTo)}`
    : '/confirm-email';
  redirect(confirmEmailUrl);
}

export async function forgotPassword(formData: FormData) {
  const email = formData.get('email') as string;

  // Validate email format
  if (!email || !validateEmail(email)) {
    redirectWithError('/forgot-password', 'invalid_email');
  }

  const supabase = await createServerSupabaseClient();

  // Get the site URL for the redirect
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });

  // Always show success message (security - don't reveal if email exists)
  redirect('/forgot-password?sent=true');
}

export async function resetPassword(formData: FormData) {
  const password = formData.get('password') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  // Validate passwords match
  if (password !== confirmPassword) {
    redirectWithError('/reset-password', 'passwords_mismatch');
  }

  // Validate password strength
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.isValid) {
    redirectWithError('/reset-password', 'weak_password');
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.updateUser({
    password,
  });

  if (error) {
    redirectWithError('/reset-password', 'reset_failed');
  }

  // Sign out after password reset so user can log in with new password
  await supabase.auth.signOut();

  redirect('/login?reset=success');
}

export async function logout() {
  const supabase = await createServerSupabaseClient();

  await supabase.auth.signOut();

  revalidatePath('/', 'layout');
  redirect('/');
}

export async function resendConfirmation(formData: FormData) {
  const email = formData.get('email') as string;
  const returnTo = formData.get('returnTo') as string | null;

  if (!email) {
    redirectWithError('/confirm-email', 'invalid_email');
  }

  const supabase = await createServerSupabaseClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Build email redirect URL with returnTo as `next` param for auth callback
  const safeReturnTo = returnTo && returnTo.startsWith('/') ? returnTo : null;
  const emailRedirectUrl = safeReturnTo
    ? `${siteUrl}/auth/callback?next=${encodeURIComponent(safeReturnTo)}`
    : `${siteUrl}/auth/callback`;

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: emailRedirectUrl,
    },
  });

  if (error) {
    // Preserve returnTo in error redirect
    const errorUrl = safeReturnTo
      ? `/confirm-email?error=send_failed&returnTo=${encodeURIComponent(safeReturnTo)}`
      : '/confirm-email?error=send_failed';
    redirect(errorUrl);
  }

  // Preserve returnTo in success redirect
  const successUrl = safeReturnTo
    ? `/confirm-email?sent=true&returnTo=${encodeURIComponent(safeReturnTo)}`
    : '/confirm-email?sent=true';
  redirect(successUrl);
}
