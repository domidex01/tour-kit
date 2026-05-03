# @tour-kit/checklists

## 0.1.8

### Patch Changes

- d5daf74: Add a 200ms `pending → completing → completed` state machine to `<ChecklistTask>`. While in the `completing` phase the root element gains `data-tk-completing="true"`, which the new optional stylesheet `@tour-kit/checklists/styles/animations.css` uses to apply a strike-through label keyframe and a check-icon scale-pop keyframe. The completion phase is skipped entirely when `useReducedMotion()` returns `true`; the CSS additionally wraps the keyframes in `@media (prefers-reduced-motion: reduce) { animation: none }` for defense-in-depth.
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
  - @tour-kit/license@1.0.3

## 0.1.7

### Patch Changes

- 04520d7: Phase 1 of the code-health pass: hoist `cn()` into `@tour-kit/core` and minify `@tour-kit/adoption`'s build.

  **`@tour-kit/core`** — new public export `cn(...inputs: ClassValue[]): string` (re-exported from the package root). Composes `clsx` + `tailwind-merge`, byte-compatible with the eight prior duplicates. `clsx` and `tailwind-merge` are now declared `dependencies` of `@tour-kit/core` and listed as tsup externals so they remain peer-resolved.

  **`@tour-kit/ai`** — `@tour-kit/core` is no longer an optional peer; it is now a required workspace dependency. Apps that installed `@tour-kit/ai` without `@tour-kit/core` will need to add it (or rely on the auto-install from this dependency).

  **`@tour-kit/media`** — adds `@tour-kit/core` as a workspace dependency (was previously absent; cn was sourced from a local copy).

  **All consumer packages** — switched to `import { cn } from '@tour-kit/core'`. No public API changes for consumers. The 8 duplicate `cn()` implementations (7 × `lib/utils.ts` + `checklists/components/cn.ts`) have been removed.

  **`@tour-kit/adoption`** — `tsup.config.ts` flips `minify: true` (matching the other 11 configs). The bundled `dist/index.js` shrinks from 50,131 → 25,758 raw bytes (-49%) and 10,334 → 7,831 gzipped bytes (-24%). The `'use client'` directive is now prepended in `onSuccess` so it survives minification.

- Updated dependencies [04520d7]
  - @tour-kit/core@0.6.0

## 0.1.6

### Patch Changes

- Updated dependencies [c03e87d]
- Updated dependencies [78dc120]
  - @tour-kit/core@0.5.1

## 0.1.5

### Patch Changes

- 5690518: Fix infinite `Maximum update depth exceeded` when mounting `<ChecklistPanel>` inside
  `<ChecklistProvider>`. The `defaultExpanded` effect now fires exactly once per mount,
  and every reducer action short-circuits when the dispatched value matches current state.
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
