# @tour-kit/media

## 0.13.0

### Minor Changes

- 8a443fb: Add a `@tour-kit/media/tailwind` entry point (`mediaPlugin`, `mediaSafelist`,
  `tourKitMediaPreset`) so embeds are never invisible.

  Previously, if a consumer's Tailwind `content` globs did not scan
  `@tour-kit/media`'s `dist`, the aspect-ratio and positioning utilities the
  embeds rely on were purged — the container collapsed to `height: 0` and every
  iframe/video rendered invisibly. `mediaPlugin` force-emits those layout
  utilities (and the five supported aspect ratios) through the plugin API, so
  they survive purging without adding the package to `content` globs, mirroring
  `@tour-kit/react`'s `tourKitPlugin` and `@tour-kit/hints`'s `hintsPlugin`.
  `mediaSafelist` covers runtime-computed `aspect-[w/h]` arbitrary values.

### Patch Changes

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

- Updated dependencies [8a443fb]
- Updated dependencies [d5e0ef1]
- Updated dependencies [8a443fb]
- Updated dependencies [8a443fb]
  - @tour-kit/license@1.3.3
  - @tour-kit/core@1.0.3

## 0.12.6

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
  - @tour-kit/license@1.3.2

## 0.12.5

### Patch Changes

- Updated dependencies [a17322c]
  - @tour-kit/core@1.0.1
  - @tour-kit/license@1.3.1

## 0.12.4

### Patch Changes

- Updated dependencies [d67d905]
- Updated dependencies [b01b53c]
  - @tour-kit/core@1.0.0
  - @tour-kit/license@1.2.0

## 0.12.3

### Patch Changes

- Updated dependencies [8c4ef89]
  - @tour-kit/core@0.14.0

## 0.12.2

### Patch Changes

- Updated dependencies [c33b3bc]
  - @tour-kit/license@1.1.2

## 0.12.1

### Patch Changes

- Updated dependencies [d777614]
  - @tour-kit/core@0.12.0
  - @tour-kit/license@1.1.1

## 0.12.0

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

## 0.11.0

### Minor Changes

- 690ad74: Add `<MediaSlot>` polymorphic component:

  - Single component accepts a URL or local source; auto-detects YouTube, Vimeo, Loom, Wistia, native video, GIF, and Lottie sources.
  - Forwards refs and `aria-*` props.
  - Honors `prefers-reduced-motion: reduce` (autoplay disabled, Lottie freezes on first frame).

  All additions are additive — no breaking changes.

### Patch Changes

- Updated dependencies [690ad74]
  - @tour-kit/core@0.11.0

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

## 0.1.6

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

## 0.1.5

### Patch Changes

- 04520d7: Phase 1 of the code-health pass: hoist `cn()` into `@tour-kit/core` and minify `@tour-kit/adoption`'s build.

  **`@tour-kit/core`** — new public export `cn(...inputs: ClassValue[]): string` (re-exported from the package root). Composes `clsx` + `tailwind-merge`, byte-compatible with the eight prior duplicates. `clsx` and `tailwind-merge` are now declared `dependencies` of `@tour-kit/core` and listed as tsup externals so they remain peer-resolved.

  **`@tour-kit/ai`** — `@tour-kit/core` is no longer an optional peer; it is now a required workspace dependency. Apps that installed `@tour-kit/ai` without `@tour-kit/core` will need to add it (or rely on the auto-install from this dependency).

  **`@tour-kit/media`** — adds `@tour-kit/core` as a workspace dependency (was previously absent; cn was sourced from a local copy).

  **All consumer packages** — switched to `import { cn } from '@tour-kit/core'`. No public API changes for consumers. The 8 duplicate `cn()` implementations (7 × `lib/utils.ts` + `checklists/components/cn.ts`) have been removed.

  **`@tour-kit/adoption`** — `tsup.config.ts` flips `minify: true` (matching the other 11 configs). The bundled `dist/index.js` shrinks from 50,131 → 25,758 raw bytes (-49%) and 10,334 → 7,831 gzipped bytes (-24%). The `'use client'` directive is now prepended in `onSuccess` so it survives minification.

- Updated dependencies [04520d7]
  - @tour-kit/core@0.6.0

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
