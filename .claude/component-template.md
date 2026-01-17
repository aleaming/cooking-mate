# Component Agent Skill Template

Use this template to generate the project-specific `shared-component-check-agent` skill. Replace all `{{PLACEHOLDER}}` values with discovered project details.

---

## SKILL.md Template

```markdown
---
name: shared-component-check-agent
description: Enforce shared component usage and design system consistency for this project. Triggers when adding/updating components, creating UI elements, reviewing code, planning features, or auditing pages. Checks {{SHARED_COMPONENT_PATHS}} for existing components before creating new ones. Works with brand-guidelines skill for complete design system enforcement.
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

**Shared Components**: `{{SHARED_COMPONENT_PATHS}}`
**Page Components**: `{{PAGE_COMPONENT_PATHS}}`
**Framework**: {{FRAMEWORK}}
**Styling**: {{STYLING_APPROACH}}
**UI Library**: {{UI_LIBRARY}}

## Before Adding Any Component

1. **Search shared components first**:
   ```bash
   ls {{SHARED_COMPONENT_PATHS}}
   grep -r "export.*ComponentName" {{SHARED_COMPONENT_PATHS}}
   ```

2. **Check inventory**: See [references/component-inventory.md](references/component-inventory.md)

3. **Decision tree**:
   - ✅ **Exact match** → Use the shared component
   - ✅ **Similar exists** → Check if variants/props cover your use case
   - ⚠️ **Partial match** → Extend existing component if appropriate
   - 🆕 **No match** → Create new shared component (confirm with user first)

## Using Shared Components

```{{FRAMEWORK_LANG}}
import { ComponentName } from '{{IMPORT_PATH}}'
```

Rules:
- Use existing variant props before custom styles
- Respect the component's API
- Components use brand tokens from [brand-guidelines](../brand-guidelines/SKILL.md)
- Only override when explicitly requested by user
- Document overrides with comments

## Creating New Shared Components

When no suitable component exists and user confirms:

1. Create in `{{SHARED_COMPONENT_PATHS}}`
2. **Use brand tokens** - Reference colors, typography, spacing from brand guidelines
3. Follow project patterns:

{{COMPONENT_TEMPLATE}}

4. Update [references/component-inventory.md](references/component-inventory.md)
5. Add token mapping to brand guidelines

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
- Line X: Hardcoded `#3b82f6` → Should use `primary` token
- Line Y: `text-blue-500` → Should use `text-primary`

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

## Related Skills

- **[brand-guidelines](../brand-guidelines/SKILL.md)** - Color, typography, spacing tokens that components use

## Override Syntax

When user explicitly wants to deviate:
- "Override: use custom styling for this"
- "Skip shared component check"
- "Create page-specific version"

Always document the reason in a comment.
```

---

## component-inventory.md Template

```markdown
# Shared Component Inventory

Last updated: {{GENERATED_DATE}}

## Quick Reference

| Component | Path | Brand Tokens Used |
|-----------|------|-------------------|
{{COMPONENT_TABLE}}

## Component Details

{{COMPONENT_DETAILS}}

---

### Entry Template

### ComponentName

**Path**: `{{SHARED_COMPONENT_PATHS}}/ComponentName.tsx`

**Import**:
```{{FRAMEWORK_LANG}}
import { ComponentName } from '{{IMPORT_PATH}}'
```

**Props**:
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | 'default' \| 'secondary' \| 'destructive' | 'default' | Visual style |
| size | 'sm' \| 'md' \| 'lg' | 'md' | Size variant |

**Brand Tokens Used**:
- `primary` - Default variant background
- `primary-foreground` - Default variant text
- `secondary` - Secondary variant background
- `destructive` - Destructive variant background
- `radius-md` - Border radius

**Variants**: default, secondary, outline, ghost, destructive

**Usage**:
```{{FRAMEWORK_LANG}}
<ComponentName variant="default" size="md">
  Content
</ComponentName>
```

**When to Use**:
- Primary actions
- Form submissions

**When NOT to Use**:
- Navigation links (use Link instead)
- Icon-only actions (use IconButton instead)
```
