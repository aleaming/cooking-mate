# Shared Component Inventory

Last updated: 2026-01-17

## Quick Reference

| Component | Path | Brand Tokens Used |
|-----------|------|-------------------|
| Button | `ui/Button.tsx` | olive-500/600/700, terracotta-500/600, rounded-lg/xl/2xl |
| Badge | `ui/Badge.tsx` | All color palettes 100/200/700, rounded-full |
| Card | `ui/Card.tsx` | sand-200 (shadow), rounded-2xl |
| Input | `ui/Input.tsx` | olive-500, sand-300/400, rounded-xl |
| Modal | `ui/Modal.tsx` | sand-200 (border), rounded-2xl |
| Drawer | `ui/Drawer.tsx` | sand-200/300, rounded-t-3xl |
| Skeleton | `ui/Skeleton.tsx` | sand-100/200, rounded-lg/full |

## Component Details

---

### Button

**Path**: `src/components/ui/Button.tsx`

**Import**:
```tsx
import { Button } from '@/components/ui';
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `'primary' \| 'secondary' \| 'outline' \| 'ghost'` | `'primary'` | Visual style |
| size | `'sm' \| 'md' \| 'lg'` | `'md'` | Size variant |
| isLoading | `boolean` | `false` | Shows loading spinner |
| disabled | `boolean` | `false` | Disabled state |
| leftIcon | `ReactNode` | - | Icon before text |
| rightIcon | `ReactNode` | - | Icon after text |

**Brand Tokens Used**:
- `olive-500/600/700` - Primary variant
- `terracotta-500/600/700` - Secondary variant
- `olive-500` (border) - Outline variant
- `olive-100/200` - Ghost hover/active
- `rounded-lg` (sm), `rounded-xl` (md), `rounded-2xl` (lg)

**Variants**:
- `primary` - Filled olive background, white text
- `secondary` - Filled terracotta background, white text
- `outline` - Olive border, transparent background
- `ghost` - No border, transparent background

**Min Touch Targets**: 44px height on all sizes

**Usage**:
```tsx
<Button variant="primary" size="md">Primary Action</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline" leftIcon={<Icon />}>With Icon</Button>
<Button variant="ghost" size="sm">Ghost</Button>
<Button isLoading>Submitting...</Button>
```

**When to Use**:
- Primary actions (submit, save, confirm)
- Secondary actions (cancel, back)
- Navigation triggers

**When NOT to Use**:
- Text links (use `<Link>` instead)
- Icon-only buttons (add aria-label)

---

### Badge

**Path**: `src/components/ui/Badge.tsx`

**Import**:
```tsx
import { Badge } from '@/components/ui';
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `'olive' \| 'terracotta' \| 'aegean' \| 'sand' \| 'success' \| 'warning' \| 'error'` | `'olive'` | Color variant |
| size | `'sm' \| 'md'` | `'sm'` | Size variant |
| removable | `boolean` | `false` | Shows remove button |
| onRemove | `() => void` | - | Remove callback |
| onClick | `() => void` | - | Click callback |

**Brand Tokens Used**:
- Each variant: `{color}-100` (bg), `{color}-700` (text), `{color}-200` (border)
- `rounded-full`

**Variants**:
- `olive` - Primary status, default
- `terracotta` - Breakfast, warm accents
- `aegean` - Lunch, info
- `sand` - Neutral, muted
- `success` - Positive states (green)
- `warning` - Caution states (amber)
- `error` - Negative states (red)

**Usage**:
```tsx
<Badge variant="olive">Default</Badge>
<Badge variant="terracotta" size="md">Breakfast</Badge>
<Badge variant="success" removable onRemove={() => {}}>Removable</Badge>
```

**When to Use**:
- Meal type indicators
- Dietary tags (vegetarian, vegan, etc.)
- Status indicators
- Filter chips

---

### Card

**Path**: `src/components/ui/Card.tsx`

**Import**:
```tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardImage } from '@/components/ui';
```

**Props (Card)**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| hoverable | `boolean` | `false` | Adds hover animation |
| clickable | `boolean` | `false` | Adds tap animation, cursor |
| padding | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Internal padding |

**Brand Tokens Used**:
- `bg-white`
- `rounded-2xl`
- `shadow-lg shadow-sand-200/50`
- `olive-900` - Title text
- `sand-700` - Content text
- `sand-200` - Footer border

**Compound Components**:
- `CardHeader` - Top section container
- `CardTitle` - Heading (uses `font-display`)
- `CardContent` - Body content
- `CardFooter` - Bottom with top border
- `CardImage` - Full-width image with aspect ratios

**Usage**:
```tsx
<Card hoverable>
  <CardImage src="/image.jpg" alt="Recipe" aspectRatio="video" />
  <CardHeader>
    <CardTitle>Greek Salad</CardTitle>
  </CardHeader>
  <CardContent>Fresh and healthy Mediterranean classic.</CardContent>
  <CardFooter>
    <Badge>vegetarian</Badge>
  </CardFooter>
</Card>
```

**When to Use**:
- Recipe cards
- Information containers
- Grouped content

---

### Input

**Path**: `src/components/ui/Input.tsx`

**Import**:
```tsx
import { Input } from '@/components/ui';
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | - | Label text |
| error | `string` | - | Error message |
| helperText | `string` | - | Helper text |
| leftIcon | `ReactNode` | - | Icon on left |
| rightIcon | `ReactNode` | - | Icon on right |

**Brand Tokens Used**:
- `olive-500` - Focus border
- `sand-300` - Default border
- `sand-400` - Icon color
- `error` - Error state
- `rounded-xl`
- Min height: 44px

**Usage**:
```tsx
<Input
  label="Email"
  placeholder="Enter your email"
  leftIcon={<EmailIcon />}
/>
<Input error="This field is required" />
<Input helperText="We'll never share your email" />
```

**When to Use**:
- Form text inputs
- Search fields
- Any text input

---

### Modal

**Path**: `src/components/ui/Modal.tsx`

**Import**:
```tsx
import { Modal } from '@/components/ui';
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| isOpen | `boolean` | - | Visibility state |
| onClose | `() => void` | - | Close callback |
| title | `string` | - | Header title |
| size | `'sm' \| 'md' \| 'lg'` | `'md'` | Max width |

**Brand Tokens Used**:
- `bg-white`
- `sand-200` - Header border
- `olive-900` - Title (font-display)
- `sand-100/200` - Close button hover
- `rounded-2xl`

**Features**:
- Escape key closes
- Click outside closes
- Body scroll lock
- Focus trap
- Portal rendered

**Usage**:
```tsx
<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Confirm">
  <p>Are you sure?</p>
  <Button onClick={() => setIsOpen(false)}>Close</Button>
</Modal>
```

---

### Drawer

**Path**: `src/components/ui/Drawer.tsx`

**Import**:
```tsx
import { Drawer } from '@/components/ui';
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| isOpen | `boolean` | - | Visibility state |
| onClose | `() => void` | - | Close callback |
| title | `string` | - | Header title |
| height | `'50%' \| '75%' \| '90%' \| 'full'` | `'75%'` | Drawer height |

**Brand Tokens Used**:
- `bg-white`
- `sand-200` - Header border
- `sand-300` - Drag handle
- `olive-900` - Title (font-display)
- `rounded-t-3xl`

**Features**:
- Slides up from bottom
- Drag handle to close
- Escape key closes
- Body scroll lock

**Usage**:
```tsx
<Drawer isOpen={isOpen} onClose={() => setIsOpen(false)} title="Select Date">
  <div className="p-4">Content here</div>
</Drawer>
```

---

### Skeleton

**Path**: `src/components/ui/Skeleton.tsx`

**Import**:
```tsx
import { Skeleton, SkeletonCard } from '@/components/ui';
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `'rectangular' \| 'circular' \| 'text'` | `'rectangular'` | Shape |
| width | `string \| number` | - | Custom width |
| height | `string \| number` | - | Custom height |

**Brand Tokens Used**:
- `sand-100/200` - Gradient shimmer

**Variants**:
- `rectangular` - `rounded-lg`
- `circular` - `rounded-full`
- `text` - `rounded` (subtle)

**Preset**:
- `SkeletonCard` - Full recipe card skeleton

**Usage**:
```tsx
<Skeleton variant="rectangular" className="w-full aspect-video" />
<Skeleton variant="circular" className="w-10 h-10" />
<Skeleton variant="text" width="75%" />
<SkeletonCard /> {/* Full card loading state */}
```

---

## Feature Components

These are domain-specific components built with shared UI components:

| Directory | Purpose |
|-----------|---------|
| `calendar/` | MealSlot, WeekView, RecipeSidebar |
| `cooking-log/` | StarRating, RecipeCookingStats |
| `layout/` | Header |
| `pantry/` | IngredientSearch, IngredientChip, RecipeMatchCard |
| `recipes/` | RecipeCard, RecipeCatalog, AddToMealPlanDrawer |
| `scaling/` | ServingsSelector, ScaledIngredientsList, ScalingWarningBanner |
| `shopping/` | ShoppingList, ShoppingCategory, ShoppingItem |
| `suggestions/` | SimilarRecipesSection, PairingRecipesSection |
