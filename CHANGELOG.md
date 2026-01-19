# Changelog

All notable changes to MedDiet will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **14-day free trial system** - New users automatically receive a 14-day trial with full access to all features. Trial status is tracked in the database with automatic expiration handling. ([ae68f96](https://github.com/aleaming/cooking-mate/commit/ae68f96))
- **Stripe subscription integration** - Complete payment system with checkout, customer portal, and webhook handling for Basic and Pro subscription tiers. ([b1d9bd5](https://github.com/aleaming/cooking-mate/commit/b1d9bd5))
- **Recipe import system** - Import recipes from URLs (AI-powered scraping) or markdown files. Includes photo management for user recipes. ([5ea1823](https://github.com/aleaming/cooking-mate/commit/5ea1823))
- **Dark mode support** - Full dark mode theme with toggle in settings. Persists user preference across sessions. ([c821444](https://github.com/aleaming/cooking-mate/commit/c821444))
- **Email/password authentication** - Secure authentication via Supabase with login, signup, password reset, and protected routes. ([78f2dc9](https://github.com/aleaming/cooking-mate/commit/78f2dc9))
- **Settings and profile pages** - User settings for preferences, theme selection, password changes, and account management. ([c821444](https://github.com/aleaming/cooking-mate/commit/c821444))
- **Homepage content update** - Refreshed landing page with feature highlights and improved call-to-action. ([09d5005](https://github.com/aleaming/cooking-mate/commit/09d5005))

### Fixed

- **User recipes in meal planner** - User-created recipes now properly appear in the meal planner sidebar and recipes page. ([c257d7b](https://github.com/aleaming/cooking-mate/commit/c257d7b))
- **Light/dark mode defaults** - Fixed default theme to light mode and corrected dark mode background colors. ([986331e](https://github.com/aleaming/cooking-mate/commit/986331e))
- **RLS INSERT policy** - Added missing Row Level Security policy for profile creation and fixed button alignment issues. ([0ef0895](https://github.com/aleaming/cooking-mate/commit/0ef0895))
- **Checkbox nesting** - Resolved React hydration warning from improper checkbox component nesting. ([09d5005](https://github.com/aleaming/cooking-mate/commit/09d5005))

### Changed

- **Design system audit** - Standardized components across the application for consistent styling and improved maintainability. ([0ff45f1](https://github.com/aleaming/cooking-mate/commit/0ff45f1))
- **Shopping list refactor** - Updated to use the shared Checkbox component for consistent UI. ([b3ff836](https://github.com/aleaming/cooking-mate/commit/b3ff836))
- **Background colors and textures** - Adjusted sand/paper texture backgrounds for better visual consistency. ([0245e37](https://github.com/aleaming/cooking-mate/commit/0245e37))
- **Recipe card styling** - Removed borders from recipe suggestion cards for cleaner appearance. ([25b9d1c](https://github.com/aleaming/cooking-mate/commit/25b9d1c))
- **Updated logo and favicons** - New custom logo design with regenerated favicon set for all platforms. ([9049dba](https://github.com/aleaming/cooking-mate/commit/9049dba))

### Removed

- Recipe card borders for cleaner visual design. ([9ae3b92](https://github.com/aleaming/cooking-mate/commit/9ae3b92))

---

## Contributing

When adding to this changelog:
- Group changes under: Added, Changed, Deprecated, Removed, Fixed, Security
- Include commit hash links for traceability
- Write in past tense, user-focused language
