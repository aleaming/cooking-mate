import type { User, Session } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  // Context exposes the same state as AuthState
}

export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'medium' | 'strong';
}

export interface PasswordRequirements {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumber: boolean;
  requireSpecial: boolean;
}

export type AuthErrorCode =
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'email_taken'
  | 'weak_password'
  | 'passwords_mismatch'
  | 'invalid_email'
  | 'signup_failed'
  | 'reset_failed'
  | 'send_failed'
  | 'unknown_error';

export interface AuthError {
  code: AuthErrorCode;
  message: string;
}

// Map error codes to user-friendly messages
export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  invalid_credentials: 'Invalid email or password',
  email_not_confirmed:
    'Please confirm your email address. Check your inbox for a confirmation link.',
  email_taken: 'An account with this email already exists',
  weak_password: 'Password does not meet requirements',
  passwords_mismatch: 'Passwords do not match',
  invalid_email: 'Please enter a valid email address',
  signup_failed: 'Unable to create account. Please try again.',
  reset_failed: 'Unable to reset password. Please try again.',
  send_failed: 'Unable to send email. Please try again.',
  unknown_error: 'Something went wrong. Please try again.',
};
