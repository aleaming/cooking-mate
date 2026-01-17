'use client';

import { forwardRef } from 'react';
import { motion } from 'framer-motion';

interface SkeletonProps {
  variant?: 'rectangular' | 'circular' | 'text';
  width?: string | number;
  height?: string | number;
  className?: string;
}

const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ variant = 'rectangular', width, height, className = '' }, ref) => {
    const variantStyles = {
      rectangular: 'rounded-lg',
      circular: 'rounded-full',
      text: 'rounded',
    };

    const defaultHeights = {
      rectangular: 'h-4',
      circular: 'h-10 w-10',
      text: 'h-4',
    };

    return (
      <motion.div
        ref={ref}
        animate={{
          backgroundPosition: ['200% 0', '-200% 0'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
        className={`
          bg-gradient-to-r from-sand-200 via-sand-100 to-sand-200
          bg-[length:200%_100%]
          ${variantStyles[variant]}
          ${!height && !width ? defaultHeights[variant] : ''}
          ${className}
        `}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
        }}
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';

// Skeleton Card for recipe loading states
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl shadow-lg shadow-sand-200/50 overflow-hidden">
    <Skeleton variant="rectangular" className="w-full aspect-video" />
    <div className="p-4 space-y-3">
      <Skeleton variant="text" className="w-3/4 h-6" />
      <Skeleton variant="text" className="w-full h-4" />
      <Skeleton variant="text" className="w-2/3 h-4" />
      <div className="flex gap-2 pt-2">
        <Skeleton variant="rectangular" className="w-16 h-6 rounded-full" />
        <Skeleton variant="rectangular" className="w-20 h-6 rounded-full" />
      </div>
    </div>
  </div>
);

export { Skeleton, SkeletonCard };
export type { SkeletonProps };
