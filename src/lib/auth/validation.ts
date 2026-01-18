import type { PasswordRequirements, PasswordValidation } from '@/types/auth';

export const PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecial: false,
};

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`At least ${PASSWORD_REQUIREMENTS.minLength} characters`);
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('At least one uppercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('At least one lowercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireNumber && !/\d/.test(password)) {
    errors.push('At least one number');
  }

  if (
    PASSWORD_REQUIREMENTS.requireSpecial &&
    !/[!@#$%^&*(),.?":{}|<>]/.test(password)
  ) {
    errors.push('At least one special character');
  }

  // Calculate password strength
  let strength: PasswordValidation['strength'] = 'weak';
  const passedChecks = 4 - errors.length; // Max 4 checks (not counting special)

  if (password.length >= 12 && passedChecks >= 4) {
    strength = 'strong';
  } else if (password.length >= 8 && passedChecks >= 3) {
    strength = 'medium';
  }

  return {
    isValid: errors.length === 0,
    errors,
    strength,
  };
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function getPasswordRequirementsList(): string[] {
  const requirements: string[] = [];

  requirements.push(`At least ${PASSWORD_REQUIREMENTS.minLength} characters`);

  if (PASSWORD_REQUIREMENTS.requireUppercase) {
    requirements.push('At least one uppercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase) {
    requirements.push('At least one lowercase letter');
  }

  if (PASSWORD_REQUIREMENTS.requireNumber) {
    requirements.push('At least one number');
  }

  if (PASSWORD_REQUIREMENTS.requireSpecial) {
    requirements.push('At least one special character');
  }

  return requirements;
}
