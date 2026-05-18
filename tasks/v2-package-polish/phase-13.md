# Phase 13 — Analytics Destinations Part 1 (PostHog + GA4)

**Duration:** Days 67–71 (~9–12 hours)
**Depends on:** Phase 0 task 0.5 — peer-dep audit signed off in `tasks/v2-package-polish/phase-0-validation.md` (`posthog-js` listed as `peer-optional + runtime feature-detect`; `gtag` / `@types/gtag.js` listed as `peer-optional + runtime feature-detect`; no hard dep added to `@tour-kit/analytics`).
**Blocks:** Phase 14 — Analytics Destinations Part 2 (Segment + Amplitude) + `useFunnel(tourId)` hook; every Phase 14 plugin re-uses the extended `AnalyticsPlugin` contract from task 13.1.
**Risk Level:** HIGH — external destination plugins; silent duplicate events / double-init are the worst-case failure mode (consumers reload posthog-js or gtag and our plugin re-inits its own copy → 2× event volume in their dashboards, with no error logged).
**Stack:** react

---

## Objective

Two new plugins — `postHogPlugin({ apiKey, host })` and `ga4Plugin({ measurementId })` — make `@tour-kit/analytics` useful out of the box for the two highest-demand destinations in the v2 demo (`examples/dashboard-next/`). Both ship as **peer-optional subpath exports** (`@tour-kit/analytics/plugins/posthog`, `@tour-kit/analytics/plugins/ga4`) so the main bundle adds zero bytes of `posthog-js` or `gtag` for consumers that don't use them. The plugin contract is **extended** (not broken): `flush()`, `identify(userId, traits)`, and `setContext(ctx)` become standard optional methods on `AnalyticsPlugin`. The existing `consolePlugin`, `mixpanelPlugin`, `amplitudePlugin`, and `googleAnalyticsPlugin` keep working because every new method is optional — the contract widens, it does not narrow. The biggest correctness risk is **double-init**: posthog-js and gtag are commonly loaded by the consumer's own page (analytics tag in `<head>`, Next.js `<Script />`, marketing CMS injection), and we must feature-detect those globals and **reuse** them rather than running `posthog.init(...)` or appending a second `gtag.js` script tag. Memory entry #37 (GA4 `isInitialized()` gap) drives the GA4 feature-detect; Context7 confirmation drives the PostHog one.

## What Success Looks Like

1. `pnpm --filter @tour-kit/analytics typecheck` exits 0 with the extended `AnalyticsPlugin` interface — every existing plugin (console, mixpanel, amplitude, google-analytics, posthog) compiles unchanged because new methods (`setContext`) are optional, and existing methods (`flush`, `identify`) keep their current signatures.
2. **PostHog one-event-per-tour-event fixture passes:** `pnpm --filter @tour-kit/analytics test -- --run posthog-plugin` exits 0 with a test that mounts `createAnalytics({ plugins: [postHogPlugin({ apiKey: 'phc_test' })] })`, mocks `posthog-js` via `vi.mock`, dispatches a sequence of 3 tour events (`tour_started`, `step_viewed`, `tour_completed`), and asserts `posthog.capture` was called exactly 3 times with the matching event names (each prefixed with `tourkit_`).
3. **PostHog double-init guard works:** in the same test file, a second case sets `window.posthog = { __SV: 1, __loaded: true, capture: vi.fn(), identify: vi.fn() } as any` BEFORE the plugin's `init()` runs; the plugin must detect the existing instance, skip `posthog.init(...)`, and route `track()` calls to the pre-existing `window.posthog.capture`. Asserted by spying on the dynamic `import('posthog-js').init` and confirming it was **not** called.
4. **GA4 feature-detect skips loader when `window.gtag` exists:** `pnpm --filter @tour-kit/analytics test -- --run ga4-plugin.feature-detect` exits 0 with a test that pre-populates `window.gtag = vi.fn()` and `window.dataLayer = []` before plugin init, then asserts the plugin does NOT inject a `<script src="https://www.googletagmanager.com/gtag/js?id=...">` element into `document.head` (queried via `document.querySelector('script[src*="googletagmanager.com/gtag/js"]')` returning `null`). A second case (no pre-existing gtag) asserts the script IS injected exactly once.
5. **Zero peer-dep bytes in main bundle:** `pnpm --filter @tour-kit/analytics build` produces `dist/index.js`; `grep -c "posthog-js\|googletagmanager\|gtag/js" dist/index.js` returns `0`. Independently, a build smoke test (`__tests__/build-output-no-peer-deps.test.ts`) reads `dist/index.js` and `dist/index.cjs` and asserts neither contains the literal strings `'posthog-js'`, `'googletagmanager.com'`, or `'gtag/js'`. The plugin bytes live only at `dist/plugins/posthog.js` and `dist/plugins/ga4.js`.
6. **Contract update visible in types:** `grep -E "flush\?|identify\?|setContext\?" packages/analytics/src/types/plugin.ts` returns ≥3 matches; `flush` and `identify` retain their existing signatures, `setContext?(ctx: Record<string, unknown>): void` is the new addition.
7. **Docs page exists:** `apps/docs/content/docs/analytics/destinations.mdx` is created with: a one-table comparison of PostHog vs GA4, install + import snippets per destination, the required CSP additions for each, and a "verify in DevTools" recipe (Network → filter `collect` for GA4, Network → filter `e` for PostHog).

---

## What Failure Looks Like (and what to do)

- **PostHog double-init detected on a page that already loaded posthog-js (e.g., consumer included `<script src="posthog.com/.../array.js">` in their root layout)** → the plugin must NO-OP its own `posthog.init(...)` call. Feature-detect via `typeof window !== 'undefined' && (window.posthog?.__SV !== undefined || window.posthog?.__loaded === true)` and reuse the existing handle: assign `posthog = window.posthog as PostHogInstance`. Asserted by the test in Success #3. If the check is missed, the consumer's PostHog dashboard receives two `$pageview` (or `tourkit_*`) events per tour event — duplicated, with the second one carrying tour-kit's overridden config (`autocapture: false`, `capture_pageview: false`), which silently overrides the consumer's settings.
- **GA4 measurement ID collision with consumer's existing `window.gtag` (e.g., consumer uses Next.js `<Script src="https://www.googletagmanager.com/gtag/js?id=G-OTHER" />`)** → the plugin must NOT overwrite the global `gtag` or `dataLayer`. Feature-detect via `typeof window.gtag === 'function' && Array.isArray(window.dataLayer)` (memory entry #37) and reuse the existing globals. Plugin then issues `gtag('config', measurementId, { send_page_view: false })` to register our property alongside the consumer's, and `gtag('event', 'tourkit_*', ...)` for every tour event. Multiple `gtag('config', ...)` calls with different measurement IDs are legitimately supported by GA4 — Google's docs explicitly allow it.
- **Plugin throws on missing peer dep (consumer imports `@tour-kit/analytics/plugins/posthog` without `pnpm add posthog-js`)** → the plugin's `init()` wraps `await import('posthog-js')` in try/catch. On failure, log `console.warn('[tour-kit] postHogPlugin: posthog-js not installed. Install it with: pnpm add posthog-js')` once and return early; subsequent `track()`/`identify()` calls become silent no-ops. Same pattern for GA4: if `<script>` injection fails (CSP blocks it), warn once and no-op. Never throw — the consumer's app must not crash because telemetry is misconfigured.
- **Consumer's CSP blocks PostHog/GA4 endpoints** → the docs page (`apps/docs/content/docs/analytics/destinations.mdx`) lists the required `script-src` / `connect-src` / `img-src` additions: `https://app.posthog.com`, `https://*.posthog.com`, `https://www.googletagmanager.com`, `https://www.google-analytics.com`. The plugin itself can't fix CSP — the doc is the fix. Reference the recently-merged commit `092afd3 fix(docs): allow GA4 + Yandex endpoints in CSP` as precedent.
- **Bundle analyzer shows bytes from posthog-js / gtag in the main analytics chunk** → block release. The fix is in two places: (a) `tsup.config.ts` must mark `'posthog-js'` as external and the plugins as separate entries; (b) `src/index.ts` must NEVER `export *` or `export { ... }` from `./plugins/posthog` or `./plugins/ga4` — only the **subpath** entries (`./plugins/posthog`, `./plugins/ga4`) expose them. Verify with `grep -E "from ['\"]\\./plugins/(posthog|ga4)['\"]" packages/analytics/src/index.ts` returning `0`. Note: the existing `src/index.ts` currently re-exports `posthogPlugin` from the main barrel — this Phase **removes** that re-export (breaking change for anyone importing `posthogPlugin` from `@tour-kit/analytics` instead of `@tour-kit/analytics/posthog`; the existing `./posthog` subpath in `package.json` exports already covers them so the migration is one import-path edit). CHANGELOG flags this.
- **Existing consumers used the old `googleAnalyticsPlugin` from `@tour-kit/analytics`** → Keep the export of `googleAnalyticsPlugin` from the main barrel for one minor cycle, but mark it deprecated in JSDoc (`@deprecated Use ga4Plugin from '@tour-kit/analytics/plugins/ga4' instead`). The new `ga4Plugin` lives at the new subpath. CHANGELOG documents the migration.
- **`window.posthog` exists but is the stub (snippet loader pre-init), not the loaded instance** → the snippet loader sets `window.posthog._i = []` and `window.posthog.__SV = 1` but the real `capture` is not wired until the array-loaded script runs. Detect this case: if `window.posthog.__SV !== undefined && typeof window.posthog.capture !== 'function'`, treat it as "loading" — defer plugin init by 500ms via `setTimeout`, retry once. If still not loaded, fall back to dynamic `import('posthog-js')` (consumer also bundled posthog-js as an npm dep; the two install paths can co-exist if our init is skipped).

---

## Architecture / Key Design Decisions

```
@tour-kit/analytics (main entry — zero peer-dep bytes)
  src/types/plugin.ts
    AnalyticsPlugin (EXTENDED interface — new optional methods)
      id?: string                                      # NEW (alias for name; back-compat)
      name: string                                     # EXISTING (kept for backwards compat)
      init?(): void | Promise<void>                    # EXISTING
      track(event: TourEvent): void | Promise<void>    # EXISTING
      identify?(userId, traits?): void                 # EXISTING — note: param renamed
                                                       #   semantically to "traits" in
                                                       #   the type doc; runtime arg unchanged
      flush?(): void | Promise<void>                   # EXISTING
      setContext?(ctx: Record<string, unknown>): void  # NEW
      destroy?(): void                                 # EXISTING

  src/core/tracker.ts (UPDATED)
    Calls plugin.setContext?.(...) when consumer calls TourAnalytics.setContext(ctx)
    Existing flush() / identify() routes already in place

  src/index.ts
    Re-exports: createAnalytics, AnalyticsProvider, useAnalytics, consolePlugin, mixpanelPlugin,
                amplitudePlugin, googleAnalyticsPlugin (DEPRECATED), AnalyticsPlugin type,
                AnalyticsConfig type, TourEvent type
    DOES NOT re-export: postHogPlugin, ga4Plugin  (subpath-only)
    Note: existing posthogPlugin re-export is REMOVED — migration path in CHANGELOG

@tour-kit/analytics/plugins/posthog (subpath entry — opt-in)
  src/plugins/posthog.ts
    export const postHogPlugin: (opts) => AnalyticsPlugin
    Dynamic import('posthog-js') wrapped in try/catch
    Double-init guard:
      if (window.posthog?.__SV !== undefined && typeof window.posthog.capture === 'function') {
        posthog = window.posthog as PostHogInstance       # reuse existing handle, skip init
      } else {
        const { default: ph } = await import('posthog-js')
        ph.init(apiKey, { api_host, autocapture: false, capture_pageview: false, ... })
        posthog = ph
      }

@tour-kit/analytics/plugins/ga4 (subpath entry — opt-in)
  src/plugins/ga4.ts
    export const ga4Plugin: (opts) => AnalyticsPlugin
    Feature-detect (memory #37 — GA4 lacks isInitialized()):
      const alreadyLoaded =
        typeof window !== 'undefined' &&
        typeof window.gtag === 'function' &&
        Array.isArray(window.dataLayer)
      if (!alreadyLoaded) injectGtagScript(measurementId)   # one <script> tag once
      else window.gtag('config', measurementId, { send_page_view: false })  # register alongside
    track(event) → window.gtag('event', `tourkit_${event.eventName}`, { ...payload })
```

### Data Model Strategy

| Layer | Type | Why |
|-------|------|-----|
| `AnalyticsPlugin` (public contract) | `interface` exported from main | Consumers reference it when building custom plugins; widening with optional methods is non-breaking |
| `PostHogPluginOptions`, `Ga4PluginOptions` | `interface` co-located with plugin file | Internal to each subpath; not re-exported from main |
| `PostHogInstance` (runtime handle shape) | local `interface` in `plugins/posthog.ts` | `posthog-js`'s default export is loosely typed by the vendor; we shape it to a 5-method subset (`init`, `capture`, `identify`, `reset`, `__SV`/`__loaded` for detection) |
| `GtagFunction` (runtime handle shape) | local `type` in `plugins/ga4.ts` + `declare global` for `Window` augmentation | `@types/gtag.js` is a peer-optional type-only dep; we declare the minimum signature locally to avoid forcing consumers to install `@types/gtag.js` for our types to compile |
| Plugin options validation | none (no Zod) | These objects come from the consumer's own code, not an external boundary; one wrong type errors at consumer's typecheck, not at runtime |

**Critical rules for this phase:**

- **Main package must never import the new plugins.** `packages/analytics/src/index.ts` references `./plugins/posthog` only via the existing `./posthog` subpath (which currently re-exports `posthogPlugin`). This Phase REMOVES that re-export from `src/index.ts` and renames the function to `postHogPlugin` (camelCase rename for consistency with `ga4Plugin`). The existing `./posthog` subpath in `package.json` continues to point at `dist/plugins/posthog.js` so consumers' subpath imports still work. A grep test enforces `index.ts` has no `posthog`/`ga4` import.
- **Peer-deps in `package.json`:** `posthog-js` is already in `peerDependenciesMeta` as optional. Add `peerDependencies.posthog-js: ">=1.0.0 <2"` for explicit version range. Add `@types/gtag.js` to `peerDependenciesMeta` as optional + type-only (no runtime peer for gtag — it's a global, not an npm module).
- **Dynamic import only.** Both plugins call `await import('posthog-js')` / inject `<script>` tag inside `init()`, never at module top. This keeps the plugin file itself loadable in SSR/test environments without the peer dep present.
- **Subpath exports configured via `package.json` exports map + tsup entry.** Add `./plugins/posthog` and `./plugins/ga4` entries. `tsup.config.ts` adds two new entries: `'plugins/posthog': 'src/plugins/posthog.ts'` and `'plugins/ga4': 'src/plugins/ga4.ts'`. `external: ['posthog-js']` in tsup so the consumer resolves it. The existing `./posthog` subpath remains (back-compat for anyone importing `posthogPlugin` from `@tour-kit/analytics/posthog`).
- **No `<script>` element from the GA4 plugin if `window.gtag` already exists.** Per memory entry #37, `gtag` lacks an official `isInitialized()` accessor; the de-facto detect is `typeof window.gtag === 'function' && Array.isArray(window.dataLayer)`. If both hold, the script is already loaded by the consumer; we issue `gtag('config', measurementId, { send_page_view: false })` to register our property alongside theirs and call it a day.
- **CSP additions documented, not enforced.** The plugin's only failure mode under CSP is the script injection or fetch failing — we catch the error, warn once, and no-op. The docs page tells consumers what to add to their CSP.
- **No new Zod schemas.** Plugin options come from consumer code; runtime validation happens at the consumer's typecheck. Don't introduce Zod for in-process boundaries.

---

## Tasks

### Task 13.1 — Plugin contract extension (2h)

**Depends on:** —

Update `packages/analytics/src/types/plugin.ts` to extend the `AnalyticsPlugin` interface with `setContext?(ctx: Record<string, unknown>): void`. `flush?` and `identify?` already exist in the current type (verified by reading the file pre-phase); the spec calls for them to be confirmed and the `identify` JSDoc updated to clarify the parameter name is "traits" semantically (the runtime arg name stays `properties` for back-compat — TypeScript only checks positional types). Also add a JSDoc-only `@since` tag on `setContext`. Add `id?: string` (alias for `name`) so future plugins can use `id` per the broader analytics convention while existing plugins using `name` keep working.

```ts
// packages/analytics/src/types/plugin.ts — EXTENDED contract (full file content)
import type { TourEvent } from './events'

/**
 * Analytics plugin interface — extended in Phase 13.
 * All new methods are optional; existing plugins (console, mixpanel, amplitude, google-analytics)
 * remain compatible without changes.
 */
export interface AnalyticsPlugin {
  /** @deprecated Use `id`. Kept for backwards-compat through v2.x. */
  name: string

  /** Unique plugin identifier (preferred). Falls back to `name` if absent. @since 2.0 */
  id?: string

  /** Initialize the plugin (called once on setup) */
  init?: () => void | Promise<void>

  /** Track a tour event */
  track: (event: TourEvent) => void | Promise<void>

  /**
   * Identify a user. The second arg is semantically "traits" in the analytics-spec sense
   * (Segment / Mixpanel convention). Existing implementations using `properties` still type-check.
   */
  identify?: (userId: string, traits?: Record<string, unknown>) => void

  /** Flush any queued events */
  flush?: () => void | Promise<void>

  /**
   * Set persistent context (super-properties / user-scope attributes) added to every subsequent event.
   * Used by `useFunnel` (Phase 14) and the dashboard-next replay flow.
   * @since 2.0
   */
  setContext?: (ctx: Record<string, unknown>) => void

  /** Clean up resources */
  destroy?: () => void
}

export interface AnalyticsConfig {
  enabled?: boolean
  plugins: AnalyticsPlugin[]
  debug?: boolean
  offlineQueue?: boolean
  batchSize?: number
  batchInterval?: number
  userId?: string
  userProperties?: Record<string, unknown>
  globalProperties?: Record<string, unknown>
}
```

Update `packages/analytics/src/core/tracker.ts` to add a public `setContext(ctx)` method that fans out to every plugin's optional `setContext`:

```ts
// Append to TourAnalytics class in packages/analytics/src/core/tracker.ts:
/**
 * Set persistent context (super-properties) propagated to every plugin.
 * @since 2.0 (Phase 13)
 */
setContext(ctx: Record<string, unknown>) {
  if (this.destroyed) return
  for (const plugin of this.plugins) {
    try {
      plugin.setContext?.(ctx)
    } catch (error) {
      if (this.config.debug) {
        logger.error(`Analytics: Failed to setContext in ${plugin.name}:`, error)
      }
    }
  }
}
```

**Sanity check:** `pnpm --filter @tour-kit/analytics typecheck` exits 0; `grep -c "setContext" packages/analytics/src/types/plugin.ts` returns ≥2 (interface declaration + JSDoc reference); `grep -c "setContext" packages/analytics/src/core/tracker.ts` returns ≥1.

---

### Task 13.2 — `postHogPlugin({ apiKey, host })` at subpath (3–4h)

**Depends on:** 13.1

Rewrite `packages/analytics/src/plugins/posthog.ts` to:
1. Export `postHogPlugin` (renamed from `posthogPlugin` — new camelCase name; keep `posthogPlugin` as a `@deprecated` alias for one minor).
2. Implement the **double-init guard** before calling `posthog.init(...)`.
3. Implement `setContext` by routing to `posthog.register(superProperties)` (PostHog's super-properties API; confirmed via Context7 — `posthog.register({})` adds to every subsequent capture).

```ts
// packages/analytics/src/plugins/posthog.ts
// Confirmed via Context7 (2026-05-15) — Library: posthog-js >= 1.362.0 (existing devDep range)
// Key APIs:
//   posthog.init(apiKey, { api_host, autocapture, capture_pageview, persistence })  -> returns instance
//   posthog.capture(eventName, properties)
//   posthog.identify(distinctId, properties)
//   posthog.register(superProps)     -> adds super-properties to every subsequent capture (used for setContext)
//   posthog.reset()
// Double-init detection accessors (confirmed):
//   window.posthog.__SV       set by the snippet loader to a numeric flag once stub is in place
//   window.posthog.__loaded   set by the runtime instance once init() callback fires
//   Strategy: if either is set AND window.posthog.capture is a function, reuse it; skip our init().
// ESM/CJS: dual (devDep is ^1.362.0). Default export is the singleton `posthog` instance.

'use client'

import { logger } from '@tour-kit/core'
import type { TourEvent } from '../types/events'
import type { AnalyticsPlugin } from '../types/plugin'

interface PostHogInstance {
  init: (apiKey: string, options: Record<string, unknown>) => void
  capture: (eventName: string, properties: Record<string, unknown>) => void
  identify: (userId: string, properties?: Record<string, unknown>) => void
  register: (props: Record<string, unknown>) => void
  reset: () => void
  __SV?: number
  __loaded?: boolean
}

declare global {
  interface Window {
    posthog?: PostHogInstance
  }
}

interface PostHogPluginOptions {
  /** PostHog project API key (phc_*) */
  apiKey: string
  /** PostHog API host (default: https://app.posthog.com) */
  host?: string
  /** Enable autocapture (default: false — we only ship tour events) */
  autocapture?: boolean
  /** Event name prefix (default: "tourkit_") */
  eventPrefix?: string
}

let warned = false
function warnOnce(msg: string) {
  if (warned || process.env.NODE_ENV === 'production') return
  warned = true
  logger.warn(`[tour-kit] ${msg}`)
}

/**
 * PostHog analytics plugin — peer-optional.
 * Consumers must: `pnpm add posthog-js` (>=1.0.0 <2).
 * Reuses an existing `window.posthog` instance if one is detected (double-init guard).
 *
 * @example
 * import { postHogPlugin } from '@tour-kit/analytics/plugins/posthog'
 * createAnalytics({ plugins: [postHogPlugin({ apiKey: 'phc_xxx' })] })
 */
export function postHogPlugin(options: PostHogPluginOptions): AnalyticsPlugin {
  let posthog: PostHogInstance | null = null
  const prefix = options.eventPrefix ?? 'tourkit_'

  return {
    id: 'posthog',
    name: 'posthog',

    async init() {
      if (typeof window === 'undefined') return

      // Double-init guard — reuse the consumer's existing posthog if present
      const existing = window.posthog
      if (
        existing &&
        (existing.__SV !== undefined || existing.__loaded === true) &&
        typeof existing.capture === 'function'
      ) {
        posthog = existing
        return
      }

      // No existing instance — dynamic import and initialize ours
      try {
        const mod = await import('posthog-js')
        const ph = (mod as unknown as { default: PostHogInstance }).default
        if (!ph || typeof ph.init !== 'function') {
          warnOnce('postHogPlugin: posthog-js loaded but init() is undefined. No-op.')
          return
        }
        ph.init(options.apiKey, {
          api_host: options.host ?? 'https://app.posthog.com',
          autocapture: options.autocapture ?? false,
          capture_pageview: false,
          persistence: 'localStorage',
        })
        posthog = ph
      } catch {
        warnOnce(
          "postHogPlugin: posthog-js not installed. Install with: pnpm add posthog-js — or remove the postHogPlugin from your analytics config.",
        )
      }
    },

    track(event: TourEvent) {
      if (!posthog) return
      posthog.capture(`${prefix}${event.eventName}`, {
        tour_id: event.tourId,
        step_id: event.stepId,
        step_index: event.stepIndex,
        total_steps: event.totalSteps,
        duration_ms: event.duration,
        session_id: event.sessionId,
        ...event.metadata,
      })
    },

    identify(userId: string, traits?: Record<string, unknown>) {
      if (!posthog) return
      posthog.identify(userId, traits)
    },

    setContext(ctx: Record<string, unknown>) {
      if (!posthog) return
      posthog.register(ctx)
    },

    flush() {
      // posthog-js auto-flushes via its own queue
    },

    destroy() {
      if (!posthog) return
      posthog.reset()
    },
  }
}

/** @deprecated Use `postHogPlugin` (camelCase). Will be removed in v3. */
export const posthogPlugin = postHogPlugin
```

Update `packages/analytics/package.json`:
- Add `"./plugins/posthog"` entry to `exports` map (mirroring the existing `./posthog` entry; both point at the same built file for one minor cycle).
- Pin `peerDependencies.posthog-js: ">=1.0.0 <2"` (was implicit in `peerDependenciesMeta`).

Update `packages/analytics/tsup.config.ts`:
- Add `'plugins/posthog': 'src/plugins/posthog.ts'` to the `entry` object.
- Add `'posthog-js'` to `external` so consumers resolve it.

**Sanity check:** `pnpm --filter @tour-kit/analytics build` exits 0; `ls packages/analytics/dist/plugins/posthog.js packages/analytics/dist/plugins/posthog.cjs` returns both files; `grep -c "posthog-js" packages/analytics/dist/index.js` returns `0`; `grep -c "double-init\|__SV\|__loaded" packages/analytics/src/plugins/posthog.ts` returns ≥3.

---

### Task 13.3 — `ga4Plugin({ measurementId })` at subpath (3–4h)

**Depends on:** 13.1

Create `packages/analytics/src/plugins/ga4.ts`. This plugin does NOT bundle `gtag.js`; it injects the loader script tag at runtime (or reuses the consumer's existing global). Memory entry #37 (GA4 lacks `isInitialized()`) drives the feature-detect.

```ts
// packages/analytics/src/plugins/ga4.ts
// GA4 has no official isInitialized() — we feature-detect via window.gtag + window.dataLayer.
// Cited: memory #37 (GA4/gtag isInitialized gap) + repo commit 092afd3 (CSP allowlist for GA4 endpoints).
// gtag.js loader URL pattern: https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX
// Standard init recipe (from Google docs):
//   window.dataLayer = window.dataLayer || []
//   function gtag(){ dataLayer.push(arguments) }
//   gtag('js', new Date())
//   gtag('config', 'G-XXXXXXXXXX')

'use client'

import { logger } from '@tour-kit/core'
import type { TourEvent } from '../types/events'
import type { AnalyticsPlugin } from '../types/plugin'

type GtagCommand = 'event' | 'set' | 'config' | 'consent' | 'js'
type GtagFunction = (command: GtagCommand, ...args: unknown[]) => void

declare global {
  interface Window {
    gtag?: GtagFunction
    dataLayer?: unknown[]
  }
}

interface Ga4PluginOptions {
  /** GA4 Measurement ID — format: G-XXXXXXXXXX */
  measurementId: string
  /** Event name prefix (default: "tourkit_") */
  eventPrefix?: string
  /** If true, skip loader-script injection even when gtag is absent (advanced; for tag-manager setups) */
  manualScriptLoad?: boolean
}

let warned = false
function warnOnce(msg: string) {
  if (warned || process.env.NODE_ENV === 'production') return
  warned = true
  logger.warn(`[tour-kit] ${msg}`)
}

function injectGtagScript(measurementId: string) {
  // 1. Initialize dataLayer + gtag stub BEFORE the async script loads (Google's canonical pattern)
  window.dataLayer = window.dataLayer || []
  const gtag: GtagFunction = function gtag(...args: unknown[]) {
    ;(window.dataLayer as unknown[]).push(args)
  }
  window.gtag = gtag
  gtag('js', new Date())
  gtag('config', measurementId, { send_page_view: false })

  // 2. Append the loader script
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`
  script.onerror = () => {
    warnOnce(
      `ga4Plugin: failed to load gtag.js for ${measurementId}. Check CSP — add https://www.googletagmanager.com to script-src.`,
    )
  }
  document.head.appendChild(script)
}

/**
 * Google Analytics 4 plugin — peer-optional (gtag is a global, no npm peer).
 *
 * Feature-detect: if `window.gtag` and `window.dataLayer` already exist
 * (consumer loaded gtag.js via Next.js <Script /> or a marketing CMS), we
 * reuse the global and register our measurementId alongside theirs via
 * `gtag('config', measurementId, ...)`. Multiple config calls with different
 * IDs are explicitly supported by GA4.
 *
 * @example
 * import { ga4Plugin } from '@tour-kit/analytics/plugins/ga4'
 * createAnalytics({ plugins: [ga4Plugin({ measurementId: 'G-XXXXXXXXXX' })] })
 */
export function ga4Plugin(options: Ga4PluginOptions): AnalyticsPlugin {
  const prefix = options.eventPrefix ?? 'tourkit_'
  let ready = false

  const getGtag = (): GtagFunction | null =>
    typeof window !== 'undefined' && typeof window.gtag === 'function' ? window.gtag : null

  return {
    id: 'ga4',
    name: 'ga4',

    init() {
      if (typeof window === 'undefined') return

      // Feature-detect — memory #37: gtag lacks isInitialized(); use this pair as the canonical signal.
      const alreadyLoaded =
        typeof window.gtag === 'function' && Array.isArray(window.dataLayer)

      if (alreadyLoaded) {
        // Reuse consumer's gtag; register our measurement ID alongside theirs
        ;(window.gtag as GtagFunction)('config', options.measurementId, {
          send_page_view: false,
        })
        ready = true
        return
      }

      if (options.manualScriptLoad) {
        warnOnce(
          'ga4Plugin: manualScriptLoad is true and no gtag global was detected — events will be queued in dataLayer only.',
        )
        // Still initialize a minimal dataLayer so track() doesn't crash
        window.dataLayer = window.dataLayer || []
        window.gtag = function gtag(...args: unknown[]) {
          ;(window.dataLayer as unknown[]).push(args)
        }
        ready = true
        return
      }

      injectGtagScript(options.measurementId)
      ready = true
    },

    track(event: TourEvent) {
      const g = getGtag()
      if (!g || !ready) return
      g('event', `${prefix}${event.eventName}`, {
        tour_id: event.tourId,
        step_id: event.stepId,
        step_index: event.stepIndex,
        total_steps: event.totalSteps,
        duration_ms: event.duration,
        send_to: options.measurementId,
        ...event.metadata,
      })
    },

    identify(userId: string, traits?: Record<string, unknown>) {
      const g = getGtag()
      if (!g) return
      g('set', { user_id: userId, ...traits })
    },

    setContext(ctx: Record<string, unknown>) {
      const g = getGtag()
      if (!g) return
      // GA4's "set" command writes to the persistent dataLayer; subsequent events inherit it
      g('set', ctx)
    },

    flush() {
      // GA auto-flushes via beacon transport
    },

    destroy() {
      // No-op — we don't tear down the consumer's gtag global on plugin destroy
    },
  }
}
```

Update `packages/analytics/package.json` exports map: add `"./plugins/ga4"` entry. Update `tsup.config.ts`: add `'plugins/ga4': 'src/plugins/ga4.ts'` to `entry`. No new peer-dep entries (gtag is a global). Optionally add `@types/gtag.js` to `peerDependenciesMeta` as `optional: true` for consumers that want stricter `Window.gtag` types — but our plugin file declares the minimum signature inline, so the type doesn't require it.

Update `packages/analytics/src/index.ts` to:
1. Keep `googleAnalyticsPlugin` exported with `@deprecated Use ga4Plugin from '@tour-kit/analytics/plugins/ga4'` JSDoc.
2. **Remove** the `posthogPlugin` export from the barrel (existing line `export { posthogPlugin } from './plugins/posthog'`). The subpath `./posthog` continues to export it. Document the migration in CHANGELOG.

**Sanity check:** `pnpm --filter @tour-kit/analytics build` exits 0; `ls packages/analytics/dist/plugins/ga4.js` returns the file; `grep -c "googletagmanager\|gtag/js" packages/analytics/dist/index.js` returns `0`; `grep -c "ga4Plugin\|window.gtag" packages/analytics/src/plugins/ga4.ts` returns ≥3.

---

### Task 13.4 — Integration tests + bundle smoke + docs (1–2h)

**Depends on:** 13.2, 13.3

Three new test files + one new docs page.

**Test file 1: `packages/analytics/__tests__/posthog-plugin.test.ts`** — fixture-based, no live API.

Two cases:
1. **One-event-per-tour-event:** `vi.mock('posthog-js', () => ({ default: { init: vi.fn(), capture: vi.fn(), identify: vi.fn(), register: vi.fn(), reset: vi.fn() } }))`. Create the plugin, call its `init()`, dispatch 3 events via `createAnalytics({ plugins: [postHogPlugin({ apiKey: 'phc_test' })] }).track(...)`. Assert `posthog.capture` called exactly 3 times with `'tourkit_tour_started'`, `'tourkit_step_viewed'`, `'tourkit_tour_completed'` and matching properties.
2. **Double-init guard:** set `(window as any).posthog = { __SV: 1, __loaded: true, capture: vi.fn(), identify: vi.fn(), register: vi.fn() }`. Re-mock `posthog-js` so its `init` is a spy. Call plugin `init()`. Assert the mocked `posthog-js.default.init` was **NOT** called (the plugin reused `window.posthog`). Then call `track(...)` and assert `window.posthog.capture` received the event.

**Test file 2: `packages/analytics/__tests__/ga4-plugin.feature-detect.test.ts`** — DOM smoke, no network.

Two cases:
1. **Reuse existing global:** pre-populate `(window as any).gtag = vi.fn(); (window as any).dataLayer = []`. Call `ga4Plugin({ measurementId: 'G-TEST' }).init?.()`. Assert `document.querySelector('script[src*="googletagmanager.com/gtag/js"]')` returns `null` (no script was injected). Assert `window.gtag` was called exactly once with `('config', 'G-TEST', { send_page_view: false })`.
2. **Inject script when gtag absent:** delete `window.gtag` and `window.dataLayer`. Call `init()`. Assert `document.querySelector('script[src*="googletagmanager.com/gtag/js"]')` is non-null and its `src` contains `id=G-TEST`. Assert `window.gtag` is now a function and `Array.isArray(window.dataLayer)` is true. Dispatch a `track(event)` and assert `window.dataLayer` contains a matching `['event', 'tourkit_*', {...}]` tuple (since the real gtag script never loads in jsdom, our stub pushes raw arrays).

**Test file 3: `packages/analytics/__tests__/build-output-no-peer-deps.test.ts`** — reads built output.

```ts
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

describe('build output — no peer deps in main bundle', () => {
  const root = resolve(__dirname, '..')
  const mainJs = resolve(root, 'dist/index.js')
  const mainCjs = resolve(root, 'dist/index.cjs')

  it.runIf(existsSync(mainJs))('dist/index.js has zero posthog-js / gtag references', () => {
    const content = readFileSync(mainJs, 'utf8')
    expect(content).not.toMatch(/posthog-js/)
    expect(content).not.toMatch(/googletagmanager\.com/)
    expect(content).not.toMatch(/gtag\/js/)
  })

  it.runIf(existsSync(mainCjs))('dist/index.cjs has zero posthog-js / gtag references', () => {
    const content = readFileSync(mainCjs, 'utf8')
    expect(content).not.toMatch(/posthog-js/)
    expect(content).not.toMatch(/googletagmanager\.com/)
    expect(content).not.toMatch(/gtag\/js/)
  })
})
```

Wire this test into the `build` flow: the project already has a `build` script (`tsup`). Update it to `"build": "tsup && vitest run __tests__/build-output-no-peer-deps.test.ts"` so the smoke runs post-build. (If the team prefers separation, leave the test as a regular `pnpm test` target and rely on CI to run both.)

**Docs page: `apps/docs/content/docs/analytics/destinations.mdx`** — new MDX page covering both plugins.

Sections (each is a top-level `##`):
1. **Comparison table** — PostHog vs GA4 with rows: install command, what gets sent, peer-dep, reuses-existing-global, CSP additions, free-tier limits.
2. **PostHog setup** — install snippet, import snippet, `<AnalyticsProvider>` wiring, CSP `script-src` / `connect-src` additions (`https://*.posthog.com`, `https://app.posthog.com`).
3. **GA4 setup** — install snippet (none — gtag is loaded automatically), import snippet, wiring, CSP additions (`https://www.googletagmanager.com`, `https://www.google-analytics.com`). Cite recent commit `092afd3` for the docs-site CSP example.
4. **Coexisting with the consumer's existing analytics** — explain the double-init guard for PostHog and the feature-detect for GA4. Include a "verify in DevTools" recipe: for GA4, `Network → filter "collect" → Preserve log → one collect request per tour event confirms tracking` (cited from memory #29).
5. **Migration note** — `posthogPlugin` → `postHogPlugin` (camelCase), `googleAnalyticsPlugin` → `ga4Plugin`. Show before/after import lines.

Also update the docs registry/config so the new page appears in the sidebar nav under `Analytics` (per the project's "Content Pipeline Rules" in CLAUDE.md — after creating any MDX file, update the corresponding registry/config and verify nav appearance).

**Sanity check:** `pnpm --filter @tour-kit/analytics test -- --run posthog-plugin` exits 0 with both cases; `pnpm --filter @tour-kit/analytics test -- --run ga4-plugin.feature-detect` exits 0 with both cases; `pnpm --filter @tour-kit/analytics test -- --run build-output-no-peer-deps` exits 0 (after `build`); `test -f apps/docs/content/docs/analytics/destinations.mdx` exits 0; the new doc appears in the rendered sidebar of `apps/docs` dev server.

---

## Deliverables

```
packages/analytics/
├── src/
│   ├── types/
│   │   └── plugin.ts                                  # UPDATED — AnalyticsPlugin extended: setContext?(ctx), id? alias for name, JSDoc on traits
│   ├── core/
│   │   └── tracker.ts                                 # UPDATED — public setContext(ctx) method fans out to plugin.setContext?
│   ├── plugins/
│   │   ├── posthog.ts                                 # REWRITTEN — postHogPlugin (camelCase), double-init guard via window.posthog.__SV/__loaded, setContext via posthog.register
│   │   └── ga4.ts                                     # NEW — ga4Plugin with feature-detect (memory #37), loader injection, setContext via gtag('set', ctx)
│   └── index.ts                                       # UPDATED — removes posthogPlugin re-export; deprecates googleAnalyticsPlugin JSDoc
├── __tests__/
│   ├── posthog-plugin.test.ts                         # NEW — one-event-per-tour-event (3 events asserted) + double-init guard fixture
│   ├── ga4-plugin.feature-detect.test.ts              # NEW — reuse-existing-gtag + script-injection cases
│   └── build-output-no-peer-deps.test.ts              # NEW — reads dist/index.{js,cjs}, asserts zero posthog-js/gtag bytes
├── package.json                                       # UPDATED — exports adds ./plugins/posthog + ./plugins/ga4; peerDeps pins posthog-js range
├── tsup.config.ts                                     # UPDATED — entry adds plugins/posthog + plugins/ga4; external adds 'posthog-js'
└── CHANGELOG.md                                       # UPDATED — v? entry: contract extension, postHogPlugin rename, ga4Plugin add, migration

apps/docs/
└── content/docs/analytics/
    └── destinations.mdx                               # NEW — comparison table, install/import per destination, CSP additions, DevTools recipe, migration note
```

---

## Exit Criteria

- [ ] `pnpm --filter @tour-kit/analytics typecheck` exits 0 with the extended `AnalyticsPlugin` interface (all existing plugins still type-check)
- [ ] `grep -E "setContext\?|flush\?|identify\?" packages/analytics/src/types/plugin.ts` returns ≥3 matches (interface declarations)
- [ ] `pnpm --filter @tour-kit/analytics build` exits 0 AND `ls packages/analytics/dist/plugins/posthog.js packages/analytics/dist/plugins/ga4.js` returns both files
- [ ] `grep -c "posthog-js\|googletagmanager\|gtag/js" packages/analytics/dist/index.js packages/analytics/dist/index.cjs` returns `0` for both files (zero peer-dep bytes in main bundle)
- [ ] `pnpm --filter @tour-kit/analytics test -- --run posthog-plugin` exits 0 with ≥2 cases passing (one-event-per-tour-event with capture called exactly 3× + double-init guard with `posthog.init` NOT called)
- [ ] `pnpm --filter @tour-kit/analytics test -- --run ga4-plugin.feature-detect` exits 0 with ≥2 cases passing (no script injection when `window.gtag` exists + script IS injected once when absent, with `id=G-TEST` in src)
- [ ] `pnpm --filter @tour-kit/analytics test -- --run build-output-no-peer-deps` exits 0 (regex assertions hold for both ESM and CJS)
- [ ] All existing analytics tests still pass: `pnpm --filter @tour-kit/analytics test -- --run` exits 0 with zero regressions on the existing console/mixpanel/amplitude/google-analytics test files
- [ ] `packages/analytics/package.json` exports map contains both `./plugins/posthog` AND `./plugins/ga4` entries; `peerDependencies.posthog-js` is set to `">=1.0.0 <2"`
- [ ] `packages/analytics/src/index.ts` does NOT re-export `postHogPlugin` or `ga4Plugin` — verified by `grep -cE "from ['\"]\\./plugins/(posthog|ga4)['\"]" packages/analytics/src/index.ts` returning `0`
- [ ] `test -f apps/docs/content/docs/analytics/destinations.mdx` exits 0 AND `grep -E "PostHog|GA4|gtag|posthog-js|CSP|csp" apps/docs/content/docs/analytics/destinations.mdx` returns ≥5 matches
- [ ] The docs registry/config is updated so `destinations.mdx` appears in the rendered sidebar under Analytics (manual verification on `pnpm --filter docs dev`)
- [ ] CHANGELOG entry documents: contract extension (`setContext`), rename `posthogPlugin` → `postHogPlugin`, deprecation of `googleAnalyticsPlugin` in favor of `ga4Plugin`, migration import paths

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to implement this phase:

---
You are building Phase 13 of Tour Kit v2 Package Polish — Analytics Destinations Part 1 (PostHog + GA4).

### What This Project Is
Tour Kit is a pnpm monorepo of 12 packages providing headless React product-tour primitives (core, react, hints) plus pro packages (announcements, surveys, checklists, adoption, analytics, ai, scheduling, license, media). v2 closes demo-wiring gaps reported while building `examples/dashboard-next/`. Every phase ships as one PR with backwards-compatible types. Stack: TypeScript strict mode, React 18+, tsup, Turborepo, Vitest, jsdom, pnpm. The `@tour-kit/analytics` package is at v0.11.0 and ships a plugin-based tracker — consumers register `AnalyticsPlugin` instances with `createAnalytics({ plugins: [...] })`.

### Established in Prior Phases
- **Phase 0 task 0.5 (peer-dep audit) signed off** in `tasks/v2-package-polish/phase-0-validation.md`: `posthog-js` and `gtag` are both `peer-optional + runtime feature-detect`. No hard dep is added to `@tour-kit/analytics`.
- **Existing `AnalyticsPlugin` interface** in `packages/analytics/src/types/plugin.ts` already has `name`, `init?`, `track`, `identify?`, `flush?`, `destroy?`. Phase 13 adds `setContext?` and an `id?` alias for `name`. Existing plugins (console, mixpanel, amplitude, google-analytics, posthog) continue to compile because all new methods are optional.
- **Existing `posthogPlugin`** in `packages/analytics/src/plugins/posthog.ts` does a naive `posthog.init(...)` with no double-init guard — it must be rewritten to feature-detect `window.posthog.__SV` / `__loaded`.
- **Existing `googleAnalyticsPlugin`** in `packages/analytics/src/plugins/google-analytics.ts` only feature-detects `window.gtag` (no script injection). It does not handle the case where gtag is absent. Phase 13 keeps this plugin as `@deprecated` and introduces `ga4Plugin` at a subpath with full feature-detect + auto-injection.
- **`package.json` exports map** already contains `./posthog`, `./mixpanel`, `./amplitude`, `./google-analytics` subpaths. Phase 13 ADDS `./plugins/posthog` and `./plugins/ga4` (keeping the old paths for back-compat).
- **`tsup.config.ts`** already builds individual plugin files as separate entries. Phase 13 adds two new entries.
- **Memory entry #37 — GA4/gtag:** GA4 lacks an official `isInitialized()` accessor. The canonical feature-detect is `typeof window.gtag === 'function' && Array.isArray(window.dataLayer)`. **You MUST use this exact pair.** If both hold, skip script injection and reuse the consumer's global.
- **Memory entry #29 — GA4 SPA pageview tracking:** verified in DevTools Network tab by filtering `collect` with Preserve log; one `collect` request per route confirms tracking. Include this recipe in the docs page.
- **Recent repo commit `092afd3 fix(docs): allow GA4 + Yandex endpoints in CSP`** — reference this in the destinations doc as precedent for the CSP additions consumers will need.

### Your Goal for This Phase
1. Extend the `AnalyticsPlugin` interface with `setContext?(ctx)`; add an `id?` alias for `name`. Add `TourAnalytics.setContext(ctx)` to the tracker class that fans out to every plugin's optional method.
2. Rewrite `postHogPlugin` (rename from `posthogPlugin`) with a double-init guard that reuses `window.posthog` when `__SV` or `__loaded` is set, and dynamic-imports `posthog-js` otherwise. Move it to the subpath `@tour-kit/analytics/plugins/posthog` and stop re-exporting it from the main barrel.
3. Create `ga4Plugin` at the subpath `@tour-kit/analytics/plugins/ga4`. Feature-detect `window.gtag + window.dataLayer` (memory #37); if both exist, register the measurementId alongside via `gtag('config', id, {...})`. Otherwise inject the loader script tag once.
4. Add three test files: PostHog plugin (one-event-per-tour-event + double-init), GA4 plugin (reuse-global + script-injection), and a build-output smoke test asserting zero peer-dep bytes in `dist/index.{js,cjs}`.
5. Write `apps/docs/content/docs/analytics/destinations.mdx` with a comparison table, per-destination setup, CSP additions, the DevTools verification recipe, and a migration note.

### Data Model Rules (follow exactly)
- **`interface` (exported from main):** `AnalyticsPlugin`, `AnalyticsConfig`. New optional methods widen the contract; do not remove or rename existing fields. Keep `name: string` (required, deprecated in JSDoc) and add `id?: string` (preferred).
- **`interface` (co-located, internal):** `PostHogInstance` in `plugins/posthog.ts`, `GtagFunction` type + `Window` augmentation in `plugins/ga4.ts`. Do NOT import types from `posthog-js` or `@types/gtag.js` at module top — declare local shapes so the module loads without peer deps installed.
- **No Zod schemas.** Plugin options are consumer-side; TypeScript checks at consumer's typecheck.
- **`'use client'` directive** at the top of both plugin files (Next.js App Router compat).
- **Dynamic `import()` only.** Inside each plugin's `init()`, use `await import('posthog-js')` wrapped in try/catch. Never import at module top.
- **No bytes of peer deps in main bundle.** `src/index.ts` must not `export` from `./plugins/posthog` or `./plugins/ga4`. The subpaths are the only entry points. Verified by `grep` + bundle smoke test.

### Architecture
```
@tour-kit/analytics (main entry — zero peer-dep bytes)
  src/types/plugin.ts
    AnalyticsPlugin (EXTENDED): name, id?, init?, track, identify?(userId, traits?),
                                 flush?, setContext?(ctx), destroy?

  src/core/tracker.ts (UPDATED)
    + public setContext(ctx) → forEach plugin: plugin.setContext?.(ctx)

  src/index.ts
    Re-exports: createAnalytics, AnalyticsProvider, useAnalytics, consolePlugin,
                mixpanelPlugin, amplitudePlugin, googleAnalyticsPlugin (DEPRECATED),
                AnalyticsPlugin type, AnalyticsConfig type, TourEvent type
    DOES NOT re-export: postHogPlugin, ga4Plugin (subpath-only)
    REMOVES the existing `posthogPlugin` re-export (consumers migrate to subpath)

@tour-kit/analytics/plugins/posthog (NEW subpath)
  src/plugins/posthog.ts
    export const postHogPlugin: (opts) => AnalyticsPlugin
    Double-init guard:
      const existing = window.posthog
      if (existing && (existing.__SV !== undefined || existing.__loaded === true)
          && typeof existing.capture === 'function') {
        posthog = existing                              // REUSE
      } else {
        const { default: ph } = await import('posthog-js')
        ph.init(apiKey, { api_host, autocapture: false, capture_pageview: false, ... })
        posthog = ph                                    // OWN
      }
    setContext(ctx) → posthog.register(ctx)
    /** @deprecated */ export const posthogPlugin = postHogPlugin  // alias for one minor

@tour-kit/analytics/plugins/ga4 (NEW subpath)
  src/plugins/ga4.ts
    export const ga4Plugin: (opts) => AnalyticsPlugin
    Feature-detect (memory #37):
      const alreadyLoaded =
        typeof window.gtag === 'function' && Array.isArray(window.dataLayer)
      if (alreadyLoaded) {
        window.gtag('config', measurementId, { send_page_view: false })   // REUSE
      } else if (!options.manualScriptLoad) {
        injectGtagScript(measurementId)                                    // INJECT <script>
      }
    track(event) → window.gtag('event', `tourkit_${event.eventName}`, { send_to: measurementId, ... })
    setContext(ctx) → window.gtag('set', ctx)
```

### Confirmed Library APIs

**posthog-js — confirmed via Context7 2026-05-15 (`/posthog/posthog-js`, range `>=1.0.0 <2`):**
```ts
// Library: posthog-js >= 1.362.0 (existing devDep)
// Package: dual ESM/CJS. Default export is the singleton `posthog` instance.
// peerDeps: none (pure browser SDK)

import posthog from 'posthog-js'

// 1. Initialize:
posthog.init('phc_xxx', {
  api_host: 'https://app.posthog.com',
  autocapture: false,                    // we only ship tour events
  capture_pageview: false,
  persistence: 'localStorage',
  loaded: (ph) => { /* optional callback when ready */ },
})

// 2. Capture an event:
posthog.capture('event_name', { tour_id: 't1', step_id: 's2' })

// 3. Identify a user (traits = second arg):
posthog.identify('user-123', { email: 'a@b.com', plan: 'pro' })

// 4. Register super-properties (used by setContext):
posthog.register({ workspace_id: 'w_42' })   // every subsequent capture gets workspace_id

// 5. Reset (used by destroy):
posthog.reset()

// 6. Double-init detection accessors (CONFIRMED):
//    window.posthog.__SV      — set to a numeric (1 / 1.0) by the snippet loader once stub is in place
//    window.posthog.__loaded  — set to true by the runtime once posthog.init() completes
//    Strategy: if either accessor is set AND typeof window.posthog.capture === 'function',
//    reuse the existing handle and SKIP our init().
//    Source: posthog-js source + Context7 examples (playground snippets explicitly check
//    `if (window.posthog) { /* already loaded */ }`).
```

**GA4 / gtag.js — memory #37 + Google's canonical docs (no Context7 call needed, library is a `<script>` tag):**
```ts
// gtag.js loader URL: https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX
// Canonical init recipe (Google docs):
window.dataLayer = window.dataLayer || []
function gtag(...args) { window.dataLayer.push(args) }
window.gtag = gtag
gtag('js', new Date())
gtag('config', 'G-XXXXXXXXXX', { send_page_view: false })   // we control pageviews

// Memory #37 — GA4 feature-detect (no isInitialized() exists in gtag):
const alreadyLoaded =
  typeof window !== 'undefined' &&
  typeof window.gtag === 'function' &&
  Array.isArray(window.dataLayer)
// If alreadyLoaded, SKIP <script> injection and reuse the consumer's global.

// Track event:
window.gtag('event', 'tourkit_step_viewed', {
  tour_id: 't1', step_id: 's2', send_to: 'G-XXXXXXXXXX',
})

// Identify (set user_id):
window.gtag('set', { user_id: 'user-123' })

// Persistent context (super-properties — used by setContext):
window.gtag('set', { workspace_id: 'w_42' })
```

**`package.json` exports map — add two new subpath entries:**
```json
"exports": {
  ".": { /* existing */ },
  "./posthog": { /* EXISTING — kept for back-compat; consumers using this path still work */ },
  "./mixpanel": { /* existing */ },
  "./amplitude": { /* existing */ },
  "./google-analytics": { /* existing */ },
  "./plugins/posthog": {
    "import": {
      "types": "./dist/plugins/posthog.d.ts",
      "default": "./dist/plugins/posthog.js"
    },
    "require": {
      "types": "./dist/plugins/posthog.d.cts",
      "default": "./dist/plugins/posthog.cjs"
    }
  },
  "./plugins/ga4": {
    "import": {
      "types": "./dist/plugins/ga4.d.ts",
      "default": "./dist/plugins/ga4.js"
    },
    "require": {
      "types": "./dist/plugins/ga4.d.cts",
      "default": "./dist/plugins/ga4.cjs"
    }
  },
  "./package.json": "./package.json"
},
"peerDependencies": {
  "react": "^18.0.0 || ^19.0.0",
  "react-dom": "^18.0.0 || ^19.0.0",
  "posthog-js": ">=1.0.0 <2"
},
"peerDependenciesMeta": {
  "@amplitude/analytics-browser": { "optional": true },
  "mixpanel-browser": { "optional": true },
  "posthog-js": { "optional": true }
}
```

**`tsup.config.ts` — add new entries + mark posthog-js external:**
```ts
// Existing config + add:
entry: {
  index: 'src/index.ts',
  // ... existing plugin entries ...
  'plugins/posthog': 'src/plugins/posthog.ts',  // NEW
  'plugins/ga4': 'src/plugins/ga4.ts',          // NEW
},
external: ['posthog-js', /* existing externals: react, react-dom, @tour-kit/*, etc. */],
```

### Files to Create / Update

#### `packages/analytics/src/types/plugin.ts` (UPDATED — full file pasted below)
Replace the file contents with the extended interface. Keep `name` required (back-compat); add `id?`; add `setContext?(ctx: Record<string, unknown>): void` with `@since 2.0` JSDoc. `flush?` and `identify?` keep their existing signatures — only the JSDoc on `identify` is updated to clarify the second arg is semantically "traits". Do NOT remove `init?` or `destroy?`.

#### `packages/analytics/src/core/tracker.ts` (UPDATED)
Append a public `setContext(ctx: Record<string, unknown>)` method to the `TourAnalytics` class. Implementation: same fan-out + try/catch pattern as the existing `identify()` method. Do not modify any other class member.

#### `packages/analytics/src/plugins/posthog.ts` (REWRITTEN)
Full rewrite. Export `postHogPlugin` (camelCase) and keep `posthogPlugin` as a `@deprecated` alias for one minor. The implementation MUST include the double-init guard: check `window.posthog.__SV` or `window.posthog.__loaded` before calling `posthog.init(...)`. Use `posthog.register(ctx)` for `setContext`. Use `posthog.reset()` for `destroy`. Dynamic-import `posthog-js` wrapped in try/catch; warn-once on missing peer dep via the module-level `warned` flag. Local `PostHogInstance` interface shapes the 5 methods we use plus `__SV?` and `__loaded?` for detection. Add `'use client'` at the top.

#### `packages/analytics/src/plugins/ga4.ts` (NEW)
Implement `ga4Plugin({ measurementId, eventPrefix?, manualScriptLoad? })`. Feature-detect `window.gtag` + `Array.isArray(window.dataLayer)` (memory #37). If both hold, call `gtag('config', measurementId, { send_page_view: false })` and return. Otherwise (unless `manualScriptLoad` is true), call `injectGtagScript(measurementId)` — a helper that initializes `window.dataLayer`, defines `window.gtag` as a push-to-dataLayer shim, runs `gtag('js', new Date())` + `gtag('config', measurementId, { send_page_view: false })`, then appends `<script async src="https://www.googletagmanager.com/gtag/js?id=...">` to `document.head` with an `onerror` that warns once about CSP. `track(event)` → `gtag('event', prefix + event.eventName, { ... payload, send_to: measurementId })`. `identify(userId, traits)` → `gtag('set', { user_id, ...traits })`. `setContext(ctx)` → `gtag('set', ctx)`. `destroy` is a no-op (don't tear down the consumer's gtag). Add `'use client'`. Declare `Window.gtag` + `Window.dataLayer` via `declare global`.

#### `packages/analytics/src/index.ts` (UPDATED)
Remove the existing `export { posthogPlugin } from './plugins/posthog'` line. Add a `@deprecated` JSDoc comment above the `googleAnalyticsPlugin` re-export pointing to `ga4Plugin from '@tour-kit/analytics/plugins/ga4'`. Do NOT add any new re-export from `./plugins/posthog` or `./plugins/ga4` — those are subpath-only.

#### `packages/analytics/package.json` (UPDATED)
Add `./plugins/posthog` and `./plugins/ga4` to `exports`. Promote `posthog-js` from `peerDependenciesMeta` only → `peerDependencies` with range `">=1.0.0 <2"` (keep the `optional: true` meta). Do NOT touch `dependencies` or `devDependencies`.

#### `packages/analytics/tsup.config.ts` (UPDATED)
Add `'plugins/posthog': 'src/plugins/posthog.ts'` and `'plugins/ga4': 'src/plugins/ga4.ts'` to the `entry` object. Ensure `external` includes `'posthog-js'` (string match — tsup accepts string or regex). Keep dual ESM/CJS output. Keep existing entries unchanged.

#### `packages/analytics/__tests__/posthog-plugin.test.ts` (NEW)
Two cases:
1. **One-event-per-tour-event:** mock `posthog-js` via `vi.mock('posthog-js', () => ({ default: { init: vi.fn(), capture: vi.fn(), identify: vi.fn(), register: vi.fn(), reset: vi.fn() } }))`. Import `postHogPlugin`. Create `createAnalytics({ plugins: [postHogPlugin({ apiKey: 'phc_test' })] })`, await any init promise, call `.track('tour_started', { tourId: 't1' })`, `.track('step_viewed', { tourId: 't1', stepId: 's1', stepIndex: 0, totalSteps: 3 })`, `.track('tour_completed', { tourId: 't1' })`. Import the mocked module and assert `mod.default.capture` was called 3 times with `'tourkit_tour_started'`, `'tourkit_step_viewed'`, `'tourkit_tour_completed'` and a `tour_id: 't1'` property each.
2. **Double-init guard:** set `(window as any).posthog = { __SV: 1, __loaded: true, capture: vi.fn(), identify: vi.fn(), register: vi.fn(), reset: vi.fn() }`. Re-mock `posthog-js`. Create the plugin and call init. Assert the mocked `posthog-js.default.init` was NOT called. Dispatch one tour event and assert `window.posthog.capture` was called with the `'tourkit_*'` event name (not the mocked module's capture).

#### `packages/analytics/__tests__/ga4-plugin.feature-detect.test.ts` (NEW)
Two cases (use `beforeEach` to reset `window.gtag`, `window.dataLayer`, and remove any injected `<script>` tags from `document.head`):
1. **Reuse existing global:** `(window as any).gtag = vi.fn(); (window as any).dataLayer = [];`. Create `ga4Plugin({ measurementId: 'G-TEST' })`; call its `init?.()`. Assert `document.querySelector('script[src*="googletagmanager.com/gtag/js"]')` is `null`. Assert `window.gtag` was called with `('config', 'G-TEST', { send_page_view: false })`.
2. **Inject script when gtag absent:** ensure `delete (window as any).gtag; delete (window as any).dataLayer`. Call `init?.()`. Assert `document.querySelector('script[src*="googletagmanager.com/gtag/js"]')` is non-null AND its `src` contains `id=G-TEST`. Assert `typeof window.gtag === 'function'` and `Array.isArray(window.dataLayer)` are both true. Dispatch a `track({ eventName: 'tour_started', tourId: 't1', timestamp: 0, sessionId: 's' })`; assert `window.dataLayer` contains at least one entry whose first element is `'event'` and second is `'tourkit_tour_started'` (since the real loader never runs in jsdom, gtag pushes raw arrays).

#### `packages/analytics/__tests__/build-output-no-peer-deps.test.ts` (NEW)
Read `dist/index.js` and `dist/index.cjs` via `node:fs`. Skip each assertion (`it.runIf(existsSync(path))`) if the file is missing — so the test passes in dev environments without a build. Assert neither contains the regex `/posthog-js/`, `/googletagmanager\.com/`, or `/gtag\/js/`. Reference content paste in Task 13.4 above.

#### `packages/analytics/CHANGELOG.md` (UPDATED)
Add an entry covering:
- **Added:** `setContext(ctx)` method on `TourAnalytics` and as an optional method on `AnalyticsPlugin`. `id?` field on `AnalyticsPlugin` as alias for `name`. New `postHogPlugin` at `@tour-kit/analytics/plugins/posthog` (camelCase rename + double-init guard). New `ga4Plugin` at `@tour-kit/analytics/plugins/ga4` (feature-detect + auto-loader).
- **Changed:** `posthogPlugin` no longer re-exported from the main entry — import from `@tour-kit/analytics/plugins/posthog` (or the legacy `@tour-kit/analytics/posthog` subpath, which still works).
- **Deprecated:** `googleAnalyticsPlugin` (use `ga4Plugin` from `@tour-kit/analytics/plugins/ga4`). `posthogPlugin` lowercase export (use `postHogPlugin`).
- **Migration:** show before/after import lines.

#### `apps/docs/content/docs/analytics/destinations.mdx` (NEW)
Sections:
1. **Comparison table** — columns: PostHog, GA4. Rows: Install command (`pnpm add posthog-js` vs none), What gets sent (per-event capture vs gtag event), Peer-dep (npm vs global), Reuses existing global (yes, via `window.posthog.__SV/__loaded` vs yes, via `window.gtag` + `window.dataLayer`), CSP additions, Free-tier limits.
2. **PostHog setup** — paste the import + wiring snippet. CSP: `script-src 'self' https://*.posthog.com; connect-src 'self' https://*.posthog.com https://app.posthog.com;`. Note the double-init guard prevents duplicate events.
3. **GA4 setup** — paste the import + wiring snippet. CSP: `script-src 'self' https://www.googletagmanager.com; connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com; img-src 'self' https://www.google-analytics.com;`. Reference commit `092afd3` as the precedent for the docs-site CSP.
4. **Coexisting with the consumer's existing analytics** — explain both feature-detect strategies. Include DevTools recipe (memory #29): for GA4, open Network panel → filter `collect` → enable Preserve log → trigger a tour → one `collect` request per event confirms tracking.
5. **Migration** — show `posthogPlugin` → `postHogPlugin` import-path change and `googleAnalyticsPlugin` → `ga4Plugin` import-path change. One sentence each.

Update the docs registry/config (per CLAUDE.md Content Pipeline Rules) so the page appears under the Analytics sidebar section.

### Success Criteria
- `pnpm --filter @tour-kit/analytics typecheck` exits 0
- `pnpm --filter @tour-kit/analytics build` exits 0; `dist/plugins/posthog.js`, `dist/plugins/posthog.cjs`, `dist/plugins/ga4.js`, `dist/plugins/ga4.cjs` all exist
- `grep -c "posthog-js\|googletagmanager\|gtag/js" packages/analytics/dist/index.js` returns `0`
- `pnpm --filter @tour-kit/analytics test -- --run posthog-plugin` exits 0 (both cases)
- `pnpm --filter @tour-kit/analytics test -- --run ga4-plugin.feature-detect` exits 0 (both cases)
- `pnpm --filter @tour-kit/analytics test -- --run build-output-no-peer-deps` exits 0
- All existing analytics tests still pass: `pnpm --filter @tour-kit/analytics test -- --run` exits 0
- `test -f apps/docs/content/docs/analytics/destinations.mdx` exits 0; the page appears in the rendered sidebar on `pnpm --filter docs dev`

### Expected File Structure at End
```
tasks/v2-package-polish/
├── big-plan.md
├── phase-0.md
├── phase-0-validation.md
├── phase-1.md
├── ...
├── phase-12.md
├── phase-13.md
└── (downstream phase files unchanged)

packages/analytics/
├── src/
│   ├── types/plugin.ts                                # UPDATED
│   ├── core/tracker.ts                                # UPDATED — public setContext(ctx)
│   ├── plugins/
│   │   ├── posthog.ts                                 # REWRITTEN
│   │   └── ga4.ts                                     # NEW
│   ├── index.ts                                       # UPDATED — removes posthogPlugin re-export
│   └── (existing core/, types/, plugins/console.ts, mixpanel.ts, amplitude.ts, google-analytics.ts unchanged)
├── __tests__/
│   ├── posthog-plugin.test.ts                         # NEW
│   ├── ga4-plugin.feature-detect.test.ts              # NEW
│   └── build-output-no-peer-deps.test.ts              # NEW
├── package.json                                       # UPDATED — exports + peerDeps
├── tsup.config.ts                                     # UPDATED — entries + external
└── CHANGELOG.md                                       # UPDATED

apps/docs/
└── content/docs/analytics/
    └── destinations.mdx                               # NEW
```

---

## Readiness Check

- [PASS] All inputs from prior phases listed and available — Phase 0 task 0.5 (peer-dep audit for `posthog-js` and `gtag`) is cited; the existing `AnalyticsPlugin` interface, `posthogPlugin`, `googleAnalyticsPlugin`, `package.json` exports map, and `tsup.config.ts` are all referenced with current state described; memory entries #29 (GA4 SPA pageview DevTools recipe) and #37 (GA4 feature-detect pattern) are cited inline in both the architecture section and the execution prompt.
- [PASS] Every sub-task has a clear, testable completion condition — each of 13.1–13.4 has a `Sanity check` line combining typecheck + build + targeted test + grep guard. The double-init guard, feature-detect, and zero-peer-dep-bytes contracts each have a dedicated exit checkbox.
- [PASS] Execution prompt is self-contained — confirmed posthog-js snippet pasted verbatim (init/capture/identify/register/reset + `__SV`/`__loaded` accessors); GA4 canonical recipe pasted verbatim (dataLayer + gtag stub + loader URL); `package.json` exports map shown verbatim with both new subpaths; `tsup.config.ts` entry diff shown; per-file guidance has one paragraph per file in the deliverables tree; success criteria are observable shell commands.
- [PASS] Exit criteria map 1:1 to deliverables — every NEW/UPDATED file in the deliverables tree appears in at least one exit checkbox (typecheck, build, test, grep guard, or doc-existence check); the zero-peer-dep-bytes contract has both a grep-against-dist check and a dedicated build-smoke test; the docs registry update is a manual-verification checkbox.
- [PASS] Heavy external deps have a fake/stub strategy noted — `posthog-js` is mocked via `vi.mock('posthog-js', () => ({ default: { init: vi.fn(), capture: vi.fn(), identify: vi.fn(), register: vi.fn(), reset: vi.fn() } }))` in both the one-event-per-tour-event and double-init cases (the latter additionally sets `window.posthog`); GA4 has no npm peer — the test directly manipulates `window.gtag` / `window.dataLayer` and asserts on `document.querySelector('script[src*="googletagmanager.com/gtag/js"]')`. No 100MB+ deps in this phase.
- [PASS] New libraries have a confirmed snippet from Context7 in the execution prompt — `posthog-js >= 1.362.0` confirmed via Context7 2026-05-15 (`/posthog/posthog-js`): `posthog.init(apiKey, { api_host, autocapture, capture_pageview, persistence })`, `posthog.capture(event, props)`, `posthog.identify(userId, traits)`, `posthog.register(superProps)` (used for `setContext`), `posthog.reset()`. Double-init accessors confirmed: `window.posthog.__SV` (set by snippet loader; the `array.full.js`/`array.js` snippet explicitly sets `e.__SV = 1.0` / `e.__SV = 1`) and `window.posthog.__loaded` (set by the runtime instance once init completes). GA4 needs no Context7 call — memory entry #37 + Google's canonical `<script>` loader URL pattern are sufficient and pasted in the execution prompt.
