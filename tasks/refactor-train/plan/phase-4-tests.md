# Phase 4 — Testing: `TourAnalytics.safeDispatch` Helper

**Scope:** `packages/analytics/src/core/tracker.ts` — replace repeated try/catch in `init`, `identify`, `dispatchEvents`, `flush`, `destroy` with a single private `safeDispatch` helper that preserves dispatch timing, return types, and the destroy-after-flag-set semantics.
**Key Pattern:** Pure-logic / refactor phase, but with **timing semantics that already burned us once** (memory #46). Mock strategy is `vi.fn()`-based fake plugins via the existing `createMockPlugin` factory at [`packages/analytics/src/__tests__/core/tracker.test.ts:7`](../../../packages/analytics/src/__tests__/core/tracker.test.ts). Critical: `await Promise.resolve()` between fire-and-forget calls and assertions, and explicit destroy-ordering tests.
**Dependencies:** vitest, `@tour-kit/core` (`logger`), existing `createMockPlugin` factory.

---

## User Stories

| # | User Story | Validation Check | Pass Condition |
|---|-----------|-----------------|----------------|
| US-1 | As an analytics integrator, I want a throwing plugin's `track` to NOT stop downstream plugins from receiving the event, so one bad integration can't blackhole my dashboard | `tracker.test.ts` — multi-plugin error isolation | Plugin B's `track` mock called even when Plugin A's `track` throws synchronously or rejects |
| US-2 | As a maintainer running `destroy()`, I want plugin `destroy` hooks to still be called AFTER `destroyed=true` is set, so `destroy` doesn't become a silent no-op | `tracker.test.ts` — destroy ordering | All plugins' `destroy()` mocks called exactly once after `destroyed === true` (per memory #46) |
| US-3 | As an analytics consumer with `debug: false`, I want plugin errors to be silently swallowed, but with `debug: true` I want them logged via `logger.error` (not `console.error` directly) | `tracker.test.ts` — debug-on/off + logger-routed test | `logger.error` spy called when `debug: true`; not called when `debug: false`; `console.error` direct not called either way |
| US-4 | As a `track` consumer, I want `track()` to remain non-blocking — a slow async plugin must NOT serialize the next event | `tracker.test.ts` — `track` parallelism | Two consecutive `track()` calls with async plugins return synchronously; both `track` mocks called before any resolves |
| US-5 | As a `flush` consumer, I want `flush()` to await all plugins sequentially and resolve only after every plugin's `flush` settled, so I can safely call it before `unload` | `tracker.test.ts` — flush serial-await | `await tracker.flush()` resolves only after every plugin's `flush` mock has been called; rejected plugin doesn't stop subsequent plugins |

---

## Component Mock Strategy

| Component | Mock Strategy | What to Assert | User Story |
|-----------|--------------|----------------|------------|
| `AnalyticsPlugin` instances | `createMockPlugin({ name, init, track, identify, flush, destroy })` from existing factory | `vi.fn` call counts, call args, call ORDER between plugins | US-1, US-2, US-4, US-5 |
| Throwing plugin (sync) | `createMockPlugin({ track: vi.fn(() => { throw new Error('boom') }) })` | Downstream plugin's `track` called once; helper returns `void` | US-1 |
| Rejecting plugin (async) | `createMockPlugin({ track: vi.fn().mockRejectedValue(new Error('async boom')) })` | After `await Promise.resolve()`, downstream plugin called; logger.error called when `debug: true` | US-1, US-3 |
| `logger.error` | `vi.spyOn(logger, 'error').mockImplementation(() => {})` | Called with substring `"track"` / `"init"` / `"destroy"` per error label; called ONLY when `debug: true` | US-3 |
| `console.error` direct | `vi.spyOn(console, 'error')` | NOT called (proves the helper goes through `logger`, not direct console) | US-3 |
| `TourAnalytics.destroy()` | Construct, await init, call `destroy()` | All plugin `destroy` mocks called AFTER `destroyed=true` set; second `destroy()` is no-op | US-2 |
| `TourAnalytics.flush()` | Plugins with mixed sync/async `flush`; one rejects | `await flush()` returns; all plugin `flush` mocks called in plugin order | US-5 |
| `TourAnalytics.track()` | Two plugins with `vi.fn().mockImplementation(() => new Promise(r => setTimeout(r, 100)))` | Both `track` mocks called synchronously before any resolves (use `expect(track).toHaveBeenCalled()` before `vi.runAllTimersAsync()`) | US-4 |
| Source-grep: `if (this.config.debug)` count | Read tracker.ts, count occurrences | Exactly **one** match (consolidated into helper) | US-3 |
| Source-grep: `safeDispatch` call count | Read tracker.ts | 5 call sites: `init`, `identify`, `dispatchEvents`, `flush`, `destroy` | (M4) |

---

## Test Tier Table

| Tier | Dependencies | Speed | When to Run |
|------|-------------|-------|-------------|
| Unit | vitest + `vi.useFakeTimers` for queue/batch tests; real `logger` with `vi.spyOn` | <5s | Every push |
| Integration (existing) | `packages/analytics/src/__tests__/integration/multi-plugin.test.tsx` — already exists, should pass unchanged | <10s | Every push |
| Source-grep gate | `readFileSync` + regex assertions | <1s | Pre-merge |

No new tier. Phase 4 is bounded to one file plus its tests.

---

## Fake / Mock Implementations

**No new fakes.** Reuse the existing factory at [`packages/analytics/src/__tests__/core/tracker.test.ts:7`](../../../packages/analytics/src/__tests__/core/tracker.test.ts):

```ts
// Existing — already in tracker.test.ts; reuse as-is
function createMockPlugin(overrides: Partial<AnalyticsPlugin> = {}): AnalyticsPlugin {
  return {
    name: 'mock-plugin',
    init: vi.fn(),
    track: vi.fn(),
    identify: vi.fn(),
    flush: vi.fn(),
    destroy: vi.fn(),
    ...overrides,
  }
}
```

Two **convenience helpers** to add at the top of `tracker.test.ts` (extending, not replacing):

```ts
function throwingPlugin(method: keyof AnalyticsPlugin, msg = 'sync-boom'): AnalyticsPlugin {
  return createMockPlugin({
    name: `throwing-${method}`,
    [method]: vi.fn(() => { throw new Error(msg) }),
  } as Partial<AnalyticsPlugin>)
}

function rejectingPlugin(method: keyof AnalyticsPlugin, msg = 'async-boom'): AnalyticsPlugin {
  return createMockPlugin({
    name: `rejecting-${method}`,
    [method]: vi.fn().mockRejectedValue(new Error(msg)),
  } as Partial<AnalyticsPlugin>)
}

async function microtask() {
  // Drain microtask queue so fire-and-forget rejections surface
  await Promise.resolve()
  await Promise.resolve()
}
```

---

## Test File List

```
packages/analytics/src/__tests__/core/
├── tracker.test.ts                                   # EXTEND: add safeDispatch suite — error isolation, destroy ordering, debug routing, track parallelism, flush serial-await
└── tracker-source-grep.test.ts                       # NEW: assert single `if (this.config.debug)` in tracker.ts; assert 5 safeDispatch call sites

packages/analytics/src/__tests__/integration/
└── multi-plugin.test.tsx                             # NO CHANGE — must continue to pass; this is the regression net
```

Only one file is touched. The source-grep file co-locates the M4 gate.

---

## `conftest.ts` Equivalent — Vitest Setup Additions

**Additions to** existing `packages/analytics/src/__tests__/setup.ts` (if any) — read it first; don't replace.

The existing tracker test already uses `vi.useFakeTimers()` in `beforeEach`. Extend this pattern in the new suite:

```ts
import { logger } from '@tour-kit/core'

let loggerErrorSpy: ReturnType<typeof vi.spyOn>
let consoleErrorSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'))
  loggerErrorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {})
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  loggerErrorSpy.mockRestore()
  consoleErrorSpy.mockRestore()
  vi.useRealTimers()
})
```

No new vitest CLI flags needed.

---

## Key Testing Decisions

| Decision | Approach | Rationale |
|----------|----------|-----------|
| Test destroy ORDER explicitly | Spy on `destroyed` getter (or set a flag via a custom plugin's `destroy` callback that records `tracker.destroyed`); assert `destroyed === true` when plugin `destroy` is called | Memory #46 — previous `safeDispatch` design with blanket `if (this.destroyed) return` silently broke destroy hooks; this test prevents that regression |
| Test `track` parallelism, not serial | Use slow async plugins (`Promise<void>` resolving on timer); assert both called before any resolves | [`phase-4.md`'s Helper Design](../phase-4.md#helper-design) explicitly preserves fire-and-forget for track — serializing async track is a regression |
| Spy on `logger.error`, not `console.error` | `vi.spyOn(logger, 'error')` | The helper now routes through `logger`; testing `console.error` would miss a regression where someone re-introduces direct `console.error` |
| Assert `console.error` NOT called | Negative assertion alongside the logger assertion | Catches the inverse regression: removing the logger import and falling back to console |
| `await microtask()` between fire-and-forget and assertion | Two `await Promise.resolve()` calls drain microtasks for async-reject logging | A single microtask may not flush nested promise chains; two is the well-known safe minimum |
| Source-grep test for helper consolidation | `readFileSync(tracker.ts)` + regex | M4 gate: "one helper location for `if (this.config.debug)`" — co-located so future PRs can't sneak the pattern back in |
| Don't add `pollNumberOfPluginsThatRanDestroy` patterns | Use direct mock-call-count assertions | The existing test file already uses `expect(mock.destroy).toHaveBeenCalledTimes(1)`; consistency matters more than novelty |
| Preserve existing wording for error messages OR update tests | Match `phase-4.md` step 2 — "Match existing message wording where tests assert it, or update tests to assert intent rather than exact strings" | Brittle exact-string assertions break on label tweaks; assert substring (`/track/`, `/init/`, `/destroy/`) instead |
| Test post-destroy lifecycle calls are no-ops | After `destroy()`, call `track`, `identify`, `flush`; assert their mocks are NOT called again | Memory #46 preserves the destroyed guard for everything EXCEPT `destroy` itself; this test pins that contract |

---

## Example Test Case

```ts
// packages/analytics/src/__tests__/core/tracker.test.ts (EXTEND)

import { logger } from '@tour-kit/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TourAnalytics } from '../../core/tracker'
import type { AnalyticsConfig, AnalyticsPlugin } from '../../types/plugin'
// import createMockPlugin and createConfig from the existing helpers at the top of the file

function throwingPlugin(method: keyof AnalyticsPlugin, msg = 'sync-boom'): AnalyticsPlugin {
  return createMockPlugin({
    name: `throwing-${method}`,
    [method]: vi.fn(() => { throw new Error(msg) }),
  } as Partial<AnalyticsPlugin>)
}

function rejectingPlugin(method: keyof AnalyticsPlugin, msg = 'async-boom'): AnalyticsPlugin {
  return createMockPlugin({
    name: `rejecting-${method}`,
    [method]: vi.fn().mockRejectedValue(new Error(msg)),
  } as Partial<AnalyticsPlugin>)
}

async function microtask() {
  await Promise.resolve()
  await Promise.resolve()
}

describe('TourAnalytics.safeDispatch (Phase 4)', () => {
  let loggerErrorSpy: ReturnType<typeof vi.spyOn>
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'))
    loggerErrorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {})
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    loggerErrorSpy.mockRestore()
    consoleErrorSpy.mockRestore()
    vi.useRealTimers()
  })

  describe('error isolation (US-1)', () => {
    it('continues to next plugin when track throws synchronously', async () => {
      const bad = throwingPlugin('track')
      const good = createMockPlugin({ name: 'good' })
      const tracker = new TourAnalytics(createConfig({
        plugins: [bad, good],
        debug: true,
      }))
      await vi.runAllTimersAsync()

      tracker.track('tour:started', { tourId: 't1' })
      await microtask()

      expect(bad.track).toHaveBeenCalledTimes(1)
      expect(good.track).toHaveBeenCalledTimes(1)
    })

    it('continues to next plugin when track rejects asynchronously', async () => {
      const bad = rejectingPlugin('track')
      const good = createMockPlugin({ name: 'good' })
      const tracker = new TourAnalytics(createConfig({
        plugins: [bad, good],
        debug: true,
      }))
      await vi.runAllTimersAsync()

      tracker.track('tour:started', { tourId: 't1' })
      await microtask()

      expect(bad.track).toHaveBeenCalledTimes(1)
      expect(good.track).toHaveBeenCalledTimes(1)
      expect(loggerErrorSpy).toHaveBeenCalled()
      expect(loggerErrorSpy.mock.calls[0]?.[0]).toMatch(/track/)
    })
  })

  describe('debug routing (US-3)', () => {
    it('does NOT log when debug: false', async () => {
      const tracker = new TourAnalytics(createConfig({
        plugins: [rejectingPlugin('track')],
        debug: false,
      }))
      await vi.runAllTimersAsync()

      tracker.track('tour:started', { tourId: 't1' })
      await microtask()

      expect(loggerErrorSpy).not.toHaveBeenCalled()
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it('logs via logger.error (not direct console.error) when debug: true', async () => {
      const tracker = new TourAnalytics(createConfig({
        plugins: [rejectingPlugin('track')],
        debug: true,
      }))
      await vi.runAllTimersAsync()

      tracker.track('tour:started', { tourId: 't1' })
      await microtask()

      expect(loggerErrorSpy).toHaveBeenCalled()
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })
  })

  describe('destroy ordering (US-2, memory #46 regression)', () => {
    it('still calls plugin destroy hooks AFTER destroyed=true is set', async () => {
      // Capture the value of `destroyed` AT THE MOMENT plugin.destroy is invoked
      let observedDestroyedFlag: boolean | null = null
      const plugin = createMockPlugin({
        destroy: vi.fn(() => {
          observedDestroyedFlag = (tracker as unknown as { destroyed: boolean }).destroyed
        }),
      })
      const tracker = new TourAnalytics(createConfig({ plugins: [plugin] }))
      await vi.runAllTimersAsync()

      tracker.destroy()
      await microtask()

      expect(plugin.destroy).toHaveBeenCalledTimes(1)
      expect(observedDestroyedFlag).toBe(true)
    })

    it('post-destroy track is a no-op for plugins', async () => {
      const plugin = createMockPlugin()
      const tracker = new TourAnalytics(createConfig({ plugins: [plugin] }))
      await vi.runAllTimersAsync()
      tracker.destroy()
      ;(plugin.track as ReturnType<typeof vi.fn>).mockClear()

      tracker.track('tour:started', { tourId: 't' })
      await microtask()

      expect(plugin.track).not.toHaveBeenCalled()
    })

    it('second destroy() call is a no-op', async () => {
      const plugin = createMockPlugin()
      const tracker = new TourAnalytics(createConfig({ plugins: [plugin] }))
      await vi.runAllTimersAsync()
      tracker.destroy()
      await microtask()
      tracker.destroy()
      await microtask()

      expect(plugin.destroy).toHaveBeenCalledTimes(1)
    })
  })

  describe('track parallelism (US-4)', () => {
    it('fire-and-forget — both plugins called synchronously even with slow async track', async () => {
      let resolveA: (() => void) | null = null
      let resolveB: (() => void) | null = null
      const slowA = createMockPlugin({
        name: 'A',
        track: vi.fn(() => new Promise<void>((r) => { resolveA = r })),
      })
      const slowB = createMockPlugin({
        name: 'B',
        track: vi.fn(() => new Promise<void>((r) => { resolveB = r })),
      })
      const tracker = new TourAnalytics(createConfig({ plugins: [slowA, slowB] }))
      await vi.runAllTimersAsync()

      tracker.track('tour:started', { tourId: 't' })
      // Without awaiting anything, BOTH plugin track mocks should already be called
      expect(slowA.track).toHaveBeenCalledTimes(1)
      expect(slowB.track).toHaveBeenCalledTimes(1)

      resolveA?.()
      resolveB?.()
      await microtask()
    })
  })

  describe('flush serial-await (US-5)', () => {
    it('awaits each plugin flush in order', async () => {
      const order: string[] = []
      const a = createMockPlugin({
        name: 'A',
        flush: vi.fn(async () => { order.push('A') }),
      })
      const b = createMockPlugin({
        name: 'B',
        flush: vi.fn(async () => { order.push('B') }),
      })
      const tracker = new TourAnalytics(createConfig({ plugins: [a, b] }))
      await vi.runAllTimersAsync()

      await tracker.flush()
      expect(order).toEqual(['A', 'B'])
    })

    it('a rejecting plugin flush does not stop the next plugin', async () => {
      const order: string[] = []
      const bad = rejectingPlugin('flush')
      const good = createMockPlugin({
        name: 'good',
        flush: vi.fn(async () => { order.push('good') }),
      })
      const tracker = new TourAnalytics(createConfig({
        plugins: [bad, good],
        debug: true,
      }))
      await vi.runAllTimersAsync()

      await tracker.flush()
      expect(order).toEqual(['good'])
      expect(loggerErrorSpy.mock.calls[0]?.[0]).toMatch(/flush/)
    })
  })
})

// ─── Companion: source-grep gate ─────────────────────────────────────────────
// packages/analytics/src/__tests__/core/tracker-source-grep.test.ts

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('tracker.ts — Phase 4 source gates (M4)', () => {
  const src = readFileSync(
    resolve(__dirname, '../../core/tracker.ts'),
    'utf-8'
  )

  it('contains exactly one `if (this.config.debug)` (consolidated into helper)', () => {
    const matches = src.match(/if \(this\.config\.debug\)/g) ?? []
    expect(matches.length).toBe(1)
  })

  it('contains 5 safeDispatch call sites', () => {
    const matches = src.match(/safeDispatch/g) ?? []
    // 1 definition + 5 call sites = 6 total
    expect(matches.length).toBe(6)
  })

  it('still routes through logger, not direct console.error', () => {
    expect(src).not.toMatch(/^\s*console\.error/m)
  })
})
```

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session:

---
You are writing the complete test suite for Phase 4 of the **Tour Kit Refactor Train** — `TourAnalytics.safeDispatch` Helper.

### What This Project Is
`@tour-kit/analytics` is a plugin-based analytics layer for the Tour Kit React library. `TourAnalytics` (at `packages/analytics/src/core/tracker.ts`) currently repeats the same plugin try/catch loop in five lifecycle methods: `init`, `identify`, `dispatchEvents`, `flush`, `destroy`. Phase 4 consolidates them into a single `safeDispatch` helper. Two critical constraints:
- `destroy()` sets `this.destroyed = true` BEFORE calling plugin destroy hooks — memory #46 says a prior `safeDispatch` design that short-circuited on `destroyed` silently broke this. The new helper has an explicit `allowDestroyed` option.
- `track()` is fire-and-forget — plugin `track` must NOT be awaited before moving to the next plugin (US-4).

### Acceptance Criteria (from User Stories)

| # | User Story | Validation Check | Pass Condition |
|---|-----------|-----------------|----------------|
| US-1 | Throwing plugin doesn't stop downstream | sync-throw + async-reject tests | Plugin B's track called when Plugin A throws |
| US-2 | Destroy hooks fire after destroyed=true | destroy ordering test | `observedDestroyedFlag === true` inside plugin.destroy mock |
| US-3 | logger.error routing | debug-on/off test | logger.error spy called when debug:true; console.error never called |
| US-4 | track is fire-and-forget | parallelism test with slow async plugins | both track mocks called before any resolves |
| US-5 | flush awaits sequentially | serial-await test | order array `['A', 'B']`; rejected plugin doesn't stop next |

### Why Fakes Are Required
None new. The existing `createMockPlugin` factory at the top of `tracker.test.ts` is the canonical helper. Add two thin wrappers (`throwingPlugin`, `rejectingPlugin`) and a `microtask()` drain. Spy on `logger.error` and `console.error`.

### What NOT to Test
- Don't re-test the existing `tracker.test.ts` suite — it's already comprehensive. EXTEND it with a `describe('TourAnalytics.safeDispatch (Phase 4)')` block.
- Don't test `event-queue.ts` behavior — that's a separate concern; the existing `event-queue.test.ts` covers it.
- Don't add a parallel fixture system per [`phase-4.md`'s Step 1](../phase-4.md#1-read-existing-tests).
- Don't assert exact error-message strings — assert SUBSTRINGS (`/track/`, `/init/`, `/destroy/`). Per [`phase-4.md`'s Step 2](../phase-4.md#2-add-helper).
- Don't test serializing `track` — that's the regression. Test parallelism.

### Critical: Helper Wrappers (Paste Into tracker.test.ts)

```ts
function throwingPlugin(method: keyof AnalyticsPlugin, msg = 'sync-boom'): AnalyticsPlugin {
  return createMockPlugin({
    name: `throwing-${method}`,
    [method]: vi.fn(() => { throw new Error(msg) }),
  } as Partial<AnalyticsPlugin>)
}

function rejectingPlugin(method: keyof AnalyticsPlugin, msg = 'async-boom'): AnalyticsPlugin {
  return createMockPlugin({
    name: `rejecting-${method}`,
    [method]: vi.fn().mockRejectedValue(new Error(msg)),
  } as Partial<AnalyticsPlugin>)
}

async function microtask() {
  await Promise.resolve()
  await Promise.resolve()
}
```

### Test Files to Create

```
packages/analytics/src/__tests__/core/tracker.test.ts                # EXTEND
packages/analytics/src/__tests__/core/tracker-source-grep.test.ts    # NEW
packages/analytics/src/__tests__/integration/multi-plugin.test.tsx   # NO CHANGE — must still pass
```

### File: tracker.test.ts (EXTEND)

Add a new `describe('TourAnalytics.safeDispatch (Phase 4)')` block at the bottom. Reuse the file's existing `createMockPlugin` and `createConfig` helpers. Add the three wrappers above just above the new describe block.

Suites to add (one per user story):
1. `describe('error isolation (US-1)')` — sync-throw, async-reject; both assert downstream plugin still called
2. `describe('debug routing (US-3)')` — `debug:false` → no log; `debug:true` → logger.error called, console.error NOT called
3. `describe('destroy ordering (US-2, memory #46 regression)')` — observedDestroyedFlag, post-destroy track no-op, double-destroy idempotent
4. `describe('track parallelism (US-4)')` — slow async plugins; both mocks called synchronously before any resolves
5. `describe('flush serial-await (US-5)')` — order array equality; rejected plugin doesn't stop next plugin

Use `vi.useFakeTimers()` in `beforeEach` and `vi.useRealTimers()` in `afterEach`, matching the existing pattern at the top of the file.

### File: tracker-source-grep.test.ts (NEW)

```ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('tracker.ts — Phase 4 source gates (M4)', () => {
  const src = readFileSync(
    resolve(__dirname, '../../core/tracker.ts'),
    'utf-8'
  )

  it('contains exactly one `if (this.config.debug)`', () => {
    const matches = src.match(/if \(this\.config\.debug\)/g) ?? []
    expect(matches.length).toBe(1)
  })

  it('contains 5 safeDispatch call sites (plus 1 definition = 6 total)', () => {
    const matches = src.match(/safeDispatch/g) ?? []
    expect(matches.length).toBe(6)
  })

  it('does NOT call console.error directly', () => {
    expect(src).not.toMatch(/^\s*console\.error/m)
  })
})
```

### Per-File Coverage Guidance

#### `tracker.test.ts` extension
- Reuse existing `createMockPlugin` / `createConfig`
- Each `it` constructs a `new TourAnalytics(createConfig({ plugins: [...] }))` and `await vi.runAllTimersAsync()` to drain initial init
- Use `await microtask()` before any assertion that checks a fire-and-forget rejection's side effect
- For the destroy-ordering test, use `(tracker as unknown as { destroyed: boolean }).destroyed` to read the private flag from within a plugin's destroy mock — there's no public getter

#### `tracker-source-grep.test.ts`
- Three assertions only, listed above

### Data Model Notes
- `TourEvent` and `TourEventName` types live in `packages/analytics/src/types/events.ts`
- `AnalyticsConfig` and `AnalyticsPlugin` live in `packages/analytics/src/types/plugin.ts`
- `vi.useFakeTimers()` is required because `TourAnalytics` constructor schedules init via promises that resolve under fake timers
- `(tracker as unknown as { destroyed: boolean })` is the standard test-only pattern in this file to read the private destroyed flag

### Success Criteria
- `pnpm --filter @tour-kit/analytics test` exits 0
- `pnpm --filter @tour-kit/analytics typecheck` exits 0
- `pnpm --filter @tour-kit/analytics build` exits 0
- The existing `packages/analytics/src/__tests__/integration/multi-plugin.test.tsx` continues to pass unchanged
- `rg -n "if \(this\.config\.debug\)" packages/analytics/src/core/tracker.ts` returns exactly **one** match
- `rg -n "safeDispatch" packages/analytics/src/core/tracker.ts` returns **six** matches (1 def + 5 call sites)

### Expected File Structure at End
```
packages/analytics/src/__tests__/core/
├── tracker.test.ts                    (EXTENDED — new safeDispatch describe block)
├── tracker-source-grep.test.ts        (NEW)
├── event-queue.test.ts                (unchanged)
└── context.test.tsx                   (unchanged)
```
---

---

## Run Commands

```bash
# Fast unit tests
pnpm --filter @tour-kit/analytics test

# Single suite focus
pnpm --filter @tour-kit/analytics test -- -t "safeDispatch"
pnpm --filter @tour-kit/analytics test -- -t "destroy ordering"
pnpm --filter @tour-kit/analytics test -- -t "track parallelism"

# Source-grep gate alone
pnpm --filter @tour-kit/analytics test -- tracker-source-grep

# Pre-merge
pnpm --filter @tour-kit/analytics typecheck
pnpm --filter @tour-kit/analytics build

# Sanity grep (mirrors phase-4.md Validation Gates)
rg -n "if \(this\.config\.debug\)" packages/analytics/src/core/tracker.ts
rg -n "safeDispatch" packages/analytics/src/core/tracker.ts
```
