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
│   ├── (auth)/           # Auth pages (login, signup, confirm-email, forgot-password)
│   ├── api/stripe/       # Stripe webhook and checkout API routes
│   ├── auth/callback/    # Supabase auth callback handler
│   ├── calendar/         # Calendar view for meal planning
│   ├── cooking-history/  # Cooking history timeline with stats
│   ├── family/           # Family sharing feature
│   │   ├── join/[token]/ # Accept invitation page
│   │   └── settings/     # Family management page
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
│   ├── auth/             # Auth components (AuthForm, PasswordInput)
│   ├── calendar/         # Calendar-specific components
│   ├── cooking-log/      # Meal tracking components (rating, logging)
│   ├── family/           # Family sharing components
│   ├── import/           # Recipe import components (RecipePreviewCard)
│   ├── layout/           # Layout components (header, nav)
│   ├── onboarding/       # Onboarding components (WelcomeModal)
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
│   ├── actions/          # Server actions (userRecipes, scrapeRecipe, storage, family*)
│   ├── auth/             # Auth server actions (login, signup, resendConfirmation)
│   ├── constants/        # Animation configs, etc.
│   ├── data/             # Data access functions
│   ├── stripe/           # Stripe config and utilities (validateStripeConfig)
│   ├── supabase/         # Supabase client setup
│   └── utils/            # Utility functions
├── stores/               # Zustand stores
└── types/                # TypeScript type definitions
```

### State Management

Five Zustand stores with persist middleware:

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

**useOnboardingStore** (`src/stores/useOnboardingStore.ts`)
- Tracks onboarding flows: `hasSeenWelcome`, `hasSeenImportGuide`
- Methods: `markWelcomeSeen()`, `markImportGuideSeen()`, `reset()`
- Used to show welcome modal on first login after subscription
- Persists to `meddiet-onboarding` in localStorage

**useFamilyStore** (`src/stores/useFamilyStore.ts`)
- Manages family sharing state: `activeFamily`, `familyMembers`, `familyMode`
- Tracks user's families and pending invitations
- Methods: `setActiveFamily()`, `toggleFamilyMode()`, `fetchMyFamilies()`, `fetchFamilyMembers()`
- Permission helpers: `getPermissions()`, `canUserVote()`, `isOwnerOrAdmin()`
- Persists to `meddiet-family` in localStorage

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

**Auth Server Actions** (`src/lib/auth/actions.ts`):
- `login(formData)` - Sign in user, detects unconfirmed email errors, supports `returnUrl`
- `signup(formData)` - Register new user with email confirmation, supports `returnTo` preservation
- `logout()` - Sign out user
- `resendConfirmation(formData)` - Resend email confirmation link, preserves `returnTo`

**Family Server Actions** (`src/lib/actions/family*.ts`):
- `createFamily(name)` - Create new family, user becomes owner
- `getMyFamilies()` - List families user belongs to
- `getFamilyById(familyId)` - Get family details with members
- `updateFamily(familyId, data)` - Update family settings (owner/admin only)
- `deleteFamily(familyId)` - Delete family (owner only)
- `leaveFamily(familyId)` - Leave a family (non-owners)

**Family Invitation Actions** (`src/lib/actions/familyInvitations.ts`):
- `sendInvitation(input)` - Create invitation with token (manual link sharing)
- `getInvitationByToken(token)` - Get invitation preview for acceptance page
- `acceptInvitation(token)` - Accept invitation and join family
- `getPendingInvitations(familyId)` - List pending invites for a family
- `revokeInvitation(invitationId)` - Cancel pending invite
- `resendInvitation(invitationId)` - Create new invitation (revokes old one)

**Family Member Actions** (`src/lib/actions/familyMembers.ts`):
- `updateMemberRole(memberId, role)` - Change member role (owner/admin only)
- `removeMember(memberId)` - Remove member from family
- `updateMemberNickname(memberId, nickname)` - Set display name

**Database Schema:**
- `recipes` table - Core recipe data with `owner_id` foreign key
- `recipe_ingredients` table - Ingredients with optional `ingredient_id` (null for user imports)
- `recipe_photos` table - User-uploaded recipe images
- `families` table - Family/household groups with `owner_id`, `max_members` (default 5)
- `family_members` table - Membership with `role` (owner/admin/voter/viewer)
- `family_invitations` table - Token-based invitations with 7-day expiry
- `family_meal_plans` table - Shared meal plans with voting status
- `family_meal_votes` table - Vote records (approve/reject/abstain)

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

**Onboarding Components** (`src/components/onboarding/`)
- `WelcomeModal` - Tier-specific welcome modal for new subscribers (Basic vs Pro features)
  - Props: `isOpen`, `onClose`, `tier: SubscriptionTier`
  - Shown on first login after subscription via `useOnboardingStore`

**Auth Components** (`src/components/auth/`)
- `AuthForm` - Shared form wrapper for auth pages with title, description, error/success handling
- `PasswordInput` - Password field with show/hide toggle

**Family Components** (`src/components/family/`)
- `FamilyDashboard` - Overview of family with member list and quick actions
- `FamilyMemberList` - List of members with role badges and management actions
- `FamilyMemberCard` - Individual member card with role, actions (kick, change role)
- `CreateFamilyModal` - Modal to create new family with name input
- `InviteMemberModal` - Send invitation with email, role selection, and copy link
- `InvitationList` - Pending invitations with resend/revoke actions
- `AcceptInvitationCard` - Invitation preview with accept/decline buttons
- `FamilySettingsForm` - Edit family name and settings
- `FamilyModeToggle` - Switch between personal and family mode
- `RoleBadge` - Colored badge for member roles (olive=owner, aegean=admin, terracotta=voter, sand=viewer)

### Utility Functions

**`src/lib/utils/`**
- `dates.ts` - Date formatting and calendar helpers using date-fns
- `ingredients.ts` - Shopping list aggregation logic
- `deviceId.ts` - Unique device ID generation using uuid
- `recipeScaling.ts` - Smart recipe scaling with warnings for non-linear ingredients
- `recipeOverlap.ts` - Recipe pairing/similarity analysis, shopping efficiency calculations
- `ingredientMatching.ts` - Pantry finder logic, recipe matching by available ingredients, `getMostCommonIngredients()` for quick selection
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
- `AuthErrorCode`: 'invalid_credentials' | 'email_not_confirmed' | 'email_taken' | 'weak_password' | 'server_error' | 'send_failed'
- `SubscriptionTier`: 'basic' | 'pro'
- `SubscriptionStatus`: 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid' | null
- `Family`, `FamilyMember`, `FamilyWithMembers` for family data
- `FamilyRole`: 'owner' | 'admin' | 'voter' | 'viewer'
- `FamilyInvitation`, `FamilyInvitationWithDetails`, `InvitationPreview`
- `InvitationStatus`: 'pending' | 'accepted' | 'expired' | 'revoked'
- `FamilyMealPlan`, `FamilyMealVote`, `MealPlanStatus`, `VoteType`
- `FamilyPermissions` - Permission flags based on role
- `FamilyActionResponse<T>` - Standard response type with data/error

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
3. **My Recipes** (`/recipes/my-recipes`) - User's imported recipe collection
4. **Pantry Finder** (`/pantry-finder`) - Find recipes by ingredients you have
5. **Meal Plan** (`/calendar`) - Calendar drag-and-drop meal planning
6. **Shopping List** (`/shopping-list`) - Aggregated shopping list
7. **History** (`/cooking-history`) - Cooking history with stats
8. **Family** (`/family`) - Family dashboard (when in family mode)

Additional routes:
- `/recipes/my-recipes` - User's imported recipe collection with edit/delete
- `/recipes/import` - Recipe import hub
- `/recipes/import/url` - Import from URL
- `/recipes/import/markdown` - Import from markdown files
- `/recipes/[id]/edit` - Edit user recipe

Auth routes (`src/app/(auth)/`):
- `/login` - Sign in page with resend confirmation link for unconfirmed users
- `/signup` - Registration page (redirects to `/confirm-email` on success)
- `/confirm-email` - Email confirmation pending page with resend option
- `/forgot-password` - Password reset request
- `/auth/callback` - OAuth/email confirmation callback handler (supports `next` param)

Family routes:
- `/family` - Family dashboard with member list and actions
- `/family/settings` - Family management (name, members, invitations)
- `/family/join/[token]` - Accept invitation page (works for logged-in and new users)

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
- Multi-select quick options grid (8 most common ingredients by frequency)
- "Find Recipes" button appears after selecting quick options
- Recipe matching with percentage scores and filter controls (min match %, sort by)
- "Clear all" button resets all selections and filters to defaults
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

### Stripe Integration

**Configuration** (`src/lib/stripe/config.ts`):
- `PLANS` object defines Basic and Pro tier pricing/features
- `getPriceId(tier, period)` returns price ID for checkout
- `validateStripeConfig()` validates all price IDs are configured

**Checkout Flow**:
1. User selects plan on `/pricing`
2. `POST /api/stripe/checkout` creates Stripe checkout session
3. On success, Stripe redirects to `/calendar?subscription=success`
4. Webhook updates `profiles.subscription_status` and `subscription_tier`

**Required Environment Variables**:
```
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_BASIC_MONTHLY
STRIPE_PRICE_BASIC_YEARLY
STRIPE_PRICE_PRO_MONTHLY
STRIPE_PRICE_PRO_YEARLY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
```

### Supabase Auth Configuration

**Email Confirmation**:
- Signup includes `emailRedirectTo: ${siteUrl}/auth/callback`
- Email confirmation required before login (when enabled in Supabase)
- `/confirm-email` page shows pending state with resend option

**Auth Callback** (`src/app/auth/callback/route.ts`):
- Exchanges auth code for session
- Supports `next` query param for custom redirect destination
- Default: checks subscription status, redirects to `/pricing` or `/calendar`

**returnTo Parameter Flow**:
The auth system preserves `returnTo` through the entire signup flow for deep linking:
1. `/signup?returnTo=/family/join/[token]` - Signup page reads param
2. Form includes hidden `returnTo` field passed to server action
3. `signup()` action includes `returnTo` as `next` in email redirect URL
4. `/confirm-email?returnTo=...` - Preserves param for resend flow
5. Email link → `/auth/callback?next=/family/join/[token]`
6. Callback redirects to the original destination

This enables invitation acceptance for new users who need to sign up first.

**Required Configuration** (Supabase Dashboard → Auth):
- Site URL: `https://your-domain.com` (no trailing slash)
- Redirect URLs: `https://your-domain.com/auth/callback`

### Family Sharing Feature

**Overview**: Enables households to collaborate on meal planning with role-based permissions.

**Roles** (hierarchical):
- **Owner** - Full control, can delete family, only one per family
- **Admin** - Can manage members and invitations
- **Voter** - Can vote on meal proposals
- **Viewer** - View-only access to family content

**Invitation Flow**:
1. Owner/Admin creates invitation via `InviteMemberModal`
2. System generates unique token (64-char hex), expires in 7 days
3. Inviter manually shares link: `/family/join/[token]`
4. Recipient visits link → sees invitation preview
5. If logged in → can accept immediately
6. If not logged in → signup flow preserves `returnTo` to return after confirmation
7. On accept → `accept_family_invitation()` database function creates membership

**Database Functions** (SECURITY DEFINER):
- `is_family_member(family_id, user_id)` - Check membership
- `get_family_role(family_id, user_id)` - Get user's role
- `can_manage_family(family_id, user_id)` - Check owner/admin
- `can_vote_in_family(family_id, user_id)` - Check voting permission
- `accept_family_invitation(token, user_id)` - Handle invitation acceptance
- `get_invitation_by_token(token)` - Get invitation preview

**RLS Policies**: All family tables use Row Level Security with policies that call the helper functions above to prevent infinite recursion.
