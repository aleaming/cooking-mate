---
name: brand-guidelines
description: Enforce brand consistency for MedDiet Mediterranean meal planner. Triggers when creating UI elements, choosing colors, selecting typography, reviewing designs, or when visual consistency matters. Reference these guidelines for all design decisions. See also: shared-component-check-agent for component-level enforcement.
---

# Brand Guidelines - MedDiet

Mediterranean Diet Meal Planner brand tokens and design standards. Use these values for all UI work.

## Quick Reference

| Token | Tailwind | Usage |
|-------|----------|-------|
| Primary (Olive) | `olive-500` | Main actions, focus states, nav active |
| Secondary (Terracotta) | `terracotta-500` | Secondary actions, breakfast accents |
| Accent (Aegean) | `aegean-500` | Highlights, lunch accents, info states |
| Neutral (Sand) | `sand-*` | Backgrounds, borders, muted text |
| Background | `bg-sand-50` / `#faf9f7` | Page backgrounds |
| Foreground | `text-olive-900` | Primary text |

## Colors

### Primary - Olive (Organic, Natural)

Use for: Primary buttons, links, focus rings, key actions, logo, navigation active states

| Shade | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| 50 | `#f7f8f3` | `olive-50` | Hover backgrounds |
| 100 | `#eef0e6` | `olive-100` | Active backgrounds, selected states |
| 200 | `#dde2cd` | `olive-200` | Selection highlight |
| 500 | `#8a9962` | `olive-500` | Primary buttons, focus rings |
| 600 | `#6f7b4d` | `olive-600` | Primary button hover |
| 700 | `#56603d` | `olive-700` | Primary button active, nav active text |
| 800 | `#474f34` | `olive-800` | Headings, strong text |
| 900 | `#3d432e` | `olive-900` | Page titles, primary text |

**CSS Variables**: `--olive-50` through `--olive-900`
**Tailwind**: `olive-{shade}` (via `@theme inline`)

### Secondary - Terracotta (Warm Mediterranean)

Use for: Secondary buttons, breakfast indicators, warm accents

| Shade | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| 50 | `#fdf6f3` | `terracotta-50` | Light backgrounds |
| 100 | `#fbeae3` | `terracotta-100` | Badge backgrounds |
| 500 | `#d97046` | `terracotta-500` | Secondary buttons |
| 600 | `#c55a35` | `terracotta-600` | Secondary button hover |
| 700 | `#a4472b` | `terracotta-700` | Text on light terracotta |

**CSS Variables**: `--terracotta-50` through `--terracotta-900`

### Accent - Aegean (Mediterranean Sea)

Use for: Highlights, lunch indicators, informational states, links

| Shade | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| 50 | `#f0f9ff` | `aegean-50` | Info backgrounds |
| 100 | `#e0f2fe` | `aegean-100` | Badge backgrounds |
| 500 | `#0c9feb` | `aegean-500` | Info icons, lunch accent |
| 600 | `#0080cc` | `aegean-600` | Links, info text |
| 700 | `#0166a5` | `aegean-700` | Text on light aegean |

**CSS Variables**: `--aegean-50` through `--aegean-900`

### Neutral - Sand (Warm Grays)

Use for: Backgrounds, borders, muted text, surfaces

| Shade | Hex | Tailwind | Usage |
|-------|-----|----------|-------|
| 50 | `#faf9f7` | `sand-50` | Page background |
| 100 | `#f5f3ef` | `sand-100` | Subtle backgrounds, skeletons |
| 200 | `#e8e4dc` | `sand-200` | Borders, dividers, shadows |
| 300 | `#d9d2c5` | `sand-300` | Input borders, drawer handle |
| 400 | `#c4b9a7` | `sand-400` | Empty state icons, scrollbar |
| 500 | `#b0a28d` | `sand-500` | Muted text, placeholders |
| 600 | `#9d8b74` | `sand-600` | Secondary text |
| 700 | `#837361` | `sand-700` | Tertiary text |

**CSS Variables**: `--sand-50` through `--sand-900`

### Semantic Colors

| Name | Hex | Tailwind | Usage |
|------|-----|----------|-------|
| Success | `#22c55e` | `green-500` | Positive feedback, completion |
| Warning | `#f59e0b` | `amber-500` | Caution, scaling warnings |
| Error | `#ef4444` | `red-500` | Errors, destructive actions |

**CSS Variables**: `--success`, `--warning`, `--error`

## Typography

### Font Families

**Display (Headings)**: Playfair Display
- CSS: `font-family: var(--font-display)`
- Tailwind: `font-display`
- Use for: Page titles, card titles, section headings

**Body**: Inter
- CSS: `font-family: var(--font-body)`
- Tailwind: `font-body` or `font-sans`
- Use for: All body text, buttons, labels

### Type Scale (Tailwind defaults)

| Size | Class | Usage |
|------|-------|-------|
| xs | `text-xs` | Captions, labels, small badges |
| sm | `text-sm` | Secondary text, helper text |
| base | `text-base` | Body text, buttons |
| lg | `text-lg` | Lead paragraphs, emphasized text |
| xl | `text-xl` | Card titles, section headings |
| 2xl | `text-2xl` | Page section titles |
| 3xl | `text-3xl` | Major page headings |
| 4xl+ | `text-4xl`+ | Hero text |

### Heading Pattern

```tsx
<h1 className="font-display text-3xl font-bold text-olive-900">Page Title</h1>
<h2 className="font-display text-xl font-semibold text-olive-900">Section</h2>
<h3 className="font-display font-semibold text-olive-900">Subsection</h3>
```

## Spacing

Tailwind v4 default scale (4px base unit):

| Token | Value | Usage |
|-------|-------|-------|
| 1 | 4px | Tight internal gaps |
| 2 | 8px | Default internal spacing |
| 3 | 12px | Comfortable gaps |
| 4 | 16px | Section spacing, card padding |
| 6 | 24px | Larger gaps |
| 8 | 32px | Major sections |

**Common Patterns**:
- Card padding: `p-4` (md) or `p-6` (lg)
- Section gaps: `gap-4` to `gap-8`
- Page margins: `px-4 sm:px-6 lg:px-8`

## Border Radius

| Token | Tailwind | Usage |
|-------|----------|-------|
| sm | `rounded-lg` | Small buttons, subtle rounding |
| md | `rounded-xl` | Inputs, medium buttons, filters |
| lg | `rounded-2xl` | Cards, modals, containers |
| xl | `rounded-3xl` | Drawer top corners |
| full | `rounded-full` | Badges, pills, avatars |

## Shadows

| Name | Tailwind | Usage |
|------|----------|-------|
| Default | `shadow-lg shadow-sand-200/50` | Cards, elevated surfaces |
| Large | `shadow-2xl` | Modals, drawers |

## Component Token Usage

| Component | Primary Tokens Used |
|-----------|---------------------|
| Button | olive-500/600/700, terracotta-500/600 |
| Badge | All palette 100/200/700 shades |
| Card | sand-200 (shadow), rounded-2xl |
| Input | olive-500, sand-300, rounded-xl |
| Modal | sand-200 (border), rounded-2xl |
| Drawer | sand-200/300, rounded-t-3xl |

See [shared-component-check-agent](../shared-component-check-agent/SKILL.md) for component details.

## Implementation

### Token Source

Tokens are defined in `src/app/globals.css`:
- CSS custom properties in `:root`
- Tailwind v4 theme in `@theme inline` block

### Using Tokens

```tsx
// Colors
className="bg-olive-500 text-white"
className="text-sand-600 border-sand-200"

// Typography
className="font-display text-xl font-semibold text-olive-900"

// Spacing & Radius
className="p-4 rounded-2xl"
```

## Enforcement Rules

1. **Never hardcode colors** - Always use token references (`olive-500` not `#8a9962`)
2. **Use semantic colors** - `error` not `red-500` for errors
3. **Respect the type scale** - Don't invent sizes
4. **Consistent spacing** - Use spacing tokens, not arbitrary values
5. **Check components first** - Shared components already implement these tokens correctly
6. **Meal type colors**:
   - Breakfast: `terracotta`
   - Lunch: `aegean`
   - Dinner: `olive`
