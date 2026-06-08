# @tour-kit/analytics

## 0.11.7

### Patch Changes

- 50e6889: Fix `next build` / webpack `Module not found` when an optional analytics peer
  (`posthog-js`, `mixpanel-browser`, `@amplitude/analytics-browser`) isn't
  installed. The guarded dynamic `import()` for each optional SDK now carries a
  `/* webpackIgnore: true */ /* @vite-ignore */` magic comment, so bundlers leave
  the import for runtime instead of resolving it at build time. The plugins
  already degraded gracefully at runtime; this extends that to the build.

  tsup no longer uses the umbrella `minify: true` (esbuild's whitespace minifier
  strips the magic comments); it minifies identifiers + syntax only, which keeps
  the gzipped bundle size flat. Regression-guarded by a dist magic-comment check,
  a real webpack build smoke test, runtime-optionality tests for all three SDKs,
  and a `peerDependenciesMeta.optional` contract test.

## 0.11.6

### Patch Changes

- Updated dependencies [8a443fb]
- Updated dependencies [d5e0ef1]
- Updated dependencies [8a443fb]
- Updated dependencies [8a443fb]
  - @tour-kit/license@1.3.3
  - @tour-kit/core@1.0.3

## 0.11.5

### Patch Changes

- Updated dependencies [ef31ce6]
  - @tour-kit/core@1.0.2
  - @tour-kit/license@1.3.2

## 0.11.4

### Patch Changes

- 62fa68a: Externalize `@amplitude/analytics-browser` in the tsup config. The SDK was
  being inlined into `dist/`, ballooning the package to ~64 KB gz (vs. ~3 KB
  expected for the root entry). Also declares the analytics SDKs
  (`@amplitude/analytics-browser`, `mixpanel-browser`, `posthog-js`) as real
  optional peer dependencies instead of listing them only in
  `peerDependenciesMeta`.

  Consumer impact: smaller bundles when not using Amplitude
  (`dist/index.js` drops from ~64 KB gz to ~3 KB gz; `dist/plugins/amplitude.js`
  drops from ~62 KB gz to <1 KB gz). Consumers who were relying on the
  bundled SDK (against the documented optional-peer contract) must now
  explicitly install `@amplitude/analytics-browser`.

  Refs: audit B-2.

- Updated dependencies [a17322c]
  - @tour-kit/core@1.0.1
  - @tour-kit/license@1.3.1

## 0.11.3

### Patch Changes

- Updated dependencies [d67d905]
- Updated dependencies [b01b53c]
  - @tour-kit/core@1.0.0
  - @tour-kit/license@1.2.0

## 0.11.2

### Patch Changes

- Updated dependencies [8c4ef89]
  - @tour-kit/core@0.14.0

## 0.11.1

### Patch Changes

- Updated dependencies [c33b3bc]
  - @tour-kit/license@1.1.2

## 0.11.0

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
  - @tour-kit/license@1.1.1

## 0.10.0

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

## 0.9.2

### Patch Changes

- Updated dependencies [690ad74]
  - @tour-kit/core@0.11.0

## 0.9.1

### Patch Changes

- Updated dependencies [cfc7da1]
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

## 0.1.8

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

- Updated dependencies
- Updated dependencies [d5daf74]
- Updated dependencies [cacf273]
- Updated dependencies [fa98539]
- Updated dependencies [716935c]
- Updated dependencies [a35d469]
  - @tour-kit/core@0.7.0
  - @tour-kit/license@1.0.3

## 0.1.7

### Patch Changes

- Updated dependencies [04520d7]
  - @tour-kit/core@0.6.0

## 0.1.6

### Patch Changes

- Updated dependencies [c03e87d]
- Updated dependencies [78dc120]
  - @tour-kit/core@0.5.1

## 0.1.5

### Patch Changes

- Updated dependencies [65ee7f9]
  - @tour-kit/core@0.5.0

## 0.1.4

### Patch Changes

- a7a0840: chore: publish Pro packages as public on npm

  Flip `publishConfig.access` from `restricted` to `public`. Pro-tier gating stays at runtime via `@tour-kit/license` + Polar.sh keys (watermark + console warning on unlicensed use), matching the documented "no hard block" licensing model. No code or API changes.

- Updated dependencies [a7a0840]
  - @tour-kit/license@1.0.2

## 0.1.3

### Patch Changes

- 940847a: chore: update GitHub owner from `DomiDex` to `domidex01` in package metadata

  Updates `repository.url`, `homepage`, `bugs.url`, and LICENSE copyright to reflect the new GitHub account. No runtime or API changes — existing installs and imports are unaffected.

- Updated dependencies [940847a]
  - @tour-kit/core@0.4.2
  - @tour-kit/license@1.0.1

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
