# @tour-kit/core

## 1.0.6

### Patch Changes

- d870c32: Hydration safety: persisted tour state no longer influences the first client
  render. `useFlowSession` seeded its state from a render-time storage read, and
  `TourProvider` seeded `completedTours`/`skippedTours` from storage in the
  reducer's initial state — so the first client render could differ from the
  server-rendered HTML, shifting React `useId` tree positions and breaking
  hydration for downstream `useId` consumers (seen as an `aria-controls`
  mismatch on the checklists launcher). Persisted state now loads in post-mount
  effects (new `HYDRATE_TERMINAL_TOURS` action; `useFlowSession` exposes
  `ready`), with the flow-session → route-persistence → autoStart precedence
  preserved via the `ready` gate. `TourKitProvider`'s `dir="auto"` detection
  also no longer reads `document.dir` during the initial render. SSR regression
  suite added.

## 1.0.3

### Patch Changes

- 8a443fb: Dedupe noisy dev-only warnings to once per page/session.

  The unlicensed `[TourKit] … without a valid license` warning previously logged
  once per mounted Pro package (≈9–10× on a page using several). `<LicenseWarning>`
  now prints at most once per session. Likewise, `<TourProvider>`'s dev
  `diagnose` tip now fires once per session instead of once per provider instance
  (it printed twice on pages with multiple tours).

- 8a443fb: Fix SSR hydration mismatch in reduced-motion detection.

  `@tour-kit/core`'s `useMediaQuery` (and the `usePrefersReducedMotion` /
  `useReducedMotion` hooks built on it) now use `useSyncExternalStore` with a
  server snapshot of `false`, so the first client render always matches the
  server markup before flipping to the real `matchMedia` value after hydration.

  `@tour-kit/media`'s `usePrefersReducedMotion` no longer reads `matchMedia` in a
  `useState` initializer (which returned `false` on the server but `true` on the
  client for reduced-motion users, causing a hydration mismatch in `TourMedia`
  and `MediaHeadless`). It now delegates to core's SSR-safe `useReducedMotion`,
  matching `MediaSlot`.

- 8a443fb: Fix `TourCard` focus management (WCAG 2.4.3).

  `TourCard` declared `aria-modal="true"` but never trapped focus or restored it
  on close — keyboard/screen-reader users could Tab into the dimmed background and
  were dumped to `<body>` when the tour closed. Root cause: `TourPortal` mounts
  its node lazily, so the focus trap's `activate()` ran against a null container
  and silently bailed (never capturing the element to restore focus to).

  `TourCard` now tracks the portaled node in state so the trap engages once the
  card mounts, restores focus to the invoking trigger on close (X and Skip), and
  marks the background `inert` for true modal semantics. Crucially, `aria-modal`,
  the focus trap, and the inert background are now applied **only to modal steps**
  — steps with `interactive: true` (spotlight/branching) stay non-modal so
  keyboard users can still reach the highlighted target.

  `@tour-kit/core`'s `useFocusTrap` gains an opt-in `{ inertBackground }` option,
  pulls drifting focus back into the container, and is idempotent across Strict
  Mode double-invocations.

## 1.0.2

### Patch Changes

- ef31ce6: chore: move 7 runtime dependencies into the pnpm catalog

  `@floating-ui/react`, `class-variance-authority`, `@radix-ui/react-slot`,
  `@radix-ui/react-dialog`, `@mui/base`, `clsx`, `tailwind-merge` are now
  resolved via `catalog:` in `pnpm-workspace.yaml`. No version changes; no
  behavior changes. Cuts future bumps from a 9-file find-and-replace to a
  one-line edit and prevents accidental drift.

  Refs: audit R-3.

## 1.0.1

### Patch Changes

- a17322c: Extract TourProvider navigation orchestrators into the new internal
  `tour-engine` module (refactor-train phase 5).

  `navigateToStep`, `handleBranchTarget`, and the related step-visibility
  helpers (`buildCallbackContext`, `evaluateStepWhen`, `findNextVisibleStepIndex`,
  `findNearestVisibleStepIndex`, `isNavigationNeeded`) move out of
  `tour-provider.tsx` into pure module-level functions under
  `packages/core/src/lib/tour-engine/`. The engine impls receive a
  `TourEngineContext` (refs/getters) so async navigation reads fresh state
  across await boundaries.

  Behavior is preserved: all 928 existing core tests pass, plus 34 new direct
  engine unit tests. Provider LOC drops from 1803 to 1372, and the
  `noExcessiveCognitiveComplexity` ignore count drops from 5 to 3 (reducer,
  flow-restore, prev — `navigateToStep` and `handleBranchTarget` no longer
  need provider-side ignores).

  No public API change.

## 1.0.0

### Major Changes

- d67d905: Phase 3 (refactor train) — Dead position API removal, hidden-step type tightening, announcements priority comparator.

  **Workstream A — `@tour-kit/core` / `@tour-kit/react` BREAKING:**

  Removed from public barrels (no production callers found in `packages`, `apps`, `examples`, or sibling `tourkit-dash`):

  - `calculatePosition`
  - `calculatePositionWithCollision`
  - `wouldOverflow`
  - `getFallbackPlacements`
  - `PositionResult` (type)

  `ElementPositionResult` (the deliberately similar but unrelated type consumed by `useElementPosition`) is preserved. The math functions still live in `packages/core/src/utils/position.ts` for internal use; only the public exports are gone.

  **Workstream B — `@tour-kit/announcements` improvement:**

  - New `createAnnouncementComparator(order, weights, sequenceById)` helper in `@tour-kit/announcements/core/priority-queue`. Replaces an inline `priorityOrder: Record<string, number>` literal in `<AnnouncementsProvider>` that hardcoded `{ critical: 0, high: 1, normal: 2, low: 3 }` and ignored both `QueueConfig.priorityWeights` and `priorityOrder: 'fifo' | 'lifo'`.
  - New `AnnouncementScheduler.queueConfig` getter (`Readonly<QueueConfig>`). Provider now reads queue config through a public getter instead of poking the private `schedulerRef.current.config` field.
  - Custom `priorityWeights` and `priorityOrder: 'fifo' | 'lifo'` now actually drive auto-show ordering. This is a behavior fix for users who relied on the previous (broken) default-weight behavior.

  **Workstream C — `@tour-kit/core` API surface widening (mostly back-compat):**

  - `TourStep` is now a discriminated union: `TourStep = VisibleTourStep | HiddenTourStep`.
  - `VisibleTourStep` requires `target` and `content` (matches the previous required surface).
  - `HiddenTourStep` declares `target?: never`, `content?: never`, `title?: never`, `placement?: never`, `advanceOn?: never` so authoring `{ kind: 'hidden', target: '#x' }` is a TypeScript error — mirroring the runtime check in `validateTour`.
  - New `isVisibleStep(step): step is VisibleTourStep` type guard (runtime + type-level).
  - New named exports `VisibleTourStep`, `HiddenTourStep`, and `isVisibleStep` from `@tour-kit/core`.
  - `createStep` / `createNamedStep` return `VisibleTourStep` (was `TourStep`) — hidden steps were never constructable via this helper.
  - `validateTour` no longer uses the `as unknown as Record<string, unknown>` cast; reads `step[field]` directly through the narrowed `HiddenTourStep` branch.
  - `waitForStepTarget(step, opts)` now takes `VisibleTourStep` (was `TourStep`). The provider already narrowed before calling it.

  Hidden step callers that read UI fields (`target`, `content`, etc.) need to narrow with `step.kind !== 'hidden'` or `isVisibleStep(step)` before access. This was a silent bug surface before — the union enforces it now.

## 0.14.0

### Minor Changes

- 8c4ef89: target-as-ref + MultiTourKit compose-mode (Phase 5 of v2 package polish).

  The `target` prop on `TourStep` and `HintConfig` now accepts a third shape —
  a getter function `() => HTMLElement | null` — alongside the existing string
  selector and `RefObject<HTMLElement | null>`. All runtime dereference paths
  (use-step, use-element-position, wait-for-step-target, utils/dom, plus four
  React card/overlay consumers and both hints components) route through a
  single new `resolveTarget` resolver exported from `@tour-kit/core`. The
  union widening is fully backwards-compatible — existing string selectors
  keep working with no console warning, and the resolver is SSR-safe (returns
  null when `document` is undefined instead of throwing).

  `<MultiTourKitProvider>` compose-mode is now the documented default: the
  JSDoc example puts every `<Tour>`, `<TourOverlay>`, `<TourCard>`, and `<App />`
  as children of the provider, and `useTour()` resolves through the registry
  from any depth. The provider's runtime behavior is unchanged.

  A new best-effort jscodeshift codemod `--from target-to-ref` rewrites
  `target="#foo"` to `target={fooRef}` when a matching `useRef` binding lives
  in the same file. Ambiguous matches get a `TODO(tour-kit): target-to-ref`
  comment instead of a destructive rewrite, and the transform is idempotent
  under re-runs.

  Docs page: `/docs/react/target-prop`.

## 0.12.0

### Minor Changes

- d777614: Phase 8 dashboard-next QA pass: analytics event coverage, a11y fixes, autostart correctness, and watermark visual polish.

  **Analytics event coverage.** New `TourEventName` values — `announcement_shown`, `announcement_dismissed`, `announcement_completed`, `checklist_task_completed`, `checklist_completed`, and `schedule_evaluated` — are now emitted by their respective providers when an analytics plugin is registered. `consolePlugin` will surface them as `[tour-kit]` groups; production destinations (`@tour-kit/analytics`) receive them via the same `track()` interface.

  **Tour autostart respects completed tours.** `<TourProvider>` no longer auto-restarts a tour that the user has already completed (or skipped) across route navigations. State is sourced from `usePersistence` when `persistence.trackCompleted` is enabled, and `ADD_COMPLETED` / `ADD_SKIPPED` reducers now dedupe to prevent the list from growing on repeat dispatches.

  **Announcement dialog a11y.** `AnnouncementModal` now forwards `aria-describedby` when a description exists and renders content with `asDialogContent` so Radix's title/description requirements are satisfied — eliminates the `DialogTitle is required` and `DialogDescription` console warnings.

  **Schedule diagnostics.** `useSchedule` exposes the evaluation `reason` (`outside_window`, `holiday`, `before_start_date`, `after_end_date`, etc.) on the hook return so consumers can render or log why a banner is hidden without inspecting the schedule shape themselves.

  **License watermark refresh.** The unlicensed badge now renders the User Tour Kit logo (14×14 SVG) in place of the amber dot — same singleton, same portal, same `pointer-events: none` wrapper, just a clearer visual signal.

  **Install graph: `@tour-kit/analytics` peer → direct dependency.** `@tour-kit/adoption`, `@tour-kit/announcements`, `@tour-kit/checklists`, `@tour-kit/hints`, `@tour-kit/react`, and `@tour-kit/scheduling` now declare `@tour-kit/analytics` as a regular dependency rather than an optional peer. Consumers no longer need to install `@tour-kit/analytics` manually for analytics events to be available — the package ships with each consumer that emits them. No runtime behaviour change for consumers who already installed it.

## 0.11.1

### Patch Changes

- 6e77a3b: Point each package's `homepage` field at https://usertourkit.com/ so the "Homepage" link in the npm sidebar opens the docs site instead of the GitHub README.

## 0.11.0

### Minor Changes

- 690ad74: Add UserGuiding parity primitives:

  - **i18n** — `interpolate`, `LocaleProvider`, `useLocale`, `useT`, `useResolveLocalizedText` with `{{var | fallback}}` grammar, ICU-lite plurals, RTL auto-derivation, and a host-adapter `t` prop.
  - **Segmentation** — `SegmentationProvider`, `useSegment`, `useSegments`, `useSegmentationContext`, `parseUserIdsFromCsv` (RFC 4180-lite, header-aware, dedup, BOM-safe).
  - **Audience** — `AudienceProp = AudienceCondition[] | { segment: string }` (promoted from `@tour-kit/announcements`), `matchesAudience`, `validateConditions`.

  All additions are additive — no breaking changes.

## 0.10.0

### Minor Changes

- cfc7da1: UserGuiding parity Phase 4 — Media-step content primitive.

  Ship `<MediaSlot>` in `@tour-kit/media` as the universal media dispatcher and
  wire it as the standard rendering primitive for the `media?` field across all
  five content consumer packages.

  **`@tour-kit/media`**

  - New: `<MediaSlot>` component, `MediaSlotProps`, `MediaSlotType`,
    `detectMediaSlotType`, and the `MEDIA_SLOT_PATTERNS` constant.
  - Auto-detects YouTube / Vimeo / Loom / Wistia / native video / GIF / Lottie
    via URL pattern matching. Unknown URLs fall back to `<img>`.
  - Honors `prefers-reduced-motion: reduce` for Lottie / GIF / NativeVideo
    autoplay (and iframe autoplay) via `useReducedMotion()` from `@tour-kit/core`.
  - iframe load errors swap to a clickable "Watch on \[provider]" fallback card.

  **`@tour-kit/core`**

  - New: `TourStepMedia` interface (structural alias of `MediaSlotProps`,
    inlined to keep `core` at the bottom of the dep graph). `TourStep.media`
    added.

  **`@tour-kit/react`**

  - `<TourCard>` renders `<MediaSlot>` between header and content when
    `step.media` is set. Adds `@tour-kit/media` as a workspace dependency.

  **`@tour-kit/hints`**

  - `HintConfig.media?` added. `<Hint>` renders `<MediaSlot>` above the tooltip
    content. Adds `@tour-kit/media` as a workspace dependency.

  **`@tour-kit/announcements`**

  - `AnnouncementMedia.type` widened from `'image' | 'video' | 'lottie'` to
    the full `MediaSlotType` union (9 values incl. `'auto'`). The narrower
    legacy values stay assignable — non-breaking.
  - `<AnnouncementContent>`, `<AnnouncementBanner>`, and `<AnnouncementToast>`
    now render `<MediaSlot>` instead of inlined per-type dispatch. Modal,
    slideout, and spotlight reach `MediaSlot` through `<AnnouncementContent>`.
  - Adds `@tour-kit/media` as a workspace dependency.

  **`@tour-kit/surveys`**

  - `QuestionConfig.media?` added. New `<QuestionMedia question={...}>`
    helper renders `<MediaSlot>` above a question prompt. Adds `@tour-kit/media`
    as a workspace dependency.

  **`@tour-kit/checklists`**

  - `ChecklistTaskConfig.media?` added. `<ChecklistTask>` renders `<MediaSlot>`
    inside the task row, below the description. Adds `@tour-kit/media` as a
    workspace dependency.

  **Tree-shaking** — verified via `scripts/verify-treeshake.sh`:
  toast-only consumers don't statically include the heavy
  `@lottiefiles/react-lottie-player` payload (it's loaded via dynamic `import()`
  inside `lottie-player.tsx`). See `notes/phase-4-treeshake.md`.

## 0.9.0

### Minor Changes

- 46f2039: Unify all packages to 0.8.0 ahead of the 1.0 milestone. Includes a small bug-hunter sweep:

  - `@tour-kit/announcements`: clear pending "show next in queue" `setTimeout`s on provider unmount; previously fire-and-forget timers could call `show()` against an unmounted tree.
  - `@tour-kit/scheduling`: drop unreachable re-exports (`getCurrentMinutesInTimezone`, `toMinutesSinceMidnight`, `getDateRangeStart`, `getNextTimeRangeStart`, `getNextAllowedDay`) from the inner `utils/` barrel. Symbols remain exported from their source modules where internal callers need them.
  - `@tour-kit/react`: silence a `useSemanticElements` warning on `TourProgress` text variant (`<output>` is incompatible with the existing `div`-based prop type).

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
