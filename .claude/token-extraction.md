# Token Extraction Guide

How to extract design tokens from various sources in a project.

## Priority Order

1. **Tailwind Config** - Most structured, preferred
2. **CSS Custom Properties** - Common, portable
3. **Theme/Token Files** - Framework-specific
4. **Component Styles** - Extract and centralize
5. **User Input** - Create fresh if nothing exists

---

## Tailwind Config Extraction

```bash
# Find config
ls tailwind.config.* 2>/dev/null
```

**Extract colors**:
```js
// In tailwind.config.ts/js, look for:
theme: {
  extend: {
    colors: {
      primary: { DEFAULT: '#...', foreground: '#...' },
      secondary: { DEFAULT: '#...', foreground: '#...' },
      // etc.
    }
  }
}
```

**Extract typography**:
```js
fontFamily: {
  sans: ['Inter', 'sans-serif'],
  heading: ['Poppins', 'sans-serif'],
}
```

**Extract spacing** (usually uses Tailwind defaults):
```js
spacing: {
  // Custom overrides if any
}
```

**Extract radii**:
```js
borderRadius: {
  lg: '0.5rem',
  md: '0.375rem',
  sm: '0.25rem',
}
```

### shadcn/ui Pattern

If using shadcn/ui, tokens are typically CSS variables in `globals.css`:

```bash
cat src/app/globals.css 2>/dev/null | grep -A 50 ":root"
# or
cat app/globals.css 2>/dev/null | grep -A 50 ":root"
```

Look for:
```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  /* etc. */
}
```

Note: shadcn uses HSL values without the `hsl()` wrapper.

---

## CSS Custom Properties Extraction

```bash
# Find files with CSS variables
grep -r ":root" --include="*.css" . 2>/dev/null | grep -v node_modules | head -10

# Common locations
cat src/styles/globals.css 2>/dev/null
cat src/index.css 2>/dev/null
cat styles/variables.css 2>/dev/null
```

**Parse variables**:
```css
:root {
  /* Colors */
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  
  /* Typography */
  --font-sans: 'Inter', sans-serif;
  --font-heading: 'Poppins', sans-serif;
  
  /* Spacing */
  --spacing-unit: 4px;
  --spacing-1: 4px;
  --spacing-2: 8px;
  
  /* Radii */
  --radius-sm: 4px;
  --radius-md: 8px;
}
```

---

## Theme File Extraction

```bash
# Find theme files
find . -name "theme.ts" -o -name "theme.js" -o -name "tokens.ts" -o -name "tokens.js" 2>/dev/null | grep -v node_modules
```

**Common patterns**:

```ts
// theme.ts
export const theme = {
  colors: {
    primary: '#3b82f6',
    secondary: '#64748b',
  },
  fonts: {
    body: 'Inter, sans-serif',
    heading: 'Poppins, sans-serif',
  },
  space: [0, 4, 8, 16, 32, 64],
  radii: {
    sm: '4px',
    md: '8px',
    lg: '16px',
  },
}
```

---

## Component Style Extraction

When no centralized tokens exist, extract from components:

```bash
# Find color values in components
grep -r "#[0-9a-fA-F]\{3,6\}" --include="*.tsx" --include="*.jsx" src/components/ 2>/dev/null | head -20

# Find Tailwind color classes
grep -r "bg-\|text-\|border-" --include="*.tsx" src/components/ 2>/dev/null | head -20
```

**Identify patterns**:
- What colors appear most frequently?
- Are there consistent spacing values?
- What font families are used?

---

## User Input Questionnaire

When no tokens can be extracted, gather from user:

### Colors
- What is your primary brand color? (hex or name)
- Secondary color?
- Do you have success/warning/error colors defined?
- Light or dark mode preference?

### Typography
- Heading font family?
- Body text font family?
- Base font size? (default: 16px)

### Spacing
- Base spacing unit? (default: 4px)
- Preferred spacing scale? (default: 4, 8, 12, 16, 24, 32, 48, 64)

### Shape
- Border radius preference? (sharp, subtle, rounded, pill)
- Default: subtle (4-8px)

---

## Output Format

After extraction, format tokens for the brand-guidelines skill:

```markdown
## Extracted Tokens

### Colors
| Token | Value | Source |
|-------|-------|--------|
| primary | #3b82f6 | tailwind.config.ts |
| secondary | #64748b | tailwind.config.ts |

### Typography
| Token | Value | Source |
|-------|-------|--------|
| font-sans | Inter, sans-serif | tailwind.config.ts |
| font-heading | Poppins, sans-serif | tailwind.config.ts |

### Spacing
| Token | Value | Source |
|-------|-------|--------|
| spacing-1 | 4px | Tailwind default |
| spacing-2 | 8px | Tailwind default |

### Radii
| Token | Value | Source |
|-------|-------|--------|
| radius-sm | 0.25rem | tailwind.config.ts |
| radius-md | 0.375rem | tailwind.config.ts |
```

---

## Validation

After extraction, verify tokens are actually used:

```bash
# Check if extracted colors appear in components
grep -r "primary\|#3b82f6" --include="*.tsx" src/components/ | head -5

# Check if font families are loaded
grep -r "Inter\|Poppins" --include="*.css" --include="*.tsx" . | head -5
```

Flag any extracted tokens that don't appear to be in use.
