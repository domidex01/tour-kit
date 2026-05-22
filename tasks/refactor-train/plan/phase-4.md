# Phase 4: Analytics `safeDispatch`

**Risk:** Low/Medium.
**Estimated effort:** 4-6 hours.
**Primary package:** `analytics`.
**Goal:** Consolidate repeated plugin try/catch handling in `TourAnalytics` without changing dispatch timing or public return types.

---

## Current State

`packages/analytics/src/core/tracker.ts` repeats the same plugin error handling in:

- `init`
- `identify`
- `dispatchEvents`
- `flush`
- `destroy`

Important behavior to preserve:

- `init()` awaits plugin `init` hooks sequentially before identifying the configured user.
- `identify()` returns `void` and calls sync optional plugin hooks.
- `dispatchEvents()` returns `void`; current `track(event)` calls are not awaited.
- `flush()` awaits plugin `flush` hooks sequentially.
- `destroy()` sets `this.destroyed = true` before plugin `destroy` hooks, but still calls those hooks.
- A throwing plugin does not stop later plugins from receiving the same lifecycle call.

The previous plan's blanket `if (this.destroyed) return` inside `safeDispatch` would break `destroy()`. It would also serialize async `track` plugins in a way the current implementation does not. This plan avoids both regressions.

---

## Helper Design

Add one private helper plus a small options type:

```ts
type DispatchMode = 'await' | 'fire-and-forget'

private async safeDispatch<M extends keyof AnalyticsPlugin>(
  method: M,
  errorLabel: string,
  args: Parameters<NonNullable<AnalyticsPlugin[M]>>,
  options: {
    mode: DispatchMode
    allowDestroyed?: boolean
  }
): Promise<void>
```

Rules:

- If `!options.allowDestroyed && this.destroyed`, return.
- For each plugin, get `plugin[method]`.
- Catch synchronous throws.
- If `mode === 'await'`, await the result and catch rejected promises before continuing to the next plugin.
- If `mode === 'fire-and-forget'`, attach `Promise.resolve(result).catch(...)` for promise rejections but do not await before continuing.
- Preserve `this` binding with `fn.apply(plugin, args)`.
- Log only when `this.config.debug` is true.

This keeps the public methods' behavior:

| Method | Mode | Return |
| --- | --- | --- |
| `init` | await | private promise |
| `identify` | fire-and-forget | `void` |
| `dispatchEvents` / `track` | fire-and-forget | `void` |
| `flush` | await | `Promise<void>` |
| `destroy` | fire-and-forget with `allowDestroyed: true` | `void` |

---

## Implementation Steps

### 1. Read Existing Tests

Use the existing harness in:

```text
packages/analytics/src/__tests__/core/tracker.test.ts
packages/analytics/src/__tests__/integration/multi-plugin.test.tsx
```

Do not create a parallel fixture system.

### 2. Add Helper

Add `safeDispatch` near the bottom of `TourAnalytics`, before `generateSessionId()`.

The body should centralize error logging through a small local function so both sync throws and async rejections use the same message:

```ts
const report = (pluginName: string, error: unknown) => {
  if (this.config.debug) {
    logger.error(`Analytics: Failed to ${errorLabel} in ${pluginName}:`, error)
  }
}
```

Match existing message wording where tests assert it, or update tests to assert intent rather than exact strings.

### 3. Replace Call Sites

Use these shapes:

```ts
private async init() {
  if (this.initialized) return
  await this.safeDispatch('init', 'init plugin', [], { mode: 'await' })
  if (this.config.userId) {
    this.identify(this.config.userId, this.config.userProperties)
  }
  this.initialized = true
}
```

```ts
identify(userId: string, properties?: Record<string, unknown>): void {
  void this.safeDispatch('identify', 'identify', [userId, properties], {
    mode: 'fire-and-forget',
  })
}
```

```ts
private dispatchEvents(events: TourEvent[]): void {
  for (const event of events) {
    void this.safeDispatch('track', 'track', [event], {
      mode: 'fire-and-forget',
    })
  }
}
```

```ts
async flush(): Promise<void> {
  if (this.destroyed) return
  this.eventQueue?.flush()
  await this.safeDispatch('flush', 'flush', [], { mode: 'await' })
}
```

```ts
destroy(): void {
  if (this.destroyed) return
  this.destroyed = true
  this.eventQueue?.destroy()
  this.eventQueue = null
  void this.safeDispatch('destroy', 'destroy', [], {
    mode: 'fire-and-forget',
    allowDestroyed: true,
  })
}
```

If TypeScript cannot express the generic tuple cleanly, keep the helper private and use one internal cast around `plugin[method]`. Do not leak `any` into public types.

---

## Tests

Add or update tests in `packages/analytics/src/__tests__/core/tracker.test.ts`:

- throwing `track` plugin does not stop downstream `track` plugin
- rejected async `track` promise is logged when `debug: true`
- rejected async `track` promise is swallowed when `debug: false`
- throwing `init` plugin does not stop downstream `init` plugin
- rejected `init` promise is caught
- `flush` awaits plugin `flush`
- post-destroy `track` / lifecycle calls are no-ops
- `destroy()` still calls plugin `destroy` after `destroyed` is set

For fire-and-forget promise rejection tests, wait one microtask:

```ts
await Promise.resolve()
```

or use `vi.waitFor`.

---

## Validation Gates

```bash
pnpm --filter @tour-kit/analytics test
pnpm --filter @tour-kit/analytics typecheck
pnpm --filter @tour-kit/analytics build
rg -n "if \\(this\\.config\\.debug\\)" packages/analytics/src/core/tracker.ts
rg -n "safeDispatch" packages/analytics/src/core/tracker.ts
```

Expected:

- tests, typecheck, and build pass
- `if (this.config.debug)` appears in one helper location
- five lifecycle call sites use `safeDispatch`
- public methods keep their current return types

---

## Rollback

Rollback is `git revert <merge-commit-sha>`.

Because this is scoped to `packages/analytics/src/core/tracker.ts` plus tests, rollback should not affect other packages.
