'use client';

import Image from 'next/image';

export interface LogoProps {
  /** Size of the logo in pixels */
  size?: number;
  /** Additional CSS classes */
  className?: string;
  /** Whether to include hover animation */
  animate?: boolean;
}

/**
 * Cooking Mate logo component
 *
 * Uses the custom artichoke SVG logo with optional hover animation.
 *
 * @example
 * <Logo size={32} />
 * <Logo size={28} animate className="text-olive-600" />
 */
export function Logo({ size = 28, className = '', animate = false }: LogoProps) {
  return (
    <Image
      src="/cooking-mate-logo.svg"
      alt="Cooking Mate"
      width={size}
      height={size}
      className={`${animate ? 'transition-transform group-hover:rotate-12' : ''} ${className}`.trim()}
      priority
    />
  );
}
