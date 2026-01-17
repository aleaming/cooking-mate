# Brand Guidelines Skill Template

Use this template to generate the project-specific `brand-guidelines` skill. Replace all `{{PLACEHOLDER}}` values with discovered or user-provided brand tokens.

---

## SKILL.md Template

```markdown
---
name: brand-guidelines
description: Enforce brand consistency for this project. Triggers when creating UI elements, choosing colors, selecting typography, reviewing designs, or when visual consistency matters. Reference these guidelines for all design decisions. See also: shared-component-check-agent for component-level enforcement.
---

# Brand Guidelines

Project brand tokens and design standards. Use these values for all UI work.

## Quick Reference

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `{{PRIMARY_COLOR}}` | Main actions, focus states |
| Secondary | `{{SECONDARY_COLOR}}` | Supporting elements |
| Background | `{{BACKGROUND_COLOR}}` | Page backgrounds |
| Foreground | `{{FOREGROUND_COLOR}}` | Primary text |
| Muted | `{{MUTED_COLOR}}` | Secondary text, borders |
| Accent | `{{ACCENT_COLOR}}` | Highlights, notifications |

## Colors

### Core Palette

**Primary**: `{{PRIMARY_COLOR}}`
- Use for: Primary buttons, links, focus rings, key actions
- CSS var: `{{PRIMARY_CSS_VAR}}`
- Tailwind: `{{PRIMARY_TAILWIND}}`

**Secondary**: `{{SECONDARY_COLOR}}`
- Use for: Secondary buttons, less prominent actions
- CSS var: `{{SECONDARY_CSS_VAR}}`
- Tailwind: `{{SECONDARY_TAILWIND}}`

**Destructive**: `{{DESTRUCTIVE_COLOR}}`
- Use for: Delete actions, errors, warnings
- CSS var: `{{DESTRUCTIVE_CSS_VAR}}`
- Tailwind: `{{DESTRUCTIVE_TAILWIND}}`

### Backgrounds & Surfaces

**Background**: `{{BACKGROUND_COLOR}}`
- Main page background
- CSS var: `{{BACKGROUND_CSS_VAR}}`

**Card/Surface**: `{{CARD_COLOR}}`
- Elevated surfaces, cards, modals
- CSS var: `{{CARD_CSS_VAR}}`

**Muted**: `{{MUTED_COLOR}}`
- Subtle backgrounds, disabled states
- CSS var: `{{MUTED_CSS_VAR}}`

### Text Colors

**Foreground**: `{{FOREGROUND_COLOR}}`
- Primary text on light backgrounds

**Muted Foreground**: `{{MUTED_FOREGROUND_COLOR}}`
- Secondary text, placeholders, captions

### Semantic Colors

**Success**: `{{SUCCESS_COLOR}}` - Positive feedback, completion
**Warning**: `{{WARNING_COLOR}}` - Caution, pending states  
**Error**: `{{ERROR_COLOR}}` - Errors, validation failures
**Info**: `{{INFO_COLOR}}` - Informational messages

## Typography

### Font Families

**Headings**: `{{HEADING_FONT}}`
- CSS: `font-family: {{HEADING_FONT_STACK}}`
- Tailwind: `font-{{HEADING_TAILWIND}}`

**Body**: `{{BODY_FONT}}`
- CSS: `font-family: {{BODY_FONT_STACK}}`
- Tailwind: `font-{{BODY_TAILWIND}}`

**Mono**: `{{MONO_FONT}}`
- Use for: Code, technical content
- CSS: `font-family: {{MONO_FONT_STACK}}`

### Type Scale

| Name | Size | Line Height | Usage |
|------|------|-------------|-------|
| xs | {{XS_SIZE}} | {{XS_LH}} | Captions, labels |
| sm | {{SM_SIZE}} | {{SM_LH}} | Secondary text |
| base | {{BASE_SIZE}} | {{BASE_LH}} | Body text |
| lg | {{LG_SIZE}} | {{LG_LH}} | Lead paragraphs |
| xl | {{XL_SIZE}} | {{XL_LH}} | H4 |
| 2xl | {{2XL_SIZE}} | {{2XL_LH}} | H3 |
| 3xl | {{3XL_SIZE}} | {{3XL_LH}} | H2 |
| 4xl | {{4XL_SIZE}} | {{4XL_LH}} | H1 |

## Spacing

Base unit: `{{SPACING_BASE}}`

| Token | Value | Usage |
|-------|-------|-------|
| spacing-1 | {{SPACING_1}} | Tight internal spacing |
| spacing-2 | {{SPACING_2}} | Default internal spacing |
| spacing-3 | {{SPACING_3}} | Comfortable spacing |
| spacing-4 | {{SPACING_4}} | Section spacing |
| spacing-6 | {{SPACING_6}} | Large gaps |
| spacing-8 | {{SPACING_8}} | Major sections |

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| radius-sm | {{RADIUS_SM}} | Subtle rounding |
| radius-md | {{RADIUS_MD}} | Default (buttons, inputs) |
| radius-lg | {{RADIUS_LG}} | Cards, modals |
| radius-full | 9999px | Pills, avatars |

## Shadows

**Small**: `{{SHADOW_SM}}` - Subtle elevation
**Medium**: `{{SHADOW_MD}}` - Cards, dropdowns
**Large**: `{{SHADOW_LG}}` - Modals, popovers

## Component Token Usage

Components from the shared library use these tokens:

| Component | Tokens Used |
|-----------|-------------|
{{COMPONENT_TOKEN_MAP}}

See [shared-component-check-agent](../shared-component-check-agent/SKILL.md) for component details.

## Implementation

### Tailwind (if applicable)

Tokens are defined in `{{TAILWIND_CONFIG_PATH}}`:
```js
// Reference, don't duplicate - check actual file for current values
```

### CSS Variables (if applicable)

Tokens are defined in `{{CSS_VARS_PATH}}`:
```css
:root {
  /* Reference actual file for current values */
}
```

## Enforcement Rules

1. **Never hardcode colors** - Always use token references
2. **Use semantic tokens** - `destructive` not `red-500`
3. **Respect the type scale** - Don't invent sizes
4. **Consistent spacing** - Use spacing tokens, not arbitrary values
5. **Check components first** - Shared components already implement these tokens correctly
```

---

## design-tokens.md Template

```markdown
# Design Tokens Reference

Extracted: {{GENERATED_DATE}}
Source: {{TOKEN_SOURCE}}

## Raw Token Values

### Colors
```
{{RAW_COLOR_TOKENS}}
```

### Typography
```
{{RAW_TYPOGRAPHY_TOKENS}}
```

### Spacing
```
{{RAW_SPACING_TOKENS}}
```

### Radii
```
{{RAW_RADIUS_TOKENS}}
```

### Shadows
```
{{RAW_SHADOW_TOKENS}}
```

## Token-to-Component Mapping

{{TOKEN_COMPONENT_MAPPING}}
```
