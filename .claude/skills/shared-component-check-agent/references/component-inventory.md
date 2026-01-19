# Shared Component Inventory

Last updated: 2026-01-18

## Quick Reference

| Component | Path | Brand Tokens Used |
|-----------|------|-------------------|
| Badge | `ui/Badge.tsx` | All color palettes 100/200/700, rounded-full |
| Button | `ui/Button.tsx` | olive-500/600/700, terracotta-500/600, rounded-lg/xl/2xl |
| Card | `ui/Card.tsx` | sand-200 (shadow), rounded-2xl |
| Checkbox | `ui/Checkbox.tsx` | olive-500/600, rounded-md |
| Drawer | `ui/Drawer.tsx` | sand-200/300, rounded-t-3xl |
| FileInput | `ui/FileInput.tsx` | olive-500, sand-100, rounded-xl |
| ImageEditor | `ui/ImageEditor.tsx` | olive-500, sand-100, rounded-xl |
| Input | `ui/Input.tsx` | olive-500, sand-300/400, rounded-xl |
| Logo | `ui/Logo.tsx` | N/A (image component) |
| Modal | `ui/Modal.tsx` | sand-200 (border), rounded-2xl |
| Select | `ui/Select.tsx` | olive-500, sand-300/400, rounded-xl |
| Skeleton | `ui/Skeleton.tsx` | sand-100/200, rounded-lg/full |
| Textarea | `ui/Textarea.tsx` | olive-500, sand-300/400, rounded-xl |
| Toggle | `ui/Toggle.tsx` | olive-500/600, sand-200/300, rounded-full |

## Component Details

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
| size | `'sm' \| 'md' \| 'lg' \| 'icon' \| 'icon-sm'` | `'md'` | Size variant |
| isLoading | `boolean` | `false` | Shows loading spinner |
| disabled | `boolean` | `false` | Disabled state |
| leftIcon | `ReactNode` | - | Icon before text |
| rightIcon | `ReactNode` | - | Icon after text |

**Brand Tokens Used**:
- `olive-500/600/700` - Primary variant
- `terracotta-500/600/700` - Secondary variant
- `olive-500` (border) - Outline variant
- `olive-100/200` - Ghost hover/active
- `rounded-lg` (sm), `rounded-xl` (md/icon), `rounded-2xl` (lg)

**Variants**:
- `primary` - Filled olive background, white text
- `secondary` - Filled terracotta background, white text
- `outline` - Olive border, transparent background
- `ghost` - No border, transparent background

**Sizes**:
- `sm` - Small text button (px-3, text-sm, min-h 44px)
- `md` - Default size (px-4, text-base, min-h 44px)
- `lg` - Large size (px-6, text-lg, min-h 48px)
- `icon` - Square icon button (p-2.5, 44x44px)
- `icon-sm` - Small icon button (p-1.5, 32x32px)

**Usage**:
```tsx
<Button variant="primary" size="md">Primary Action</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline" leftIcon={<Icon />}>With Icon</Button>
<Button variant="ghost" size="sm">Ghost</Button>
<Button isLoading>Submitting...</Button>
<Button variant="ghost" size="icon" aria-label="Settings">
  <IconSettings className="w-5 h-5" />
</Button>
```

**When to Use**:
- Primary actions (submit, save, confirm)
- Secondary actions (cancel, back)
- Navigation triggers
- Icon-only buttons (use `icon` or `icon-sm` size with aria-label)

**When NOT to Use**:
- Text links (use `<Link>` instead)

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

### Checkbox

**Path**: `src/components/ui/Checkbox.tsx`

**Import**:
```tsx
import { Checkbox } from '@/components/ui';
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| checked | `boolean` | `false` | Checked state |
| onChange | `(checked: boolean) => void` | - | Change callback |
| label | `string` | - | Label text |
| disabled | `boolean` | `false` | Disabled state |

**Brand Tokens Used**:
- `olive-500/600` - Checked state
- `sand-300` - Border
- `rounded-md`

**Features**:
- Animated checkmark with Framer Motion
- Accessible with keyboard navigation
- Supports labels

**Usage**:
```tsx
<Checkbox checked={isChecked} onChange={setIsChecked} label="I agree" />
<Checkbox checked disabled label="Disabled" />
```

**When to Use**:
- Form checkboxes
- Settings toggles (for on/off with label)
- Selection lists

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

### FileInput

**Path**: `src/components/ui/FileInput.tsx`

**Import**:
```tsx
import { FileInput } from '@/components/ui';
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| accept | `string` | - | Accepted file types |
| multiple | `boolean` | `false` | Allow multiple files |
| onFileSelect | `(files: File[]) => void` | - | Selection callback |
| preview | `boolean` | `true` | Show image preview |
| dragDrop | `boolean` | `true` | Enable drag and drop |
| label | `string` | - | Label text |
| hint | `string` | - | Helper text |
| disabled | `boolean` | `false` | Disabled state |

**Brand Tokens Used**:
- `olive-500` - Focus/active state
- `sand-100` - Background
- `sand-200` - Border (dashed)
- `rounded-xl`

**Features**:
- Drag and drop support
- Image preview with edit/remove
- File type validation
- Multiple file selection

**Usage**:
```tsx
<FileInput
  accept="image/*"
  onFileSelect={(files) => handleFiles(files)}
  label="Upload photo"
  hint="Drag and drop or click to browse"
/>
```

**When to Use**:
- Recipe image upload
- Document upload
- Any file selection

---

### ImageEditor

**Path**: `src/components/ui/ImageEditor.tsx`

**Import**:
```tsx
import { ImageEditor } from '@/components/ui';
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| src | `string` | - | Image source URL |
| onSave | `(blob: Blob) => void` | - | Save callback |
| onCancel | `() => void` | - | Cancel callback |
| aspectRatio | `number` | - | Crop aspect ratio |

**Brand Tokens Used**:
- `olive-500` - Active controls
- `sand-100` - Background
- `rounded-xl`

**Features**:
- Crop functionality
- Zoom controls
- Aspect ratio enforcement
- Canvas-based editing

**Usage**:
```tsx
<ImageEditor
  src={imageUrl}
  onSave={(blob) => uploadImage(blob)}
  onCancel={() => setEditing(false)}
  aspectRatio={16/9}
/>
```

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
- Any single-line text input

---

### Logo

**Path**: `src/components/ui/Logo.tsx`

**Import**:
```tsx
import { Logo } from '@/components/ui';
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| size | `number` | `28` | Logo size in pixels |
| className | `string` | - | Additional classes |

**Usage**:
```tsx
<Logo />
<Logo size={40} />
<Logo className="opacity-75" />
```

**When to Use**:
- Header branding
- Auth pages
- Footer

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

### Select

**Path**: `src/components/ui/Select.tsx`

**Import**:
```tsx
import { Select } from '@/components/ui';
import type { SelectOption } from '@/components/ui';
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| options | `SelectOption[]` | - | Dropdown options |
| label | `string` | - | Label text |
| error | `string` | - | Error message |
| helperText | `string` | - | Helper text |
| placeholder | `string` | - | Placeholder text |
| size | `'sm' \| 'md' \| 'lg'` | `'md'` | Size variant |

**SelectOption Type**:
```tsx
interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}
```

**Brand Tokens Used**:
- `olive-500` - Focus border
- `sand-300` - Default border
- `error` - Error state
- `rounded-xl`
- Min height: 44px

**Usage**:
```tsx
const options = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
];

<Select
  options={options}
  label="Meal Type"
  placeholder="Select meal type"
  value={mealType}
  onChange={(e) => setMealType(e.target.value)}
/>
```

**When to Use**:
- Dropdown selections
- Form select fields
- Filters with predefined options

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

### Textarea

**Path**: `src/components/ui/Textarea.tsx`

**Import**:
```tsx
import { Textarea } from '@/components/ui';
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | `string` | - | Label text |
| error | `string` | - | Error message |
| helperText | `string` | - | Helper text |
| resize | `'none' \| 'vertical' \| 'horizontal' \| 'both'` | `'vertical'` | Resize behavior |
| rows | `number` | `3` | Initial rows |

**Brand Tokens Used**:
- `olive-500` - Focus border
- `sand-300` - Default border
- `error` - Error state
- `rounded-xl`
- Min height: 44px per row

**Usage**:
```tsx
<Textarea
  label="Description"
  placeholder="Enter recipe description"
  rows={4}
/>
<Textarea
  label="Notes"
  resize="none"
  error="Required field"
/>
```

**When to Use**:
- Multi-line text input
- Recipe descriptions
- Notes fields
- Comments

---

### Toggle

**Path**: `src/components/ui/Toggle.tsx`

**Import**:
```tsx
import { Toggle } from '@/components/ui';
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| checked | `boolean` | `false` | Toggle state |
| onCheckedChange | `(checked: boolean) => void` | - | Change callback |
| label | `string` | - | Label text |
| description | `string` | - | Description text |
| disabled | `boolean` | `false` | Disabled state |

**Brand Tokens Used**:
- `olive-500/600` - Active state
- `sand-200/300` - Inactive state
- `rounded-full` - Switch track and thumb

**Features**:
- Animated thumb transition
- Label and description support
- Accessible switch pattern

**Usage**:
```tsx
<Toggle
  checked={notifications}
  onCheckedChange={setNotifications}
  label="Email Notifications"
  description="Receive email updates about your account"
/>
```

**When to Use**:
- Boolean settings
- Feature toggles
- Preference switches

---

## Feature Components

These are domain-specific components built with shared UI components:

| Directory | Purpose |
|-----------|---------|
| `auth/` | PasswordInput |
| `calendar/` | MealSlot, WeekView, RecipeSidebar |
| `cooking-log/` | StarRating, CookingLogForm, CookingLogModal, RecipeCookingStats |
| `import/` | RecipePreviewCard, IngredientEditor, InstructionEditor |
| `layout/` | Header |
| `pantry/` | IngredientSearch, IngredientChip, RecipeMatchCard, NextIngredientSuggestions |
| `recipes/` | RecipeCard, RecipeCatalog, AddToMealPlanDrawer, TimerButton, TimerModal, AddToCalendarModal, PhotoGalleryManager |
| `scaling/` | ServingsSelector, ScaledIngredientsList, ScalingWarningBanner, CheckableIngredientItem |
| `shopping/` | ShoppingList, ShoppingCategory, ShoppingItem |
| `suggestions/` | SimilarRecipesSection, PairingRecipesSection, SuggestionCard |

---

## Color Token Reference

### Brand Colors (use these)
- `olive-*` - Primary green (50-900)
- `terracotta-*` - Secondary orange (50-900)
- `aegean-*` - Accent blue (50-900)
- `sand-*` - Neutral/gray (50-900)

### Semantic Colors (use these)
- `success` - Positive states (alias to green)
- `warning` - Caution states (alias to amber)
- `error` - Negative states (alias to red)
- `foreground` - Text color (adapts to theme)
- `background` - Page background (adapts to theme)
- `muted` - Muted text
- `border` - Border color
- `card` - Card background

### Avoid These (use semantic equivalents)
- `green-*` - Use `success` or `olive-*`
- `red-*` - Use `error` or `terracotta-*`
- `blue-*` - Use `aegean-*`
- `gray-*` - Use `sand-*`

---

## Import Pattern

Always use barrel imports:

```tsx
// Correct
import { Button, Card, Input, Badge } from '@/components/ui';

// Incorrect
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
```
