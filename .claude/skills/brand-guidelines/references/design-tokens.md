# Design Tokens Reference

Extracted: 2026-01-17
Source: `src/app/globals.css`

## Raw Token Values

### Colors

```css
/* Primary - Olive */
--olive-50: #f7f8f3;
--olive-100: #eef0e6;
--olive-200: #dde2cd;
--olive-300: #c4ccaa;
--olive-400: #a7b283;
--olive-500: #8a9962;
--olive-600: #6f7b4d;
--olive-700: #56603d;
--olive-800: #474f34;
--olive-900: #3d432e;

/* Secondary - Terracotta */
--terracotta-50: #fdf6f3;
--terracotta-100: #fbeae3;
--terracotta-200: #f7d5c7;
--terracotta-300: #f0b8a1;
--terracotta-400: #e6916f;
--terracotta-500: #d97046;
--terracotta-600: #c55a35;
--terracotta-700: #a4472b;
--terracotta-800: #863c28;
--terracotta-900: #6e3525;

/* Accent - Aegean */
--aegean-50: #f0f9ff;
--aegean-100: #e0f2fe;
--aegean-200: #b9e5fe;
--aegean-300: #7cd1fd;
--aegean-400: #36bafa;
--aegean-500: #0c9feb;
--aegean-600: #0080cc;
--aegean-700: #0166a5;
--aegean-800: #065688;
--aegean-900: #0b4770;

/* Neutral - Sand */
--sand-50: #faf9f7;
--sand-100: #f5f3ef;
--sand-200: #e8e4dc;
--sand-300: #d9d2c5;
--sand-400: #c4b9a7;
--sand-500: #b0a28d;
--sand-600: #9d8b74;
--sand-700: #837361;
--sand-800: #6c5f52;
--sand-900: #594f45;

/* Semantic */
--success: #22c55e;
--warning: #f59e0b;
--error: #ef4444;

/* Base */
--background: #faf9f7;
--foreground: #3d432e;
```

### Typography

```css
--font-display: "Playfair Display", serif;
--font-body: "Inter", sans-serif;
--font-sans: var(--font-body);
```

**Font Loading** (via `next/font/google` in `layout.tsx`):
- Playfair Display: Display, weight 400-700
- Inter: Body, full weight range

### Spacing

Tailwind v4 default scale (4px base):

```
1: 0.25rem (4px)
2: 0.5rem (8px)
3: 0.75rem (12px)
4: 1rem (16px)
5: 1.25rem (20px)
6: 1.5rem (24px)
8: 2rem (32px)
10: 2.5rem (40px)
12: 3rem (48px)
16: 4rem (64px)
```

### Border Radii

```
rounded-lg: 0.5rem (8px)
rounded-xl: 0.75rem (12px)
rounded-2xl: 1rem (16px)
rounded-3xl: 1.5rem (24px)
rounded-full: 9999px
```

### Shadows

```css
/* Card shadow pattern */
shadow-lg shadow-sand-200/50

/* Modal/Drawer shadow */
shadow-2xl
```

## Token-to-Component Mapping

| Token Category | Components Using |
|----------------|------------------|
| olive-500/600/700 | Button (primary), Input (focus), focus-visible |
| terracotta-500/600/700 | Button (secondary), Badge (terracotta), Breakfast |
| aegean-100/500/600 | Badge (aegean), Lunch, Info states |
| sand-50/100/200/300 | Page bg, Card shadow, Borders, Inputs |
| sand-400/500/600 | Muted text, Icons, Placeholders |
| rounded-2xl | Card, Modal, Buttons (lg) |
| rounded-xl | Input, Buttons (md), Filters |
| rounded-full | Badge, Pills, Avatar |
| font-display | All headings, Card titles |
| font-body | Body text, Buttons, Labels |

## Meal Type Color Mapping

| Meal | Primary Color | Badge Variant | Icon Color |
|------|---------------|---------------|------------|
| Breakfast | Terracotta | `terracotta` | `terracotta-600` |
| Lunch | Aegean | `aegean` | `aegean-600` |
| Dinner | Olive | `olive` | `olive-600` |
