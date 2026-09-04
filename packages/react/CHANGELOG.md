# @tour-kit/react

## 2.1.0

### Patch Changes

- Updated dependencies [dcce333]
- Updated dependencies [a68699f]
  - @tour-kit/core@2.1.0
  - @tour-kit/analytics@0.12.1
  - @tour-kit/media@0.13.4

## 2.0.0

### Patch Changes

- Updated dependencies [6653ba1]
  - @tour-kit/analytics@0.12.0

## 1.0.7

### Patch Changes

- Updated dependencies [3138481]
  - @tour-kit/core@1.0.7
  - @tour-kit/analytics@0.11.10
  - @tour-kit/media@0.13.3

## 1.0.6

### Patch Changes

- d870c32: `TourCard` now lazy-loads `@tour-kit/media` (`React.lazy` + `Suspense`)
  instead of importing it statically. Bundlers split the media stack into its
  own async chunk, fetched only when a step with `media` first renders — tour
  consumers without media steps no longer pay for it in their initial bundle.
  The embed mounts one tick after the card; `@tour-kit/media` remains a regular
  dependency so installed-case resolution keeps working in every bundler
  (`webpackIgnore`-style optional imports would leave a bare specifier browsers
  cannot resolve).
- d870c32: Widen the `react-router-dom` peer dependency to `^6.0.0 || ^7.0.0` so consumers on React Router 7 (the current major) can `npm install` without an `ERESOLVE`/peer conflict. The router adapter already supports v7 (it imports from `react-router` first); only the `react-router-dom` peer range was still pinned to v6.
- d870c32: Ship the `'use client'` directive in published dists. tsup's `banner` option is
  stripped by the rollup treeshake pass (and by `minify: true`), so every package
  relying on it published client entries without the directive — importing them from a
  Next.js App-Router Server Component evaluated React-stateful code in the react-server
  layer and crashed `next build` with `createContext is not a function`. All client
  entries now get the directive injected post-build (shared
  `tooling/build/use-client.ts`); server-safe entries (`license/headless`,
  `ai/server`, tailwind plugin entries) intentionally stay directive-free.

  Also fixes `@tour-kit/media/tailwind` shipping without type declarations: the
  package's second tsup config raced the first one's DTS step, which deleted
  `dist/tailwind/index.d.ts` after it was emitted. Media now builds from a single
  config.

- Updated dependencies [d870c32]
- Updated dependencies [d870c32]
- Updated dependencies [d870c32]
  - @tour-kit/core@1.0.6
  - @tour-kit/media@0.13.2
  - @tour-kit/analytics@0.11.9

## 1.0.5

### Patch Changes

- @tour-kit/analytics@0.11.8
- @tour-kit/media@0.13.1

## 1.0.4

### Patch Changes

- Updated dependencies [50e6889]
  - @tour-kit/analytics@0.11.7

## 1.0.3

### Patch Changes

- 8a443fb: `TourCard` now dismisses on Escape by default (`closeOnEscape`, standard dialog
  convention) — wiring only Escape so arrow/Enter navigation is still opt-in via
  `useKeyboardNavigation`. `TourOverlay` also keeps a stable backdrop dim: the dim
  is produced by the spotlight cutout's box-shadow, so for target-less (centered)
  steps — or a transient frame before the target rect resolves — the overlay now
  falls back to dimming itself instead of going fully transparent.
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

- Updated dependencies [8a443fb]
- Updated dependencies [8a443fb]
- Updated dependencies [8a443fb]
- Updated dependencies [8a443fb]
  - @tour-kit/core@1.0.3
  - @tour-kit/media@0.13.0
  - @tour-kit/analytics@0.11.6

## 1.0.2

### Patch Changes

- ef31ce6: chore: move 7 runtime dependencies into the pnpm catalog

  `@floating-ui/react`, `class-variance-authority`, `@radix-ui/react-slot`,
  `@radix-ui/react-dialog`, `@mui/base`, `clsx`, `tailwind-merge` are now
  resolved via `catalog:` in `pnpm-workspace.yaml`. No version changes; no
  behavior changes. Cuts future bumps from a 9-file find-and-replace to a
  one-line edit and prevents accidental drift.

  Refs: audit R-3.

- Updated dependencies [ef31ce6]
  - @tour-kit/core@1.0.2
  - @tour-kit/media@0.12.6
  - @tour-kit/analytics@0.11.5

## 1.0.1

### Patch Changes

- Updated dependencies [62fa68a]
- Updated dependencies [a17322c]
  - @tour-kit/analytics@0.11.4
  - @tour-kit/core@1.0.1
  - @tour-kit/media@0.12.5

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

### Patch Changes

- Updated dependencies [d67d905]
  - @tour-kit/core@1.0.0
  - @tour-kit/analytics@0.11.3
  - @tour-kit/media@0.12.4

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

### Patch Changes

- Updated dependencies [8c4ef89]
  - @tour-kit/core@0.14.0
  - @tour-kit/analytics@0.11.2
  - @tour-kit/media@0.12.3

## 0.13.0

### Minor Changes

- 0a03a1e: Refresh `<TourCard>` look (Phase 4 of v2 package polish).

  The default `<TourCard />` now renders a step-of-N indicator inside the
  header (visible decorative `<span aria-hidden="true">1 / 3</span>`), draws
  a real Floating UI `<FloatingArrow>` that points at the target across all
  12 placements, and gives the primary `Next` button a stronger
  `focus-visible:ring-2` focus ring. The dialog now uses
  `aria-label="Step N of M: <title>"` as its single screen-reader source —
  the old `aria-labelledby` is removed and no `aria-live` region duplicates
  the announcement.

  Backwards-compatibility escape hatch: `<TourCard variant="classic" />`
  pins the v1 layout (no step indicator, no arrow, current shipped Skip /
  Back / Next variants) for one minor cycle. It emits a one-time
  `console.warn` per `currentStep.id` in development; suppressed in
  production. Removed in the next major.

  New optional props on `TourCardProps`:

  - `showStepIndicator?: boolean` — force the indicator on or off
    (defaults to `true` on `'refreshed'`, `false` on `'classic'`)
  - `arrowSize?: number` — `<FloatingArrow>` height in px (default `8`,
    width is `2 × size`)
  - `variant?: 'refreshed' | 'classic'` — opt-out, defaults to `'refreshed'`

  `<TourArrow>` gains a `size?: number` prop and an explicit
  `aria-hidden="true"`. The Skip button carries a constant
  `aria-label="Skip tour"` so screen-reader naming is stable across i18n
  even when `skipLabel` is customized.

  Coverage: 11 a11y cases (8 existing + 3 new), 5 classic-variant cases,
  and a 12-placement Playwright matrix that asserts arrow tips land within
  4px of the target's edge.

### Patch Changes

- @tour-kit/analytics@0.11.1
- @tour-kit/media@0.12.2

## 0.12.0

### Minor Changes

- d777614: Phase 8 dashboard-next QA pass: analytics event coverage, a11y fixes, autostart correctness, and watermark visual polish.

  **Analytics event coverage.** New `TourEventName` values — `announcement_shown`, `announcement_dismissed`, `announcement_completed`, `checklist_task_completed`, `checklist_completed`, and `schedule_evaluated` — are now emitted by their respective providers when an analytics plugin is registered. `consolePlugin` will surface them as `[tour-kit]` groups; production destinations (`@tour-kit/analytics`) receive them via the same `track()` interface.

  **Tour autostart respects completed tours.** `<TourProvider>` no longer auto-restarts a tour that the user has already completed (or skipped) across route navigations. State is sourced from `usePersistence` when `persistence.trackCompleted` is enabled, and `ADD_COMPLETED` / `ADD_SKIPPED` reducers now dedupe to prevent the list from growing on repeat dispatches.

  **Announcement dialog a11y.** `AnnouncementModal` now forwards `aria-describedby` when a description exists and renders content with `asDialogContent` so Radix's title/description requirements are satisfied — eliminates the `DialogTitle is required` and `DialogDescription` console warnings.

  **Schedule diagnostics.** `useSchedule` exposes the evaluation `reason` (`outside_window`, `holiday`, `before_start_date`, `after_end_date`, etc.) on the hook return so consumers can render or log why a banner is hidden without inspecting the schedule shape themselves.

  **License watermark refresh.** The unlicensed badge now renders the User Tour Kit logo (14×14 SVG) in place of the amber dot — same singleton, same portal, same `pointer-events: none` wrapper, just a clearer visual signal.

  **Install graph: `@tour-kit/analytics` peer → direct dependency.** `@tour-kit/adoption`, `@tour-kit/announcements`, `@tour-kit/checklists`, `@tour-kit/hints`, `@tour-kit/react`, and `@tour-kit/scheduling` now declare `@tour-kit/analytics` as a regular dependency rather than an optional peer. Consumers no longer need to install `@tour-kit/analytics` manually for analytics events to be available — the package ships with each consumer that emits them. No runtime behaviour change for consumers who already installed it.

### Patch Changes

- Updated dependencies [d777614]
  - @tour-kit/core@0.12.0
  - @tour-kit/analytics@0.11.0
  - @tour-kit/media@0.12.1

## 0.11.1

### Patch Changes

- 6e77a3b: Point each package's `homepage` field at https://usertourkit.com/ so the "Homepage" link in the npm sidebar opens the docs site instead of the GitHub README.
- Updated dependencies [6e77a3b]
- Updated dependencies [2f1a88d]
  - @tour-kit/core@0.11.1
  - @tour-kit/media@0.12.0

## 0.11.0

### Minor Changes

- 690ad74: Wire i18n, audience, and `<MediaSlot>` into Tour steps:

  - `TourStep` accepts `LocalizedText` titles/content that resolve through `<LocaleProvider>` + `useT`.
  - `TourStep.audience` accepts `AudienceCondition[]` or `{ segment: 'name' }` (consumes `<SegmentationProvider>`).
  - Optional `media` slot renders `<MediaSlot>` inside the step card.

  All additions are additive — no breaking changes.

### Patch Changes

- Updated dependencies [690ad74]
- Updated dependencies [690ad74]
  - @tour-kit/core@0.11.0
  - @tour-kit/media@0.11.0

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

### Patch Changes

- Updated dependencies [cfc7da1]
  - @tour-kit/media@0.10.0
  - @tour-kit/core@0.10.0

## 0.9.0

### Minor Changes

- 46f2039: Unify all packages to 0.8.0 ahead of the 1.0 milestone. Includes a small bug-hunter sweep:

  - `@tour-kit/announcements`: clear pending "show next in queue" `setTimeout`s on provider unmount; previously fire-and-forget timers could call `show()` against an unmounted tree.
  - `@tour-kit/scheduling`: drop unreachable re-exports (`getCurrentMinutesInTimezone`, `toMinutesSinceMidnight`, `getDateRangeStart`, `getNextTimeRangeStart`, `getNextAllowedDay`) from the inner `utils/` barrel. Symbols remain exported from their source modules where internal callers need them.
  - `@tour-kit/react`: silence a `useSemanticElements` warning on `TourProgress` text variant (`<output>` is incompatible with the existing `div`-based prop type).

### Patch Changes

- Updated dependencies [46f2039]
  - @tour-kit/core@0.9.0

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
