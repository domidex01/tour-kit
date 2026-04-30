# @tour-kit/core

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
