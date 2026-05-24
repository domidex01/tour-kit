# @tour-kit/announcements

## 4.1.1

### Patch Changes

- a17322c: QA fixes surfaced by the dashboard-next example.

  - `AnnouncementBanner` now defaults to `sticky: true`. Without an explicit
    `sticky` value the banner was rendering as a flow-positioned flex sibling,
    which in flex/grid layouts (like dashboard-next's `AnnouncementsHost`) ate
    ~728px of horizontal space and squeezed `<main>` from 1171px to 442px.
    Both the cva `defaultVariants` and the `effectiveSticky ?? true` fallback
    now agree on `true`; opt out with `sticky={false}` or
    `bannerOptions.sticky = false`.
  - `AnnouncementModal` adds an explicit `aria-modal="true"` on
    `Dialog.Content` so screen readers can detect modality.
  - `ScheduledBanner` (example) wraps its diagnostic body in a mount guard so
    the SSR/CSR diagnostic text no longer diverges (`not_registered` vs
    `wrong_time`).

- Updated dependencies [62fa68a]
- Updated dependencies [a17322c]
  - @tour-kit/analytics@0.11.4
  - @tour-kit/core@1.0.1
  - @tour-kit/scheduling@0.11.4
  - @tour-kit/license@1.3.1
  - @tour-kit/media@0.12.5

## 4.1.0

### Minor Changes

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
- Updated dependencies [b01b53c]
  - @tour-kit/core@1.0.0
  - @tour-kit/license@1.2.0
  - @tour-kit/analytics@0.11.3
  - @tour-kit/media@0.12.4
  - @tour-kit/scheduling@0.11.3

## 4.0.0

### Changed (visual breaking)

- `<AnnouncementSpotlight>` cutout now uses a 2px inset stroke + directional arrow
  instead of a soft radial gradient. The new design passes WCAG 2.1 AA contrast on
  white, off-white, and light-gray backgrounds. Set `strokeColor="auto"` (default)
  to follow `prefers-color-scheme`, or pass any CSS color string to override.

  **Migration:** if you rely on the legacy radial-gradient look, opt in via
  `<AnnouncementSpotlight variant="legacy-spotlight">`. The legacy variant is
  kept for one minor cycle (until v4.1) and will be removed in v5.

### Added

- `@tour-kit/announcements/adapters/sonner` — peer-optional Sonner adapter for
  `variant="toast"`. Pass it to the provider:

  ```tsx
  import { AnnouncementsProvider } from "@tour-kit/announcements";
  import { sonnerAdapter } from "@tour-kit/announcements/adapters/sonner";
  import { Toaster } from "sonner";

  // ...
  <AnnouncementsProvider toastAdapter={sonnerAdapter}>
    {children}
    <Toaster />
  </AnnouncementsProvider>;
  ```

  Requires `sonner` >=1.0.0 <3 installed. Without `sonner` installed, the existing
  portal toast renders unchanged — no bytes of Sonner ship in the main bundle.

- `<AnnouncementSpotlight>` props: `variant`, `strokeColor`. See migration note above.
- `ToastAdapter` interface for building custom toast transports (e.g., react-hot-toast).

### Patch Changes

- Updated dependencies [8c4ef89]
  - @tour-kit/core@0.14.0
  - @tour-kit/analytics@0.11.2
  - @tour-kit/media@0.12.3
  - @tour-kit/scheduling@0.11.2

## 3.0.1

### Patch Changes

- Updated dependencies [c33b3bc]
  - @tour-kit/license@1.1.2
  - @tour-kit/analytics@0.11.1
  - @tour-kit/media@0.12.2
  - @tour-kit/scheduling@0.11.1

## 3.0.0

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
  - @tour-kit/scheduling@0.11.0
  - @tour-kit/license@1.1.1
  - @tour-kit/media@0.12.1

## 2.0.0

### Minor Changes

- 2f1a88d: License gate is now soft by default for Pro packages

  `<LicenseGate>` is rewritten as the canonical internal soft gate. It now reads `LicenseContext` directly (no longer throws when used outside `<LicenseProvider>`), always renders `children`, and on non-localhost hosts without a valid license layers a single small `Tour Kit · Unlicensed · Buy license` portal badge plus a dev-only console warning over the top. `fallback` continues to hard-replace children, but only when a provider is mounted and the state is gated.

  `<LicenseWatermark>` is replaced. It is no longer a full-screen rotated `UNLICENSED` overlay — it is now a small fixed bottom-right badge rendered into `document.body` via a portal, with `pointer-events: none` on the wrapper and `pointer-events: auto` on the link so it never blocks app clicks. Multiple mounted instances coalesce into a single visible badge via singleton ownership transfer (StrictMode-safe). Badge clicks open pricing with UTM params and emit `unlicensed_badge_clicked` via `window.gtag` or `window.dataLayer`.

  All 8 Pro packages (`@tour-kit/adoption`, `@tour-kit/announcements`, `@tour-kit/checklists`, `@tour-kit/ai`, `@tour-kit/surveys`, `@tour-kit/scheduling`, `@tour-kit/analytics`, `@tour-kit/media`) now wrap their provider/components with `<LicenseGate require="pro">` instead of `<ProGate package="...">`. The practical effect: a developer can install a Pro package, push a preview deploy, and demo the real UI to teammates before purchasing — no more hard-placeholder dead end on preview, staging, or production.

  `<ProGate>` is **not** removed. It remains exported from `@tour-kit/license` for downstream consumers who want a hard-placeholder gate, but Tour Kit's own Pro packages no longer use it internally.

  Commercial URLs aligned to `usertourkit.com` across `LicenseWarning`, `ProGate`, every Pro package `LICENSE.md`, the docs API reference, the pricing FAQ, and the license package README/CLAUDE.md.

### Patch Changes

- 6e77a3b: Point each package's `homepage` field at https://usertourkit.com/ so the "Homepage" link in the npm sidebar opens the docs site instead of the GitHub README.
- Updated dependencies [6e77a3b]
- Updated dependencies [6e77a3b]
- Updated dependencies [2f1a88d]
  - @tour-kit/core@0.11.1
  - @tour-kit/license@1.1.0
  - @tour-kit/scheduling@0.10.0
  - @tour-kit/media@0.12.0

## 1.2.0

### Minor Changes

- 690ad74: Wire i18n + segments + category, ship `<ChangelogPage>` and `serializeFeed`:

  - `AnnouncementConfig.title`/`description` accept `LocalizedText` and resolve through `<LocaleProvider>`.
  - `AnnouncementConfig.audience` accepts `{ segment: 'name' }` to reference `<SegmentationProvider>` cohorts.
  - New optional `category` field for grouping in the changelog filter.
  - New `<ChangelogPage>` (server-renderable, category filter, emoji reactions, media support, RTL-aware) — exported from the `@tour-kit/announcements/changelog` subpath to keep toast/modal/banner-only consumers tree-shaken.
  - New `serializeFeed(entries, options)` returns `{ rss, jsonFeed }` strings (RSS 2.0 + JSON Feed 1.1, XML-entity-safe).

  All additions are additive — no breaking changes.

### Patch Changes

- Updated dependencies [690ad74]
- Updated dependencies [690ad74]
  - @tour-kit/core@0.11.0
  - @tour-kit/media@0.11.0

## 1.1.0

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

## 1.0.0

### Minor Changes

- 46f2039: Unify all packages to 0.8.0 ahead of the 1.0 milestone. Includes a small bug-hunter sweep:

  - `@tour-kit/announcements`: clear pending "show next in queue" `setTimeout`s on provider unmount; previously fire-and-forget timers could call `show()` against an unmounted tree.
  - `@tour-kit/scheduling`: drop unreachable re-exports (`getCurrentMinutesInTimezone`, `toMinutesSinceMidnight`, `getDateRangeStart`, `getNextTimeRangeStart`, `getNextAllowedDay`) from the inner `utils/` barrel. Symbols remain exported from their source modules where internal callers need them.
  - `@tour-kit/react`: silence a `useSemanticElements` warning on `TourProgress` text variant (`<output>` is incompatible with the existing `div`-based prop type).

### Patch Changes

- Updated dependencies [46f2039]
  - @tour-kit/core@0.9.0
  - @tour-kit/scheduling@0.9.0

## 0.2.3

### Patch Changes

- 6d7f23f: Launch-hardening audit fixes A2–A5:

  - announcements: stabilize the toast auto-dismiss `setInterval` so it no longer re-arms on every parent render (audit A2).
  - ai: declare the chat message list with explicit `aria-live="polite"`, `aria-atomic="false"`, `aria-relevant="additions text"`, and `aria-busy` driven by streaming status so screen readers announce streaming tokens reliably (audit A3).
  - announcements: render the spotlight overlay as a real `<button>` when `closeOnOverlayClick` is enabled, otherwise an inert `aria-hidden` div — element shape is now statically coherent and Enter/Space activation works through the native button (audit A4).
  - surveys: trap focus inside `SurveyPopover`, dismiss with reason `"escape_key"` when Escape is pressed, and restore focus to the anchor on close (audit A5).

- 6b58a04: Honor `prefers-reduced-motion: reduce` across all five display variants (modal, slideout, banner, toast, spotlight). Every `tailwindcss-animate` utility (`animate-in`, `animate-out`, `fade-*`, `slide-in-from-*`, `slide-out-to-*`, `zoom-in-95`, `zoom-out-95`) is now gated behind Tailwind's `motion-safe:` prefix in the cva variant files and `<AnnouncementOverlay>`, so reduce-mode users never see them. Also re-exports `useReducedMotion` from `@tour-kit/core` for ergonomic in-package access. No public API changes.
- Phase 1: Close client-only Usertour parity gaps. Six features ship across six packages with no breaking changes:

  - `useFlowSession` + `useBroadcast` for reload resume and cross-tab gating (`@tour-kit/core`)
  - `TourStep['kind']: 'visible' | 'hidden'` for branching without UI mounts (`@tour-kit/core`, `@tour-kit/react`)
  - `routeChangeStrategy` + `waitForStepTarget` + `TourRouteError` for cross-page tours that survive hard refresh (`@tour-kit/core`, `@tour-kit/react`)
  - `<ThemeProvider>` with system / dark / light / URL / predicate matchers and `useThemeVariation()` (`@tour-kit/react`)
  - 4 new `<TourProgress>` variants (`narrow`, `chain`, `numbered`, `none`) + 150ms tooltip docking + 200ms checklist completion animation (`@tour-kit/react`, `@tour-kit/checklists`)
  - `useReducedMotion()` exported from `@tour-kit/core` and honored across `@tour-kit/announcements`, `@tour-kit/surveys`, `@tour-kit/hints`

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
  - @tour-kit/scheduling@0.1.5
  - @tour-kit/license@1.0.3

## 0.2.2

### Patch Changes

- 04520d7: Phase 1 of the code-health pass: hoist `cn()` into `@tour-kit/core` and minify `@tour-kit/adoption`'s build.

  **`@tour-kit/core`** — new public export `cn(...inputs: ClassValue[]): string` (re-exported from the package root). Composes `clsx` + `tailwind-merge`, byte-compatible with the eight prior duplicates. `clsx` and `tailwind-merge` are now declared `dependencies` of `@tour-kit/core` and listed as tsup externals so they remain peer-resolved.

  **`@tour-kit/ai`** — `@tour-kit/core` is no longer an optional peer; it is now a required workspace dependency. Apps that installed `@tour-kit/ai` without `@tour-kit/core` will need to add it (or rely on the auto-install from this dependency).

  **`@tour-kit/media`** — adds `@tour-kit/core` as a workspace dependency (was previously absent; cn was sourced from a local copy).

  **All consumer packages** — switched to `import { cn } from '@tour-kit/core'`. No public API changes for consumers. The 8 duplicate `cn()` implementations (7 × `lib/utils.ts` + `checklists/components/cn.ts`) have been removed.

  **`@tour-kit/adoption`** — `tsup.config.ts` flips `minify: true` (matching the other 11 configs). The bundled `dist/index.js` shrinks from 50,131 → 25,758 raw bytes (-49%) and 10,334 → 7,831 gzipped bytes (-24%). The `'use client'` directive is now prepended in `onSuccess` so it survives minification.

- Updated dependencies [04520d7]
  - @tour-kit/core@0.6.0

## 0.2.1

### Patch Changes

- Updated dependencies [c03e87d]
- Updated dependencies [78dc120]
  - @tour-kit/core@0.5.1

## 0.2.0

### Minor Changes

- 0afd485: Registered announcements now auto-show on mount (and when `userContext` changes)
  whenever eligibility rules (`frequency`, `audience`, `schedule`, queue capacity)
  allow. This closes a behavior gap where configs registered but never surfaced.

  Opt out per-announcement with `autoShow: false` to drive the component imperatively
  via `show(id)`.

### Patch Changes

- Updated dependencies [65ee7f9]
  - @tour-kit/core@0.5.0

## 0.1.4

### Patch Changes

- a7a0840: chore: publish Pro packages as public on npm

  Flip `publishConfig.access` from `restricted` to `public`. Pro-tier gating stays at runtime via `@tour-kit/license` + Polar.sh keys (watermark + console warning on unlicensed use), matching the documented "no hard block" licensing model. No code or API changes.

- Updated dependencies [a7a0840]
  - @tour-kit/license@1.0.2
  - @tour-kit/scheduling@0.1.4

## 0.1.3

### Patch Changes

- 940847a: chore: update GitHub owner from `DomiDex` to `domidex01` in package metadata

  Updates `repository.url`, `homepage`, `bugs.url`, and LICENSE copyright to reflect the new GitHub account. No runtime or API changes — existing installs and imports are unaffected.

- Updated dependencies [940847a]
  - @tour-kit/core@0.4.2
  - @tour-kit/license@1.0.1
  - @tour-kit/scheduling@0.1.3

## 0.1.2

### Patch Changes

- 3fce450: Replace JWT-based licensing with Polar.sh license key validation

  BREAKING CHANGES:

  - Removed `publicKey` prop from `<LicenseProvider>` (JWT verification removed)
  - Added required `organizationId` prop to `<LicenseProvider>`
  - License key format changed from JWT to Polar format (`TOURKIT-*` prefix)
  - Removed `jose` dependency

  New features:

  - Polar.sh license key validation and activation (up to 5 domains)
  - 24-hour localStorage cache with Zod integrity checks
  - Automatic dev-mode bypass (localhost, 127.0.0.1, \*.local)
  - `<LicenseWatermark>` component for soft enforcement
  - `<LicenseGate>` with interleaved validation
  - Render-time domain verification

- Updated dependencies [3fce450]
  - @tour-kit/license@1.0.0
  - @tour-kit/scheduling@0.1.2
