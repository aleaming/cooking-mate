import type { Transition, Variants } from 'framer-motion';

// ============================================
// DURATION CONSTANTS
// ============================================
export const DURATION = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  slower: 0.8,
} as const;

// ============================================
// SPRING CONFIGURATIONS
// ============================================
export const SPRING = {
  gentle: { type: 'spring', stiffness: 120, damping: 14 } as Transition,
  bouncy: { type: 'spring', stiffness: 300, damping: 20 } as Transition,
  stiff: { type: 'spring', stiffness: 400, damping: 30 } as Transition,
  soft: { type: 'spring', stiffness: 100, damping: 20 } as Transition,
} as const;

// ============================================
// EASING CURVES
// ============================================
export const EASE = {
  smooth: [0.4, 0, 0.2, 1] as const,
  bounce: [0.68, -0.55, 0.265, 1.55] as const,
  organic: [0.43, 0.13, 0.23, 0.96] as const,
} as const;

// ============================================
// PAGE TRANSITIONS
// ============================================
export const pageVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.normal, ease: EASE.organic },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: DURATION.fast },
  },
};

// ============================================
// CARD INTERACTIONS
// ============================================
export const cardVariants: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: SPRING.gentle,
  },
  hover: {
    scale: 1.02,
    y: -4,
    transition: SPRING.gentle,
  },
  tap: { scale: 0.98 },
};

// ============================================
// STAGGERED LISTS
// ============================================
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: SPRING.gentle,
  },
};

// ============================================
// FADE ANIMATIONS
// ============================================
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: DURATION.normal },
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATION.fast },
  },
};

export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.normal, ease: EASE.organic },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: DURATION.fast },
  },
};

// ============================================
// DRAG AND DROP
// ============================================
export const draggableVariants: Variants = {
  idle: {
    scale: 1,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  dragging: {
    scale: 1.05,
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
    zIndex: 1000,
  },
};

export const droppableVariants: Variants = {
  idle: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  active: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.5)',
    scale: 1.02,
    transition: SPRING.bouncy,
  },
};

// ============================================
// MICRO-INTERACTIONS
// ============================================
export const checkmarkVariants: Variants = {
  unchecked: { pathLength: 0, opacity: 0 },
  checked: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: DURATION.normal, ease: 'easeOut' },
  },
};

export const strikethroughVariants: Variants = {
  unchecked: { scaleX: 0, originX: 0 },
  checked: {
    scaleX: 1,
    transition: { duration: DURATION.fast, delay: 0.1 },
  },
};

export const buttonRipple: Variants = {
  initial: { scale: 0, opacity: 0.5 },
  animate: {
    scale: 4,
    opacity: 0,
    transition: { duration: 0.6 },
  },
};

// ============================================
// MODAL ANIMATIONS
// ============================================
export const modalBackdrop: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: SPRING.bouncy,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: DURATION.fast },
  },
};

// ============================================
// CALENDAR NAVIGATION
// ============================================
export const slideLeft: Variants = {
  initial: { opacity: 0, x: 50 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION.normal, ease: EASE.organic },
  },
  exit: {
    opacity: 0,
    x: -50,
    transition: { duration: DURATION.fast },
  },
};

export const slideRight: Variants = {
  initial: { opacity: 0, x: -50 },
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: DURATION.normal, ease: EASE.organic },
  },
  exit: {
    opacity: 0,
    x: 50,
    transition: { duration: DURATION.fast },
  },
};

// ============================================
// COLLAPSE/EXPAND
// ============================================
export const collapseVariants: Variants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: { duration: DURATION.normal, ease: EASE.smooth },
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: { duration: DURATION.normal, ease: EASE.smooth },
  },
};

// ============================================
// TOOLTIP
// ============================================
export const tooltipVariants: Variants = {
  initial: { opacity: 0, scale: 0.9, y: 5 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: DURATION.fast },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    y: 5,
    transition: { duration: DURATION.instant },
  },
};

// ============================================
// DRAWER ANIMATIONS
// ============================================
export const drawerBackdrop: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: DURATION.normal },
  },
  exit: {
    opacity: 0,
    transition: { duration: DURATION.fast },
  },
};

export const drawerContent: Variants = {
  initial: { y: '100%' },
  animate: {
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  exit: {
    y: '100%',
    transition: {
      duration: DURATION.normal,
      ease: EASE.smooth,
    },
  },
};
