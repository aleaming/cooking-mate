# Framework-Specific Component Patterns

Use these templates when generating the `{{COMPONENT_TEMPLATE}}` section based on detected tech stack. All patterns show how to properly reference brand tokens.

## React + TypeScript + Tailwind + CVA (shadcn/ui pattern)

Most common modern React pattern. Components reference CSS variables for brand tokens.

```tsx
import { cn } from '@/lib/utils'
import { type VariantProps, cva } from 'class-variance-authority'

const componentVariants = cva(
  // Base classes - use token references
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors',
  {
    variants: {
      variant: {
        // Reference CSS variables from brand tokens
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        sm: 'h-9 px-3',
        md: 'h-10 px-4 py-2',
        lg: 'h-11 px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface ComponentNameProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof componentVariants> {}

export function ComponentName({
  className,
  variant,
  size,
  ...props
}: ComponentNameProps) {
  return (
    <button
      className={cn(componentVariants({ variant, size }), className)}
      {...props}
    />
  )
}
```

**Token integration**: Uses Tailwind classes that map to CSS variables (e.g., `bg-primary` → `--primary`)

---

## React + TypeScript + Tailwind (No CVA)

Simpler pattern without class-variance-authority:

```tsx
import { cn } from '@/lib/utils'

export interface ComponentNameProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

// Maps to brand tokens via Tailwind config
const variantStyles = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
}

const sizeStyles = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 py-2',
  lg: 'h-11 px-8 text-lg',
}

export function ComponentName({
  className,
  variant = 'default',
  size = 'md',
  ...props
}: ComponentNameProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    />
  )
}
```

---

## React + TypeScript + CSS Variables (Direct)

When using CSS variables directly without Tailwind:

```tsx
import styles from './ComponentName.module.css'
import { clsx } from 'clsx'

export interface ComponentNameProps {
  variant?: 'default' | 'secondary' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  children?: React.ReactNode
}

export function ComponentName({
  variant = 'default',
  size = 'md',
  className,
  children,
  ...props
}: ComponentNameProps) {
  return (
    <button
      className={clsx(styles.root, styles[variant], styles[size], className)}
      {...props}
    >
      {children}
    </button>
  )
}
```

**CSS Module** (`ComponentName.module.css`):
```css
.root {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-weight: 500;
  transition: background-color 0.2s;
}

/* Variants reference brand tokens */
.default {
  background-color: var(--primary);
  color: var(--primary-foreground);
}
.default:hover {
  background-color: var(--primary-hover);
}

.secondary {
  background-color: var(--secondary);
  color: var(--secondary-foreground);
}

.destructive {
  background-color: var(--destructive);
  color: var(--destructive-foreground);
}

/* Sizes use spacing tokens */
.sm {
  height: var(--spacing-9);
  padding: 0 var(--spacing-3);
  font-size: var(--text-sm);
}
.md {
  height: var(--spacing-10);
  padding: var(--spacing-2) var(--spacing-4);
}
.lg {
  height: var(--spacing-11);
  padding: 0 var(--spacing-8);
  font-size: var(--text-lg);
}
```

---

## React + styled-components

```tsx
import styled from 'styled-components'

interface ComponentNameProps {
  variant?: 'default' | 'secondary' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

const StyledButton = styled.button<ComponentNameProps>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-weight: 500;
  transition: background-color 0.2s;
  
  /* Variant styles using CSS variables */
  ${({ variant = 'default' }) => {
    switch (variant) {
      case 'secondary':
        return `
          background-color: var(--secondary);
          color: var(--secondary-foreground);
          &:hover { background-color: var(--secondary-hover); }
        `
      case 'destructive':
        return `
          background-color: var(--destructive);
          color: var(--destructive-foreground);
          &:hover { background-color: var(--destructive-hover); }
        `
      default:
        return `
          background-color: var(--primary);
          color: var(--primary-foreground);
          &:hover { background-color: var(--primary-hover); }
        `
    }
  }}
  
  /* Size styles using spacing tokens */
  ${({ size = 'md' }) => {
    switch (size) {
      case 'sm':
        return `height: var(--spacing-9); padding: 0 var(--spacing-3); font-size: var(--text-sm);`
      case 'lg':
        return `height: var(--spacing-11); padding: 0 var(--spacing-8); font-size: var(--text-lg);`
      default:
        return `height: var(--spacing-10); padding: var(--spacing-2) var(--spacing-4);`
    }
  }}
`

export function ComponentName({ children, ...props }: ComponentNameProps & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <StyledButton {...props}>{children}</StyledButton>
}
```

---

## Vue 3 + TypeScript + Tailwind

```vue
<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'default' | 'secondary' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
})

// Maps to brand tokens via Tailwind
const variantClasses = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
}

const sizeClasses = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 py-2',
  lg: 'h-11 px-8 text-lg',
}

const classes = computed(() => [
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  variantClasses[props.variant],
  sizeClasses[props.size],
])
</script>

<template>
  <button :class="classes">
    <slot />
  </button>
</template>
```

---

## Vue 3 + CSS Variables

```vue
<script setup lang="ts">
interface Props {
  variant?: 'default' | 'secondary' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'md',
})
</script>

<template>
  <button :class="[$style.root, $style[variant], $style[size]]">
    <slot />
  </button>
</template>

<style module>
.root {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  font-weight: 500;
}

.default {
  background-color: var(--primary);
  color: var(--primary-foreground);
}

.secondary {
  background-color: var(--secondary);
  color: var(--secondary-foreground);
}

.destructive {
  background-color: var(--destructive);
  color: var(--destructive-foreground);
}

.sm { height: var(--spacing-9); padding: 0 var(--spacing-3); }
.md { height: var(--spacing-10); padding: var(--spacing-2) var(--spacing-4); }
.lg { height: var(--spacing-11); padding: 0 var(--spacing-8); }
</style>
```

---

## Svelte + CSS Variables

```svelte
<script lang="ts">
  export let variant: 'default' | 'secondary' | 'destructive' = 'default'
  export let size: 'sm' | 'md' | 'lg' = 'md'
</script>

<button class="btn {variant} {size}" on:click>
  <slot />
</button>

<style>
  .btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--radius-md);
    font-weight: 500;
    transition: background-color 0.2s;
  }

  .default {
    background-color: var(--primary);
    color: var(--primary-foreground);
  }
  .default:hover {
    background-color: var(--primary-hover);
  }

  .secondary {
    background-color: var(--secondary);
    color: var(--secondary-foreground);
  }

  .destructive {
    background-color: var(--destructive);
    color: var(--destructive-foreground);
  }

  .sm { height: var(--spacing-9); padding: 0 var(--spacing-3); font-size: var(--text-sm); }
  .md { height: var(--spacing-10); padding: var(--spacing-2) var(--spacing-4); }
  .lg { height: var(--spacing-11); padding: 0 var(--spacing-8); font-size: var(--text-lg); }
</style>
```

---

## Detection Matrix

| Indicator | Template to Use |
|-----------|-----------------|
| `class-variance-authority` in deps | React + Tailwind + CVA |
| `tailwindcss` + no CVA | React/Vue + Tailwind (simple) |
| `.module.css` files present | CSS Modules pattern |
| `styled-components` or `@emotion` | styled-components pattern |
| `shadcn` or `@radix-ui` | React + Tailwind + CVA |
| `.vue` files + `tailwindcss` | Vue 3 + Tailwind |
| `.vue` files + `<style module>` | Vue 3 + CSS Variables |
| `.svelte` files | Svelte pattern |
