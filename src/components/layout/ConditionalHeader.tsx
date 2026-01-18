'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';

// Routes where the main header should be hidden
const AUTH_ROUTES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/auth-error',
];

export function ConditionalHeader() {
  const pathname = usePathname();

  // Hide header on auth routes
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isAuthRoute) {
    return null;
  }

  return <Header />;
}
