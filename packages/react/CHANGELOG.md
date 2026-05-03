# @tour-kit/react

## 0.7.0

### Minor Changes

- Phase 1: Close client-only Usertour parity gaps. Six features ship across six packages with no breaking changes:

  - `useFlowSession` + `useBroadcast` for reload resume and cross-tab gating (`@tour-kit/core`)
  - `TourStep['kind']: 'visible' | 'hidden'` for branching without UI mounts (`@tour-kit/core`, `@tour-kit/react`)
  - `routeChangeStrategy` + `waitForStepTarget` + `TourRouteError` for cross-page tours that survive hard refresh (`@tour-kit/core`, `@tour-kit/react`)
  - `<ThemeProvider>` with system / dark / light / URL / predicate matchers and `useThemeVariation()` (`@tour-kit/react`)
  - 4 new `<TourProgress>` variants (`narrow`, `chain`, `numbered`, `none`) + 150ms tooltip docking + 200ms checklist completion animation (`@tour-kit/react`, `@tour-kit/checklists`)
  - `useReducedMotion()` exported from `@tour-kit/core` and honored across `@tour-kit/announcements`, `@tour-kit/surveys`, `@tour-kit/hints`

- cacf273: Cross-page flow continuation: per-step `routeChangeStrategy: 'auto' | 'prompt' | 'manual'` on `TourStep`. The `'auto'` default calls `router.navigate(step.route)`, then awaits the new step's target via the existing `MutationObserver`-based `waitForElement` (3000 ms timeout, 100 ms polling — neither). Surfaces failures as `TourRouteError({ code: 'TARGET_NOT_FOUND' | 'NAVIGATION_REJECTED' | 'TIMEOUT' })` through a new `onStepError` callback on `<TourProvider>`. `'prompt'` defers to `onNavigationRequired`; `'manual'` does nothing — the consumer drives navigation.

  The flow session blob is bumped to V2 (`currentRoute?: string` added). `parse()` accepts V1 blobs and migrates in-flight with `currentRoute: undefined`, so apps with persisted V1 sessions continue to load. On mount, if the persisted route differs from the current pathname the provider navigates first, awaits the target, then dispatches `START_TOUR` — a hard refresh during a multi-page tour now resumes on the right URL.

  The existing `waitForElement` utility gains an optional `signal: AbortSignal` parameter for cooperative cancellation (default behavior unchanged). The new public exports are `TourRouteError`, `waitForStepTarget`, and the `WaitForStepTargetOptions` type. All three router adapters — Next.js App Router, Next.js Pages Router, and React Router v6/v7 — work without changes.

- d5daf74: Extend `<TourProgress>` from 3 to 7 variants. New variants: `narrow` (thin progress bar), `chain` (segmented progress with completed/active/pending status), `numbered` (`"<current> / <total>"` chip), and `none` (renders `null` — useful for compound layouts that opt out). All visible aria-bearing variants expose `role="progressbar"` with `aria-valuenow={current}`, `aria-valuemin={1}`, `aria-valuemax={total}`, and `aria-label="Step N of M"`. Existing `text`, `dots`, and `bar` variants are unchanged.
- 81a1dcc: Add `<ThemeProvider>`, `resolveTheme`, and `ThemeMatcher` (discriminated union over `'system' | 'dark' | 'light' | 'url'`). Themes are applied via a `data-tk-theme` attribute on the provider root, switching CSS variables defined in `@tour-kit/react/styles/variables.css` without React tree re-renders for non-subscribed consumers. SSR-safe: the server-rendered HTML emits a fixed neutral `data-tk-theme="default"` and no inline CSS-variable style; the first client effect resolves the active variation and applies it. Phase 4b will add trait-predicate matchers.

### Patch Changes

- 716935c: Add hidden / invisible step support: `kind: 'visible' | 'hidden'` and `onEnter` lifecycle on `TourStep`.

  - Hidden steps run their `onEnter` (and legacy `onShow`) lifecycle plus `onNext` branching, then auto-advance without mounting any DOM card. Useful for trait-based forks, gating logic, and conditional completion.
  - New exports: `validateTour` and `TourValidationError`. `<TourProvider>` calls `validateTour` synchronously at mount; misconfigured hidden steps (carrying `target`, `content`, `title`, `placement`, or `advanceOn`) throw `TourValidationError({ code: 'INVALID_HIDDEN_STEP' })` immediately so consumers see config errors at render time, not at runtime.
  - Hidden-step chains are guarded against infinite loops: traversing more than 50 hidden steps in a single navigation throws `TourValidationError({ code: 'HIDDEN_STEP_LOOP' })`.
  - `useTourRoute` (`@tour-kit/react`) now defensively returns `currentStepRoute === undefined` when the active step is hidden.

  Backwards compatible — `kind` defaults to `'visible'`. Tours without any hidden steps behave bit-for-bit as before.

- d5daf74: Add a 150ms docking transition to `<TourCard>` so placement flips (e.g. `bottom` → `top` when the target scrolls near the viewport edge) tween smoothly instead of snapping. The transition class `transition-[transform,top,left] duration-150 ease-out` is applied to the floating element (the same element Floating UI positions via inline `transform`). The class is gated by `useReducedMotion()` from `@tour-kit/core` — users who prefer reduced motion get instant placement updates with no animation.
- 462d837: Add `'predicate'` matcher to `ThemeMatcher` and a `traits?: TTraits` prop to `<ThemeProvider>` (now generic: `<ThemeProvider<TTraits>>`). Predicates are evaluated after URL match and before system fallback, so `(traits) => traits.plan === 'enterprise'` flips the active variation as your host data changes. New `useThemeVariation()` hook returns the active `{ activeId, tokens }` with a stable reference identity across unrelated re-renders — safe in `useEffect` deps. Memoize `traits` at the consumer to honor the perf budget; an inline `traits={{ ... }}` object creates a new reference each render and forces the resolver effect to re-run. See the new `guides/theme-variations.mdx` page.
- a35d469: NPM SEO + README accuracy pass. Pure metadata and documentation — no public API changes.

  **`package.json` (11 packages, license unchanged)** — descriptions trimmed to ≤150 chars (front-loading the primary keyword phrase before npm search-card truncation) and keyword arrays reordered with high-intent long-tail terms first (`react-onboarding`, `nextjs-onboarding`, `onboarding-wizard`, `onboarding-flow`, `react-product-tour`, `product-demo`, `feature-hint`, `in-app-survey`, etc.). Generic single-word keywords (`react`, `tour`) deprioritized; `*-alternative` keywords retained or expanded.

  **READMEs (all 12 packages)** — rewritten on a unified template:

  - H1 + keyword-phrase tagline + badge row (npm version, downloads, bundle, types, license)
  - "Alternative to" line owning competitor-name SEO surface (`react-joyride-alternative`, `intro-js-alternative`, `shepherd-alternative`, etc.)
  - Quick Start that compiles against the actual exports
  - Comparison table vs major alternatives
  - Complete API reference verified against `src/index.ts` for every package — no fictional or missing exports
  - Cross-links to sibling `@tour-kit/*` npm pages
  - Docs link migrated from the broken `tour-kit.dev` / `tourkit.dev` to the live `usertourkit.com`
  - Correct license disclosure (MIT for free packages / Pro tier for proprietary)

  **Accuracy bugs fixed in the rewrite** (none of these compiled before):

  - `core` — Quick Start used `createTour({ id, steps })` and `createStep({ id, target, content: { title, description } })`, neither of which match the real signatures (`createTour(steps, options?)`, `createStep(target, content, options?)`). Rewritten using `createNamedTour` / `createNamedStep` for explicit IDs. Hook list was missing 4 public hooks (`useAdvanceOn`, `useBranch`, `useRoutePersistence`, `useUILibrary`) and 11 public utilities; all now documented.
  - `checklists` — referenced non-existent `<ChecklistItem>` (real export is `<ChecklistTask>`), `useChecklistItem` (real: `useTask`), `useChecklistProgress` (real: `useChecklistsProgress`), and claimed MIT licensing despite being a Pro package.
  - `analytics` — referenced non-existent `createAnalyticsPlugin`, `createSegmentPlugin`, and `useTrack`. Real plugin exports are `consolePlugin`, `posthogPlugin`, `mixpanelPlugin`, `amplitudePlugin`, `googleAnalyticsPlugin`. Real hooks are `useAnalytics` and `useAnalyticsOptional`. License also corrected from MIT to Pro.
  - `adoption`, `core`, `analytics`, `checklists`, `license` — broken docs URLs (`tour-kit.dev` / `tourkit.dev`) updated to `usertourkit.com`.
  - `media`, `surveys`, `scheduling` — these had no README at all; new ones added.

  This is the foundation for the npm-search SEO push: with corrected metadata and accurate, intent-rich READMEs, npm full-text indexing surfaces the packages for `react-onboarding`, `nextjs-onboarding`, `onboarding-wizard`, and competitor-alternative searches that were previously dead air.

- Updated dependencies
- Updated dependencies [d5daf74]
- Updated dependencies [cacf273]
- Updated dependencies [fa98539]
- Updated dependencies [716935c]
- Updated dependencies [a35d469]
  - @tour-kit/core@0.7.0

## 0.6.0

### Minor Changes

- 04520d7: Phase 1 of the code-health pass: hoist `cn()` into `@tour-kit/core` and minify `@tour-kit/adoption`'s build.

  **`@tour-kit/core`** — new public export `cn(...inputs: ClassValue[]): string` (re-exported from the package root). Composes `clsx` + `tailwind-merge`, byte-compatible with the eight prior duplicates. `clsx` and `tailwind-merge` are now declared `dependencies` of `@tour-kit/core` and listed as tsup externals so they remain peer-resolved.

  **`@tour-kit/ai`** — `@tour-kit/core` is no longer an optional peer; it is now a required workspace dependency. Apps that installed `@tour-kit/ai` without `@tour-kit/core` will need to add it (or rely on the auto-install from this dependency).

  **`@tour-kit/media`** — adds `@tour-kit/core` as a workspace dependency (was previously absent; cn was sourced from a local copy).

  **All consumer packages** — switched to `import { cn } from '@tour-kit/core'`. No public API changes for consumers. The 8 duplicate `cn()` implementations (7 × `lib/utils.ts` + `checklists/components/cn.ts`) have been removed.

  **`@tour-kit/adoption`** — `tsup.config.ts` flips `minify: true` (matching the other 11 configs). The bundled `dist/index.js` shrinks from 50,131 → 25,758 raw bytes (-49%) and 10,334 → 7,831 gzipped bytes (-24%). The `'use client'` directive is now prepended in `onSuccess` so it survives minification.

### Patch Changes

- Updated dependencies [04520d7]
  - @tour-kit/core@0.6.0

## 0.5.1

### Patch Changes

- 78dc120: Fix `onComplete` and `onSkip` callbacks firing multiple times, which caused `Maximum update depth exceeded` when the parent unmounted the `<Tour>` synchronously inside the callback (issue #6).

  - `TourProvider` now consolidates every completion path (`complete()`, `next()` at last step, branch `'complete'` / `'skip'` targets, and the no-visible-step auto-finish) through shared `completeTour` / `skipTour` helpers guarded by tour-id-keyed refs. The guard catches both stale-closure synchronous double-calls and post-`COMPLETE_TOUR` re-firing. Refs are re-armed on `start()` and on cross-tour branch transitions, so legitimate restarts still fire the callbacks.
  - `<Tour>` (in `@tour-kit/react`) wraps the consumer-supplied `onComplete` / `onSkip` with the same idempotency guard as a defense-in-depth layer.

- Updated dependencies [c03e87d]
- Updated dependencies [78dc120]
  - @tour-kit/core@0.5.1

## 0.5.0

### Minor Changes

- 65ee7f9: Wire `autoStart` through to `TourProvider`. Any tour declared with `autoStart: true`
  now activates on provider mount, matching the documented quick-start behavior.
  Persistence restore still wins — if a tour was previously interrupted, that tour
  resumes instead.

### Patch Changes

- Updated dependencies [65ee7f9]
  - @tour-kit/core@0.5.0

## 0.4.2

### Patch Changes

- 940847a: chore: update GitHub owner from `DomiDex` to `domidex01` in package metadata

  Updates `repository.url`, `homepage`, `bugs.url`, and LICENSE copyright to reflect the new GitHub account. No runtime or API changes — existing installs and imports are unaffected.

- Updated dependencies [940847a]
  - @tour-kit/core@0.4.2

## 0.4.1

### Patch Changes

- Fix lint errors and add biome-ignore comments for valid accessibility patterns

## 0.3.0

### Minor Changes

- ### @tour-kit/react

  - Fix `Tour` component to properly render children content alongside tour steps
  - Add `TourCard`, `TourOverlay`, and navigation components with Floating UI positioning
  - Add primitive components: `TourPortal`, `TourArrow`

  ### @tour-kit/core

  - Export hooks and utilities for tour state management
  - Add focus trap, keyboard navigation, and spotlight hooks

  ### @tour-kit/hints

  - Initial hints package setup

### Patch Changes

- Updated dependencies
  - @tour-kit/core@0.3.0

## 0.2.0

### Minor Changes

- Add tour hooks and utility functions

  ### New Hooks

  - `useTour` - Main tour control hook with state and actions
  - `useStep` - Individual step management hook
  - `useSpotlight` - Spotlight overlay positioning and styling
  - `useKeyboardNavigation` - Keyboard navigation (arrow keys, Escape)
  - `useFocusTrap` - Focus trap for accessibility compliance
  - `usePersistence` - Tour state persistence (localStorage/sessionStorage/cookies)
  - `useElementPosition` - Track element position with ResizeObserver
  - `useMediaQuery` / `usePrefersReducedMotion` - Media query hooks

  ### New Utilities

  - DOM utilities: `waitForElement`, `isElementVisible`, `getScrollParent`
  - Position utilities: `calculatePosition`, `getOptimalPlacement`
  - Scroll utilities: `scrollIntoView`, `getScrollOffset`
  - Storage utilities: `createStorageAdapter`, `createPrefixedStorage`
  - Accessibility utilities: `generateId`, `announceToScreenReader`, `trapFocus`
  - Factory functions: `createTour`, `createStep`

  ### Context Providers

  - `TourProvider` - Main tour state management with reducer
  - `TourKitProvider` - Configuration wrapper with merged configs

### Patch Changes

- Updated dependencies
  - @tour-kit/core@0.2.0

## 0.1.0

### Minor Changes

- 47e702c: Initial release of tour-kit packages

### Patch Changes

- Updated dependencies [47e702c]
  - @tour-kit/core@0.1.0
