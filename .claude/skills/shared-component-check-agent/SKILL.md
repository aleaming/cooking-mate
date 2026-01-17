---
name: shared-component-check-agent
description: Enforce shared component usage and design system consistency for MedDiet. Triggers when adding/updating components, creating UI elements, reviewing code, planning features, or auditing pages. Checks src/components/ui/ for existing components before creating new ones. Works with brand-guidelines skill for complete design system enforcement.
---

# Shared Component Check Agent

Enforce design system consistency by checking for existing shared components before creating new ones.

## Trigger Conditions

Activate this skill when:
- Adding a new component to a page
- Updating UI elements on existing pages
- Creating interactive elements (buttons, forms, cards, modals)
- Reviewing code or PRs for component consistency
- Planning new features that need UI components
- User requests "component audit" or "consistency check"

## Project Configuration

**Shared Components**: `src/components/ui/`
**Feature Components**: `src/components/{feature}/`
**Framework**: React 19 + TypeScript
**Styling**: Tailwind CSS v4 (via `@theme inline`)
**Animation**: Framer Motion 12

## Before Adding Any Component

1. **Search shared components first**:
   ```bash
   ls src/components/ui/
   grep -r "export.*ComponentName" src/components/ui/
   ```

2. **Check inventory**: See [references/component-inventory.md](references/component-inventory.md)

3. **Decision tree**:
   - ✅ **Exact match** → Use the shared component
   - ✅ **Similar exists** → Check if variants/props cover your use case
   - ⚠️ **Partial match** → Extend existing component if appropriate
   - 🆕 **No match** → Create new shared component (confirm with user first)

## Using Shared Components

```tsx
import { Button, Card, Badge, Input, Modal, Drawer, Skeleton } from '@/components/ui';
```

Rules:
- Use existing variant props before custom styles
- Respect the component's API
- Components use brand tokens from [brand-guidelines](../brand-guidelines/SKILL.md)
- Only override when explicitly requested by user
- Document overrides with comments

## Available Components

| Component | Variants | Sizes | Import |
|-----------|----------|-------|--------|
| **Button** | primary, secondary, outline, ghost | sm, md, lg | `{ Button }` |
| **Badge** | olive, terracotta, aegean, sand, success, warning, error | sm, md | `{ Badge }` |
| **Card** | hoverable, clickable, padding levels | - | `{ Card, CardHeader, CardTitle, CardContent, CardFooter, CardImage }` |
| **Input** | with label, error, helperText, icons | - | `{ Input }` |
| **Modal** | with title | sm, md, lg | `{ Modal }` |
| **Drawer** | with title | 50%, 75%, 90%, full | `{ Drawer }` |
| **Skeleton** | rectangular, circular, text | custom | `{ Skeleton, SkeletonCard }` |

## Creating New Shared Components

When no suitable component exists and user confirms:

1. Create in `src/components/ui/`
2. **Use brand tokens** - Reference colors, typography, spacing from brand guidelines
3. Follow project patterns:

```tsx
'use client';

import { forwardRef } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { SPRING } from '@/lib/constants/animations';

type ComponentVariant = 'default' | 'secondary';
type ComponentSize = 'sm' | 'md' | 'lg';

interface ComponentProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  variant?: ComponentVariant;
  size?: ComponentSize;
  children: React.ReactNode;
}

const variantStyles: Record<ComponentVariant, string> = {
  default: 'bg-olive-500 text-white',
  secondary: 'bg-terracotta-500 text-white',
};

const sizeStyles: Record<ComponentSize, string> = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-2.5 text-base',
  lg: 'px-6 py-3 text-lg',
};

const Component = forwardRef<HTMLDivElement, ComponentProps>(
  ({ variant = 'default', size = 'md', children, className = '', ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        transition={SPRING.gentle}
        className={`
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Component.displayName = 'Component';

export { Component };
export type { ComponentProps, ComponentVariant, ComponentSize };
```

4. Add to `src/components/ui/index.ts` barrel export
5. Update [references/component-inventory.md](references/component-inventory.md)
6. Add token mapping to brand guidelines

## Code Review Mode

When reviewing code for component consistency:

1. Identify imports - are shared components being used?
2. Find inline styles or custom elements that match shared components
3. Check for hardcoded values that should use brand tokens
4. Flag opportunities to use existing shared components

Report format:
```
## Component Review: [File/PR]

### Using Shared Components ✅
- Button (correct usage)
- Card (correct usage)

### Brand Token Issues ⚠️
- Line X: Hardcoded `#8a9962` → Should use `olive-500`
- Line Y: `text-blue-500` → Should use `text-aegean-500`

### Component Opportunities ⚠️
- Line X: Custom button → Could use Button variant="secondary"
- Line Y: Inline card styles → Could use Card component

### New Components Suggested 🆕
- [Name]: Appears in X places, candidate for extraction
```

## Feature Planning Mode

When planning new features:

1. List UI elements needed
2. Cross-reference with component inventory
3. Identify which shared components to use
4. Check brand guidelines for token usage
5. Flag any gaps requiring new shared components

## Animation Constants

Use constants from `@/lib/constants/animations`:

```tsx
import {
  SPRING,           // { gentle, bouncy, stiff, soft }
  pageVariants,     // Page transitions
  cardVariants,     // Card hover/tap
  staggerContainer, // List container
  staggerItem,      // List items
  fadeIn, fadeInUp, // Fade animations
  drawerContent,    // Drawer slide
  modalContent,     // Modal scale
} from '@/lib/constants/animations';
```

## Related Skills

- **[brand-guidelines](../brand-guidelines/SKILL.md)** - Color, typography, spacing tokens that components use

## Override Syntax

When user explicitly wants to deviate:
- "Override: use custom styling for this"
- "Skip shared component check"
- "Create page-specific version"

Always document the reason in a comment.
