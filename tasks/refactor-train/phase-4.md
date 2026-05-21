# Phase 4 — Analytics `safeDispatch` helper

**Duration:** Days 11–12 (~4.25 hours)
**Depends on:** none (Phase 2 is informationally helpful — `logger.error` is already in use here; once Phase 2 lands, the `if (this.config.debug)` gate around `logger.error` could be revisited)
**Blocks:** none
**Risk Level:** LOW — scoped to a single file (`packages/analytics/src/core/tracker.ts`); the helper preserves exact behaviour. The only subtle change is awaiting optional-method return values that may resolve to a Promise.
**Stack:** typescript

---

## Objective

Resolve the [MED] candidate from [`docs/refactor-candidates.md`](../../docs/refactor-candidates.md) titled *"Five identical `try { plugin.X?.() } catch { if(debug) logger.error(...) }` blocks in `TourAnalytics`"*.

Today, `packages/analytics/src/core/tracker.ts` has the exact same iterate-and-swallow pattern in 5 places:

| Method            | Lines     | What it dispatches                     |
| ----------------- | --------- | -------------------------------------- |
| `init`            | 42–49     | `plugin.init?.()` (awaited)            |
| `identify`        | 64–70     | `plugin.identify?.(userId, properties)` |
| `dispatchEvents`  | 107–113   | `plugin.track(event)` (required, no `?.`) |
| `flush`           | 289–295   | `plugin.flush?.()` (awaited)           |
| `destroy`         | 309–316   | `plugin.destroy?.()`                    |

Five copies of the same boilerplate means five places to remember to add a new safety guard (timeout, AbortSignal, etc.). The diff history already shows drift: some sites gate on `if (this.destroyed)` early-return, others don't. **Action:** extract a private `safeDispatch` helper that runs the for-loop, optional-chain-calls the method, catches, and routes errors through `logger.error` gated by `this.config.debug`.

After this phase, adding a new plugin lifecycle hook (e.g. `plugin.onPageChange`) is a single line.

---

## What Success Looks Like

1. **`TourAnalytics` has exactly one `try { … } catch` block in production code.** Verified by `grep -c "try {" packages/analytics/src/core/tracker.ts` returning a number that's 5 less than today (today: 5+ try blocks counting initialization + event-queue interactions; after: the 5 lifecycle catches become 1 inside `safeDispatch`).
2. **`init`, `identify`, `dispatchEvents`, `flush`, `destroy` each have a single `safeDispatch` call** instead of an inline for-loop with try/catch. Verified by visual inspection of the file diff.
3. **`if (this.destroyed) return` is consistently applied.** Today, some methods check it, others don't. `safeDispatch` should bake in the destroyed-guard (callers that need a different behaviour bypass it).
4. **Behaviour is preserved end-to-end.** All existing tests in `packages/analytics/src/core/__tests__/tracker.test.ts` pass without modification.
5. **New tests pin the helper's contract:**
   - A throwing plugin in the middle of the list does **not** stop downstream plugins from receiving the event.
   - `config.debug = false` suppresses `logger.error`.
   - `config.debug = true` emits exactly one `logger.error` per failure.
   - A rejected promise from an async lifecycle method (e.g. `plugin.init` returning `Promise.reject`) is caught and logged at debug=true, swallowed at debug=false.
6. **TypeScript signature is correct.** `safeDispatch<M extends keyof AnalyticsPlugin>(method: M, errorLabel: string, ...args: Parameters<NonNullable<AnalyticsPlugin[M]>>): Promise<void>` compiles and is callable for both required (`track`) and optional (`init`/`identify`/`flush`/`destroy`) methods. The required-vs-optional distinction is handled inside `safeDispatch` via an optional-chain call.
7. **`pnpm --filter @tour-kit/analytics test` exits 0** with new tests included.
8. **`pnpm --filter @tour-kit/analytics typecheck` exits 0.**
9. **`pnpm --filter @tour-kit/analytics build` exits 0** with bundle size flat (the helper replaces equivalent inline code).

---

## What Failure Looks Like (and what to do)

- **The type of `safeDispatch`'s `...args` parameter can't be expressed because `AnalyticsPlugin[M]` could be `undefined` for optional methods.** TypeScript distributes `Parameters<undefined>` to `never`. **Fix:** use `Parameters<NonNullable<AnalyticsPlugin[M]>>` to strip `undefined`. If `M` resolves to a method whose `Parameters` type is computed via `infer`, this works; if it doesn't, fall back to `...args: any[]` for the helper internals while keeping the public-facing call sites strict.
- **`safeDispatch` introduces an unwanted `await` on a non-async method.** `plugin.track` returns `void`, but `await void` is a no-op. Same for `plugin.identify`. The only methods that already returned a Promise were `init` and `flush`. Wrapping all in `await` is safe (TypeScript permits `await`-on-non-Promise) and unifies the error path: a previously-uncaught rejected promise from `identify` is now caught.
- **A test that asserted "plugin.identify was called synchronously" now fails** because `safeDispatch` schedules the call inside an async function. **Fix:** the test was over-specifying the implementation. Update it to assert `expect(plugin.identify).toHaveBeenCalledWith(userId, properties)` regardless of timing, or use `await vi.waitFor(...)`.
- **`safeDispatch` makes a destroyed-tracker post-destroy call silently succeed.** If a consumer calls `tracker.identify()` after `tracker.destroy()`, the current code returns early (`if (this.destroyed) return`). `safeDispatch` should preserve this. **Bake in:** the first line of `safeDispatch` is `if (this.destroyed) return`.
- **The `dispatchEvents` call site is special** because `plugin.track` is required (not optional-chained). `safeDispatch`'s optional-chain call (`plugin[method]?.(...args)`) handles both cases — when the method is required, the `?.` is a redundant guard that passes through. **Verify:** `plugin.track !== undefined` is invariant per the `AnalyticsPlugin` interface; the runtime cost is one undefined-check per plugin per event.

---

## Files Touched

### Modified

| Path                                                        | Change                                                                              | Δ LOC (approx) |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------- |
| `packages/analytics/src/core/tracker.ts`                    | Add private `safeDispatch` method; replace 5 inline for-loops with 5 one-line calls | −35 / +25      |

### Added

| Path                                                        | Purpose                                                                 |
| ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| `packages/analytics/src/core/__tests__/tracker.test.ts`     | Extend with `safeDispatch` contract tests (~80 LOC)                     |

### Net delta

- **Production-code net:** ~−10 LOC
- **Test-code net:** ~+80 LOC (4 new tests)

---

## Step-by-Step Implementation

### Step 1 — Read the existing `tracker.test.ts` to understand the test harness (15 min)

```bash
cat packages/analytics/src/core/__tests__/tracker.test.ts | head -100
```

Familiarise with the existing fixture pattern (mock plugins, plugin factory, `createAnalytics` invocation). The new tests should reuse this harness, not invent a new one.

### Step 2 — Add `safeDispatch` to `TourAnalytics` (1 h)

**`packages/analytics/src/core/tracker.ts`** — add as a private method on the class:

```ts
/**
 * Iterates `this.plugins` and invokes `method` on each one with `args`.
 *
 * - Optional methods (`init`, `identify`, `flush`, `destroy`) — invokes via
 *   optional chaining so plugins that don't implement them are skipped.
 * - Required methods (`track`) — invokes directly; the `?.` is a no-op guard
 *   since the interface mandates the method.
 * - Errors thrown synchronously **or** returned as rejected Promises are
 *   caught and (when `this.config.debug` is true) logged via `logger.error`.
 * - Awaits any Promise return so async lifecycle errors are surfaced
 *   consistently — under the previous per-method `try/catch`, `init` was
 *   awaited but `identify`/`destroy` were not, so a rejected `identify` Promise
 *   was a silent unhandled rejection. This unifies the contract.
 * - Honors `this.destroyed` — a no-op if the tracker has been torn down.
 *
 * @param method - The lifecycle method name to dispatch.
 * @param errorLabel - Short human-readable label used in the debug error message
 *                     (e.g. "init", "identify", "track", "flush", "destroy").
 * @param args - Arguments passed to each plugin's method.
 */
private async safeDispatch<M extends keyof AnalyticsPlugin>(
  method: M,
  errorLabel: string,
  ...args: Parameters<NonNullable<AnalyticsPlugin[M]>>
): Promise<void> {
  if (this.destroyed) return

  for (const plugin of this.plugins) {
    try {
      const fn = plugin[method] as ((...a: typeof args) => unknown) | undefined
      await fn?.apply(plugin, args)
    } catch (error) {
      if (this.config.debug) {
        logger.error(`Analytics: Failed to ${errorLabel} in ${plugin.name}:`, error)
      }
    }
  }
}
```

**Notes on the type signature:**

- `M extends keyof AnalyticsPlugin` lets the caller name any plugin method by string-literal type, which TypeScript narrows the args against.
- `Parameters<NonNullable<AnalyticsPlugin[M]>>` strips `undefined` from the indexed type so `Parameters<...>` produces the right tuple. For required methods (`track`), `NonNullable` is a no-op.
- The runtime `as ((...a: typeof args) => unknown) | undefined` cast is needed because TypeScript can't statically verify that `plugin[method]` has the same signature across all plugins. The bracket access narrowing is a known TS limitation in this pattern.
- `fn?.apply(plugin, args)` uses `apply` (not direct call) to preserve `this` binding in case a plugin's method uses `this` (e.g. `class-based plugins`). Some plugins are arrow-function objects where this doesn't matter, but `apply` is safe in both shapes.

### Step 3 — Replace the 5 call sites (30 min)

**`init` (current lines 38–56)** — before:

```ts
private async init() {
  if (this.initialized) return

  for (const plugin of this.plugins) {
    try {
      await plugin.init?.()
    } catch (error) {
      if (this.config.debug) {
        logger.error(`Analytics: Failed to init plugin ${plugin.name}:`, error)
      }
    }
  }

  if (this.config.userId) {
    this.identify(this.config.userId, this.config.userProperties)
  }

  this.initialized = true
}
```

After:

```ts
private async init() {
  if (this.initialized) return

  await this.safeDispatch('init', 'init plugin')

  if (this.config.userId) {
    this.identify(this.config.userId, this.config.userProperties)
  }

  this.initialized = true
}
```

**`identify` (current lines 61–72)** — before:

```ts
identify(userId: string, properties?: Record<string, unknown>) {
  if (this.destroyed) return
  for (const plugin of this.plugins) {
    try {
      plugin.identify?.(userId, properties)
    } catch (error) {
      if (this.config.debug) {
        logger.error(`Analytics: Failed to identify in ${plugin.name}:`, error)
      }
    }
  }
}
```

After (note: `identify` becomes `async` because `safeDispatch` is async; if the existing return type was `void`, this is a soft breaking change — callers must not assume sync completion. Verify with `grep -n "identify(" packages/` to check if any caller awaits the return; if none, the change is invisible):

```ts
identify(userId: string, properties?: Record<string, unknown>): void {
  // Fire-and-forget. The previous implementation was sync; we keep the
  // public return type as `void` so callers can't accidentally `await` it
  // and observe the new async-ness. Internal error handling is unchanged.
  void this.safeDispatch('identify', 'identify', userId, properties)
}
```

Using `void` on the expression discards the returned `Promise` so the method signature stays `void`. Errors are still caught inside `safeDispatch` and logged when `debug` is enabled.

**`dispatchEvents` (current lines 104–116)** — before:

```ts
private dispatchEvents(events: TourEvent[]) {
  for (const event of events) {
    for (const plugin of this.plugins) {
      try {
        plugin.track(event)
      } catch (error) {
        if (this.config.debug) {
          logger.error(`Analytics: Failed to track in ${plugin.name}:`, error)
        }
      }
    }
  }
}
```

After:

```ts
private dispatchEvents(events: TourEvent[]) {
  for (const event of events) {
    void this.safeDispatch('track', 'track', event)
  }
}
```

**`flush` (current lines 282–297)** — before:

```ts
async flush() {
  if (this.destroyed) return
  this.eventQueue?.flush()

  for (const plugin of this.plugins) {
    try {
      await plugin.flush?.()
    } catch (error) {
      if (this.config.debug) {
        logger.error(`Analytics: Failed to flush ${plugin.name}:`, error)
      }
    }
  }
}
```

After:

```ts
async flush() {
  if (this.destroyed) return
  this.eventQueue?.flush()
  await this.safeDispatch('flush', 'flush')
}
```

**`destroy` (current lines 302–318)** — before:

```ts
destroy() {
  if (this.destroyed) return
  this.destroyed = true
  this.eventQueue?.destroy()
  this.eventQueue = null

  for (const plugin of this.plugins) {
    try {
      plugin.destroy?.()
    } catch (error) {
      if (this.config.debug) {
        logger.error(`Analytics: Failed to destroy ${plugin.name}:`, error)
      }
    }
  }
}
```

After:

```ts
destroy() {
  if (this.destroyed) return
  this.destroyed = true
  this.eventQueue?.destroy()
  this.eventQueue = null

  // Set destroyed BEFORE dispatch so safeDispatch's destroyed-guard kicks in.
  // But we still want to call each plugin's destroy() so they can clean up.
  // The guard intercepts post-destroy calls (which would be ANOTHER destroy
  // call from a different code path). Here, we set `destroyed = true` AFTER
  // the dispatch so plugins get one final destroy invocation.
  // … wait — re-read this carefully.
}
```

**Subtle issue:** `safeDispatch` checks `this.destroyed` at the top. If we set `this.destroyed = true` before calling `safeDispatch('destroy', ...)`, the dispatch becomes a no-op and plugins never get their `destroy()` call. **Fix:** move the `this.destroyed = true` line to *after* the dispatch:

```ts
async destroy() {  // now async to await safeDispatch
  if (this.destroyed) return
  this.eventQueue?.destroy()
  this.eventQueue = null

  await this.safeDispatch('destroy', 'destroy')

  this.destroyed = true  // set LAST so the dispatch runs first
}
```

This makes `destroy` async (it used to be sync). Same caveat as `identify`: verify no external caller assumes sync return. If they do, use `void this.safeDispatch(...)` and accept that destroy is fire-and-forget for plugins.

**Decision:** keep `destroy` synchronous from the caller's POV by using `void`:

```ts
destroy() {
  if (this.destroyed) return
  this.eventQueue?.destroy()
  this.eventQueue = null

  // Fire the destroy dispatch first, then mark destroyed. The destroyed flag
  // gates future calls to identify/track/flush — it doesn't gate the dispatch
  // *inside* destroy itself. The plugins receive the destroy() call as a
  // fire-and-forget; any error is logged at debug=true.
  void this.safeDispatch('destroy', 'destroy')

  this.destroyed = true
}
```

The `void` keeps the public signature `: void` and matches the pre-refactor behaviour (destroy was sync-style fire-and-forget for plugin `destroy?.()` calls).

### Step 4 — Add tests for `safeDispatch` contract (1 h)

**`packages/analytics/src/core/__tests__/tracker.test.ts`** — append:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TourAnalytics } from '../tracker'
import type { AnalyticsPlugin } from '../../types/plugin'

describe('safeDispatch', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('throwing plugin does not stop downstream plugins (track)', () => {
    const goodTrack1 = vi.fn()
    const goodTrack2 = vi.fn()
    const tracker = new TourAnalytics({
      plugins: [
        { name: 'good1', track: goodTrack1 },
        { name: 'thrower', track: () => { throw new Error('boom') } },
        { name: 'good2', track: goodTrack2 },
      ],
      debug: false,
    })
    tracker.tourStarted('t1', 5)
    expect(goodTrack1).toHaveBeenCalledTimes(1)
    expect(goodTrack2).toHaveBeenCalledTimes(1)
  })

  it('debug=false suppresses error logging', () => {
    const tracker = new TourAnalytics({
      plugins: [{ name: 'thrower', track: () => { throw new Error('boom') } }],
      debug: false,
    })
    tracker.tourStarted('t1', 5)
    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })

  it('debug=true emits one log per failure', () => {
    const tracker = new TourAnalytics({
      plugins: [{ name: 'thrower', track: () => { throw new Error('boom') } }],
      debug: true,
    })
    tracker.tourStarted('t1', 5)
    expect(consoleErrorSpy).toHaveBeenCalledTimes(1)
    expect(consoleErrorSpy.mock.calls[0][0]).toMatch(/track.*thrower/)
  })

  it('rejected Promise from async lifecycle method is caught (init)', async () => {
    const plugin: AnalyticsPlugin = {
      name: 'async-thrower',
      init: () => Promise.reject(new Error('async boom')),
      track: vi.fn(),
    }
    // Construction triggers init() — verify no unhandled rejection escapes
    const tracker = new TourAnalytics({ plugins: [plugin], debug: true })
    // Wait for the async init to settle
    await new Promise((r) => setTimeout(r, 10))
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringMatching(/init.*async-thrower/),
      expect.any(Error)
    )
  })

  it('post-destroy calls are no-ops', () => {
    const trackFn = vi.fn()
    const tracker = new TourAnalytics({
      plugins: [{ name: 'good', track: trackFn }],
      debug: false,
    })
    tracker.destroy()
    tracker.tourStarted('t1', 5)
    expect(trackFn).not.toHaveBeenCalled()
  })

  it('destroy() still calls each plugin.destroy before setting destroyed flag', async () => {
    const destroyFn = vi.fn()
    const tracker = new TourAnalytics({
      plugins: [{ name: 'good', track: vi.fn(), destroy: destroyFn }],
      debug: false,
    })
    tracker.destroy()
    await new Promise((r) => setTimeout(r, 10))  // settle the fire-and-forget dispatch
    expect(destroyFn).toHaveBeenCalledTimes(1)
  })
})
```

### Step 5 — Run validation (30 min)

```bash
pnpm --filter @tour-kit/analytics test         # green, new tests included
pnpm --filter @tour-kit/analytics typecheck    # green
pnpm --filter @tour-kit/analytics build        # green, dist/ produced
pnpm --filter @tour-kit/analytics size-limit   # delta ≈ 0
```

If any existing test fails, **stop** and inspect — it likely asserted on an implementation detail (sync vs async, exact try/catch shape) that this refactor changes. Update the assertion to match the new contract (behaviour, not implementation).

---

## Validation Gates

1. `pnpm --filter @tour-kit/analytics test` exits 0 with the 6 new safeDispatch tests included.
2. `pnpm --filter @tour-kit/analytics typecheck` exits 0.
3. `pnpm --filter @tour-kit/analytics build` produces `dist/` without error.
4. `grep -c "try {" packages/analytics/src/core/tracker.ts` returns a number that is 4 less than the pre-refactor count (5 lifecycle catches → 1 inside `safeDispatch`, minus any pre-existing non-lifecycle catches the file has).
5. The 5 lifecycle methods (`init`, `identify`, `dispatchEvents`, `flush`, `destroy`) each call `this.safeDispatch(...)` exactly once.
6. `pnpm --filter @tour-kit/analytics size-limit` is flat (no bundle regression).

---

## Rollback Plan

This phase ships as a single PR scoped to one file (`packages/analytics/src/core/tracker.ts`) plus its test file. Rollback is `git revert <merge-commit-sha>`. Risk of side-effects on other packages: zero — `@tour-kit/analytics` is a leaf in the dependency graph.

---

## Open Questions Surfaced During Planning

1. **Should `safeDispatch` enforce a timeout per plugin call?** The current code has no timeout, so a hanging plugin (e.g. a network call that never resolves) blocks `flush()` forever. **Decision:** out of scope — file a follow-up issue for a `timeout?: number` config option on `AnalyticsConfig`. The refactor lays the groundwork (single dispatch site) but doesn't introduce the timeout.
2. **Should `identify` change to `async` and return a Promise?** Today it returns `void`. The refactor keeps it sync-returning via `void`-discard. Some consumers might benefit from awaiting `identify()` for ordering guarantees. **Decision:** out of scope — file a follow-up. The current shape is byte-compatible.
3. **Should `safeDispatch` accept a `timeout?` parameter at call-site?** Same answer — defer to a follow-up.
4. **The `errorLabel` parameter is mildly redundant** with the method name — `errorLabel: 'init'` when `method: 'init'`. Could derive automatically. **Decision:** explicit is better — `dispatchEvents` calls `safeDispatch('track', 'track', ...)` and the label gives reviewers a clear sentence to read. Keep as-is.

---

## Time Budget

| Step                                                       | Estimated |
| ---------------------------------------------------------- | --------- |
| 1. Read existing test harness                              | 15 min    |
| 2. Add `safeDispatch` method                               | 1 h       |
| 3. Replace 5 call sites                                    | 30 min    |
| 4. Add 6 new contract tests                                | 1 h       |
| 5. Run validation                                          | 30 min    |
| Buffer for type-narrowing surprises                        | 1 h       |
| **Total**                                                  | **4.25 h**|

If §2 takes more than 1.5 hours, the TypeScript signature is fighting you — fall back to `...args: unknown[]` inside `safeDispatch` and `(plugin[method] as Function | undefined)?.apply(plugin, args)` to escape the narrowing. The cost is that callers no longer get parameter-arity checking at the `safeDispatch` call sites, but the helper is private so the impact is contained.
