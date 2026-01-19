# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server (Turbopack)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint
```

## Architecture Overview

Mediterranean diet meal planning app built with Next.js 16 App Router. Users browse recipes, drag-and-drop them onto a monthly calendar, and generate aggregated shopping lists.

### Key Technologies
- **Next.js 16.1.1** with App Router (all components use `'use client'`)
- **React 19** with React DOM 19
- **Tailwind CSS v4** with `@theme inline` in globals.css
- **Zustand 5** for state with localStorage persistence
- **Framer Motion 12** for animations
- **@dnd-kit** for drag-and-drop calendar interactions
- **@tabler/icons-react** for icons
- **date-fns 4** for date manipulation
- **Supabase** for user authentication and user-created recipes storage

### Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── calendar/         # Calendar view for meal planning
│   ├── cooking-history/  # Cooking history timeline with stats
│   ├── pantry-finder/    # Ingredient-based recipe finder
│   ├── recipes/          # Recipe browsing
│   │   ├── [id]/         # Dynamic recipe detail page (with scaling, suggestions)
│   │   │   └── edit/     # Recipe edit page (user recipes only)
│   │   ├── import/       # Recipe import flows
│   │   │   ├── url/      # Import from URL (scrapes recipe data)
│   │   │   └── markdown/ # Import from markdown files
│   │   └── my-recipes/   # User's imported recipe collection
│   └── shopping-list/    # Shopping list view
├── components/
│   ├── calendar/         # Calendar-specific components
│   ├── cooking-log/      # Meal tracking components (rating, logging)
│   ├── import/           # Recipe import components (RecipePreviewCard)
│   ├── layout/           # Layout components (header, nav)
│   ├── pantry/           # Pantry finder components
│   ├── recipes/          # Recipe-specific components
│   ├── scaling/          # Recipe scaling UI components
│   ├── shopping/         # Shopping list components
│   ├── suggestions/      # Smart recipe suggestion components
│   └── ui/               # Reusable UI primitives
├── data/
│   ├── recipes/          # Static recipe data (breakfast, lunch, dinner)
│   └── masterIngredients.ts  # Master ingredient list for pantry finder
├── hooks/                # Custom React hooks
├── providers/            # React context providers
├── lib/
│   ├── actions/          # Server actions (userRecipes, scrapeRecipe, storage)
│   ├── constants/        # Animation configs, etc.
│   ├── data/             # Data access functions
│   ├── supabase/         # Supabase client setup
│   └── utils/            # Utility functions
├── stores/               # Zustand stores
└── types/                # TypeScript type definitions
```

### State Management

Three Zustand stores with persist middleware:

**useMealPlanStore** (`src/stores/useMealPlanStore.ts`)
- Stores meal assignments keyed by `"YYYY-MM-DD-mealType"`
- Tracks calendar navigation (currentYear, currentMonth)
- Persists to `meddiet-meal-plans` in localStorage

**useShoppingStore** (`src/stores/useShoppingStore.ts`)
- Tracks checked shopping items and date range
- Persists to `meddiet-shopping` in localStorage

**useCookingLogStore** (`src/stores/useCookingLogStore.ts`)
- Tracks cooking sessions with ratings, notes, and servings made
- Provides recipe stats (times cooked, average rating, last cooked)
- Core methods: `logCooking`, `getRecipeStats`, `getSessionsForRecipe`, `getAllSessions`, `getMonthlyStats`
- CRUD methods: `updateSession`, `deleteSession`, `getSession`
- Query methods: `getSessionsInDateRange`, `wasRecentlyCooked`, `isMealLogged`, `getSessionByMealPlanKey`
- Persists to `meddiet-cooking-log` in localStorage

**Important Pattern**: When using computed data from Zustand (like `getRecipeStats`), use `useMemo` instead of calling directly in selector to prevent infinite loops:
```typescript
// ✓ Correct - prevents infinite re-renders
const sessions = useCookingLogStore((state) => state.sessions);
const stats = useMemo(() => calculateStats(sessions), [sessions]);

// ✗ Incorrect - causes infinite loop
const stats = useCookingLogStore((state) => state.getRecipeStats(id));
```

### Data Flow

1. **Static Recipes** are TypeScript objects in `src/data/recipes/` (breakfast.ts, lunch.ts, dinner.ts, exported via index.ts)
2. **User Recipes** are stored in Supabase (`recipes` table) with `owner_id` linking to authenticated user
3. **Recipe Collection** (`/recipes`) combines both static and user recipes for unified browsing/filtering
4. **Meal Plans** are created when users drop recipes onto calendar slots
5. **Shopping Lists** aggregate ingredients from all recipes in the selected date range using `src/lib/utils/ingredients.ts`

### User Recipe System

**Import Methods:**
- **URL Import** (`/recipes/import/url`) - Scrapes recipe data from external URLs using Anthropic API
- **Markdown Import** (`/recipes/import/markdown`) - Parses `.md` files containing recipe data

**Recipe IDs:**
- Static recipes use slug-based IDs (e.g., `greek-salad`)
- User recipes use prefixed IDs: `user-{shortId}-{hash}` (e.g., `user-mkkkxbhs-vk8muc`)
- Check `recipeId.startsWith('user-')` to determine if recipe needs Supabase fetch

**Server Actions** (`src/lib/actions/userRecipes.ts`):
- `getUserRecipes()` - Fetch all recipes for authenticated user
- `getUserRecipeById(id)` - Fetch single user recipe
- `createUserRecipe(data)` - Create new recipe with ingredients/instructions
- `updateUserRecipe(data)` - Update existing user recipe
- `deleteUserRecipe(id)` - Delete user recipe

**Database Schema:**
- `recipes` table - Core recipe data with `owner_id` foreign key
- `recipe_ingredients` table - Ingredients with optional `ingredient_id` (null for user imports)
- `recipe_photos` table - User-uploaded recipe images

### Component Patterns

**UI Components** (`src/components/ui/`)
- Badge, Button, Card, Checkbox, Drawer, Input, Modal, Skeleton
- Variant-based: Button has `variant` (primary/secondary/outline/ghost) and `size` (sm/md/lg)
- Checkbox: Animated checkbox with Framer Motion checkmark
- Compound pattern: Card exports CardHeader, CardTitle, CardContent, CardFooter, CardImage
- All exported through index.ts barrel file

**Feature Components**
- Calendar uses @dnd-kit with `DroppableMealSlot` and `DraggableRecipeCard`
- Drawer slides up from bottom (75% height) for meal plan selection
- Shopping items have animated checkmarks with strikethrough

**Cooking Log Components** (`src/components/cooking-log/`)
- `StarRating` - Interactive 5-star rating input
- `CookingLogForm` - Form for logging cooking sessions
- `CookingLogModal` - Modal wrapper for the cooking log form
- `MarkAsCookedButton` - Button on calendar meal slots (always visible on filled slots)
- `RecipeCookingStats` - Stats display for recipe detail page

**Scaling Components** (`src/components/scaling/`)
- `ServingsSelector` - Enhanced +/- with preset buttons (½×, 1×, 2×, Party)
- `ScaledIngredientsList` - Wrapper for scaled ingredients with unit conversion
- `ScaledIngredientItem` - Individual ingredient with original amount tooltip
- `ScalingWarningBanner` - Collapsible warnings for non-linear scaling
- `TimingAdjustmentNote` - Cook time adjustment suggestions
- `CheckableIngredientItem` - Ingredient row with checkbox for gathering tracking
- `CheckableIngredientsList` - Full ingredient list with checkboxes, progress bar, and reset

**Recipe Components** (`src/components/recipes/`)
- `RecipeCard` - Recipe card for browsing views
  - Props: `recipe`, `compact?`, `onClick?`, `showActions?`, `onEdit?`, `onDelete?`, `sourceLabel?`, `linkQuery?`
  - `showActions` shows edit/delete buttons on hover (for user recipes)
  - `linkQuery` adds query params to recipe link (e.g., `"from=my-recipes"`)
- `RecipeCatalog` - Recipe grid with filtering (meal type, difficulty, dietary tags, search)
- `TimerButton` - Triggers native device timer on mobile or shows in-app modal on desktop
- `TimerModal` - In-app timer with progress ring, Web Audio API alarm, and browser notifications
- `AddToCalendarModal` - Modal for adding recipes to meal plan with date/meal type selection

**Import Components** (`src/components/import/`)
- `RecipePreviewCard` - Editable recipe card for import/edit flows with inline editing for all fields

**Suggestion Components** (`src/components/suggestions/`)
- `SimilarRecipesSection` - "You might also like" horizontal scroll
- `PairingRecipesSection` - "Pairs well with" with shopping efficiency bars
- `SuggestionCard` - Compact recipe card with reason badges

**Pantry Components** (`src/components/pantry/`)
- `IngredientSearch` - Autocomplete search for master ingredients
- `IngredientChip` - Removable chip for selected ingredients
- `RecipeMatchCard` - Recipe card with match percentage progress bar
- `NextIngredientSuggestions` - "What to buy next" suggestions panel

### Utility Functions

**`src/lib/utils/`**
- `dates.ts` - Date formatting and calendar helpers using date-fns
- `ingredients.ts` - Shopping list aggregation logic
- `deviceId.ts` - Unique device ID generation using uuid
- `recipeScaling.ts` - Smart recipe scaling with warnings for non-linear ingredients
- `recipeOverlap.ts` - Recipe pairing/similarity analysis, shopping efficiency calculations
- `ingredientMatching.ts` - Pantry finder logic, recipe matching by available ingredients
- `timer.ts` - Timer utilities: `parseTimeFromText()`, `formatDuration()`, `formatCountdown()`, mobile device detection, native timer integration
- `ingredientCategory.ts` - Infers ingredient category from name using keyword matching
- `markdownParser.ts` - Parses markdown files to extract recipe data

**`src/lib/data/`**
- `masterIngredients.ts` - Functions to access master ingredient list for pantry finder

### Hooks

- `useDeviceId` - Generates and persists a unique device identifier
- `useTimer` - Countdown timer with start, pause, resume, reset, stop controls
- `useCookingChecklist` - Manages ingredient checklist state with sessionStorage persistence

### Animation System

Centralized in `src/lib/constants/animations.ts`:
- `SPRING` configs (gentle, bouncy, stiff, soft)
- `pageVariants`, `cardVariants` for page/component transitions
- `staggerContainer`/`staggerItem` for list animations
- `drawerContent`/`modalContent`/`drawerBackdrop` for overlays
- `checkmarkVariants`/`strikethroughVariants` for checkbox animations
- `fadeIn`, `fadeInUp`, `slideLeft`, `slideRight` for general transitions
- `collapseVariants`, `tooltipVariants`, `buttonRipple` for micro-interactions
- `draggableVariants`/`droppableVariants` for drag-and-drop feedback

### Type System

Core types in `src/types/`:
- `Recipe`, `RecipeIngredient`, `Instruction`, `NutritionInfo`
- `UserRecipe` - Extends Recipe with `ownerId`, `sourceUrl`, `sourceType`, `photos`
- `RecipeSourceType`: 'manual' | 'markdown' | 'url_import'
- `ImportedRecipeData`, `ParsedIngredient`, `ParsedInstruction` for import flows
- `CreateRecipeInput`, `UpdateRecipeInput` for server actions
- `MealSlotType`: 'breakfast' | 'lunch' | 'dinner'
- `MealPlan`, `DayMealPlan` for calendar data
- `AggregatedIngredient`, `ShoppingListByCategory` for shopping
- `CookingSession`, `CookingStats`, `CookingRating` for meal tracking
- `MasterIngredient`, `IngredientCategory` for pantry finder
- `RecipeMatch`, `RecipePairing`, `RecipeSimilarity` for suggestions
- `ScalingResult`, `ScalingWarning` for recipe scaling

**Note:** `RecipeIngredient.ingredientId` can be `null` for user-imported ingredients that don't link to master ingredient list.

### Styling

Mediterranean color palette defined in `src/app/globals.css`:
- **olive** (primary) - natural green tones
- **terracotta** (secondary) - warm orange/brown
- **aegean** (accent) - Mediterranean blue
- **sand** (neutral) - warm grays

Fonts: Playfair Display (headings), Inter (body) via next/font/google.

### File Conventions

- Pages in `src/app/` follow Next.js App Router conventions
- Dynamic routes use `[id]` folder pattern
- All interactive components need `'use client'` directive
- Path alias `@/` maps to `src/`

### Navigation

Main navigation in `src/components/layout/Header.tsx`:
1. **Home** (`/`) - Landing page
2. **Recipes** (`/recipes`) - Recipe browsing with filters (includes user recipes)
3. **Pantry Finder** (`/pantry-finder`) - Find recipes by ingredients you have
4. **Meal Plan** (`/calendar`) - Calendar drag-and-drop meal planning
5. **Shopping List** (`/shopping-list`) - Aggregated shopping list
6. **History** (`/cooking-history`) - Cooking history with stats

Additional routes:
- `/recipes/my-recipes` - User's imported recipe collection with edit/delete
- `/recipes/import` - Recipe import hub
- `/recipes/import/url` - Import from URL
- `/recipes/import/markdown` - Import from markdown files
- `/recipes/[id]/edit` - Edit user recipe

**Context-Aware Navigation:**
Recipe detail pages use `?from=my-recipes` query param to determine back button behavior:
- From Recipe Collection → back to `/recipes`
- From My Recipes → back to `/recipes/my-recipes`

### Feature Integration Points

**Recipe Detail Page** (`src/app/recipes/[id]/page.tsx`)
- Scaling controls with presets and warnings
- Checkable ingredient list for gathering tracking
- Cooking timer (native on mobile, in-app modal on desktop)
- Smart suggestions (similar recipes, pairing recipes)
- Cooking stats (times cooked, average rating)
- Add to meal plan modal

**Calendar Page** (`src/components/calendar/`)
- `MealSlot.tsx` - Includes "Mark as Cooked" button on filled slots
- `CalendarDay.tsx` - Passes date to MealSlot for cooking log

**Pantry Finder Page** (`src/app/pantry-finder/page.tsx`)
- Ingredient search with autocomplete
- Recipe matching with percentage scores
- "What to buy next" suggestions sidebar

**My Recipes Page** (`src/app/recipes/my-recipes/page.tsx`)
- Grid of user's imported recipes using RecipeCard
- Filter by source type (URL Import, Markdown, Manual)
- Search by name/description
- Edit and delete actions on cards

**Recipe Import Flow** (`src/app/recipes/import/`)
- URL import uses Anthropic API to scrape and structure recipe data
- Markdown import parses `.md` files with recipe structure
- Both use `RecipePreviewCard` for inline editing before save
- Ingredients auto-categorized using `inferIngredientCategory()`
