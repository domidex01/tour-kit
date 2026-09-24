# @tour-kit/license

## 1.4.1

### Patch Changes

- Updated dependencies [9d0be69]
  - @tour-kit/core@3.0.1

## 1.4.0

### Minor Changes

- 1a6e295: The production licence badge reaches `@tour-kit/react` and `@tour-kit/hints`.

  **This changes behaviour for every existing install.** A consumer who
  upgrades and has no licence key configured will see a small
  `userTourKit · Unlicensed` badge in the bottom-right of their **production**
  deployment. It did not appear before. Nothing renders differently on
  localhost, `127.0.0.1`, `*.local`, or on preview/ephemeral deploy URLs, and
  nothing fails to render anywhere — `LicenseGate` is a soft gate that layers a
  badge over the feature rather than replacing it.

  `TourProvider` and `TourKitProvider` are now owned by `@tour-kit/react`
  instead of being re-exported from `@tour-kit/core`. Props and behaviour are
  identical and a type test asserts it, so imports do not change; the badge
  simply reaches the documented single-tour quickstart, which previously
  rendered none. `MultiTourKitProvider` and `HintsProvider` are wrapped too.
  With all of them plus a Pro package mounted together you still get exactly one
  badge — `LicenseWatermark` elects a single owner.

  In `@tour-kit/license`:

  - A project means a registrable domain. `foo.com` and `app.foo.com` now cost
    one activation slot instead of two, on both the activation and the
    validation side. Existing activations keep working: the stored label is
    normalised at comparison time, not migrated.
  - The badge and the dev-only console warning name the current price.
  - The badge no longer appears on a development host even when a
    `<LicenseProvider>` is mounted with an empty key. The licence grants
    development, evaluation, testing and CI use without charge, so the old
    behaviour had the runtime contradicting the terms. The console warning
    still fires, so a missing env var is still visible.

- 3c13df3: feat(vue,svelte): the licence gate, and the first public release under BUSL-1.1

  `@tour-kit/vue` and `@tour-kit/svelte` have been `private: true` since §1.5,
  waiting on the licence. This lands it and publishes them — at 1.0.0, because a
  first release at 0.1.0 says "not ready" about code that has been under test for
  three phases.

  Both now start the licence gate from their provider's mount hook. Production use
  needs a key; development, evaluation, testing and CI do not, exactly as the
  BUSL-1.1 Additional Use Grant says. Without a key the binding still works in
  full and layers the same corner badge every other package layers:

  ```ts
  provideTourKit({ tours, license: { licenseKey: KEY } });
  ```

  The gate is a **dependency**, not an optional peer. An opt-in gate is no gate:
  a consumer who skips the install would simply not be gated.

  For that to work without React, `@tour-kit/license` grew a framework-free half.
  `startLicenseGate()`, `mountWatermark()` and `warnUnlicensed()` are now exported
  from `@tour-kit/license/headless`, and `react`/`react-dom` became **optional**
  peers — installing `@tour-kit/vue` no longer warns about a React peer it will
  never load.

  The badge itself moved out of `<LicenseWatermark>` into `lib/watermark-dom.ts`,
  and the two React components are bindings over it now. There is one badge
  implementation in the repo rather than one per framework, which is the same call
  `createSpotlight` settled for the spotlight — the markup, the UTM parameters,
  the accessible label and the click telemetry only exist once. Its one-per-page
  rule is a count now instead of an owner election; the election only existed
  because a React portal needs some component to own it.

  Two fixes in `@tour-kit/license` reach React consumers as well:

  - React-bearing prop types moved to `types/react.ts`. tsup rolls every type
    module both entries reach into one shared declaration chunk that
    `headless.d.ts` imports, so `LicenseGateProps`' `React.ReactNode` was
    travelling into the React-free door with nothing to resolve it — a Vue or
    Svelte app on `skipLibCheck: false` with no `@types/react` got `TS2503:
Cannot find namespace 'React'` from inside `node_modules`. The names are
    unchanged and still exported from the root barrel.
  - `<LicenseGate>` and `startLicenseGate()` now share one `gateSignalsFor()`
    rather than each deriving the same four rules, so a new bypass `renderKey`
    cannot land on one binding and leave the other badging paying customers.

  `@tour-kit/license` also ships its `LICENSE.md` now — it declares `SEE LICENSE
IN LICENSE.md` and the file was not in `files`, which was survivable while it
  was an internal React-only dependency and is not now that two public packages
  redistribute it.

  Everything else is unchanged for React consumers: 241 tests in the licence
  package and every Pro package's licence-integration suite pass untouched.

### Patch Changes

- Updated dependencies [f62631b]
- Updated dependencies [e70e310]
- Updated dependencies [9d1cba1]
- Updated dependencies [978338b]
  - @tour-kit/core@3.0.0

## 1.3.7

### Patch Changes

- Updated dependencies [c9293ff]
- Updated dependencies [b032980]
- Updated dependencies [2c065cf]
- Updated dependencies [d9cac78]
- Updated dependencies [dcce333]
- Updated dependencies [d985ec5]
- Updated dependencies [c6953d8]
- Updated dependencies [a68699f]
  - @tour-kit/core@2.1.0

## 1.3.6

### Patch Changes

- Updated dependencies [3138481]
  - @tour-kit/core@1.0.7

## 1.3.5

### Patch Changes

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
  - @tour-kit/core@1.0.6

## 1.3.4

### Patch Changes

- 2b9e527: Stop the "Unlicensed" watermark from appearing on legitimate, paid deployments.

  Two fixes to how domain activation is handled, both aimed at the common
  Vercel/Netlify workflow where preview URLs pile up:

  - **Activation-limit reached no longer watermarks a valid key.** When Polar
    validates the key as `granted` but the auto-activation call returns `403`
    (activation limit reached), the license is now treated as a valid Pro license
    on that domain instead of falling through to the unlicensed watermark. The key
    is genuinely paid — the customer just has more live domains than slots — so we
    keep Pro unlocked, emit a one-time console warning pointing at the Polar
    dashboard, and cache the result. Previously this mapped to `status: 'invalid'`
    and rendered the watermark on the customer's production site.

  - **Ephemeral / preview hosts skip activation entirely.** Vercel preview URLs
    (`*-git-*.vercel.app`, `*-<hash>-*.vercel.app`), Netlify branch/deploy-preview
    hosts (`*--*.netlify.app`), Cloudflare Pages previews (`<hash>.*.pages.dev`),
    dev tunnels (ngrok, `loca.lt`, `trycloudflare.com`), and raw IP hosts now
    resolve to a `preview_bypass` state that unlocks Pro without calling Polar, so
    a busy preview workflow never burns the key's finite activation slots. Stable
    production hosts — including a bare `project.vercel.app` alias — still validate
    and activate normally. New `isEphemeralHost()` helper exported from the package
    root and `@tour-kit/license/headless`.

## 1.3.3

### Patch Changes

- 8a443fb: Dedupe noisy dev-only warnings to once per page/session.

  The unlicensed `[TourKit] … without a valid license` warning previously logged
  once per mounted Pro package (≈9–10× on a page using several). `<LicenseWarning>`
  now prints at most once per session. Likewise, `<TourProvider>`'s dev
  `diagnose` tip now fires once per session instead of once per provider instance
  (it printed twice on pages with multiple tours).

- d5e0ef1: Reword the unlicensed watermark badge CTA from "Buy license" to "Remove for $99". The new copy names the benefit (remove the badge) and the one-time price, and the `aria-label` now reads "remove this badge with a one-time $99 license" — higher-intent CTA framing for the production watermark, which is the primary in-app conversion surface for Tour Kit Pro. Behavior, link target, and the `unlicensed_badge_clicked` event are unchanged.
- Updated dependencies [8a443fb]
- Updated dependencies [8a443fb]
- Updated dependencies [8a443fb]
  - @tour-kit/core@1.0.3

## 1.3.2

### Patch Changes

- Updated dependencies [ef31ce6]
  - @tour-kit/core@1.0.2

## 1.3.1

### Patch Changes

- Updated dependencies [a17322c]
  - @tour-kit/core@1.0.1

## 1.3.0

### Minor Changes

- Add `apiBase` override for the Polar → tourkit-dash issuer migration (`tour-kit-cloud` plan/15f).

  - **New `apiBase?: string` prop on `<LicenseProvider>`** — points the validate/activate/deactivate flow at a non-Polar issuer without bumping the SDK major.
  - **New `options.apiBase` on `validateLicenseKey`, `validateKey`, `activateKey`, `deactivateKey`** — additive 4th positional arg on the low-level functions; existing positional callers are unaffected.
  - **New `resolveApiBase(override?)` export** (from `@tour-kit/license` and `@tour-kit/license/headless`) implementing the precedence chain: explicit override > `NEXT_PUBLIC_TOUR_KIT_LICENSE_API_BASE` env > `TOUR_KIT_LICENSE_API_BASE` env > Polar default.
  - **New `DEFAULT_API_BASE` export** holds the Polar URL string. v2.0.0 will flip this constant at T+90 per plan/15m.
  - **`PolarValidateResponseSchema` and `PolarActivateResponseSchema` switched to `z.looseObject`** (Zod 4's non-deprecated `.passthrough()` replacement) so the tourkit-dash issuer can add additive `tk_*` fields like `tk_tier` without breaking v1.x parsers. The `schema-no-tier.regression.test.ts` pin still holds: **Polar itself** does not emit `tier`; the looseObject change permits but does not require additive fields.
  - **New fixture** `src/__tests__/fixtures/polar-validate-response.json` — the canonical SDK-side counterpart to `tour-kit-cloud`'s byte-equality test (plan/15c §"Polar passthrough byte-equality").

  Zero behavior change for callers who don't opt in. Default issuer is still Polar; existing tests pass unchanged.

## 1.2.0

### Minor Changes

- b01b53c: Phase 8 — Trial tier + dev clarity for `@tour-kit/license`.

  - Add `<TrialBadge>` — client-derived trial countdown that flips to an Upgrade CTA when `daysLeft <= 3`. Reads from `useLicense().trial` when no `daysLeft` prop is passed.
  - Add `<LicenseDebugPanel>` — dev-only license inspection panel. Renders the literal copy `🟢 Dev bypass active (NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY set, hostname=localhost)` so the dev-bypass state is unambiguous. Returns `null` in production by default.
  - Add `<LicenseTestMode tier="invalid" | "pro" | "free">` — QA-only context override so the watermark, adoption gate, and Pro fallbacks can be verified on a real production-like domain without unsetting env vars. Emits a loud `console.warn` in production and is enforced by a static guard script (`scripts/check-license-test-mode.mjs`) that fails the package test pipeline on application-source imports.
  - Add pure helper `getDaysLeft({ issuedAt, trialDays, validatedAt, serverValidatedAt }, now?)` in `@tour-kit/license/headless`. Anchors to Polar's `last_validated_at` plus local elapsed time to absorb client clock skew.
  - Extend `LicenseProviderProps` with optional `trialDays` and `trialIssuedAt`. Extend `LicenseState` with `serverValidatedAt?: number | null` (parsed from Polar `last_validated_at`). Extend `LicenseContextValue` with `trial: TrialContextValue | null`.
  - Update `polar-client.ts` to map `response.lastValidatedAt` into `state.serverValidatedAt` on validated, expired, and revoked branches. `LicenseCacheSchema` now accepts the optional field; old v1.0.x cache entries continue to parse.
  - The Polar Zod schema does NOT gain a `tier` field — the API doesn't emit one (memory project_polar_api_findings.md #187 / Phase 0 §6). Pinned with `schema-no-tier.regression.test.ts`.
  - New docs page `apps/docs/content/docs/licensing/trial.mdx` covers the trial surface, debug panel, test mode, and the future schema-migration plan when Polar ships server-side trial signalling.

### Patch Changes

- Updated dependencies [d67d905]
  - @tour-kit/core@1.0.0

## 1.1.2

### Patch Changes

- c33b3bc: Fix Pro-package SSR blackout in `<LicenseGate>` loading state.

  `LicenseProvider` validates the license inside a `useEffect`, which never fires during server rendering. That left `context.isLoading` `true` on every SSR pass, and `<LicenseGate>` (used internally by all 8 Pro packages since 1.1.0) returned `null` whenever no explicit `loading` prop was passed — wiping the entire Pro subtree from server HTML and forcing a pop-in on hydration. The release smoke app caught this as a missing `data-smoke-ok` marker on the curl probe.

  The loading branch now defaults to `children` instead of `null`. Consumers who want a skeleton during validation can still pass `loading={<Skeleton />}`; the watermark only renders once the gate decision is known.

## 1.1.1

### Patch Changes

- d777614: Phase 8 dashboard-next QA pass: analytics event coverage, a11y fixes, autostart correctness, and watermark visual polish.

  **Analytics event coverage.** New `TourEventName` values — `announcement_shown`, `announcement_dismissed`, `announcement_completed`, `checklist_task_completed`, `checklist_completed`, and `schedule_evaluated` — are now emitted by their respective providers when an analytics plugin is registered. `consolePlugin` will surface them as `[tour-kit]` groups; production destinations (`@tour-kit/analytics`) receive them via the same `track()` interface.

  **Tour autostart respects completed tours.** `<TourProvider>` no longer auto-restarts a tour that the user has already completed (or skipped) across route navigations. State is sourced from `usePersistence` when `persistence.trackCompleted` is enabled, and `ADD_COMPLETED` / `ADD_SKIPPED` reducers now dedupe to prevent the list from growing on repeat dispatches.

  **Announcement dialog a11y.** `AnnouncementModal` now forwards `aria-describedby` when a description exists and renders content with `asDialogContent` so Radix's title/description requirements are satisfied — eliminates the `DialogTitle is required` and `DialogDescription` console warnings.

  **Schedule diagnostics.** `useSchedule` exposes the evaluation `reason` (`outside_window`, `holiday`, `before_start_date`, `after_end_date`, etc.) on the hook return so consumers can render or log why a banner is hidden without inspecting the schedule shape themselves.

  **License watermark refresh.** The unlicensed badge now renders the User Tour Kit logo (14×14 SVG) in place of the amber dot — same singleton, same portal, same `pointer-events: none` wrapper, just a clearer visual signal.

  **Install graph: `@tour-kit/analytics` peer → direct dependency.** `@tour-kit/adoption`, `@tour-kit/announcements`, `@tour-kit/checklists`, `@tour-kit/hints`, `@tour-kit/react`, and `@tour-kit/scheduling` now declare `@tour-kit/analytics` as a regular dependency rather than an optional peer. Consumers no longer need to install `@tour-kit/analytics` manually for analytics events to be available — the package ships with each consumer that emits them. No runtime behaviour change for consumers who already installed it.

## 1.1.0

### Minor Changes

- 2f1a88d: License gate is now soft by default for Pro packages

  `<LicenseGate>` is rewritten as the canonical internal soft gate. It now reads `LicenseContext` directly (no longer throws when used outside `<LicenseProvider>`), always renders `children`, and on non-localhost hosts without a valid license layers a single small `Tour Kit · Unlicensed · Buy license` portal badge plus a dev-only console warning over the top. `fallback` continues to hard-replace children, but only when a provider is mounted and the state is gated.

  `<LicenseWatermark>` is replaced. It is no longer a full-screen rotated `UNLICENSED` overlay — it is now a small fixed bottom-right badge rendered into `document.body` via a portal, with `pointer-events: none` on the wrapper and `pointer-events: auto` on the link so it never blocks app clicks. Multiple mounted instances coalesce into a single visible badge via singleton ownership transfer (StrictMode-safe). Badge clicks open pricing with UTM params and emit `unlicensed_badge_clicked` via `window.gtag` or `window.dataLayer`.

  All 8 Pro packages (`@tour-kit/adoption`, `@tour-kit/announcements`, `@tour-kit/checklists`, `@tour-kit/ai`, `@tour-kit/surveys`, `@tour-kit/scheduling`, `@tour-kit/analytics`, `@tour-kit/media`) now wrap their provider/components with `<LicenseGate require="pro">` instead of `<ProGate package="...">`. The practical effect: a developer can install a Pro package, push a preview deploy, and demo the real UI to teammates before purchasing — no more hard-placeholder dead end on preview, staging, or production.

  `<ProGate>` is **not** removed. It remains exported from `@tour-kit/license` for downstream consumers who want a hard-placeholder gate, but Tour Kit's own Pro packages no longer use it internally.

  Commercial URLs aligned to `usertourkit.com` across `LicenseWarning`, `ProGate`, every Pro package `LICENSE.md`, the docs API reference, the pricing FAQ, and the license package README/CLAUDE.md.

### Patch Changes

- 6e77a3b: Point each package's `homepage` field at https://usertourkit.com/ so the "Homepage" link in the npm sidebar opens the docs site instead of the GitHub README.
- 6e77a3b: Fix localhost licensing so an empty `licenseKey` is treated as unlicensed.

  Local development still skips Polar validation and activation usage when a
  non-empty key is configured. When the key is missing or blank, Tour Kit now
  shows the same unlicensed watermark on localhost that it shows in production —
  surfacing a missing env var before it reaches a deploy.

  - `<LicenseProvider licenseKey="">` on localhost now resolves to `invalid`/`free`
    and `useLicenseGate()` / `<LicenseGate>` / `<ProGate>` gate accordingly.
  - `validateLicenseKey('')` returns the unlicensed state before any cache read
    or Polar call, on every host.
  - Whitespace-only keys are treated as missing (trimmed before presence checks,
    cache hashing, validation, activation, and render-key generation).
  - `useLicenseGate()` now reads `<LicenseProvider>` state before the hostname
    bypass, so a provider with an empty key no longer leaks Pro behavior locally.
  - `<LicenseGate>` outside a `LicenseProvider` keeps localhost quiet — there is
    no provider-owned key to inspect.

## 1.0.3

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

## 1.0.2

### Patch Changes

- a7a0840: chore: publish Pro packages as public on npm

  Flip `publishConfig.access` from `restricted` to `public`. Pro-tier gating stays at runtime via `@tour-kit/license` + Polar.sh keys (watermark + console warning on unlicensed use), matching the documented "no hard block" licensing model. No code or API changes.

## 1.0.1

### Patch Changes

- 940847a: chore: update GitHub owner from `DomiDex` to `domidex01` in package metadata

  Updates `repository.url`, `homepage`, `bugs.url`, and LICENSE copyright to reflect the new GitHub account. No runtime or API changes — existing installs and imports are unaffected.

## 1.0.0

### Major Changes

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
