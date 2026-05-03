# @tour-kit/core

## 0.7.0

### Minor Changes

- Phase 1: Close client-only Usertour parity gaps. Six features ship across six packages with no breaking changes:

  - `useFlowSession` + `useBroadcast` for reload resume and cross-tab gating (`@tour-kit/core`)
  - `TourStep['kind']: 'visible' | 'hidden'` for branching without UI mounts (`@tour-kit/core`, `@tour-kit/react`)
  - `routeChangeStrategy` + `waitForStepTarget` + `TourRouteError` for cross-page tours that survive hard refresh (`@tour-kit/core`, `@tour-kit/react`)
  - `<ThemeProvider>` with system / dark / light / URL / predicate matchers and `useThemeVariation()` (`@tour-kit/react`)
  - 4 new `<TourProgress>` variants (`narrow`, `chain`, `numbered`, `none`) + 150ms tooltip docking + 200ms checklist completion animation (`@tour-kit/react`, `@tour-kit/checklists`)
  - `useReducedMotion()` exported from `@tour-kit/core` and honored across `@tour-kit/announcements`, `@tour-kit/surveys`, `@tour-kit/hints`

- d5daf74: Add SSR-safe `useReducedMotion()` hook (Comeau pattern). Defaults to `true` server-side and on the first client render, then flips to the actual `matchMedia('(prefers-reduced-motion: reduce)')` value after the first effect. Designed for animation classes that must default to "no animation" during SSR/first paint to avoid a one-frame motion flash for users who have requested reduced motion. The existing `usePrefersReducedMotion()` hook (defaults to `false`) is preserved for backward compatibility.
- cacf273: Cross-page flow continuation: per-step `routeChangeStrategy: 'auto' | 'prompt' | 'manual'` on `TourStep`. The `'auto'` default calls `router.navigate(step.route)`, then awaits the new step's target via the existing `MutationObserver`-based `waitForElement` (3000 ms timeout, 100 ms polling — neither). Surfaces failures as `TourRouteError({ code: 'TARGET_NOT_FOUND' | 'NAVIGATION_REJECTED' | 'TIMEOUT' })` through a new `onStepError` callback on `<TourProvider>`. `'prompt'` defers to `onNavigationRequired`; `'manual'` does nothing — the consumer drives navigation.

  The flow session blob is bumped to V2 (`currentRoute?: string` added). `parse()` accepts V1 blobs and migrates in-flight with `currentRoute: undefined`, so apps with persisted V1 sessions continue to load. On mount, if the persisted route differs from the current pathname the provider navigates first, awaits the target, then dispatches `START_TOUR` — a hard refresh during a multi-page tour now resumes on the right URL.

  The existing `waitForElement` utility gains an optional `signal: AbortSignal` parameter for cooperative cancellation (default behavior unchanged). The new public exports are `TourRouteError`, `waitForStepTarget`, and the `WaitForStepTargetOptions` type. All three router adapters — Next.js App Router, Next.js Pages Router, and React Router v6/v7 — work without changes.

- fa98539: Add `useFlowSession` and `useBroadcast` hooks for active-tour resume and cross-tab pause.

  - `routePersistence.flowSession` (opt-in) persists the active tour's `(tourId, stepIndex)` so a hard refresh resumes the tour at the same step. Defaults: `sessionStorage` with 1h TTL, throttled writes (200ms trailing edge).
  - `routePersistence.crossTab` (opt-in) coordinates across tabs via `BroadcastChannel`. When tab A starts a tour, any tab with the same active tour id pauses and fires the new `onTourPaused(tourId, 'cross-tab')` callback on `<TourProvider>`.
  - New types: `FlowSessionConfig`, `CrossTabConfig`, `UseFlowSessionConfig`, `UseFlowSessionReturn`, `UseBroadcastReturn`.

  Both fields are `undefined` by default — apps that don't pass them keep current behavior bit-for-bit. No new runtime dependencies; the `BroadcastChannel`-undefined fallback is a no-op so older Safari users still get a working tour without cross-tab sync.

- 716935c: Add hidden / invisible step support: `kind: 'visible' | 'hidden'` and `onEnter` lifecycle on `TourStep`.

  - Hidden steps run their `onEnter` (and legacy `onShow`) lifecycle plus `onNext` branching, then auto-advance without mounting any DOM card. Useful for trait-based forks, gating logic, and conditional completion.
  - New exports: `validateTour` and `TourValidationError`. `<TourProvider>` calls `validateTour` synchronously at mount; misconfigured hidden steps (carrying `target`, `content`, `title`, `placement`, or `advanceOn`) throw `TourValidationError({ code: 'INVALID_HIDDEN_STEP' })` immediately so consumers see config errors at render time, not at runtime.
  - Hidden-step chains are guarded against infinite loops: traversing more than 50 hidden steps in a single navigation throws `TourValidationError({ code: 'HIDDEN_STEP_LOOP' })`.
  - `useTourRoute` (`@tour-kit/react`) now defensively returns `currentStepRoute === undefined` when the active step is hidden.

  Backwards compatible — `kind` defaults to `'visible'`. Tours without any hidden steps behave bit-for-bit as before.

### Patch Changes

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

## 0.6.0

### Minor Changes

- 04520d7: Phase 1 of the code-health pass: hoist `cn()` into `@tour-kit/core` and minify `@tour-kit/adoption`'s build.

  **`@tour-kit/core`** — new public export `cn(...inputs: ClassValue[]): string` (re-exported from the package root). Composes `clsx` + `tailwind-merge`, byte-compatible with the eight prior duplicates. `clsx` and `tailwind-merge` are now declared `dependencies` of `@tour-kit/core` and listed as tsup externals so they remain peer-resolved.

  **`@tour-kit/ai`** — `@tour-kit/core` is no longer an optional peer; it is now a required workspace dependency. Apps that installed `@tour-kit/ai` without `@tour-kit/core` will need to add it (or rely on the auto-install from this dependency).

  **`@tour-kit/media`** — adds `@tour-kit/core` as a workspace dependency (was previously absent; cn was sourced from a local copy).

  **All consumer packages** — switched to `import { cn } from '@tour-kit/core'`. No public API changes for consumers. The 8 duplicate `cn()` implementations (7 × `lib/utils.ts` + `checklists/components/cn.ts`) have been removed.

  **`@tour-kit/adoption`** — `tsup.config.ts` flips `minify: true` (matching the other 11 configs). The bundled `dist/index.js` shrinks from 50,131 → 25,758 raw bytes (-49%) and 10,334 → 7,831 gzipped bytes (-24%). The `'use client'` directive is now prepended in `onSuccess` so it survives minification.

## 0.5.1

### Patch Changes

- c03e87d: Fix six semantic bugs surfaced by the tk-bug-hunter audit:

  - `useKeyboardNavigation` now ignores keypresses while focus is in `<select>`, `[contenteditable]`, or `role="textbox"` elements, so rich-text editors (TipTap, Lexical, ProseMirror) no longer trigger tour navigation while the user is typing.
  - `getFocusableElements` (used by `useFocusTrap`) no longer drops `position: fixed` descendants; the filter now uses `getComputedStyle` for `display` / `visibility` instead of `offsetParent`, which is null for fixed-positioned elements.
  - `createCookieStorage().getItem()` escapes regex metacharacters in cookie keys so tour IDs containing `.`, `-`, `(`, etc. round-trip correctly.
  - `lockScroll()` is now ref-counted: nested calls share a single lock, the saved scroll position is captured once, and previous inline body styles are restored on unlock. Fixes the case where a tour card opens a modal that also locks scroll.
  - `useRoutePersistence({ syncTabs: true })` now actually reacts to cross-tab `storage` events via a new additive `externalVersion` return field; the `TourProvider` re-runs its restore effect when this value changes. The no-op manual `StorageEvent` dispatch inside `save()` was removed — browsers already fire those on other tabs automatically.
  - The `UPDATE_TOURS` reducer shallow-equality-checks the incoming array and skips state updates when tour references are unchanged, preventing unnecessary re-renders when consumers pass `tours` as an inline literal.

  Also removes five unused test-utility factories (`createResizeObserverMock`, `createIntersectionObserverMock`, `createMutationObserverMock`, `createTimerTracker`, `createStorageTracker`) from `cleanup-test-utils.ts`.

- 78dc120: Fix `onComplete` and `onSkip` callbacks firing multiple times, which caused `Maximum update depth exceeded` when the parent unmounted the `<Tour>` synchronously inside the callback (issue #6).

  - `TourProvider` now consolidates every completion path (`complete()`, `next()` at last step, branch `'complete'` / `'skip'` targets, and the no-visible-step auto-finish) through shared `completeTour` / `skipTour` helpers guarded by tour-id-keyed refs. The guard catches both stale-closure synchronous double-calls and post-`COMPLETE_TOUR` re-firing. Refs are re-armed on `start()` and on cross-tour branch transitions, so legitimate restarts still fire the callbacks.
  - `<Tour>` (in `@tour-kit/react`) wraps the consumer-supplied `onComplete` / `onSkip` with the same idempotency guard as a defense-in-depth layer.

## 0.5.0

### Minor Changes

- 65ee7f9: Wire `autoStart` through to `TourProvider`. Any tour declared with `autoStart: true`
  now activates on provider mount, matching the documented quick-start behavior.
  Persistence restore still wins — if a tour was previously interrupted, that tour
  resumes instead.

## 0.4.2

### Patch Changes

- 940847a: chore: update GitHub owner from `DomiDex` to `domidex01` in package metadata

  Updates `repository.url`, `homepage`, `bugs.url`, and LICENSE copyright to reflect the new GitHub account. No runtime or API changes — existing installs and imports are unaffected.

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

## 0.1.0

### Minor Changes

- 47e702c: Initial release of tour-kit packages
