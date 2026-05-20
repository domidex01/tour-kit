# Phase 1 — Testing: useTour Reach + Force-Show

**Scope:** `@tour-kit/core` registry (`tour-registry.tsx`, `use-tour-actions.ts`, `tour-provider.tsx` wiring), `@tour-kit/announcements` `forceShow(id)` on `AnnouncementsProvider`, `@tour-kit/codemods` `replay-bridge-to-use-tour-actions` jscodeshift transform, docs page `apps/docs/content/docs/guides/imperative-control.mdx`, and a deletions-only migration in `examples/dashboard-next`.
**Key Pattern:** Pure logic + integration — no heavy deps, no model loads. Unit-test the registry against fake registry entries and a hand-rolled `<Tour>` test harness; fixture-test the codemod; integration-test the sibling-subtree `useTourActions` flow with `<TourProvider>`; pin the `FORCE_SHOW_BYPASS` whitelist as a literal-array snapshot so future drift breaks CI loudly.
**Dependencies:** vitest, @testing-library/react, jscodeshift (existing devDep of `@tour-kit/codemods`), jsdom env, optional Node process with `globalThis.gc` exposed for the StrictMode leak test.

---

## 1. User Stories

| # | User Story | Validation Check | Pass Condition |
|---|-----------|-----------------|----------------|
| US-1 | As a demo author, I want to call `useTourActions("welcome").start()` from a sibling subtree so I can wire a "Replay" link in the navbar without window events | `use-tour-actions.test.tsx` mounts `<TourProvider id="welcome">` plus a sibling button calling the hook | Clicking the button transitions `isActive` from `false` to `true` |
| US-2 | As a library author, I want unknown tour ids to return a frozen no-op so route transitions don't throw mid-render | `use-tour-actions.test.tsx` asserts `useTourActions("does-not-exist")` returns a frozen object | `Object.isFrozen(result) === true`; calling `result.start()` is a no-op (does not throw) |
| US-3 | As a React 18 consumer, I want StrictMode double-mount + unmount to leave zero registry entries so memory doesn't leak | `tour-registry.test.ts` simulates StrictMode (manual `register → unregister → register → unregister`) and calls `prune()` | `tourRegistry.snapshot().size === 0` after the second unmount |
| US-4 | As a Pro admin, I want `forceShow("welcome-modal")` to bypass frequency/cooldown/viewCount/isDismissed/audience but **not** the license soft-gate | `force-show.test.tsx` primes each gate as "blocking", calls `forceShow`, asserts the modal renders | 5 bypass tests pass (modal renders despite gate); 1 license test passes (watermark/warning still visible) |
| US-5 | As CI, I want the `FORCE_SHOW_BYPASS` array pinned to a literal so future gate additions default to "respect, not bypass" | `force-show.test.tsx` literal-array snapshot test | `expect(FORCE_SHOW_BYPASS).toEqual(['frequency', 'cooldown', 'viewCount', 'isDismissed', 'audience'])` — drift breaks CI |
| US-6 | As a v1 consumer with `ReplayBridge`, I want a codemod to migrate me to `useTourActions(id).start()` without manual rewrites | `replay-bridge-to-use-tour-actions.test.ts` runs the transform on the before-fixture | Output equals the after-fixture byte-for-byte; running the transform twice on the same input is a no-op (idempotent) |
| US-7 | As a docs reviewer, I want `imperative-control.mdx` to compile via Fumadocs so the runnable code blocks don't 404 | `pnpm --filter @tour-kit/docs build` | Exits 0; page renders at `/docs/guides/imperative-control` (manual smoke) |

---

## 2. Component Mock Strategy

| Component | Mock Strategy | What to Assert | User Story |
|---|---|---|---|
| `tourRegistry` singleton | No mock — exercise directly; reset between tests with a helper that clears `entries` + `listeners` | After `register({id,...})`, `get(id)` returns the entry; after `unregister()`, `snapshot().size === 0` | US-1, US-3 |
| `useTourActions(id)` consumer | No mock — render real `<TourProvider id="x">` plus a sibling consumer; use `act()` + `userEvent` | `isActive` flips `false → true` on `start()`; unknown id returns the module-level frozen no-op | US-1, US-2 |
| StrictMode double-mount | Don't render under `<React.StrictMode>` (jsdom can't drive RAF GC reliably); simulate manually: `register → register-with-same-id → both-unregister → prune` | `tourRegistry.snapshot().size === 0` post-prune; the "duplicate id" dev `console.error` fires | US-3 |
| `AnnouncementsProvider.forceShow` | No mock for provider; mock per-gate state via initial `<AnnouncementsProvider announcements={[{id, config: { frequency: 'once' }, state: { viewCount: 1, isDismissed: true }}]}>` | Modal renders after `forceShow(id)` for each blocked-by-X case; analytics event fires with `metadata.trigger='forced'` | US-4, US-5 |
| `<LicenseGate require="pro">` (soft gate) | Wrap test in `<LicenseProvider licenseKey="">` with no real Polar call (use the unlicensed state); use existing test idioms from `packages/announcements/src/__tests__/license-integration.test.tsx` | Watermark/warning DOM element present after `forceShow` (license gate NOT bypassed) | US-4 |
| `replay-bridge-to-use-tour-actions` transform | jscodeshift fixture pattern: `input.tsx` → run transform → assert equals `output.tsx`; reuse the existing `from-driver.test.ts` harness shape | Output text equals fixture byte-for-byte; second-pass output is identical to first-pass (idempotency) | US-6 |
| MDX docs page | No mock — run `pnpm --filter @tour-kit/docs build` | Exits 0 | US-7 |

---

## 3. Test Tier Table

| Tier | Dependencies | Speed | When to Run |
|------|-------------|-------|-------------|
| Unit | vitest, jsdom, in-memory `tourRegistry` reset | <2s total | Every push |
| Component | vitest + @testing-library/react, in-memory providers | <5s total | Every push |
| Codemod fixture | vitest + jscodeshift (existing devDep) | <2s total | Every push |
| Docs build smoke | `pnpm --filter @tour-kit/docs build` | ~10–20s | Pre-merge CI |
| GC-dependent StrictMode leak (optional) | A Vitest run launched from a Node process that exposes `globalThis.gc` | <1s | Optional — `it.skipIf(!globalThis.gc)` so default `pnpm test` does not require the flag |

---

## 4. No Fake Implementations (Pure Logic + Component Phase)

Phase 1 has zero heavy dependencies (no model loads, no network, no DB). The registry is a `Map` + `Set`; the announcement provider is a reducer + persist effect; the codemod is a pure AST transform. Real implementations run in jsdom in milliseconds. The closest thing to a "fake" is a small helper in `tour-registry.test.ts` that resets the module-level registry between tests so cross-test leakage doesn't masquerade as success.

```ts
// packages/core/src/registry/__tests__/test-helpers.ts (NEW — small, not a fake)
import { tourRegistry } from '../tour-registry'
export function resetTourRegistry() {
  // Module-private state — exposed for tests only via a __reset__ symbol on tourRegistry.
  (tourRegistry as unknown as { __reset__: () => void }).__reset__()
}
```

`tour-registry.tsx` adds `__reset__: process.env.NODE_ENV === 'test' ? () => { entries.clear(); listeners.clear() } : undefined` so production never carries the helper.

---

## 5. Test File List

```
packages/core/src/registry/__tests__/
├── tour-registry.test.ts                          # NEW — register/unregister/prune/dev-double-id console.error
├── use-tour-actions.test.tsx                      # NEW — sibling-subtree start/stop, frozen no-op, double-call ref identity
└── test-helpers.ts                                # NEW — resetTourRegistry() between tests

packages/announcements/src/__tests__/
└── force-show.test.tsx                            # NEW — per-row bypass tests (5) + license-soft-gate test (1)
                                                   #       + literal-array pin on FORCE_SHOW_BYPASS
                                                   #       + analytics-trigger='forced' assertion

packages/codemods/src/__tests__/
└── replay-bridge-to-use-tour-actions.test.ts      # NEW — before/after fixture parity + idempotency
packages/codemods/src/__tests__/fixtures/
└── replay-bridge-to-use-tour-actions/
    ├── basic.input.tsx                            # NEW — window.dispatchEvent('tour-replay') + addEventListener
    └── basic.output.tsx                           # NEW — useTourActions(id).start() + import added; listener stripped
```

| File | Tier | Tests | Description |
|------|------|-------|-------------|
| `tour-registry.test.ts` | Unit | ≥4 | register-then-get; unregister clears; manual double-mount+prune leaves size 0; dev double-id emits `console.error`. |
| `use-tour-actions.test.tsx` | Component | ≥4 | Sibling-subtree `start()`; unknown-id returns frozen no-op; `Object.isFrozen` assertion; state mirror re-renders on transition. |
| `force-show.test.tsx` | Component | ≥7 | One bypass test per matrix row (5); license soft-gate preserved (1); analytics `trigger='forced'` event emitted (1); literal-array pin on `FORCE_SHOW_BYPASS`. |
| `replay-bridge-to-use-tour-actions.test.ts` | Codemod | ≥3 | Happy-path rewrite; listener strip; idempotent second pass. |

---

## 6. Test Setup (Vitest + jsdom + reset helper)

**Additions to existing `packages/core/vitest.config.ts`:** existing config covers `src/**/*.test.ts(x)`; no change needed. Add `setupFiles: ['./src/registry/__tests__/setup.ts']` ONLY if more than one new test needs registry reset; otherwise import `resetTourRegistry` per-file.

`packages/core/src/registry/__tests__/setup.ts`:

```ts
import { afterEach } from 'vitest'
import { resetTourRegistry } from './test-helpers'

afterEach(() => {
  resetTourRegistry()
})
```

**Additions to existing `packages/announcements/vitest.config.ts`:** none. Reuse the existing `jsdom` env and Testing Library setup.

For the codemod: `packages/codemods/src/__tests__/replay-bridge-to-use-tour-actions.test.ts` follows the existing pattern in `packages/codemods/src/__tests__/from-driver.test.ts` and imports `runTransform` from `packages/codemods/src/__tests__/_helpers.ts`. The current codemod tests are flat under `src/__tests__/`; keep the new file there unless the package test layout changes.

For the optional GC leak test:

```ts
it.skipIf(!globalThis.gc)('strict-mode leak — no live entries after gc + prune', async () => {
  // ... simulate register/unregister cycle
  globalThis.gc?.()
  tourRegistry.prune()
  expect(tourRegistry.snapshot().size).toBe(0)
})
```

---

## 7. Key Testing Decisions

| Decision | Approach | Rationale |
|----------|----------|-----------|
| Module-level `__reset__` instead of a re-mock of the singleton | Add a test-only symbol on `tourRegistry` exported behind `NODE_ENV === 'test'` | `vi.resetModules()` between tests is slower and can race with React's `useSyncExternalStore` subscription lifecycle. A direct `entries.clear()` is deterministic. |
| StrictMode test simulates the lifecycle manually | Two `register → unregister` cycles plus `prune()` | jsdom can't reliably drive `<React.StrictMode>` GC the way Chrome does; simulating the cycle deterministically exercises the same code paths without flake. |
| GC-dependent assertion is `skipIf(!globalThis.gc)` | Optional run only in an environment where the test process already exposes `globalThis.gc` | Default `pnpm test` doesn't need to expose GC; CI can opt in with a Node-level flag. Flakiness would cost more than the assertion is worth. |
| `FORCE_SHOW_BYPASS` is pinned as a literal-array equality | `expect(FORCE_SHOW_BYPASS).toEqual([...])` | A future contributor adding a new gate would silently bypass it unless the literal pin breaks first. The pin is the load-bearing CI gate. |
| Force-show tests prime state via initial `announcements` prop, not by calling `dismiss()` first | One render per test; setup is data, not interactions | Faster, more readable, and avoids ordering bugs (calling `dismiss()` first masks whether `forceShow` truly bypasses `isDismissed`). |
| License soft-gate test asserts watermark presence, not children absence | `<LicenseGate>` renders children + overlays watermark when unlicensed — see Phase 0 §4 sign-off | Asserting "children disappear" would invert the contract. The invariant is "watermark/warning state survives `forceShow`." |
| Codemod fixtures are minimal (one input/output pair) | Add a second fixture only for idempotency | Three fixture pairs would test variants we don't ship yet. The transform is heuristic; one canonical case + idempotency is the right granularity. |
| Idempotency tested by running the transform twice | Assert second-pass output equals first-pass | Catches regressions where a future "improvement" rewrites already-migrated code into something weird. |
| Docs page tested via build, not by parsing MDX | `pnpm --filter @tour-kit/docs build` | Fumadocs is the source of truth; if it builds, the page is valid. Re-implementing the MDX parser in a test would drift. |

---

## 8. Example Test Case

The force-show suite is the most representative — it pins both a behavior matrix and a literal CI gate.

```tsx
// packages/announcements/src/__tests__/force-show.test.tsx
import { render, screen, act } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AnnouncementsProvider, useAnnouncements } from '../index'
import { FORCE_SHOW_BYPASS } from '../context/announcements-provider'

function ForceShowButton({ id }: { id: string }) {
  const { forceShow } = useAnnouncements()
  return <button onClick={() => forceShow(id)}>Force</button>
}

describe('FORCE_SHOW_BYPASS literal pin', () => {
  it('matches the Phase 0 §4 signed-off matrix exactly — drift breaks CI', () => {
    expect(FORCE_SHOW_BYPASS).toEqual([
      'frequency',
      'cooldown',
      'viewCount',
      'isDismissed',
      'audience',
    ])
  })
})

describe('forceShow bypass matrix', () => {
  it.each([
    ['frequency=once, viewCount=1', { config: { frequency: 'once' }, state: { viewCount: 1 } }],
    ['scheduler cooldown active',   { config: { cooldown: { ms: 60_000 } }, state: { lastViewedAt: new Date() } }],
    ['viewCount >= maxViews',       { config: { maxViews: 1 }, state: { viewCount: 1 } }],
    ['isDismissed=true',            { config: {}, state: { isDismissed: true } }],
    ['audience mismatch',           { config: { audience: ['admin'] }, state: {} }],
  ])('bypasses %s', async (_, primed) => {
    const onAnalytics = vi.fn()
    render(
      <AnnouncementsProvider announcements={[{ id: 'a', ...primed }]} analytics={{ track: onAnalytics }}>
        <ForceShowButton id="a" />
      </AnnouncementsProvider>
    )
    await act(async () => screen.getByText('Force').click())
    expect(screen.queryByTestId('announcement-a')).toBeInTheDocument()
    expect(onAnalytics).toHaveBeenCalledWith(
      'announcement_shown',
      expect.objectContaining({ tourId: 'a', metadata: expect.objectContaining({ trigger: 'forced' }) }),
    )
  })

  it('does NOT bypass <LicenseGate require="pro"> — watermark/warning remains', async () => {
    // Render with unlicensed LicenseProvider per the existing license-integration.test.tsx pattern.
    // After forceShow, [data-tour-kit-watermark] must still be in the document.
    // (see packages/announcements/src/__tests__/license-integration.test.tsx for the unlicensed wrapper idiom)
  })
})
```

---

## 9. Execution Prompt

Copy everything between the `---` lines into a new Claude session to write this test suite:

---

You are writing the complete test suite for Phase 1 of Tour Kit v2 Package Polish — useTour Reach + Force-Show.

### What This Project Is

Tour Kit is a pnpm + Turborepo monorepo of 12 React packages providing headless product-tour primitives. `@tour-kit/core` ships the headless registry and hooks; `@tour-kit/announcements` ships modal/toast/banner/spotlight/slideout. Stack: TypeScript strict mode, React 18+, Vitest + @testing-library/react (jsdom), jscodeshift for codemods, pnpm. No model loads, no network in tests.

### Acceptance Criteria (from User Stories)

| # | User Story | Validation Check | Pass Condition |
|---|-----------|-----------------|----------------|
| US-1 | `useTourActions("x").start()` from a sibling subtree flips `isActive` | renderHook + sibling button | `isActive: false → true` |
| US-2 | Unknown id returns frozen no-op | `useTourActions("missing")` | `Object.isFrozen(result) === true`; methods are no-ops |
| US-3 | StrictMode double-mount leaves zero entries | manual register/unregister cycle + prune | `tourRegistry.snapshot().size === 0` |
| US-4 | `forceShow` bypasses 5 gates but not LicenseGate | one test per row + license soft-gate test | Modal renders for 5 cases; watermark visible in license case |
| US-5 | `FORCE_SHOW_BYPASS` literal pinned | `expect(arr).toEqual([...])` | Equality matches Phase 0 §4 verbatim |
| US-6 | Codemod rewrites `tour-replay` dispatches | fixture-based test | Output matches; idempotent on second pass |
| US-7 | Docs page builds | `pnpm --filter @tour-kit/docs build` | Exit 0 |

### Why Fakes Are Required

None. Phase 1 has no heavy deps (no model, no network, no DB). The registry is in-memory; the announcement provider is a reducer; the codemod is a pure AST transform. The only test-only helper is `resetTourRegistry()` which clears the module-level singleton between tests — see §4 of this plan for the implementation pattern.

### What NOT to Test

- Don't test `useTour()` itself — that's covered by existing `@tour-kit/core` tests. Phase 1 adds `useTourActions`, which is a new surface.
- Don't test Polar, license validation, or any network behavior. The license soft-gate test only checks that the watermark element is present in the unlicensed render — no Polar call.
- Don't test the codemod under every possible variant of `window.dispatchEvent(...)`. The transform is heuristic; emit a TODO comment on ambiguous matches. One canonical happy-path + one idempotency case is the right granularity.
- Don't add a Playwright e2e for this phase — the ≥30 LOC `examples/dashboard-next` diff is the proof point, verified manually in the PR.

### Critical: No Fake Implementations

See §4 of this plan. The only "fake" is a test-only `resetTourRegistry()` helper that clears the module-level `entries` + `listeners`. It's exposed behind `NODE_ENV === 'test'` so production never carries the helper.

### Test Files to Create

```
packages/core/src/registry/__tests__/
├── tour-registry.test.ts
├── use-tour-actions.test.tsx
└── test-helpers.ts

packages/announcements/src/__tests__/
└── force-show.test.tsx

packages/codemods/src/__tests__/
└── replay-bridge-to-use-tour-actions.test.ts
packages/codemods/src/__tests__/fixtures/replay-bridge-to-use-tour-actions/
├── basic.input.tsx
└── basic.output.tsx
```

### Per-File Coverage Guidance

#### `packages/core/src/registry/__tests__/tour-registry.test.ts`
≥4 cases: (1) `register({...})` → `get(id)` returns the entry; (2) `unregister()` (returned from `register`) clears the entry — `snapshot().size === 0`; (3) manual two-cycle `register → unregister → register → unregister`, then `prune()`, leaves size 0; (4) in dev (`process.env.NODE_ENV !== 'production'`), registering a second entry with the same id emits a `console.error` (use `vi.spyOn(console, 'error')`).

#### `packages/core/src/registry/__tests__/use-tour-actions.test.tsx`
≥4 cases: (1) `renderHook(() => useTourActions("missing"))` returns a frozen no-op; `Object.isFrozen(result) === true`; calling `result.start()` does not throw. (2) Render `<TourProvider id="welcome" steps={[{id:'a',...}]} />` plus a sibling button that calls `useTourActions("welcome").start()`; click it; assert `isActive: true`. (3) Two calls to `useTourActions(sameId)` in the same render return objects whose `state.*` fields update on the next dispatch (re-render assertion). (4) After `useEffect`-driven unregister (unmount the provider), `useTourActions("welcome")` re-returns the frozen no-op.

#### `packages/announcements/src/__tests__/force-show.test.tsx`
≥7 cases: (1)–(5) one per matrix row using `it.each` (frequency-once+viewCount=1, scheduler cooldown active, viewCount >= maxViews, isDismissed=true, audience mismatch) — each primes state via the initial `announcements` prop, calls `forceShow`, asserts the announcement renders, and asserts the analytics event fires with `metadata.trigger='forced'`. (6) License soft-gate: wrap in `<LicenseProvider>` with no license; call `forceShow`; assert the `[data-tour-kit-watermark]` element is still in the DOM (license gate NOT bypassed). (7) Literal-array pin: `expect(FORCE_SHOW_BYPASS).toEqual(['frequency','cooldown','viewCount','isDismissed','audience'])`.

#### `packages/codemods/src/__tests__/replay-bridge-to-use-tour-actions.test.ts`
≥3 cases following the existing `from-driver.test.ts` + `_helpers.ts` idiom: (1) load `basic.input.tsx`, run transform, assert output equals `basic.output.tsx`. (2) Run transform a second time on the already-transformed output; assert it equals the first-pass output (idempotency). (3) Input with no `tour-replay` events at all; assert the file is returned unchanged.

#### `packages/codemods/src/__tests__/fixtures/replay-bridge-to-use-tour-actions/basic.{input,output}.tsx`
Input: `window.addEventListener('tour-replay', (e) => start(e.detail.id))` plus `<button onClick={() => window.dispatchEvent(new CustomEvent('tour-replay', { detail: { id: 'welcome' } }))}>Replay</button>`. Output: the listener block removed; the dispatch rewritten to `useTourActions('welcome').start()`; `import { useTourActions } from '@tour-kit/core'` added at the top.

### Data Model Notes

- `UseTourActionsReturn` is an `interface` (per Phase 0 §2 sign-off). Test the shape via TS — if it drifts, the assertions break at compile time.
- `FORCE_SHOW_BYPASS` is a `const` tuple `as const` in the announcements provider. The pinned-array test imports it directly and asserts literal equality.

### Success Criteria

- `pnpm --filter @tour-kit/core test -- --run` exits 0 with `tour-registry.test.ts` (≥4 cases) + `use-tour-actions.test.tsx` (≥4 cases) green
- `pnpm --filter @tour-kit/announcements test -- --run force-show` exits 0 with ≥7 cases green including the literal pin
- `pnpm --filter @tour-kit/codemods test -- --run replay-bridge` exits 0 with fixture parity + idempotency
- `pnpm --filter @tour-kit/docs build` exits 0
- No regressions in pre-existing tour/announcement/codemod suites (`pnpm test` at repo root)

### Expected File Structure at End

```
packages/core/src/registry/__tests__/
├── tour-registry.test.ts                          # NEW
├── use-tour-actions.test.tsx                      # NEW
└── test-helpers.ts                                # NEW
packages/announcements/src/__tests__/
└── force-show.test.tsx                            # NEW
packages/codemods/src/__tests__/
└── replay-bridge-to-use-tour-actions.test.ts      # NEW
packages/codemods/src/__tests__/fixtures/replay-bridge-to-use-tour-actions/
├── basic.input.tsx                                # NEW
└── basic.output.tsx                               # NEW
```

---

## 10. Run Commands

```bash
# Fast path — every push
pnpm --filter @tour-kit/core test -- --run tour-registry use-tour-actions
pnpm --filter @tour-kit/announcements test -- --run force-show
pnpm --filter @tour-kit/codemods test -- --run replay-bridge

# Full per-package suite
pnpm --filter @tour-kit/core test -- --run
pnpm --filter @tour-kit/announcements test -- --run

# Optional GC-leak assertion (only if you want the skipped gc branch to run)
pnpm --filter @tour-kit/core exec node --expose-gc ../../node_modules/vitest/vitest.mjs run src/registry/__tests__/tour-registry.test.ts

# Docs build (pre-merge)
pnpm --filter @tour-kit/docs build
```
