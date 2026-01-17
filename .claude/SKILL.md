---
name: design-system-bootstrap
description: Bootstrap complete design system governance for any project. Use when setting up design system enforcement, creating brand guidelines, adding component consistency checking, or when asked to "set up design system", "enforce brand consistency", or "bootstrap design governance". Analyzes the codebase to discover existing brand tokens, component patterns, and styling conventions, then generates tailored skills for both brand guidelines and component consistency that work together.
---

# Design System Bootstrap

Creates project-specific design system governance by generating two linked skills:
1. **Brand Guidelines** - Colors, typography, spacing, and design tokens
2. **Component Consistency Agent** - Enforces shared component usage

## What Gets Generated

```
.claude/skills/
├── brand-guidelines/
│   ├── SKILL.md                      # Brand enforcement rules
│   └── references/
│       └── design-tokens.md          # Colors, typography, spacing
└── shared-component-check-agent/
    ├── SKILL.md                      # Component enforcement rules
    └── references/
        └── component-inventory.md    # Available shared components
```

Both skills cross-reference each other - components reference brand tokens, brand guidelines reference which components implement them.

## Bootstrap Process

### Step 1: Discover Project Structure

```bash
# Find component directories
find . -type d \( -name "components" -o -name "ui" -o -name "shared" \) 2>/dev/null | grep -v node_modules | head -20

# Find styling/theme files
find . -type f \( -name "*.css" -o -name "tailwind.config.*" -o -name "theme.ts" -o -name "tokens.*" -o -name "variables.*" \) 2>/dev/null | grep -v node_modules | head -15

# Check package.json for stack
cat package.json 2>/dev/null | grep -E '"react"|"vue"|"svelte"|"tailwindcss"|"@radix-ui"|"shadcn"' | head -10
```

### Step 2: Extract Brand Tokens

Look for existing design tokens in order of preference:

**Tailwind Config** (if present):
```bash
cat tailwind.config.js 2>/dev/null || cat tailwind.config.ts 2>/dev/null
# Extract: colors, fontFamily, spacing, borderRadius
```

**CSS Variables** (check global CSS):
```bash
find . -name "globals.css" -o -name "variables.css" -o -name "index.css" 2>/dev/null | head -3
# Look for :root { --color-*, --font-*, --spacing-* }
```

**Theme Files** (JS/TS):
```bash
find . -name "theme.ts" -o -name "theme.js" -o -name "tokens.ts" 2>/dev/null | head -3
```

**If no tokens found**: Prompt user for brand basics:
- Primary/secondary colors
- Font families (headings, body)
- Base spacing unit

### Step 3: Analyze Component Patterns

```bash
# List shared components
ls <shared-component-path>/

# Sample component structure
head -60 <shared-component-path>/Button.tsx
```

Document: export patterns, props conventions, variant handling, how styles reference tokens.

### Step 4: Present Findings

Before generating, present to user:

```markdown
## Design System Analysis

### Brand Tokens Found
- **Colors**: primary (#xxx), secondary (#xxx), ...
- **Typography**: Headings (Font), Body (Font)
- **Spacing**: Base unit Xpx
- **Source**: tailwind.config.ts

### Components Found
- X shared components in `src/components/ui/`
- Pattern: React + TypeScript + Tailwind + CVA

### Will Generate
1. `.claude/skills/brand-guidelines/` - Token enforcement
2. `.claude/skills/shared-component-check-agent/` - Component enforcement

Proceed? [Y/n]
```

### Step 5: Generate Skills

Use templates from:
- [references/brand-template.md](references/brand-template.md) - Brand guidelines skill
- [references/component-template.md](references/component-template.md) - Component agent skill
- [references/framework-patterns.md](references/framework-patterns.md) - Component code patterns

Create the directory structure and populate with project-specific values.

### Step 6: Link the Skills

Ensure cross-references:
- Component inventory notes which brand tokens each component uses
- Brand guidelines notes which components implement each token
- Both skills trigger appropriately and reference each other

## Framework Detection

| Indicator | Stack |
|-----------|-------|
| `tailwindcss` + `class-variance-authority` | React + Tailwind + CVA |
| `tailwindcss` only | React/Vue + Tailwind |
| `.module.css` files | CSS Modules |
| `styled-components` or `@emotion` | CSS-in-JS |
| `shadcn` or `@radix-ui` | shadcn/ui (React + Tailwind + CVA) |
| `.vue` files | Vue 3 |
| `.svelte` files | Svelte |

## Token Source Priority

1. `tailwind.config.ts/js` - Most structured, preferred
2. CSS custom properties (`:root` variables) - Common, portable
3. Theme/token JS/TS files - Framework-specific
4. Component inline values - Extract and centralize
5. User input - Last resort, create fresh

## Reference Files

- [references/brand-template.md](references/brand-template.md) - Brand guidelines skill template
- [references/component-template.md](references/component-template.md) - Component agent skill template
- [references/framework-patterns.md](references/framework-patterns.md) - Framework-specific component patterns
- [references/token-extraction.md](references/token-extraction.md) - How to extract tokens from various sources
