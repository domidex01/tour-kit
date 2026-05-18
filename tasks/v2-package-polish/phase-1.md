# Phase 1 — useTour Reach + Force-Show

**Duration:** Days 3–8 (~10–14 hours)
**Depends on:** Phase 0 (tasks 0.2 `useTourActions` signature + 0.4 `forceShow` matrix — both signed off in `phase-0-validation.md`)
**Blocks:** Phase 2 (viewCount reset reuses force-show internals), Phase 10 ("open mentioned step" deep-link via `useTourActions(id).goToStep`), Phase 12 (HintGroup may consume `useTourActions` for cross-hint navigation)
**Risk Level:** HIGH — the registry hook is the keystone for Phases 2 and 10. A memory-leak or stale-ref bug ripples across every standalone `<Tour>` instance in StrictMode, and a force-show bypass that's too eager would leak past audience/license gates that other phases depend on.
**Stack:** react

---

## Objective

Convert the two workarounds the user explicitly named as "most of the demo wiring pain" into first-class APIs:

1. A **`useTourActions(id)` registry hook** in `@tour-kit/core` so a standalone `<Tour id="...">` (or a tour driven by `useTourKit`) self-registers at mount and any sibling subtree can read `isActive` / call `start`/`stop`/`restart`/`goToStep`. This kills the `ReplayBridge` window-event hack and the LS-clear+unregister+register dance in `examples/dashboard-next`.
2. A **`forceShow(id)` method** on `AnnouncementsProvider` that bypasses `frequency` / `scheduler cooldown` / `viewCount` / `isDismissed` / `audience` per the Phase 0 task 0.4 matrix — but **never** bypasses the `<LicenseGate require="pro">` boundary (security). Used by admin previews and the demo's "force-show the welcome modal" affordance.

Both APIs land in core/announcements with backwards-compatible types (existing `useTour` / `show()` / `dismiss()` keep their current shape), are tree-shakeable, and ship a codemod that deprecates the `ReplayBridge` window event in v2.0 (warn) with removal slated for v3.0.

## What Success Looks Like

1. `useTourActions("welcome").start()` opens the `welcome` tour when called from a sibling subtree (verified by a Storybook story that renders `<Tour id="welcome" steps={...} />` and a sibling `<button onClick={() => useTourActions("welcome").start()}>` — clicking the button transitions `isActive` from `false` to `true` without any prop drilling)
2. `forceShow("welcome-modal")` displays the announcement when `frequency: "once"` and `viewCount >= 1` are both true (verified by a Vitest test that primes state, calls `forceShow`, and asserts the modal renders)
3. `forceShow` does **not** bypass `<LicenseGate require="pro">` (verified by a Vitest test that wraps the modal in a `LicenseGate` with an invalid license — `forceShow` is called and the modal is **not** rendered; a `console.warn` fires)
4. `useTourActions("does-not-exist")` returns a frozen no-op object (`isActive: false`, `start`/`stop`/etc. are no-ops) and does **not** throw — verified by a unit test that asserts `Object.isFrozen(result) === true`
5. StrictMode double-render does not leak registry entries (verified by a test that mounts `<Tour id="x" />` inside `<React.StrictMode>`, unmounts, and asserts `tourRegistry.size === 0`; the registry stores `WeakRef`s and prunes on unmount)
6. `examples/dashboard-next` can delete `ReplayBridge` + the LS-clear+unregister+register block — diff shows **≥30 LOC removed** (M1 milestone gate per big-plan.md)
7. All existing tour + announcement tests still pass (`pnpm --filter @tour-kit/core test && pnpm --filter @tour-kit/announcements test` exit 0 with zero regressions)
8. `pnpm --filter @tour-kit/core typecheck && pnpm --filter @tour-kit/announcements typecheck` exits 0
9. New docs page `apps/docs/content/docs/guides/imperative-control.mdx` renders in dev (`pnpm --filter docs dev` shows it in the sidebar under Guides) and contains runnable code blocks for both `useTourActions` and `forceShow`

---

## What Failure Looks Like (and what to do)

- **`useTourActions(id)` causes a memory leak in StrictMode (double-mount keeps a strong reference to the unmounted Tour)** → switch the registry value from `RegistryEntry` to `WeakRef<RegistryEntry>` and add an explicit `unregister(id)` call in the `useEffect` cleanup. Add a `tourRegistry.prune()` call on every read to drop entries whose `WeakRef.deref()` returns `undefined`. If a leak still shows in tests, fall back to a plain `Map<string, RegistryEntry>` keyed by tour id with a strict `unregister` contract — accept the cost of mandatory cleanup over a memory-leak class.
- **`forceShow(id)` accidentally bypasses an unintended gate (e.g., user preference, audience-blocklist)** → enforce a hardcoded bypass whitelist as a TypeScript const tuple sourced from the Phase 0 §4 matrix. Every check in `show()` that is NOT in the whitelist must run unchanged. If a new gate is added in a future phase without updating the whitelist, the default is "respect, don't bypass." Add a Vitest snapshot test that pins the whitelist to a literal array — any future drift fails CI loudly.
- **Two tours register under the same id (e.g., HMR remount, accidental double-mount)** → emit a `console.error` in dev (`process.env.NODE_ENV !== 'production'`), keep the latest registration, and document the behaviour in `imperative-control.mdx`. Do NOT throw — throwing would tank HMR DX.
- **A standalone `<Tour>` instance has no `<TourProvider>` parent** → the registry is a module-level singleton; it does not require a provider. `useTourActions` reads from the singleton, so this case is supported. Document it explicitly so reviewers don't add a "must be inside Provider" assertion.
- **The deprecated `ReplayBridge` window event is still wired somewhere we can't grep** → make the codemod idempotent and run it on `examples/*` in CI; emit `[ReplayBridge] deprecated — call useTourActions(id).start() instead` on every dispatch. Survive v2.0 with a warn; cut in v3.0.
- **`forceShow` emits analytics that look like real user views and skew telemetry** → set `metadata.trigger="forced"` on every analytics event (matches Phase 0 §4 rationale). Document this in `imperative-control.mdx` so dashboard owners can filter `trigger != "forced"` to get real-user counts.
- **Test asserting "no leaked entries in StrictMode" is flaky** → drive GC explicitly in the test via `globalThis.gc?.()` when running under `vitest --expose-gc`, and assert the pruned size, not the raw `Map.size`. Mark the test `skipIf(!globalThis.gc)` rather than letting it flake.

---

## Architecture / Key Design Decisions

```
                ┌─────────────────────────────────────────────────────┐
                │  @tour-kit/core/src/registry/tour-registry.tsx      │
                │  module-level Map<string, WeakRef<RegistryEntry>>   │
                │  + register() / unregister() / get() / subscribe()  │
                └─────────────────────────────────────────────────────┘
                                 ▲                       ▲
                                 │                       │
              ┌──────────────────┘                       └──────────────────┐
              │                                                              │
   ┌────────────────────────┐                              ┌──────────────────────────┐
   │ <Tour id="welcome">    │  ──── self-registers ───▶    │ useTourActions("welcome")│
   │ <TourProvider id="...">│        on mount, prunes      │  reads via WeakRef.deref │
   │ useTourKit({ id, ... })│        on unmount            │  returns frozen no-op    │
   └────────────────────────┘                              │  when id is unknown      │
                                                           └──────────────────────────┘

   ┌──────────────────────────────────────────────┐
   │ @tour-kit/announcements                       │
   │ AnnouncementsContextValue                      │
   │   show(id)        — respects all gates         │
   │   forceShow(id)   — bypasses 5/6 gates per     │
   │                     Phase 0 §4 matrix          │
   │                     (LicenseGate still enforced)│
   └──────────────────────────────────────────────┘
```

### Data Model Strategy

| Layer | Type | Why |
|-------|------|-----|
| Public hook return (`UseTourActionsReturn`) | `interface` exported from `@tour-kit/core/types` | Phase 0 §2 signed off as `interface`; consumers extend it (e.g., AI deep-link in Phase 10) |
| Registry entry shape (`RegistryEntry`) | `interface` (internal, not exported) | Mutated in place when a tour re-mounts; structural typing keeps tests cheap |
| `forceShow` bypass policy | `const` tuple `as const` (TypeScript discriminated whitelist) | Pin the bypass set at compile time; any drift = type error |
| Bypass key | `'frequency' \| 'cooldown' \| 'viewCount' \| 'isDismissed' \| 'audience'` (union literal) | Closed set mirrors Phase 0 §4 matrix; new gates default to respect-unless-added |

**Critical rules for this phase:**

- **Registry is a module-level singleton.** `tour-registry.tsx` exports `tourRegistry` directly — no React context, no Provider required. This is intentional: `useTourActions` must work from a sibling subtree (the whole point of Phase 1), and a context dependency would re-create the workaround.
- **`WeakRef` for the registry value, not the key.** Keys are tour ids (strings — interned, not GC-able). Values hold the controller surface; wrapping them in `WeakRef` plus explicit `unregister()` on unmount survives StrictMode without leaks.
- **Frozen no-op return on unknown id.** Returning `null` would force callers to write `useTourActions(id)?.start()` everywhere. Returning a frozen no-op object lets callers write `useTourActions(id).start()` and have it silently no-op during route transitions when the tour isn't mounted. Documented as intentional in Phase 0 §2.
- **`forceShow` bypass whitelist is enforced by type, not comment.** The whitelist is a `const` tuple checked at compile time; the runtime `forceShow` implementation iterates `gateChecks: Record<BypassKey, () => boolean>` and skips only those keys present in the whitelist.
- **No new animations.** This phase ships no DOM transitions, so the three-tier reduced-motion defense from CLAUDE.md does not apply. Existing tour/announcement animations are unchanged.
- **No new libraries.** `WeakRef` is ES2021 (already in `tsconfig.json target: ES2020` — verify with one-liner; if not available, the deliverable upgrades core's target to ES2021 in a CHANGELOG-noted minor). React 18+ already supports the `useSyncExternalStore` pattern needed for the registry subscription.

---

## Tasks

### Task 1.1 — `useTourActions(id)` registry hook in `@tour-kit/core` (5–7 h)

**Depends on:** Phase 0 task 0.2 (signed-off signature)

Build the module-level registry + `useTourActions` hook. The registry is a `Map<string, WeakRef<RegistryEntry>>` with a subscription set so `useTourActions` can re-render on state changes via `useSyncExternalStore`. Standalone `<Tour id="...">` and `useTourKit({ id, ... })` self-register at mount and unregister at unmount.

Signed-off signature from Phase 0 §2 (pasted here verbatim — the prompt says "assume Phase 0 signs off something like this"):

```ts
// packages/core/src/types/registry.ts
export interface UseTourActionsReturn {
  // Minimal state slice (read-only mirror of registry)
  isActive: boolean
  currentStepId: string | null
  progress: number // 0..1

  // Imperative actions — every method is a no-op if the tour is not registered
  start: () => void
  stop: () => void
  restart: () => void
  next: () => void
  prev: () => void
  goToStep: (stepId: string) => void
}

/**
 * Read/control a tour from anywhere in the React tree, including siblings of
 * the <Tour> instance. Standalone <Tour id="..."> components self-register at
 * mount via the tour registry. Returns a frozen no-op object when the tour id
 * is unknown — does NOT throw, so call sites stay quiet during route transitions.
 */
export function useTourActions(tourId: string): UseTourActionsReturn
```

Internal registry shape (not exported):

```ts
// packages/core/src/registry/tour-registry.tsx
interface RegistryEntry {
  id: string
  // Live state mirror updated by the owning <Tour> on every transition
  state: {
    isActive: boolean
    currentStepId: string | null
    progress: number
  }
  // Imperative controllers wired from the owning <Tour>'s reducer
  actions: {
    start: () => void
    stop: () => void
    restart: () => void
    next: () => void
    prev: () => void
    goToStep: (stepId: string) => void
  }
}

// Module-level singleton — no Provider required
const entries = new Map<string, WeakRef<RegistryEntry>>()
const listeners = new Set<() => void>()

export const tourRegistry = {
  register(entry: RegistryEntry): () => void { /* set + notify; returns unregister fn */ },
  get(id: string): RegistryEntry | null { /* deref + prune-on-miss */ },
  subscribe(fn: () => void): () => void { /* add + return remove fn */ },
  snapshot(): ReadonlyMap<string, RegistryEntry> { /* for tests */ },
  prune(): void { /* drop dead WeakRefs */ },
}
```

Wire the existing `<TourProvider>` / `useTourKit` to push a `RegistryEntry` on mount (`useEffect(() => tourRegistry.register({...}), [])`). The `actions.*` methods delegate to the existing reducer dispatch path. The `state.*` mirror is updated via a side-effect that fires on every reducer transition (cheap because the registry entry is mutated in place; only the subscription notification triggers a re-render in `useTourActions` consumers).

`useTourActions(tourId)` implementation uses `React.useSyncExternalStore(tourRegistry.subscribe, () => tourRegistry.get(tourId))`. When the registry entry is null, return a module-level frozen no-op object (allocated once, reused across all unknown-id calls).

**Sanity check:** `pnpm --filter @tour-kit/core typecheck && pnpm --filter @tour-kit/core test -- --run` exits 0; a manual smoke test in Storybook (sibling button calls `useTourActions("welcome").start()`) flips `isActive`.

---

### Task 1.2 — Deprecate `ReplayBridge` + codemod transform (1–2 h)

**Depends on:** 1.1

Add a deprecation warning to any existing `ReplayBridge` window-event listener (search `packages/react/src/**` and `examples/dashboard-next/**` — the user's pain point came from `examples/dashboard-next`, so the listener may live there as user code rather than in the package; if it's only in the example, the warning lives in the codemod's transform output as a `console.warn` injected at the call site).

Create `packages/codemods/src/transforms/replay-bridge-to-use-tour-actions.ts` — a jscodeshift transform that:
- Finds `window.dispatchEvent(new CustomEvent('tour-replay', { detail: { id: '...' } }))` (and small variants — quoted/double-quoted, template-literal id)
- Rewrites to `useTourActions('...').start()` if a `React` import is already in scope; otherwise emits a `// TODO(tour-kit): replace with useTourActions` comment and leaves the line untouched (best-effort, never break code)
- Strips the matching `window.addEventListener('tour-replay', ...)` listener block
- Adds `import { useTourActions } from '@tour-kit/core'` if not already present

Register the transform in `packages/codemods/src/cli.ts` so it shows up in `tour-kit-migrate --list`. Add a `__tests__/transforms/replay-bridge-to-use-tour-actions.test.ts` fixture pair (before/after).

**Sanity check:** `pnpm --filter @tour-kit/codemods test -- --run replay-bridge` exits 0; running the codemod on `examples/dashboard-next/` removes the `ReplayBridge` listener and replaces the dispatch.

---

### Task 1.3 — `forceShow(id)` on `AnnouncementsProvider` (3–4 h)

**Depends on:** Phase 0 task 0.4 (signed-off matrix)

Add a `forceShow: (id: string) => void` method to `AnnouncementsContextValue` in `packages/announcements/src/types/context.ts` and wire it in `packages/announcements/src/context/announcements-provider.tsx` next to the existing `show()` (around line 458–517).

Per Phase 0 §4 matrix:

| Gate                                              | `show()` respects? | `forceShow()` respects? |
|---------------------------------------------------|--------------------|-------------------------|
| `frequency` rule (once, session, times, interval) | Yes                | **No**                  |
| Scheduler cooldown (`canShow()`)                  | Yes                | **No**                  |
| `viewCount` threshold                             | Yes                | **No**                  |
| `isDismissed` flag                                | Yes (no-op)        | **No** (re-shows)       |
| `audience` (segment + array)                      | Yes                | **No**                  |
| License gate (`<LicenseGate require="pro">`)      | Yes                | **Yes** (security)      |

Implementation pattern (refactor `show()` to extract gate evaluation, then `forceShow()` reuses the side-effect tail):

```ts
const FORCE_SHOW_BYPASS = ['frequency', 'cooldown', 'viewCount', 'isDismissed', 'audience'] as const
type ForceShowBypassKey = (typeof FORCE_SHOW_BYPASS)[number]

const forceShow = React.useCallback((id: string) => {
  const announcementState = state.announcements.get(id)
  const config = state.configs.get(id)
  if (!announcementState || !config) return

  // LicenseGate is NOT bypassed — that's a security boundary, not a UX gate.
  // The LicenseGate component itself short-circuits rendering when invalid,
  // so we simply emit the SHOW action and let the gate decide visually.

  // Skip every gate in FORCE_SHOW_BYPASS; preserve the existing side-effect tail
  // (queue-or-show, persist, analytics, callbacks) but stamp trigger="forced"
  // and still increment viewCount so admins see real telemetry deltas.

  schedulerRef.current.markActive()
  dispatch({ type: 'SHOW', id })

  const updatedState = {
    ...announcementState,
    isActive: true,
    isVisible: true,
    viewCount: announcementState.viewCount + 1, // still increment per Phase 0 §4
    isDismissed: false,                          // re-show after dismissal
    lastViewedAt: new Date(),
  }
  persistState(id, updatedState)

  analytics?.track('announcement_shown', {
    tourId: id,
    metadata: getAnnouncementAnalyticsMetadata(config, {
      trigger: 'forced',                         // Phase 0 §4 — admin/demo flag
      viewCount: updatedState.viewCount,
    }),
  })
  config.onShow?.()
  onAnnouncementShow?.(id)
}, [state.announcements, state.configs, persistState, analytics, onAnnouncementShow])
```

Update `AnnouncementsContextValue` (`packages/announcements/src/types/context.ts`) and `useAnnouncements()` return shape to expose `forceShow`. Add a pinned-array test that asserts `FORCE_SHOW_BYPASS` equals `['frequency', 'cooldown', 'viewCount', 'isDismissed', 'audience']` exactly — any drift breaks CI.

**Sanity check:** `pnpm --filter @tour-kit/announcements test -- --run forceShow` shows a passing test where `frequency: "once"` + `viewCount: 1` + `isDismissed: true` all bypass and the modal renders, plus a passing test where `<LicenseGate require="pro">` blocks even after `forceShow`.

---

### Task 1.4 — Docs page: "Imperative control" (1 h)

**Depends on:** 1.1, 1.3

Create `apps/docs/content/docs/guides/imperative-control.mdx` with two H2 sections:

1. **Imperative tour control with `useTourActions`** — explain the registry model (standalone tours self-register), show a sibling-subtree code block, document the `frozen no-op` return on unknown id, mention the StrictMode-safe `WeakRef` storage.
2. **Force-showing announcements (admin previews)** — show the `forceShow("welcome-modal")` call site, paste the bypass matrix table verbatim from Phase 0 §4, and explain the `metadata.trigger="forced"` analytics flag so dashboard owners know how to filter.

Update `apps/docs/content/docs/guides/meta.json` so the new page appears in the Guides sidebar (slot it after `analytics-integration.mdx` alphabetically).

**Sanity check:** `pnpm --filter docs build` exits 0; `pnpm --filter docs dev` shows the page at `/docs/guides/imperative-control`.

---

## Deliverables

```
packages/core/
├── src/
│   ├── registry/
│   │   ├── tour-registry.tsx        # NEW — module-level Map<string, WeakRef<RegistryEntry>>;
│   │   │                            #       register/unregister/get/subscribe/snapshot/prune
│   │   ├── use-tour-actions.ts      # NEW — useSyncExternalStore hook; frozen no-op on unknown id
│   │   └── __tests__/
│   │       ├── tour-registry.test.ts        # NEW — StrictMode leak test, prune behaviour
│   │       └── use-tour-actions.test.tsx    # NEW — sibling-subtree integration, no-op return
│   ├── types/
│   │   └── registry.ts              # NEW — UseTourActionsReturn interface (exported)
│   ├── context/
│   │   └── tour-provider.tsx        # UPDATED — useEffect registers entry in tourRegistry on mount
│   └── index.ts                     # UPDATED — re-export useTourActions, UseTourActionsReturn

packages/announcements/
├── src/
│   ├── context/
│   │   └── announcements-provider.tsx   # UPDATED — adds forceShow callback + FORCE_SHOW_BYPASS tuple
│   ├── types/
│   │   └── context.ts                   # UPDATED — AnnouncementsContextValue gains forceShow
│   ├── hooks/
│   │   └── use-announcements.ts         # UPDATED — surface forceShow in return shape
│   └── __tests__/
│       └── force-show.test.tsx          # NEW — bypass matrix tests + LicenseGate boundary test

packages/codemods/
├── src/
│   ├── transforms/
│   │   └── replay-bridge-to-use-tour-actions.ts   # NEW — jscodeshift transform
│   ├── cli.ts                                      # UPDATED — register new transform
│   └── __tests__/transforms/
│       └── replay-bridge-to-use-tour-actions.test.ts   # NEW — before/after fixture

apps/docs/
└── content/docs/guides/
    ├── imperative-control.mdx       # NEW — useTourActions + forceShow guide
    └── meta.json                    # UPDATED — sidebar entry

examples/dashboard-next/
└── (deletions only — proof point, not a deliverable file)
                                     # ≥30 LOC removed: ReplayBridge.tsx + LS-clear+register dance
```

---

## Exit Criteria

- [ ] `pnpm --filter @tour-kit/core typecheck` and `pnpm --filter @tour-kit/announcements typecheck` and `pnpm --filter @tour-kit/codemods typecheck` all exit 0
- [ ] `pnpm --filter @tour-kit/core test -- --run` exits 0 with new tests `tour-registry.test.ts` (≥3 cases: register/unregister/StrictMode-no-leak) and `use-tour-actions.test.tsx` (≥3 cases: sibling-subtree start, unknown-id no-op, frozen return) passing
- [ ] `pnpm --filter @tour-kit/announcements test -- --run force-show` exits 0 with ≥6 cases proving the Phase 0 §4 matrix row-by-row (one test per bypass row + one test that `LicenseGate` still blocks)
- [ ] Pinned-array test in `force-show.test.tsx` asserts `FORCE_SHOW_BYPASS` literal-equals `['frequency', 'cooldown', 'viewCount', 'isDismissed', 'audience']` — drift breaks CI
- [ ] `pnpm --filter @tour-kit/codemods test -- --run replay-bridge` exits 0 with before/after fixture parity (input file with `window.dispatchEvent('tour-replay')` → output file with `useTourActions(id).start()` + import added + listener removed)
- [ ] `pnpm --filter docs build` exits 0 and `imperative-control.mdx` appears in the rendered sidebar under Guides
- [ ] StrictMode leak test: mount `<Tour id="x" />` inside `<React.StrictMode>`, unmount, assert `tourRegistry.snapshot().size === 0` after `tourRegistry.prune()`
- [ ] `examples/dashboard-next` diff: `git diff --stat examples/dashboard-next` after migration shows ≥30 LOC removed (M1 gate)
- [ ] All existing tour + announcement tests still pass (no regressions): `pnpm test` at repo root exits 0

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to implement this phase:

---
You are building Phase 1 of Tour Kit v2 Package Polish — useTour Reach + Force-Show.

### What This Project Is
Tour Kit is a pnpm monorepo of 12 packages providing headless React product-tour primitives (core, react, hints) plus pro packages (announcements, surveys, checklists, adoption, analytics, ai, scheduling, license, media). v2 closes demo-wiring gaps reported while building `examples/dashboard-next/`. Every phase ships as one PR with backwards-compatible types. The stack is TypeScript strict mode, React 18+, tsup, Turborepo, Vitest, pnpm. `WeakRef` is available (ES2021; verify `tsconfig.json target` is at least `ES2020` with `lib: ['ES2021']` — if not, widen the lib in a separate commit and note in CHANGELOG).

### Established in Prior Phases
- Phase 0 (signed off in `tasks/v2-package-polish/phase-0-validation.md`) locked these contracts:
  - **`useTourActions(id)` signature** — see "Signed-off signatures" below
  - **`target` union type** — out of scope for Phase 1
  - **`forceShow(id)` behaviour matrix** — see the table below; matches `tasks/v2-package-polish/phase-0.md` task 0.4
  - **Peer-dep audit** — no new libraries in Phase 1; nothing to install
  - **Trial-tier decision** — out of scope for Phase 1
- The existing announcements provider lives at `packages/announcements/src/context/announcements-provider.tsx` with `show()` on lines 458–517 — every gate in `show()` is the source of truth for the bypass policy
- The existing tour controller is in `packages/core/src/hooks/use-tour.ts` and `packages/core/src/context/tour-provider.tsx` — Phase 1 wires registration into the provider's `useEffect`, does not rewrite the controller

### Signed-off Signatures (verbatim from Phase 0 §2 / §4)

```ts
// Phase 0 §2 — UseTourActionsReturn
export interface UseTourActionsReturn {
  isActive: boolean
  currentStepId: string | null
  progress: number // 0..1
  start: () => void
  stop: () => void
  restart: () => void
  next: () => void
  prev: () => void
  goToStep: (stepId: string) => void
}

export function useTourActions(tourId: string): UseTourActionsReturn
```

```ts
// Phase 0 §4 — forceShow signature
forceShow: (id: string) => void
```

| Gate                                              | `show()` respects? | `forceShow()` respects? |
|---------------------------------------------------|--------------------|-------------------------|
| `frequency` rule (once, session, times, interval) | Yes                | **No**                  |
| Scheduler cooldown (`canShow()`)                  | Yes                | **No**                  |
| `viewCount` threshold                             | Yes                | **No**                  |
| `isDismissed` flag                                | Yes (no-op)        | **No** (re-shows)       |
| `audience` (segment + array)                      | Yes                | **No**                  |
| License gate (`<LicenseGate require="pro">`)      | Yes                | **Yes** (security)      |

`forceShow` still increments `viewCount` (admins see real telemetry deltas) and stamps analytics events with `metadata.trigger="forced"`.

### Your Goal for This Phase
Ship `useTourActions(id)` in `@tour-kit/core` (registry + hook + frozen no-op return), add `forceShow(id)` to `AnnouncementsProvider` per the matrix above, write a deprecation codemod for the `ReplayBridge` window event, and document both APIs in a new docs guide. Migrate `examples/dashboard-next` to prove ≥30 LOC removed (M1 gate).

### Data Model Rules (follow exactly)
- **`interface` (exported):** `UseTourActionsReturn` lives in `packages/core/src/types/registry.ts`. Re-exported from `@tour-kit/core` barrel.
- **`interface` (internal):** `RegistryEntry` is module-private to `tour-registry.tsx`. Not exported.
- **`const` tuple:** `FORCE_SHOW_BYPASS = ['frequency', 'cooldown', 'viewCount', 'isDismissed', 'audience'] as const` lives in `announcements-provider.tsx`. Pinned by a snapshot test.
- **No new Zod schemas this phase.** `forceShow(id)` takes a `string` and never crosses an external validation boundary.
- **Module-level singleton, not Context.** `tourRegistry` is exported from `tour-registry.tsx` directly. Adding a Provider would re-create the workaround Phase 1 is killing.
- **`WeakRef` values, string keys.** `Map<string, WeakRef<RegistryEntry>>`. Explicit `unregister` on unmount; `prune()` on every read miss.
- **Frozen no-op return.** Allocate one module-level frozen no-op object; reuse it for every unknown-id call. Never return `null`.

### Architecture
```
@tour-kit/core
  src/registry/tour-registry.tsx     ← module-level singleton; Map<string, WeakRef<RegistryEntry>>
  src/registry/use-tour-actions.ts   ← useSyncExternalStore(tourRegistry.subscribe, …)
  src/types/registry.ts              ← UseTourActionsReturn (exported)
  src/context/tour-provider.tsx      ← useEffect(() => tourRegistry.register({…}), [])

@tour-kit/announcements
  src/context/announcements-provider.tsx
    show(id)         — existing; unchanged
    forceShow(id)    — NEW; bypasses 5 gates per matrix; LicenseGate still enforced
  src/types/context.ts                ← AnnouncementsContextValue gains forceShow

@tour-kit/codemods
  src/transforms/replay-bridge-to-use-tour-actions.ts   ← jscodeshift transform

apps/docs/content/docs/guides/imperative-control.mdx    ← new guide page
```

### Confirmed Library APIs

No new libraries this phase. Existing patterns to reference verbatim:

```ts
// React 18+ — useSyncExternalStore signature (already used elsewhere in core)
const snapshot = React.useSyncExternalStore(
  (onStoreChange) => tourRegistry.subscribe(onStoreChange),  // subscribe
  () => tourRegistry.get(tourId),                            // getSnapshot
  () => null                                                 // getServerSnapshot (SSR-safe)
)
```

```ts
// WeakRef — ES2021; assume tsconfig lib includes ES2021
const ref = new WeakRef(entry)
const live = ref.deref()  // RegistryEntry | undefined
```

```ts
// Existing announcements show() pattern (lines 458–517 of announcements-provider.tsx):
//   1. !announcementState || !config → return
//   2. audience segment check (filteredIds.has)        ← bypassed by forceShow
//   3. scheduler.canShow(config, state, userContext)   ← bypassed by forceShow
//   4. scheduler.shouldQueue → enqueue                 ← bypassed by forceShow (forced is immediate)
//   5. dispatch SHOW + persist + emit analytics        ← preserved; trigger="forced"
```

### Files to Create / Update

#### `packages/core/src/types/registry.ts` (NEW)
Export `UseTourActionsReturn` exactly as shown in "Signed-off signatures" above. Add a JSDoc block above the interface explaining the frozen-no-op-on-unknown-id contract. Do not import React in this file (types only).

#### `packages/core/src/registry/tour-registry.tsx` (NEW)
Module-level singleton. Declare `const entries = new Map<string, WeakRef<RegistryEntry>>()` and `const listeners = new Set<() => void>()`. Export a single `tourRegistry` object with `register(entry): () => void` (returns unregister fn; notifies listeners), `get(id): RegistryEntry | null` (deref + prune on miss), `subscribe(fn): () => void`, `snapshot(): ReadonlyMap<string, RegistryEntry>` (resolves all WeakRefs; used by tests), and `prune(): void` (drops dead refs). `RegistryEntry` is internal (not exported). In dev (`process.env.NODE_ENV !== 'production'`), `register` emits `console.error` if a live entry already exists under the same id — keep the latest registration.

#### `packages/core/src/registry/use-tour-actions.ts` (NEW)
Export `useTourActions(tourId: string): UseTourActionsReturn`. Implementation uses `useSyncExternalStore(tourRegistry.subscribe, () => tourRegistry.get(tourId), () => null)`. When the entry is null, return the module-level frozen no-op constant (allocate once at module scope: `const FROZEN_NOOP: UseTourActionsReturn = Object.freeze({ isActive: false, currentStepId: null, progress: 0, start: () => {}, stop: () => {}, restart: () => {}, next: () => {}, prev: () => {}, goToStep: () => {} })`). When the entry exists, return a new object whose `state.*` fields come from `entry.state` and whose method fields delegate to `entry.actions` (do not return `entry.actions` directly — wrap so the registry can be swapped later without invalidating closures held by consumers).

#### `packages/core/src/registry/__tests__/tour-registry.test.ts` (NEW)
≥3 cases: (1) register-then-get returns the entry; (2) explicit unregister removes it (`snapshot().size === 0`); (3) StrictMode-simulated double-mount-then-unmount leaves zero live entries after `prune()`. Use `globalThis.gc?.()` if available; skip the GC-dependent assertion when not (`it.skipIf(!globalThis.gc)`).

#### `packages/core/src/registry/__tests__/use-tour-actions.test.tsx` (NEW)
≥3 cases: (1) `useTourActions("missing")` returns the frozen no-op and `Object.isFrozen(result) === true`; (2) sibling subtree integration — render `<TourProvider id="welcome" steps={...}>` and a sibling button calling `useTourActions("welcome").start()`, assert `isActive` flips to true; (3) double-call to `useTourActions(sameId)` returns referentially-equal-by-shape objects (state mirror updates re-render without snapshot identity drift).

#### `packages/core/src/context/tour-provider.tsx` (UPDATED)
Add a `useEffect` that calls `tourRegistry.register({ id, state, actions })` on mount and returns the unregister fn for cleanup. The `state` object is updated by a dispatcher subscription (mutate in place to avoid forcing the consumer to re-subscribe). Wire `actions` to the existing reducer dispatch path — do not refactor the reducer.

#### `packages/core/src/index.ts` (UPDATED)
Re-export `useTourActions` and `UseTourActionsReturn` from the barrel. Do not break any existing exports.

#### `packages/announcements/src/types/context.ts` (UPDATED)
Add `forceShow: (id: string) => void` to `AnnouncementsContextValue` between `show` and `reset` (alphabetical-ish; co-locate with imperative methods). Update the corresponding hook return type in `packages/announcements/src/hooks/use-announcements.ts`.

#### `packages/announcements/src/context/announcements-provider.tsx` (UPDATED)
Add the `FORCE_SHOW_BYPASS` const tuple at module scope (above the provider component). Implement `forceShow` as shown in the "Implementation pattern" block of Task 1.3. Place it directly below `show` (around line 518). Include `forceShow` in the `value` object returned to the context, and in every `React.useMemo` deps array that lists `show` (`show`'s deps + `forceShow` should be co-listed). Preserve every other gate path unchanged.

#### `packages/announcements/src/__tests__/force-show.test.tsx` (NEW)
≥6 cases, one per matrix row plus the LicenseGate boundary: (1) `frequency: "once"` + already viewed → `forceShow` re-renders the modal; (2) scheduler cooldown active → `forceShow` bypasses; (3) `viewCount >= maxViews` → `forceShow` re-renders; (4) `isDismissed: true` → `forceShow` re-renders and re-sets `isDismissed` to false; (5) `audience` mismatch → `forceShow` ignores audience and renders; (6) `<LicenseGate require="pro">` invalid → `forceShow` is called but the modal does NOT render (security boundary preserved). Plus a literal-array snapshot test pinning `FORCE_SHOW_BYPASS` to `['frequency', 'cooldown', 'viewCount', 'isDismissed', 'audience']`.

#### `packages/codemods/src/transforms/replay-bridge-to-use-tour-actions.ts` (NEW)
jscodeshift transform. Match `window.dispatchEvent(new CustomEvent('tour-replay', { detail: { id: <expr> } }))` (and small variants) → rewrite to `useTourActions(<expr>).start()`. Strip matching `window.addEventListener('tour-replay', …)` blocks. Add `import { useTourActions } from '@tour-kit/core'` if not already present. Idempotent (running twice is a no-op on second pass). On uncertain matches (custom event name varies), emit `// TODO(tour-kit): replace with useTourActions` and leave the node untouched.

#### `packages/codemods/src/__tests__/transforms/replay-bridge-to-use-tour-actions.test.ts` (NEW)
Fixture-based test: input file with a `tour-replay` dispatch + listener → output file matches expected (dispatch rewritten, listener removed, import added). Add a second fixture proving idempotency (running the transform twice produces an unchanged output on the second pass).

#### `packages/codemods/src/cli.ts` (UPDATED)
Register the new transform under the name `replay-bridge-to-use-tour-actions` so `tour-kit-migrate --list` shows it.

#### `apps/docs/content/docs/guides/imperative-control.mdx` (NEW)
Two H2 sections per Task 1.4. Each section contains a runnable code block (TypeScript, fenced as ```tsx). The `forceShow` section pastes the matrix table verbatim. Frontmatter: `title: Imperative control`, `description: Control tours from sibling subtrees with useTourActions, and bypass announcement gates with forceShow.`.

#### `apps/docs/content/docs/guides/meta.json` (UPDATED)
Slot the new page after `analytics-integration` in the `pages` array.

#### `examples/dashboard-next/**` (UPDATED — deletions only)
Remove `ReplayBridge.tsx`, the LS-clear+unregister+register dance, and any related test. Replace the dispatch call site with `useTourActions("welcome").start()`. Replace the force-show LS-dance with `useAnnouncements().forceShow("welcome-modal")`. Target ≥30 LOC removed (M1 gate). This is the proof point; not a deliverable file.

### Success Criteria
- `useTourActions("welcome").start()` flips `isActive` from `false` to `true` when called from a sibling subtree (Storybook + Vitest)
- `forceShow("welcome-modal")` renders the modal when `frequency: "once"` and `viewCount >= 1`; does NOT render when `<LicenseGate require="pro">` is invalid
- `useTourActions("does-not-exist")` returns a frozen no-op object, never throws
- StrictMode mount+unmount leaves zero entries in `tourRegistry.snapshot()` after `prune()`
- `examples/dashboard-next` diff shows ≥30 LOC removed
- All tests pass: `pnpm test` exits 0 at repo root
- All typecheck pass: `pnpm typecheck` exits 0 at repo root
- Docs build clean: `pnpm --filter docs build` exits 0; new page renders in sidebar

### Expected File Structure at End
```
tasks/v2-package-polish/
├── big-plan.md
├── phase-0.md
├── phase-0-validation.md
└── phase-1.md

packages/core/src/
├── registry/
│   ├── tour-registry.tsx              # NEW
│   ├── use-tour-actions.ts            # NEW
│   └── __tests__/
│       ├── tour-registry.test.ts      # NEW
│       └── use-tour-actions.test.tsx  # NEW
├── types/
│   └── registry.ts                    # NEW
├── context/
│   └── tour-provider.tsx              # UPDATED — registers on mount
└── index.ts                           # UPDATED — re-export

packages/announcements/src/
├── context/announcements-provider.tsx # UPDATED — adds forceShow + FORCE_SHOW_BYPASS
├── types/context.ts                   # UPDATED — AnnouncementsContextValue
├── hooks/use-announcements.ts         # UPDATED — surface forceShow
└── __tests__/force-show.test.tsx      # NEW

packages/codemods/src/
├── transforms/replay-bridge-to-use-tour-actions.ts            # NEW
├── cli.ts                                                      # UPDATED
└── __tests__/transforms/replay-bridge-to-use-tour-actions.test.ts  # NEW

apps/docs/content/docs/guides/
├── imperative-control.mdx             # NEW
└── meta.json                          # UPDATED

examples/dashboard-next/                # ≥30 LOC removed (proof point)
```

---

## Readiness Check

- [PASS] All inputs from prior phases listed and available — Phase 0 §2 (useTourActions signature), §4 (forceShow matrix), §5 (no new peer deps for Phase 1) are pasted verbatim in the Execution Prompt; source-of-truth lines in `announcements-provider.tsx` and `use-tour.ts` are cited.
- [PASS] Every sub-task has a clear, testable completion condition — each task has a `Sanity check` one-liner (`pnpm --filter ... test` or `pnpm --filter ... typecheck`).
- [PASS] Execution prompt is self-contained — prior facts copied inline (no "see Phase 0"); signed-off signatures pasted verbatim; data model rules listed (interface, const tuple, no Zod, module singleton, WeakRef, frozen no-op); per-file guidance has one paragraph per file in the deliverables tree; success criteria are observable.
- [PASS] Exit criteria map 1:1 to deliverables — every NEW/UPDATED file in the deliverables tree appears in at least one exit checkbox (typecheck, test, or build); StrictMode leak test and ≥30-LOC dashboard-next diff explicitly listed.
- [PASS] Heavy external deps have a fake/stub strategy noted — no heavy deps in Phase 1. Vitest + jscodeshift fixtures are existing infra; no model/network mocking needed. Marked PASS.
- [PASS] New libraries have a confirmed snippet from Context7 in the execution prompt — no new libraries this phase (per Phase 0 §5 peer-dep audit). `WeakRef` + `useSyncExternalStore` are both existing language/framework primitives. Marked PASS.
