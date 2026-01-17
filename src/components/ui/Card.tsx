'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cardVariants, SPRING } from '@/lib/constants/animations';

interface CardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  hoverable?: boolean;
  clickable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingStyles = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      hoverable = false,
      clickable = false,
      padding = 'md',
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <motion.div
        ref={ref}
        variants={cardVariants}
        initial="initial"
        animate="animate"
        whileHover={hoverable || clickable ? 'hover' : undefined}
        whileTap={clickable ? 'tap' : undefined}
        transition={SPRING.gentle}
        className={`
          bg-white rounded-2xl
          shadow-lg shadow-sand-200/50
          ${clickable ? 'cursor-pointer' : ''}
          ${paddingStyles[padding]}
          ${className}
        `}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';

// Card Header Component
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`mb-4 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

// Card Title Component
interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ children, as: Component = 'h3', className = '', ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={`font-display text-xl font-semibold text-olive-900 ${className}`}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

CardTitle.displayName = 'CardTitle';

// Card Content Component
interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`text-sand-700 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

// Card Footer Component
interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`mt-4 pt-4 border-t border-sand-200 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

// Card Image Component
interface CardImageProps extends HTMLAttributes<HTMLDivElement> {
  src: string;
  alt: string;
  aspectRatio?: 'square' | 'video' | 'wide';
}

const aspectRatioStyles = {
  square: 'aspect-square',
  video: 'aspect-video',
  wide: 'aspect-[2/1]',
};

const CardImage = forwardRef<HTMLDivElement, CardImageProps>(
  ({ src, alt, aspectRatio = 'video', className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          -mx-4 -mt-4 mb-4 overflow-hidden rounded-t-2xl
          ${aspectRatioStyles[aspectRatio]}
          ${className}
        `}
        {...props}
      >
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }
);

CardImage.displayName = 'CardImage';

export { Card, CardHeader, CardTitle, CardContent, CardFooter, CardImage };
export type { CardProps };
