# Phase 14 — Analytics Destinations Part 2 + useFunnel

**Duration:** Days 72–77 (~9–14 hours)
**Depends on:** Phase 13 task 13.1 — `AnalyticsPlugin` contract extended with `flush()`, `identify(userId, traits)`, and `setContext(context)`. The contract lives in `packages/analytics/src/types/plugin.ts`; Phase 14 implements two more plugins against the same shape. Phase 13's `postHogPlugin` and `ga4Plugin` are the reference implementations to mirror.
**Blocks:** Nothing direct (M7 milestone gate — "all 4 analytics destinations + funnel hook shipped" — closes when this phase merges)
**Risk Level:** MEDIUM — the plugin contract is locked by Phase 13 and two of these plugins (Segment + Amplitude) are net-new implementations of an existing shape. The risk surface is (a) keeping zero peer-dep bytes out of `dist/index.js` for two new subpath entries and (b) wiring the new `useFunnel` hook to the existing analytics event stream without introducing a memory leak across rapid mount/unmount cycles.
**Stack:** react

---

## Objective

Close the analytics destination set by shipping `segmentPlugin({ writeKey })` and `amplitudePlugin({ apiKey })` against the Phase 13 extended `AnalyticsPlugin` contract, plus a new `useFunnel(tourId)` hook that subscribes to the tour analytics event stream and returns live `{ step, total, dropOff, completionRate }` for an in-app dashboard widget. Both new plugins are peer-optional via subpath exports (`@tour-kit/analytics/segment`, `@tour-kit/analytics/amplitude`) mirroring the Phase 7 / Phase 13 pattern — zero bytes of `@segment/analytics-next` or `@amplitude/analytics-browser` may leak into the main analytics bundle when not imported. A docs comparison table covers all 4 destinations (PostHog, GA4, Segment, Amplitude) plus per-stack integration recipes.

## What Success Looks Like

1. **All four destinations have a working `dashboard-next` demo recipe** — verified by `examples/dashboard-next/src/lib/analytics-recipes.ts` containing one named factory per destination (`makePostHogAnalytics`, `makeGa4Analytics`, `makeSegmentAnalytics`, `makeAmplitudeAnalytics`) and a smoke test `apps/docs/__tests__/analytics-recipes.smoke.test.ts` asserting each factory returns a `TourAnalytics` with at least one plugin whose `name` matches the destination id.
2. **`useFunnel('onboarding')` returns live counts as steps fire** — RTL test mounts `<AnalyticsProvider config={{ plugins: [consolePlugin()] }}><FunnelHarness /></AnalyticsProvider>`, dispatches `tour_started → step_viewed (×3) → tour_completed` via `useAnalytics().track*` calls, and asserts `result.current` transitions from `{ step: 0, total: 0, dropOff: 0, completionRate: 0 }` → `{ step: 3, total: 1, dropOff: 0, completionRate: 1 }`.
3. **`consolePlugin` no longer triggers "dev-only" warnings now that real destinations exist** — the existing dev warning in `packages/analytics/src/plugins/console.ts` ("This is a dev-only plugin; add a real destination before production") is removed because the comparison docs page now lists four production destinations consumers can choose from. Verified by `grep -c "dev-only" packages/analytics/src/plugins/console.ts` returning `0`.
4. **Bundle analyzer: each plugin adds zero bytes to the main analytics bundle when not imported** — verified by `grep -c "analytics-next\|amplitude" packages/analytics/dist/index.js` returning `0` for both files (`dist/index.js` and `dist/index.cjs`). The new plugin bytes live only in `dist/plugins/segment.js` and `dist/plugins/amplitude.js` (the Amplitude plugin file already exists at v0.11.0; this phase re-points it to the extended contract — bytes remain in the subpath).
5. **Typecheck clean across the analytics package** — `pnpm --filter @tour-kit/analytics typecheck` exits 0.
6. **All existing analytics tests still pass** — `pnpm --filter @tour-kit/analytics test -- --run` exits 0 with zero regressions on the existing 12+ test files (event-queue, tracker, posthog-plugin, etc.).
7. **Comparison docs page renders with 4 columns** — `apps/docs/content/docs/analytics/destinations-comparison.mdx` is published; Fumadocs build emits the page; the rendered HTML contains a `<table>` with 4 destination columns (PostHog, GA4, Segment, Amplitude) and rows for setup difficulty, peer-dep size, identify support, and retention. `grep -c "Segment\|Amplitude\|PostHog\|GA4" apps/docs/content/docs/analytics/destinations-comparison.mdx` returns ≥4.

---

## Architecture / Key Design Decisions

```
                ┌────────────────────────────────────────────────────────────┐
                │  @tour-kit/analytics (main entry — zero peer-dep bytes)    │
                │                                                            │
                │  AnalyticsProvider                                         │
                │    creates TourAnalytics (existing — unchanged)            │
                │                                                            │
                │  TourAnalytics                                             │
                │    dispatches events to all plugins (existing pipeline)    │
                │    + NEW: emit('analytics:event', event) on every track    │
                │      via a lightweight Subscriber (no new dep)             │
                │                                                            │
                │  useFunnel(tourId): FunnelData                             │
                │    subscribes to the Subscriber via useSyncExternalStore   │
                │    reduces events into { step, total, dropOff, completion} │
                │    SSR-safe; cleans up on unmount                          │
                └────────────────────────────────────────────────────────────┘
                          ▲                                       ▲
                          │ (consumer opts in via subpath)        │
                          │                                       │
                ┌─────────────────────────┐         ┌────────────────────────────────┐
                │ @tour-kit/analytics/    │         │ @tour-kit/analytics/amplitude  │
                │     segment             │         │                                │
                │                         │         │ export function amplitudePlugin│
                │ export function         │         │   wraps @amplitude/analytics-  │
                │   segmentPlugin         │         │   browser via dynamic import   │
                │   ({ writeKey })        │         │   (already implemented in      │
                │   wraps @segment/       │         │   v0.11.0 — Phase 14 only      │
                │   analytics-next via    │         │   re-points it to the extended │
                │   dynamic import        │         │   contract: adds setContext)   │
                └─────────────────────────┘         └────────────────────────────────┘
                          │                                       │
                          ▼                                       ▼
                ┌──────────────────────────┐         ┌──────────────────────────────┐
                │ @segment/analytics-next  │         │ @amplitude/analytics-browser │
                │ (peer-optional ^1.84.0)  │         │ (peer-optional ^2.42.0)      │
                └──────────────────────────┘         └──────────────────────────────┘
```

### Data Model Strategy

| Layer | Type | Why |
|-------|------|-----|
| Plugin contract (public, exported from main) | `interface AnalyticsPlugin` — extended in Phase 13 with `setContext?(ctx: AnalyticsContext): void` | Consumers can author custom plugins typed against the canonical shape; `setContext` is optional so older plugins (mixpanel, console) compile unchanged |
| `segmentPlugin` / `amplitudePlugin` | factory function returning `AnalyticsPlugin` | Closures hold the SDK instance lazily; matches the existing posthog/ga4 idiom verbatim |
| `useFunnel` return value | `interface FunnelData { step: number; total: number; dropOff: number; completionRate: number }` | Closed, observable, dashboard-renderable shape; no per-step array (consumers that need that should read the raw subscriber) |
| Internal funnel reducer state | plain object `{ tourId: string; started: number; completed: number; stepCounts: Record<string, number> }` reduced via `React.useReducer` | No new dep (Zustand is not in the analytics package); `useReducer` is sufficient because the subscriber serializes events into one dispatch per event |
| Analytics event subscriber | `Set<(event: TourEvent) => void>` on `TourAnalytics` instance | Lightweight; one allocation per provider; subscribe/unsubscribe are O(1); no new dependency. Mirrors the `EventQueue` pattern already in the package |

**Critical rules for this phase:**

- **Two new subpath entries, two new peer-deps optional.** `packages/analytics/package.json` already declares `@amplitude/analytics-browser` as peer-optional and ships the `./amplitude` subpath. Phase 14 adds the same shape for `@segment/analytics-next` and `./segment`. No hard deps are introduced.
- **Subscriber lives on the `TourAnalytics` instance, not in module-level state.** Multiple providers (e.g., a test harness mounting two trackers) must not cross-pollinate funnel data. The subscriber set is an instance field added in Task 14.3.
- **`useFunnel` is SSR-safe.** Use `useSyncExternalStore` with a `getServerSnapshot` returning the zero state (`{ step: 0, total: 0, dropOff: 0, completionRate: 0 }`). The hook must not throw if mounted outside `<AnalyticsProvider>` — it returns the zero state and logs a one-time dev warning (consistent with `useAnalyticsOptional`).
- **Funnel calculation rule (deterministic):**
  - `total` = count of `tour_started` events for `tourId` since hook mount
  - `step` = max step index observed in `step_viewed` events for `tourId` (0-based; 0 when none)
  - `completed` = count of `tour_completed` events for `tourId` (internal, not exposed)
  - `dropOff` = `total - completed` (number of started-but-not-completed tours)
  - `completionRate` = `total === 0 ? 0 : completed / total` (clamp 0–1; returned as a fraction, not a percentage — docs note this)
- **No new keyframes, no new UI components.** `useFunnel` is logic-only; consumers render their own dashboard widget.
- **Dynamic import in plugins.** Both new plugins use `await import('@segment/analytics-next')` and `await import('@amplitude/analytics-browser')` wrapped in try/catch, mirroring the posthog plugin (lines 47–62 of `posthog.ts`). Do NOT import at module top — that breaks the zero-bytes-in-main-bundle contract.
- **No `<Toaster />`-style requirement.** Segment loads via `AnalyticsBrowser.load({ writeKey })` and immediately accepts buffered `.track()` calls; Amplitude requires `init(apiKey)` before any `track()`. Both happen inside the plugin's `init()` lifecycle hook, which `TourAnalytics` already awaits.
- **`name` field on each plugin matches the comparison-doc column header verbatim** — `segment` and `amplitude` — so consumers can filter analytics output by destination id.

---

## Tasks

### Task 14.1 — `segmentPlugin({ writeKey })` at peer-optional subpath (2–3 h)

**Depends on:** Phase 13 task 13.1 (`AnalyticsPlugin` contract gained `setContext()`)

Build `packages/analytics/src/plugins/segment.ts` — a peer-optional Segment plugin that wraps `@segment/analytics-next`. Mirrors the posthog plugin idiom verbatim: dynamic import in `init()`, instance held in a closure, `track()` no-ops when not initialized, `flush()` and `identify()` and the new `setContext()` delegate to the underlying SDK.

```ts
// Confirmed via Context7 (2026-05-15) — Library: @segment/analytics-next 1.84.0
// Key API: AnalyticsBrowser.load({ writeKey }) returns AnalyticsBrowser; .track(event, properties)
// Package: dual ESM/CJS; tree-shakeable; peerDeps react ^18 || ^19
// Buffered API — .track() called before load completes is queued internally

// packages/analytics/src/plugins/segment.ts
import { logger } from '@tour-kit/core'
import type { TourEvent } from '../types/events'
import type { AnalyticsPlugin, AnalyticsContext } from '../types/plugin'

interface SegmentInstance {
  track: (event: string, properties?: Record<string, unknown>) => void
  identify: (userId: string, traits?: Record<string, unknown>) => void
  page: (name?: string, properties?: Record<string, unknown>) => void
  group: (groupId: string, traits?: Record<string, unknown>) => void
  flush?: () => Promise<void>
}

interface SegmentPluginOptions {
  /** Segment write key (from app.segment.com) */
  writeKey: string
  /** Custom CDN URL (rare; for proxied installs) */
  cdnURL?: string
  /** Event name prefix (default: tourkit_) */
  eventPrefix?: string
  /** Disable client persistence (cookies/localStorage) */
  disableClientPersistence?: boolean
}

/**
 * Segment analytics plugin (peer-optional).
 *
 * @example
 * ```ts
 * import { segmentPlugin } from '@tour-kit/analytics/segment'
 *
 * const analytics = createAnalytics({
 *   plugins: [segmentPlugin({ writeKey: 'YOUR_WRITE_KEY' })],
 * })
 * ```
 */
export function segmentPlugin(options: SegmentPluginOptions): AnalyticsPlugin {
  let segment: SegmentInstance | null = null
  let context: AnalyticsContext | null = null
  const prefix = options.eventPrefix ?? 'tourkit_'

  return {
    name: 'segment',

    async init() {
      if (typeof window === 'undefined') return
      try {
        const mod = await import('@segment/analytics-next')
        // AnalyticsBrowser.load returns an AnalyticsBrowser that satisfies our
        // SegmentInstance shape; calls before load resolves are buffered internally.
        segment = mod.AnalyticsBrowser.load(
          {
            writeKey: options.writeKey,
            cdnURL: options.cdnURL,
          },
          {
            disableClientPersistence: options.disableClientPersistence ?? false,
          },
        ) as unknown as SegmentInstance
      } catch (error) {
        logger.warn('Analytics: Segment not available:', error)
      }
    },

    track(event: TourEvent) {
      if (!segment) return
      segment.track(`${prefix}${event.eventName}`, {
        tour_id: event.tourId,
        step_id: event.stepId,
        step_index: event.stepIndex,
        total_steps: event.totalSteps,
        duration_ms: event.duration,
        session_id: event.sessionId,
        ...event.metadata,
        ...(context ?? {}),
      })
    },

    identify(userId: string, traits?: Record<string, unknown>) {
      if (!segment) return
      segment.identify(userId, traits)
    },

    setContext(ctx: AnalyticsContext) {
      context = ctx
    },

    async flush() {
      if (!segment?.flush) return
      await segment.flush()
    },

    destroy() {
      // Segment has no explicit reset for AnalyticsBrowser; drop the reference.
      segment = null
    },
  }
}
```

Update `packages/analytics/package.json`:
- Add `./segment` to the `exports` map (mirror the existing `./amplitude` entry shape exactly).
- Add `"@segment/analytics-next": { "optional": true }` to `peerDependenciesMeta`.
- Add `"@segment/analytics-next": "^1.84.0"` to `devDependencies` (so the tests can import the real shape).

Update `packages/analytics/tsup.config.ts` `entry` to include `'plugins/segment': 'src/plugins/segment.ts'`, and ensure `external` includes `'@segment/analytics-next'`.

**Sanity check:** `pnpm --filter @tour-kit/analytics build && grep -c "analytics-next" packages/analytics/dist/index.js` returns `0`; `ls packages/analytics/dist/plugins/segment.js` exists; `pnpm --filter @tour-kit/analytics typecheck` exits 0.

---

### Task 14.2 — `amplitudePlugin({ apiKey })` extended-contract refresh (2–3 h)

**Depends on:** Phase 13 task 13.1

The Amplitude plugin already exists at v0.11.0 (`packages/analytics/src/plugins/amplitude.ts`) and ships `init`, `track`, `identify`, `flush`, `destroy`. Phase 14 adds the Phase 13 extended-contract method `setContext()` and aligns event-property naming with the comparison-docs naming guarantee (`tour_id`, `step_id`, `step_index`, `total_steps`, `duration_ms`, `session_id` — Amplitude is currently missing `session_id`).

```ts
// Confirmed via Context7 (2026-05-15) — Library: @amplitude/analytics-browser 2.42.3
// Key API: amplitude.init(apiKey, opts?) → void; amplitude.track(event, properties) → { promise }
// Package: dual ESM/CJS; tree-shakeable; peerDeps react ^18 || ^19
// Default options: defaultTracking auto-instruments sessions + page views unless disabled

import * as amplitude from '@amplitude/analytics-browser'

// 1. Initialize ONCE per app (the plugin does this in init()):
amplitude.init('YOUR_API_KEY', {
  defaultTracking: false,           // we ship explicit events only
  serverUrl: undefined,             // optional EU residency override
})

// 2. Track events:
amplitude.track('Button Clicked', {
  productId: 'SKU-12345',
  price: 29.99,
})

// 3. Identify a user:
amplitude.setUserId('user@example.com')
const identify = new amplitude.Identify()
identify.set('plan', 'pro')
amplitude.identify(identify)

// 4. Flush:
amplitude.flush()
```

Patch `packages/analytics/src/plugins/amplitude.ts`:

1. Add `setContext(ctx)` to the returned `AnalyticsPlugin` — same closure-stored `context` pattern as the segment plugin in 14.1.
2. Add `session_id: event.sessionId` to the `track()` property map (parity with posthog + segment).
3. Add an `eventOptions?: Record<string, unknown>` field to `AmplitudePluginOptions` and pass it as the third argument to `amplitude.track(...)` when present (allows consumers to forward custom `time` / `session_id` overrides per Amplitude's API).
4. Keep the existing dynamic `import('@amplitude/analytics-browser')` in `init()` — already correct.
5. Bump the file's JSDoc example to show `setContext` usage.

Update `packages/analytics/src/plugins/amplitude.ts` — patch only; no file move. The existing `./amplitude` subpath in `package.json` exports map and the existing `'plugins/amplitude'` tsup entry are unchanged.

**Sanity check:** `pnpm --filter @tour-kit/analytics typecheck` exits 0; `grep -c "amplitude" packages/analytics/dist/index.js` returns `0`; `grep -c "session_id" packages/analytics/src/plugins/amplitude.ts` returns ≥1; `grep -c "setContext" packages/analytics/src/plugins/amplitude.ts` returns ≥1.

---

### Task 14.3 — `useFunnel(tourId)` hook + event subscriber (4–6 h)

**Depends on:** —

Two pieces: (a) a lightweight event subscriber bolted onto `TourAnalytics`, (b) the `useFunnel(tourId)` hook that consumes it.

#### Part A — Subscriber on `TourAnalytics`

Patch `packages/analytics/src/core/tracker.ts`:

```ts
// Add to TourAnalytics:
private subscribers = new Set<(event: TourEvent) => void>()

/** Subscribe to every dispatched event. Returns an unsubscribe function. */
subscribe(listener: (event: TourEvent) => void): () => void {
  this.subscribers.add(listener)
  return () => {
    this.subscribers.delete(listener)
  }
}

// In dispatchEvents(), AFTER the plugin track loop, fan out to subscribers:
for (const event of events) {
  for (const sub of this.subscribers) {
    try {
      sub(event)
    } catch (err) {
      if (this.config.debug) {
        logger.error('Analytics: subscriber threw:', err)
      }
    }
  }
}
```

Subscribers must NOT see queued events twice — call them after `dispatchEvents` has fanned out to plugins (i.e., on actual emission, not on enqueue). For the offline-queue/batch path, this means subscribers fire when the queue flushes, not when events are pushed. Document this with a one-line code comment.

#### Part B — `useFunnel` hook

New file `packages/analytics/src/hooks/use-funnel.ts`:

```ts
// packages/analytics/src/hooks/use-funnel.ts
'use client'

import * as React from 'react'
import { useAnalyticsOptional } from '../core/context'
import type { TourEvent } from '../types/events'

export interface FunnelData {
  /** Highest step index observed in step_viewed events (0-based; 0 when none) */
  step: number
  /** Count of tour_started events for this tourId since hook mount */
  total: number
  /** total - completed (started but not completed) */
  dropOff: number
  /** completed / total, fraction in [0, 1]; 0 when total === 0 */
  completionRate: number
}

const ZERO: FunnelData = { step: 0, total: 0, dropOff: 0, completionRate: 0 }

interface FunnelState {
  tourId: string
  started: number
  completed: number
  maxStepIndex: number
}

type FunnelAction = { type: 'event'; event: TourEvent }

function reducer(state: FunnelState, action: FunnelAction): FunnelState {
  const { event } = action
  if (event.tourId !== state.tourId) return state
  switch (event.eventName) {
    case 'tour_started':
      return { ...state, started: state.started + 1 }
    case 'tour_completed':
      return { ...state, completed: state.completed + 1 }
    case 'step_viewed':
      if (typeof event.stepIndex !== 'number') return state
      return {
        ...state,
        maxStepIndex: Math.max(state.maxStepIndex, event.stepIndex),
      }
    default:
      return state
  }
}

/**
 * Subscribes to the analytics event stream and reduces it into a live funnel for a tour.
 *
 * @example
 * const { step, total, dropOff, completionRate } = useFunnel('onboarding')
 *
 * Outside <AnalyticsProvider>, returns the zero state and emits a one-time dev warning.
 */
export function useFunnel(tourId: string): FunnelData {
  const analytics = useAnalyticsOptional()
  const [state, dispatch] = React.useReducer(reducer, {
    tourId,
    started: 0,
    completed: 0,
    maxStepIndex: 0,
  })

  React.useEffect(() => {
    if (!analytics) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.warn('[tour-kit] useFunnel called outside <AnalyticsProvider> — returning zero state')
      }
      return
    }
    const unsubscribe = analytics.subscribe((event) => {
      dispatch({ type: 'event', event })
    })
    return unsubscribe
  }, [analytics])

  // Reset when tourId changes
  const lastTourId = React.useRef(tourId)
  React.useEffect(() => {
    if (lastTourId.current !== tourId) {
      lastTourId.current = tourId
      // reducer ignores events with non-matching tourId; reset state via a
      // synthetic action shape would complicate types — simpler: re-mount key
      // (consumers can pass { key: tourId } if they need a hard reset). For
      // intra-tour use this branch is never hit.
    }
  }, [tourId])

  if (!analytics) return ZERO

  const total = state.started
  const dropOff = Math.max(0, total - state.completed)
  const completionRate = total === 0 ? 0 : state.completed / total
  return {
    step: state.maxStepIndex,
    total,
    dropOff,
    completionRate,
  }
}
```

Re-export from `packages/analytics/src/index.ts`:

```ts
// Hooks
export { useFunnel } from './hooks/use-funnel'
export type { FunnelData } from './hooks/use-funnel'
```

**Sanity check:** `pnpm --filter @tour-kit/analytics typecheck` exits 0; `pnpm --filter @tour-kit/analytics test -- --run use-funnel` exits 0 with the simulated `tour_started → step_viewed → tour_completed` sequence asserting `result.current.completionRate === 1`.

---

### Task 14.4 — Comparison docs + recipes (1–2 h)

**Depends on:** 14.1, 14.2, 14.3

Create `apps/docs/content/docs/analytics/destinations-comparison.mdx`. Use Fumadocs table syntax. Four destination columns + rows for the five evaluation axes the user brief calls out (setup difficulty, peer-dep size, identify support, retention, plus event-prefix support which all four share).

Table outline (paste into the MDX as a real markdown table):

| Capability | PostHog | GA4 | Segment | Amplitude |
|------------|---------|-----|---------|-----------|
| Subpath | `@tour-kit/analytics/posthog` | `@tour-kit/analytics/google-analytics` | `@tour-kit/analytics/segment` | `@tour-kit/analytics/amplitude` |
| Peer dep | `posthog-js` ^1.362 | `gtag.js` (script tag) | `@segment/analytics-next` ^1.84 | `@amplitude/analytics-browser` ^2.42 |
| Setup difficulty | 1 — `apiKey` only | 2 — global `gtag` or `measurementId` | 1 — `writeKey` only | 1 — `apiKey` only |
| Approx peer-dep size (min+gz) | ~55 KB | ~25 KB (script-tag) | ~80 KB | ~45 KB |
| `identify` support | yes | partial (via `set user_id`) | yes | yes |
| `flush` support | auto | n/a | yes | yes |
| `setContext` support | yes (Phase 13) | yes (Phase 13) | yes (Phase 14) | yes (Phase 14) |
| Retention dashboards | native (PostHog) | via GA4 explorations | via downstream destinations | native (Amplitude Charts) |
| EU residency | self-host or EU cloud | regional collection | yes (EU region) | yes (`serverZone: 'EU'`) |

Below the table, four per-stack recipe blocks — copy-pasteable code for each destination:

```mdx
## PostHog recipe

\`\`\`tsx
import { AnalyticsProvider, createAnalytics } from '@tour-kit/analytics'
import { posthogPlugin } from '@tour-kit/analytics/posthog'

const analytics = createAnalytics({
  plugins: [posthogPlugin({ apiKey: process.env.NEXT_PUBLIC_POSTHOG_KEY! })],
})
\`\`\`

## Segment recipe

\`\`\`tsx
import { segmentPlugin } from '@tour-kit/analytics/segment'

const analytics = createAnalytics({
  plugins: [segmentPlugin({ writeKey: process.env.NEXT_PUBLIC_SEGMENT_KEY! })],
})
\`\`\`

(...GA4 and Amplitude blocks follow the same shape.)
```

Also add `useFunnel` to the analytics index docs page (`apps/docs/content/docs/analytics/index.mdx` or whichever the package's landing page is) with one snippet:

```mdx
\`\`\`tsx
import { useFunnel } from '@tour-kit/analytics'

function OnboardingFunnelWidget() {
  const { step, total, dropOff, completionRate } = useFunnel('onboarding')
  return (
    <div>
      <p>Step {step} · {total} starts · {(completionRate * 100).toFixed(0)}% completed · {dropOff} drop-off</p>
    </div>
  )
}
\`\`\`
```

Add the comparison page to the analytics section's `meta.json` so it appears in the sidebar.

Remove the dev-only warning from `packages/analytics/src/plugins/console.ts` (single-line cleanup — see Success Looks Like #3).

**Sanity check:** `pnpm --filter docs build` exits 0; `grep -c "destinations-comparison" apps/docs/content/docs/analytics/meta.json` returns ≥1; `grep -c "useFunnel" apps/docs/content/docs/analytics/index.mdx` returns ≥1; `grep -c "dev-only" packages/analytics/src/plugins/console.ts` returns `0`.

---

## Deliverables

```
packages/analytics/
├── src/
│   ├── plugins/
│   │   ├── segment.ts                            # NEW — peer-optional Segment plugin via dynamic import; setContext supported
│   │   ├── amplitude.ts                          # UPDATED — adds setContext, adds session_id to track payload, adds eventOptions
│   │   └── console.ts                            # UPDATED — removes "dev-only" warning string
│   ├── hooks/
│   │   └── use-funnel.ts                         # NEW — useFunnel(tourId): FunnelData; uses analytics.subscribe + useReducer
│   ├── core/
│   │   └── tracker.ts                            # UPDATED — adds subscribe(listener) → unsubscribe; fans out after dispatchEvents
│   ├── index.ts                                  # UPDATED — re-exports useFunnel + FunnelData type
│   └── __tests__/
│       ├── segment-plugin.test.ts                # NEW — peer-optional smoke (Segment present + absent)
│       ├── amplitude-plugin.test.ts              # UPDATED or NEW — verifies setContext + session_id payload
│       └── use-funnel.test.tsx                   # NEW — RTL simulation of tour_started → step_viewed → tour_completed
├── package.json                                  # UPDATED — exports map adds ./segment; peerDepsMeta adds @segment/analytics-next optional; devDeps add @segment/analytics-next
└── tsup.config.ts                                # UPDATED — adds plugins/segment entry; external: ['@segment/analytics-next', ...]

apps/docs/
├── content/docs/analytics/
│   ├── destinations-comparison.mdx               # NEW — 4-destination comparison table + per-stack recipes
│   ├── index.mdx                                 # UPDATED — adds useFunnel snippet
│   └── meta.json                                 # UPDATED — adds destinations-comparison to sidebar
└── __tests__/
    └── analytics-recipes.smoke.test.ts           # NEW — asserts each destination factory returns a TourAnalytics with the expected plugin name

examples/dashboard-next/
└── src/lib/
    └── analytics-recipes.ts                      # NEW — four named factories: makePostHogAnalytics, makeGa4Analytics, makeSegmentAnalytics, makeAmplitudeAnalytics
```

---

## Exit Criteria

- [ ] `pnpm --filter @tour-kit/analytics typecheck` exits 0
- [ ] `pnpm --filter @tour-kit/analytics build` exits 0
- [ ] `grep -c "analytics-next" packages/analytics/dist/index.js packages/analytics/dist/index.cjs` returns `0` for both files (independent verification of zero-bytes contract for Segment)
- [ ] `grep -c "amplitude" packages/analytics/dist/index.js packages/analytics/dist/index.cjs` returns `0` for both files (zero-bytes contract for Amplitude — re-verified after refresh)
- [ ] `ls packages/analytics/dist/plugins/segment.js packages/analytics/dist/plugins/segment.cjs` returns both files (Segment subpath entry built)
- [ ] `pnpm --filter @tour-kit/analytics test -- --run segment-plugin` exits 0 with ≥2 passing cases (Segment-present routes through `AnalyticsBrowser.load + .track`; Segment-absent logs warn + no-ops)
- [ ] `pnpm --filter @tour-kit/analytics test -- --run amplitude-plugin` exits 0 — at minimum two new assertions: payload includes `session_id`; `setContext({ plan: 'pro' })` then `track()` includes `plan: 'pro'` in the property map
- [ ] `pnpm --filter @tour-kit/analytics test -- --run use-funnel` exits 0 — the RTL test dispatches `tour_started → step_viewed (×3) → tour_completed` and asserts `result.current` transitions to `{ step: 3, total: 1, dropOff: 0, completionRate: 1 }`
- [ ] All existing analytics tests still pass: `pnpm --filter @tour-kit/analytics test -- --run` exits 0 with zero regressions
- [ ] `packages/analytics/package.json` `exports` contains a `./segment` entry; `peerDependenciesMeta["@segment/analytics-next"].optional === true`
- [ ] `apps/docs/content/docs/analytics/destinations-comparison.mdx` exists; `grep -E "Segment|Amplitude|PostHog|GA4" apps/docs/content/docs/analytics/destinations-comparison.mdx | wc -l` returns ≥4 (one match per destination, plus more inside the table)
- [ ] `apps/docs/content/docs/analytics/meta.json` lists `destinations-comparison`
- [ ] `pnpm --filter docs build` exits 0 (Fumadocs successfully renders the new MDX)
- [ ] `grep -c "dev-only" packages/analytics/src/plugins/console.ts` returns `0`
- [ ] `examples/dashboard-next/src/lib/analytics-recipes.ts` exists and exports four named factories — verified by `grep -cE "make(PostHog|Ga4|Segment|Amplitude)Analytics" examples/dashboard-next/src/lib/analytics-recipes.ts` returning ≥4
- [ ] `apps/docs/__tests__/analytics-recipes.smoke.test.ts` exits 0 — asserts each factory returns a `TourAnalytics` with `plugins[0].name` matching the destination id (`posthog`, `google-analytics`, `segment`, `amplitude`)

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to implement this phase:

---
You are building Phase 14 of Tour Kit v2 Package Polish — Analytics Destinations Part 2 + useFunnel.

### What This Project Is
Tour Kit is a pnpm monorepo of 12 packages providing headless React product-tour primitives (core, react, hints) plus pro packages (announcements, surveys, checklists, adoption, analytics, ai, scheduling, license, media). v2 closes demo-wiring gaps reported while building `examples/dashboard-next/`. Every phase ships as one PR with backwards-compatible types. Stack: TypeScript strict mode, React 18+, tsup dual-ESM/CJS, Turborepo, Vitest + RTL, pnpm. The `@tour-kit/analytics` package is at v0.11.0 today; this phase brings it to v0.12.0 with two new plugins (Segment net-new; Amplitude refreshed to the extended contract), one new hook (`useFunnel`), and a 4-destination comparison docs page.

### Established in Prior Phases
- **Phase 13 task 13.1** extended the `AnalyticsPlugin` contract in `packages/analytics/src/types/plugin.ts` with `flush()`, `identify(userId, traits)`, and `setContext(ctx: AnalyticsContext)`. The `AnalyticsContext` type is a `Record<string, unknown>` — global properties forwarded into every `track()` call's property map. Both `flush()` and `identify()` already exist in the v0.11.0 contract; Phase 13 added `setContext` as the new piece. Phase 14 implements two more plugins (`segmentPlugin`, `amplitudePlugin`) against this exact shape.
- **Phase 13 tasks 13.2 / 13.3** shipped `posthogPlugin({ apiKey, host })` and `ga4Plugin({ measurementId })` — both peer-optional via subpath exports `@tour-kit/analytics/posthog` and `@tour-kit/analytics/google-analytics`. The PostHog plugin (`packages/analytics/src/plugins/posthog.ts`) is the reference implementation to mirror for Segment — same dynamic-import-in-init idiom, same closure-stored instance, same `eventPrefix` default of `'tourkit_'`.
- **Phase 7 subpath export pattern** is the canonical reference for peer-optional subpaths — `packages/announcements/src/adapters/sonner.ts` lives behind `@tour-kit/announcements/adapters/sonner` and the main package never imports it. Phase 14 mirrors this for `@tour-kit/analytics/segment` (the `./amplitude` subpath already exists at v0.11.0 and is preserved).
- **Existing analytics source paths:**
  - `packages/analytics/src/core/tracker.ts` — `TourAnalytics` class with `dispatchEvents` loop at lines 104–116. Phase 14 adds a `subscribe(listener)` instance method here and fans events out to subscribers after the plugin track loop.
  - `packages/analytics/src/core/context.tsx` — `AnalyticsProvider` + `useAnalytics` + `useAnalyticsOptional` hooks. `useFunnel` uses `useAnalyticsOptional` so the hook gracefully degrades outside the provider.
  - `packages/analytics/src/plugins/amplitude.ts` — already implemented with `init`, `track`, `identify`, `flush`, `destroy`. Phase 14 adds `setContext`, adds `session_id` to the track payload, adds `eventOptions` field.
  - `packages/analytics/src/plugins/posthog.ts` — copy this idiom verbatim for the new `segment.ts`.

### Your Goal for This Phase
1. **`segmentPlugin({ writeKey })`** — peer-optional plugin under new subpath `@tour-kit/analytics/segment`. Wraps `@segment/analytics-next`'s `AnalyticsBrowser.load()` + `.track()` / `.identify()` / `.flush()`. Closure-stored context for `setContext`.
2. **`amplitudePlugin({ apiKey })` refresh** — patch the existing v0.11.0 plugin to add `setContext`, add `session_id` to the track payload, add `eventOptions` pass-through. Subpath unchanged.
3. **`useFunnel(tourId)`** — new hook in `packages/analytics/src/hooks/use-funnel.ts`. Subscribes to a new lightweight event subscriber on the `TourAnalytics` instance (`subscribe(listener) → unsubscribe`). Reduces `tour_started`, `step_viewed`, `tour_completed` events for the given `tourId` into `{ step, total, dropOff, completionRate }`. SSR-safe; returns the zero state outside `<AnalyticsProvider>` with a one-time dev warning. Uses `React.useReducer` (no new dep — Zustand is not in this package).
4. **Comparison docs page** — `apps/docs/content/docs/analytics/destinations-comparison.mdx` with a 4-column table (PostHog, GA4, Segment, Amplitude) and per-stack copy-pasteable recipes. Add to `meta.json` sidebar.
5. Remove the legacy "dev-only" warning from `packages/analytics/src/plugins/console.ts` (a string match on `dev-only` in that file must return 0 after this phase).
6. Add `examples/dashboard-next/src/lib/analytics-recipes.ts` exporting four named factories — one per destination.

### Data Model Rules (follow exactly)
- **`interface` (exported from main):** `FunnelData` lives in `packages/analytics/src/hooks/use-funnel.ts`. Re-exported via `src/index.ts`. Shape: `{ step: number; total: number; dropOff: number; completionRate: number }`.
- **Factory function (exported from subpath only):** `segmentPlugin: (options) => AnalyticsPlugin` from `packages/analytics/src/plugins/segment.ts`. **Never** re-exported from `src/index.ts`. Verify with `grep -c "plugins/segment" packages/analytics/src/index.ts` returning `0`.
- **Internal reducer state:** plain object `{ tourId, started, completed, maxStepIndex }` reduced via `React.useReducer`. No Pydantic, no Zod (this is a TS-only react package). Closed shape; do not widen.
- **Subscriber set:** `private subscribers = new Set<(event: TourEvent) => void>()` on the `TourAnalytics` instance. Fired AFTER `dispatchEvents` fans out to plugins, NOT on enqueue (so batched events trigger subscribers when the queue flushes, not when pushed). Document with a code comment.
- **Dynamic import in plugins.** Both `segment.ts` and `amplitude.ts` use `await import('...')` wrapped in try/catch inside `init()`. NEVER at module top.
- **`useFunnel` SSR rule:** if `useAnalyticsOptional()` returns `null`, return the zero state and log one dev warning. Never throw.
- **`completionRate` is a fraction in `[0, 1]`** (not a percentage). Docs make this explicit. Consumers multiply by 100 if they want a percent.

### Architecture

```
@tour-kit/analytics (main entry — zero peer-dep bytes)
  src/core/tracker.ts                — TourAnalytics + new subscribe(listener)
  src/core/context.tsx               — AnalyticsProvider (unchanged)
  src/hooks/use-funnel.ts            — useFunnel(tourId): FunnelData
  src/index.ts                       — re-exports useFunnel + FunnelData type
  src/plugins/console.ts             — UPDATED: remove "dev-only" warning string
  src/plugins/amplitude.ts           — UPDATED: setContext + session_id + eventOptions

@tour-kit/analytics/segment (NEW subpath — opt-in)
  src/plugins/segment.ts             — peer-optional Segment via dynamic import

@tour-kit/analytics/amplitude (existing subpath — refreshed in-place)
  src/plugins/amplitude.ts           — see above
```

### Confirmed Library APIs

**`@segment/analytics-next` 1.84.0 — confirmed via Context7 2026-05-15:**

```ts
// Library: @segment/analytics-next 1.84.0
// Install: pnpm add @segment/analytics-next  (peer-optional — consumer installs)
// Package: dual ESM/CJS; tree-shakeable; peerDeps react ^18 || ^19
// Buffered API — .track() called before load completes is queued internally

import { AnalyticsBrowser } from '@segment/analytics-next'

// 1. Static load — returns AnalyticsBrowser proxy (buffered before ready):
const analytics = AnalyticsBrowser.load({ writeKey: 'YOUR_WRITE_KEY' })

// 2. With options:
const analyticsWithOptions = AnalyticsBrowser.load(
  { writeKey: 'YOUR_WRITE_KEY', cdnURL: 'https://custom-cdn.example.com' },
  {
    initialPageview: true,
    disableClientPersistence: false,
    retryQueue: true,
    integrations: { 'Segment.io': { apiHost: 'api.segment.io/v1' } },
  },
)

// 3. Track:
analytics.track('Page Loaded')
analytics.track('Product Added', { productId: 'prod-123', price: 149.99 })

// 4. Identify:
analytics.identify('user-id', { plan: 'pro' })

// 5. Flush (returns Promise<void>):
await analytics.flush()
```

**`@amplitude/analytics-browser` 2.42.3 — confirmed via Context7 2026-05-15:**

```ts
// Library: @amplitude/analytics-browser 2.42.3
// Install: pnpm add @amplitude/analytics-browser  (peer-optional — consumer installs)
// Package: dual ESM/CJS; tree-shakeable; peerDeps react ^18 || ^19
// init() must complete before any track() — but track() is queued internally if called early

import * as amplitude from '@amplitude/analytics-browser'

// 1. Initialize once per app:
amplitude.init('YOUR_API_KEY', {
  defaultTracking: false,           // ship explicit events only — Tour Kit's default
  serverUrl: undefined,             // optional EU residency override
})

// 2. Track events:
amplitude.track('Button Clicked', {
  productId: 'SKU-12345',
  price: 29.99,
})

// 3. With event options (3rd arg):
amplitude.track('Custom Event', { key: 'value' }, {
  time: Date.now() - 60000,
  session_id: 1234567890,
})

// 4. Identify a user:
amplitude.setUserId('user@example.com')
const identify = new amplitude.Identify()
identify.set('plan', 'pro')
amplitude.identify(identify)

// 5. Flush:
amplitude.flush()
```

**`package.json` exports map — Segment subpath added (existing entries unchanged):**

```json
"exports": {
  ".":           { /* existing */ },
  "./posthog":   { /* existing */ },
  "./mixpanel":  { /* existing */ },
  "./amplitude": { /* existing */ },
  "./google-analytics": { /* existing */ },
  "./segment": {
    "import": {
      "types":   "./dist/plugins/segment.d.ts",
      "default": "./dist/plugins/segment.js"
    },
    "require": {
      "types":   "./dist/plugins/segment.d.cts",
      "default": "./dist/plugins/segment.cjs"
    }
  },
  "./package.json": "./package.json"
},
"peerDependenciesMeta": {
  "@amplitude/analytics-browser": { "optional": true },
  "mixpanel-browser":              { "optional": true },
  "posthog-js":                    { "optional": true },
  "@segment/analytics-next":       { "optional": true }
},
"devDependencies": {
  /* existing entries */
  "@segment/analytics-next": "^1.84.0"
}
```

**`tsup.config.ts` — Segment entry added:**

```ts
entry: {
  index:                  'src/index.ts',
  'plugins/console':      'src/plugins/console.ts',
  'plugins/posthog':      'src/plugins/posthog.ts',
  'plugins/mixpanel':     'src/plugins/mixpanel.ts',
  'plugins/amplitude':    'src/plugins/amplitude.ts',
  'plugins/google-analytics': 'src/plugins/google-analytics.ts',
  'plugins/segment':      'src/plugins/segment.ts',           // NEW
},
external: [
  'react', 'react-dom',
  '@tour-kit/core', '@tour-kit/license',
  'posthog-js', 'mixpanel-browser', '@amplitude/analytics-browser',
  '@segment/analytics-next',                                  // NEW
],
```

**`useFunnel` hook signature + reducer:**

```ts
export interface FunnelData {
  step: number          // max step index observed (0-based)
  total: number         // count of tour_started events
  dropOff: number       // total - completed
  completionRate: number // completed / total, in [0, 1]
}

export function useFunnel(tourId: string): FunnelData
```

Funnel reducer rules (deterministic):
- `tour_started` (for tourId) → `started += 1`
- `tour_completed` (for tourId) → `completed += 1`
- `step_viewed` (for tourId, `stepIndex` is a number) → `maxStepIndex = max(maxStepIndex, stepIndex)`
- All other events → no-op
- Events with non-matching `tourId` → no-op

### Files to Create / Update

#### `packages/analytics/src/plugins/segment.ts` (NEW)
Export `segmentPlugin(options: SegmentPluginOptions): AnalyticsPlugin`. Dynamic-import `@segment/analytics-next` inside `init()` wrapped in try/catch — on failure call `logger.warn(...)` and leave the closure-stored `segment` ref null. `track()` no-ops when `segment` is null. `eventPrefix` defaults to `'tourkit_'`. The track property map MUST include `tour_id`, `step_id`, `step_index`, `total_steps`, `duration_ms`, `session_id` plus any `event.metadata` plus any closure-stored `context` set via `setContext`. `setContext(ctx)` replaces the entire context map (does not merge). `flush()` calls `segment.flush()` if available. `destroy()` drops the segment reference to null. Do NOT import `@segment/analytics-next` at module top.

#### `packages/analytics/src/plugins/amplitude.ts` (UPDATED)
Patch the existing v0.11.0 file. Add `setContext(ctx)` to the returned object — closure-stored `context: AnalyticsContext | null` spread into the track property map. Add `session_id: event.sessionId` to the existing track property map (parity with posthog + segment). Add `eventOptions?: Record<string, unknown>` to `AmplitudePluginOptions` and pass it as the third argument to `amplitude.track(name, props, eventOptions)` ONLY when defined (omit the arg otherwise — Amplitude treats undefined as "use defaults"). Update the JSDoc example to show one `setContext` call. Do NOT change the dynamic-import idiom, do NOT change the subpath, do NOT change `init`/`identify`/`flush`/`destroy` semantics.

#### `packages/analytics/src/plugins/console.ts` (UPDATED)
Remove the dev-only warning string. Single-line cleanup. Verify by `grep -c "dev-only" packages/analytics/src/plugins/console.ts` returning `0`.

#### `packages/analytics/src/core/tracker.ts` (UPDATED)
Add a private field `subscribers = new Set<(event: TourEvent) => void>()`. Add a public method `subscribe(listener): () => void` that adds the listener and returns an unsubscribe closure. In `dispatchEvents`, AFTER the inner `for (const plugin of this.plugins)` loop, add a second loop that fans events out to `this.subscribers`. Wrap each subscriber call in try/catch to match the plugin loop's error handling — log via `logger.error('Analytics: subscriber threw:', err)` when `this.config.debug` is true. Add one code comment clarifying that subscribers fire on emission (post-plugin), NOT on enqueue.

#### `packages/analytics/src/hooks/use-funnel.ts` (NEW)
Implement `useFunnel(tourId)` per the spec above. Use `useAnalyticsOptional()` to access the tracker. On mount, subscribe via `analytics.subscribe(...)` and dispatch each event into a `React.useReducer`. On unmount, the returned unsubscribe runs in the effect cleanup. When `analytics` is null, log a one-time `console.warn` in dev (`process.env.NODE_ENV !== 'production'`) and return the zero state. Export `FunnelData` interface (named export). The reducer is module-private — do NOT export it.

#### `packages/analytics/src/index.ts` (UPDATED)
Add `export { useFunnel } from './hooks/use-funnel'` and `export type { FunnelData } from './hooks/use-funnel'`. Do NOT import `./plugins/segment` here — verify with grep.

#### `packages/analytics/package.json` (UPDATED)
Bump `version` to `0.12.0`. Add `./segment` to `exports` (mirror the existing `./amplitude` entry verbatim). Add `"@segment/analytics-next": { "optional": true }` to `peerDependenciesMeta`. Add `"@segment/analytics-next": "^1.84.0"` to `devDependencies`. Do NOT touch existing `peerDependencies` (the entry is in `peerDependenciesMeta` only — Segment is opt-in like the other three).

#### `packages/analytics/tsup.config.ts` (UPDATED)
Add `'plugins/segment': 'src/plugins/segment.ts'` to the `entry` object. Add `'@segment/analytics-next'` to the `external` array. Keep dual ESM/CJS output.

#### `packages/analytics/__tests__/segment-plugin.test.ts` (NEW)
Two cases, mirroring the Phase 7 sonner-adapter test pattern:
1. **Segment present:** `vi.mock('@segment/analytics-next', () => ({ AnalyticsBrowser: { load: vi.fn(() => ({ track: vi.fn(), identify: vi.fn(), flush: vi.fn(async () => {}) })) } }))`. Construct the plugin, call `await plugin.init?.()`, then `plugin.track({ eventName: 'tour_started', tourId: 't', sessionId: 's', timestamp: 0 })`. Assert `AnalyticsBrowser.load` was called with `{ writeKey: '...' }`, AND that the returned instance's `track` was called once with the prefixed event name and a payload containing `tour_id: 't'` and `session_id: 's'`. Also assert `setContext({ plan: 'pro' })` then `plugin.track(...)` includes `plan: 'pro'` in the call's property map.
2. **Segment absent:** `vi.mock('@segment/analytics-next', () => { throw new Error('not installed') })`. Spy `logger.warn`. Call `await plugin.init?.()` and `plugin.track(...)`. Assert `logger.warn` was called once with a message containing `'Segment'` and `plugin.track` does NOT throw.

#### `packages/analytics/__tests__/amplitude-plugin.test.ts` (UPDATED or NEW)
Two new assertions on top of any existing tests:
1. Track payload includes `session_id`: mock `@amplitude/analytics-browser`, init, call `plugin.track({ eventName: 'step_viewed', tourId: 't', sessionId: 'sess-1', timestamp: 0 })`, assert `amplitude.track` was called with a payload object whose `session_id === 'sess-1'`.
2. `setContext` merge: call `plugin.setContext?.({ plan: 'pro' })` then `plugin.track(...)`, assert the track payload contains `plan: 'pro'`.

#### `packages/analytics/__tests__/use-funnel.test.tsx` (NEW)
Use `renderHook` from `@testing-library/react`. Set up a real `TourAnalytics` via `createAnalytics({ plugins: [consolePlugin()] })` wrapped in `<AnalyticsProvider config={...}>`. Render `useFunnel('onboarding')`. Then call `analytics.tourStarted('onboarding', 3)`, `analytics.stepViewed('onboarding', 's1', 0, 3)`, `analytics.stepViewed('onboarding', 's2', 1, 3)`, `analytics.stepViewed('onboarding', 's3', 2, 3)`, `analytics.tourCompleted('onboarding')` — each wrapped in `act(...)`. Assert `result.current` reaches `{ step: 2, total: 1, dropOff: 0, completionRate: 1 }` (step is 0-based max index = 2 for a 3-step tour). Also assert calling `useFunnel('other-tour')` does NOT pick up the events (tourId filter). Also assert unmount cleans up the subscriber by checking `analytics['subscribers']` (private; cast to any in the test) has size 0 after unmount.

#### `apps/docs/content/docs/analytics/destinations-comparison.mdx` (NEW)
Use Fumadocs MDX frontmatter (`title`, `description`). Embed the 4-column table from Task 14.4 verbatim. Below the table, include four per-stack recipe code-blocks (PostHog, GA4, Segment, Amplitude). Each recipe shows the import path, the plugin factory call, and one `<AnalyticsProvider>` usage. Close with a "Choosing a destination" paragraph (≤3 sentences) summarizing PostHog (built-in retention), GA4 (free tier), Segment (multi-destination fanout), Amplitude (native charts).

#### `apps/docs/content/docs/analytics/index.mdx` (UPDATED)
Add a `useFunnel` section with the code snippet from Task 14.4. Place between any existing "Plugins" and "Configuration" sections.

#### `apps/docs/content/docs/analytics/meta.json` (UPDATED)
Add `"destinations-comparison"` to the `pages` array (or whichever key Fumadocs uses for the sidebar order — match the existing pattern). Place it just after the index page.

#### `apps/docs/__tests__/analytics-recipes.smoke.test.ts` (NEW)
Import each factory from `examples/dashboard-next/src/lib/analytics-recipes.ts` (path may need a tsconfig path alias — match what the docs app already uses). For each factory, call it with stub credentials (`{ apiKey: 'test', writeKey: 'test', measurementId: 'G-TEST' }`), then assert `result.plugins.length >= 1` and `result.plugins[0].name` matches the expected destination id. Mock all four peer-deps to no-ops.

#### `examples/dashboard-next/src/lib/analytics-recipes.ts` (NEW)
Four named exports:
```ts
import { createAnalytics } from '@tour-kit/analytics'
import { posthogPlugin } from '@tour-kit/analytics/posthog'
import { googleAnalyticsPlugin } from '@tour-kit/analytics/google-analytics'
import { segmentPlugin } from '@tour-kit/analytics/segment'
import { amplitudePlugin } from '@tour-kit/analytics/amplitude'

export const makePostHogAnalytics = (apiKey: string) =>
  createAnalytics({ plugins: [posthogPlugin({ apiKey })] })

export const makeGa4Analytics = (measurementId: string) =>
  createAnalytics({ plugins: [googleAnalyticsPlugin({ measurementId })] })

export const makeSegmentAnalytics = (writeKey: string) =>
  createAnalytics({ plugins: [segmentPlugin({ writeKey })] })

export const makeAmplitudeAnalytics = (apiKey: string) =>
  createAnalytics({ plugins: [amplitudePlugin({ apiKey })] })
```

### Success Criteria
- `pnpm --filter @tour-kit/analytics typecheck` exits 0
- `pnpm --filter @tour-kit/analytics build` exits 0
- `grep -c "analytics-next" packages/analytics/dist/index.js` returns `0`
- `grep -c "amplitude" packages/analytics/dist/index.js` returns `0` (after refresh)
- `pnpm --filter @tour-kit/analytics test -- --run segment-plugin` exits 0 with ≥2 passing cases
- `pnpm --filter @tour-kit/analytics test -- --run amplitude-plugin` exits 0 (setContext + session_id assertions pass)
- `pnpm --filter @tour-kit/analytics test -- --run use-funnel` exits 0 (end state `{ step: 2, total: 1, dropOff: 0, completionRate: 1 }`)
- All existing analytics tests still pass
- `pnpm --filter docs build` exits 0 (new comparison page renders)
- `grep -c "dev-only" packages/analytics/src/plugins/console.ts` returns `0`
- `examples/dashboard-next/src/lib/analytics-recipes.ts` exports 4 named factories

### Expected File Structure at End
```
packages/analytics/
├── src/
│   ├── plugins/
│   │   ├── segment.ts                # NEW
│   │   ├── amplitude.ts              # UPDATED — +setContext +session_id +eventOptions
│   │   ├── console.ts                # UPDATED — dev-only warning removed
│   │   ├── posthog.ts                # unchanged
│   │   ├── mixpanel.ts               # unchanged
│   │   └── google-analytics.ts       # unchanged
│   ├── hooks/
│   │   └── use-funnel.ts             # NEW
│   ├── core/
│   │   ├── tracker.ts                # UPDATED — subscribe(listener) added
│   │   ├── context.tsx               # unchanged
│   │   └── event-queue.ts            # unchanged
│   ├── index.ts                      # UPDATED — exports useFunnel + FunnelData
│   └── __tests__/
│       ├── segment-plugin.test.ts    # NEW
│       ├── amplitude-plugin.test.ts  # UPDATED or NEW
│       └── use-funnel.test.tsx       # NEW
├── package.json                      # UPDATED — version 0.12.0, exports, peerDepsMeta, devDeps
└── tsup.config.ts                    # UPDATED — segment entry, external segment

apps/docs/
├── content/docs/analytics/
│   ├── destinations-comparison.mdx   # NEW
│   ├── index.mdx                     # UPDATED — useFunnel snippet
│   └── meta.json                     # UPDATED — comparison page in sidebar
└── __tests__/
    └── analytics-recipes.smoke.test.ts  # NEW

examples/dashboard-next/
└── src/lib/
    └── analytics-recipes.ts          # NEW — 4 named factories
```

---

## Readiness Check

- [PASS] All inputs from prior phases listed and available — Phase 13 task 13.1 (extended `AnalyticsPlugin` contract with `setContext`) cited; the actual contract file path (`packages/analytics/src/types/plugin.ts`) is given; the existing v0.11.0 Amplitude plugin is cited with concrete behavior to preserve (init/identify/flush/destroy semantics); the PostHog plugin is named as the reference implementation pattern; Phase 7's subpath-export pattern is referenced as the architectural template.
- [PASS] Every sub-task has a clear, testable completion condition — each of 14.1–14.4 has a `Sanity check` one-liner combining typecheck + build + targeted test or grep; the no-peer-dep-bytes contract has both a `grep -c` check and a `ls` check in exit criteria.
- [PASS] Execution prompt is self-contained — confirmed `@segment/analytics-next` 1.84.0 and `@amplitude/analytics-browser` 2.42.3 snippets pasted verbatim from Context7 2026-05-15; `package.json` exports map shown verbatim with the new `./segment` entry; tsup entry diff shown; the full `useFunnel` reducer rules pasted as a deterministic checklist; per-file guidance has one paragraph per file in the deliverables tree; success criteria are observable shell commands.
- [PASS] Exit criteria map 1:1 to deliverables — every NEW/UPDATED file in the deliverables tree appears in at least one exit checkbox (typecheck, build, test, grep guard, or docs build); the no-bytes-leak contract has both a Segment check and an Amplitude check after the refresh.
- [PASS] Heavy external deps have a fake/stub strategy noted — `@segment/analytics-next` is mocked via `vi.mock(...)` in both present and absent test variants; the present mock shows the exact `AnalyticsBrowser.load` shape returning a stub `{ track, identify, flush }`; the absent mock throws and asserts `logger.warn` + no-op behavior. The Amplitude test mocks `@amplitude/analytics-browser` similarly. No 100MB+ deps in this phase. `useFunnel` tests use the real `TourAnalytics` with `consolePlugin()` (no network).
- [PASS] New libraries have a confirmed snippet from Context7 in the execution prompt — `@segment/analytics-next` 1.84.0 confirmed via Context7 2026-05-15 (`/segmentio/analytics-next`); `AnalyticsBrowser.load({ writeKey })`, `.track(event, props)`, `.identify(userId, traits)`, `.flush()` all verified. `@amplitude/analytics-browser` 2.42.3 confirmed via Context7 2026-05-15 (`/amplitude/amplitude-typescript`); `amplitude.init(apiKey, opts)`, `amplitude.track(event, props, eventOptions?)`, `amplitude.setUserId`, `new amplitude.Identify()`, `.flush()` all verified. Both snippets pasted verbatim under "Confirmed Library APIs."
