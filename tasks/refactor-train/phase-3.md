# Phase 3 — Dead-code drop + type tightening + priority comparator reuse

**Duration:** Days 8–10 (~5.25 hours)
**Depends on:** none (entry-friendly; Phase 1 + Phase 2 ordering is a courtesy not a requirement)
**Blocks:** none
**Risk Level:** MEDIUM — §3.2 changes the public API of `@tour-kit/core` and `@tour-kit/react` (four function exports deleted). Mitigated by exhaustive caller-scan in §3.1 + a changeset that flags the deletions.
**Stack:** typescript

---

## Objective

Resolve three independent MED candidates from [`docs/refactor-candidates.md`](../../docs/refactor-candidates.md) in one PR because each is too small to justify its own merge cycle:

1. **Drop dead `calculatePosition` family** (`packages/core/src/utils/position.ts:107-293`). The 4 exports (`calculatePosition`, `calculatePositionWithCollision`, `wouldOverflow`, `getFallbackPlacements`) — ~190 LOC of manual placement math — have **zero non-test, non-index consumers** in the workspace. Every Tour/Hint/Survey/Announcement positioning site uses `@floating-ui/react` directly. The exports are re-exported from `packages/core/src/index.ts:128-132` and `packages/react/src/index.ts:173` but never called.
2. **Consolidate priority comparator** (`packages/announcements/src/context/announcements-provider.tsx:451-461`). The provider's auto-show effect inlines a `priorityOrder: Record<string, number> = { critical: 0, high: 1, normal: 2, low: 3 }` map even though `packages/announcements/src/core/priority-queue.ts:148-170` already exports a `createComparator` function for the exact purpose. Two sources of truth for "what priority means" — if the queue ever switches to `lifo` or a custom weight map, the provider silently disagrees.
3. **Drop `as unknown as Record<string, unknown>` from `validateTour`** (`packages/core/src/lib/validate-tour.ts:33`). A runtime check casts each `step` to `Record<string, unknown>` to read fields that exist on the *visible* step shape but are typed-out for the *hidden* shape. A properly narrowed `HiddenStep` discriminated union makes the cast unnecessary and lets TypeScript catch the bad shape at the type boundary.

After this phase, public API is tighter by 4 functions, `announcements-provider` has one fewer source of priority truth, and `validate-tour.ts` has no `as unknown` casts.

---

## What Success Looks Like

1. **`calculatePosition` family is no longer in the public barrel.** `grep -n "calculatePosition\|wouldOverflow\|getFallbackPlacements\|calculatePositionWithCollision" packages/core/src/index.ts packages/react/src/index.ts` returns **0 matches**.
2. **Internal callers (if any) still work.** `grep -rn "calculatePosition\|wouldOverflow\|getFallbackPlacements\|calculatePositionWithCollision" packages/ apps/ examples/ --include="*.ts" --include="*.tsx" | grep -v __tests__ | grep -v dist | grep -v _position-fallback` returns **0 lines** (per the report's own evidence). If the grep shows callers we missed, route them through the internal `_position-fallback.ts` (see §3.2 below).
3. **`announcements-provider.tsx`'s auto-show effect uses `createComparator`.** Verified by `grep -n "priorityOrder: Record" packages/announcements/src/context/announcements-provider.tsx` returning 0 lines and `grep -n "createComparator" packages/announcements/src/context/announcements-provider.tsx` returning at least 1 line.
4. **`HiddenStep` is narrowed.** `packages/core/src/types/step.ts` declares `HiddenStep` so `target`/`content`/`title`/`placement`/`advanceOn` are explicitly `never` (or omitted via `Omit`/`Exclude` from a base step type, depending on the existing type structure). Verified by a TypeScript test in `packages/core/src/types/__tests__/step-types.test-d.ts` (or `.test.ts` with `// @ts-expect-error` assertions) confirming `const x: HiddenStep = { kind: 'hidden', id: 'a', target: '.foo' }` produces a type error.
5. **`validateTour` body contains no `as unknown` cast.** Verified by `grep -n "as unknown" packages/core/src/lib/validate-tour.ts` returning 0 lines. The function still exists as a runtime guard for legacy untyped configs (typed `Tour` from a `JSON.parse` boundary), but the body iterates without casting.
6. **`pnpm typecheck` clean** across the workspace (modulo the pre-existing dashboard-next baseline failure per memory `#203`).
7. **`pnpm --filter @tour-kit/announcements test` exits 0**, including new tests that lock the priority comparator semantics.
8. **`pnpm --filter @tour-kit/core test` exits 0**, including the existing `position.test.ts` tests now importing from the internal module path (or deleted if redundant).
9. **`pnpm build` clean** with bundle-size delta:
   - `@tour-kit/core`: −~3.5 KB gzipped (the 4 functions + their tests' shared overhead — verify against `size-limit`).
   - `@tour-kit/react`: −0.2 KB gzipped (the single re-export).
10. **Changeset filed** describing the public-API removals with a code example showing the `@floating-ui/react` migration path consumers should take if they were (improbably) importing the deleted functions.

---

## What Failure Looks Like (and what to do)

- **A consumer outside the surveyed scope was importing `calculatePosition`.** The report's grep covered `packages/ apps/ examples/`, but third-party consumers of `@tour-kit/core` could be calling these. Mitigation: **before merge**, search `tour-kit-dash` (sibling repo per `CLAUDE.md`) for imports of these symbols — if found, preserve the symbol as a `@deprecated` re-export from `_position-fallback.ts` for one minor release with a deprecation log warning, then delete in the next major.
- **The internal `_position-fallback.ts` still imports them via `index.ts`'s legacy path.** When refactoring, make sure the internal tests in `packages/core/src/utils/__tests__/position.test.ts` use the new path (`from '../_position-fallback'`) and not `from '../position'` (which is fine but should be consistent). Run `pnpm --filter @tour-kit/core test` after the move.
- **`createComparator` requires `QueueConfig` but the provider doesn't have one.** The provider has `schedulerRef.current.config.priorityWeights`. Verify by reading the scheduler's `config` shape. If `priorityOrder` isn't yet a field on the config, **add it** with a default of `'priority'` — this is a tiny API addition that's safe.
- **The `HiddenStep` narrowing breaks an existing test that constructed an invalid `HiddenStep` to assert `validateTour` throws.** This is a *good* failure — the type now prevents the bad shape at compile time, so the runtime test becomes redundant. Two options: (a) delete the runtime test (preferred), or (b) cast the test input with `as HiddenStep` (a deliberate `as` cast to bypass the narrowing **inside the test** is acceptable because the test's whole purpose is to exercise the legacy untyped boundary).
- **The `HiddenStep` narrowing breaks consumer code that imported `HiddenStep` and passed extra fields.** Consumers should not be doing this — the original `HiddenStep` already disallowed these fields per the JSDoc — but TS may have been silently permissive. Document the change in the changeset as a **type-level breaking change** that surfaces at compile time only.
- **`validateTour` is still useful for `JSON.parse(rawConfig)` boundaries.** Keep the function exported but adjust the JSDoc to say "for runtime validation of untyped/external configs (e.g. JSON.parsed user input)" — this anchors its remaining purpose.

---

## Files Touched

### Modified

| Path                                                            | Change                                                                              | Δ LOC (approx) |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------- |
| `packages/core/src/utils/position.ts`                           | Keep `getDocumentDirection`, `mirrorSide`, `mirrorAlignment`, `mirrorPlacementForRTL`, `parsePlacement`, `getOppositeSide`, `getElementRect`, `getViewportDimensions`. Move `calculatePosition`, `wouldOverflow`, `getFallbackPlacements`, `calculatePositionWithCollision`, `shiftPositionIntoViewport` + `PositionResult` interface to a new `_position-fallback.ts` (internal). | −190 / +0      |
| `packages/core/src/utils/_position-fallback.ts`                 | NEW file housing the 4 (private) functions + their helper                           | +190           |
| `packages/core/src/index.ts:128-132`                            | Delete the 4 exports                                                                | −5             |
| `packages/react/src/index.ts:173`                               | Delete `calculatePosition` re-export                                                | −1             |
| `packages/core/src/utils/__tests__/position.test.ts`            | Update imports to `from '../_position-fallback'` for tests of the 4 functions; keep tests for the 8 retained util functions unchanged | ~5 import lines |
| `packages/announcements/src/context/announcements-provider.tsx:451-461` | Replace inline `priorityOrder` literal with `createComparator(order, weights)` call | −11 / +4       |
| `packages/announcements/src/core/scheduler.ts` (if needed)      | Expose `priorityOrder` + `priorityWeights` getters on the scheduler so the provider can read them cleanly (currently the provider reaches into `schedulerRef.current.config` directly — keep that or wrap, depending on existing conventions) | ~5 lines       |
| `packages/core/src/types/step.ts`                               | Narrow `HiddenStep`: make `target`/`content`/`title`/`placement`/`advanceOn` `never` (or restructure the type to omit them via discriminated union) | ~20 lines      |
| `packages/core/src/lib/validate-tour.ts`                        | Drop the `as unknown as Record<string, unknown>` cast; iterate via typed step properties | ~10 lines      |

### Added

| Path                                                            | Purpose                                                                 |
| --------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `packages/core/src/types/__tests__/step-types.test-d.ts`        | TS-only type tests asserting `HiddenStep` rejects forbidden fields      |
| `packages/announcements/src/context/__tests__/auto-show-priority.test.tsx` | Test locking that the auto-show effect uses the queue's comparator (e.g. switches to `lifo` ordering when configured) |
| `.changeset/refactor-train-phase-3.md`                          | Changeset documenting the public-API removals                           |

### Net delta

- **Production-code net:** ~−15 LOC (190 deleted from public surface, 175 moved internally; the comparator/type-narrowing changes are small)
- **Public-API surface:** 4 functions + 1 interface (`PositionResult`) removed
- **Bundle (gzipped):** −~3.5 KB across `@tour-kit/core` + `@tour-kit/react` (tree-shaking removes the now-unreferenced internal code)

---

## Step-by-Step Implementation

### Step 1 — Verify zero external callers (30 min)

Workspace-internal grep first:

```bash
grep -rn "calculatePosition\|wouldOverflow\|getFallbackPlacements\|calculatePositionWithCollision" \
  packages/ apps/ examples/ --include="*.ts" --include="*.tsx" \
  | grep -v __tests__ | grep -v dist | grep -v "position.ts" | grep -v "index.ts"
```

Expected: **0 lines** (per `docs/refactor-candidates.md` MED §1 evidence).

Cross-repo grep (sibling `tourkit-dash` per `CLAUDE.md`):

```bash
grep -rn "calculatePosition\|wouldOverflow\|getFallbackPlacements\|calculatePositionWithCollision" \
  /home/domidex/projects/tourkit-dash/ \
  --include="*.ts" --include="*.tsx" 2>/dev/null \
  | grep -v node_modules | grep -v .next | grep -v dist || echo "OK: no dash callers"
```

If either grep returns lines, **stop** and add a `@deprecated` re-export layer before deleting (see §What Failure §1 above).

### Step 2 — Move the 4 functions to `_position-fallback.ts` (45 min)

Create `packages/core/src/utils/_position-fallback.ts`:

```ts
/**
 * Manual placement-math fallback functions. Internal-only — `@floating-ui/react`
 * is the production positioning engine. These are retained for the in-repo unit
 * tests that exercise placement algebra without spinning up a React tree, and
 * as a defensive fallback if `@floating-ui/react` ever needs to be swapped out.
 *
 * Underscore prefix on filename telegraphs "internal — do not import from
 * outside `@tour-kit/core/src/utils/`".
 */

import type { Placement, Position, Rect } from '../types'
import { parsePlacement, getOppositeSide, getViewportDimensions } from './position'

export interface PositionResult {
  x: number
  y: number
  placement: Placement
  hasOverflow: boolean
}

export function calculatePosition(/* ... copy from position.ts:107-161 verbatim ... */) {
  // ... body unchanged
}

export function wouldOverflow(/* ... copy from position.ts:166-177 ... */) {
  // ... body unchanged
}

export function getFallbackPlacements(/* ... copy from position.ts:182-212 ... */) {
  // ... body unchanged
}

export function calculatePositionWithCollision(/* ... copy from position.ts:227-293 ... */) {
  // ... body unchanged
}

function shiftPositionIntoViewport(/* ... copy from position.ts:298-321 ... */) {
  // ... unchanged
}
```

Delete the same function bodies from `packages/core/src/utils/position.ts`. The retained helpers (`getDocumentDirection`, `mirrorSide`, `mirrorAlignment`, `mirrorPlacementForRTL`, `parsePlacement`, `getOppositeSide`, `getElementRect`, `getViewportDimensions`) stay in `position.ts`.

### Step 3 — Update barrel exports (15 min)

**`packages/core/src/index.ts:128-132`** — delete these 5 lines:

```ts
  calculatePosition,
  wouldOverflow,
  // (the line in-between, whatever it is)
  getFallbackPlacements,
  calculatePositionWithCollision,
```

Also delete the `PositionResult` type re-export if present.

**`packages/react/src/index.ts:173`** — delete the `calculatePosition` re-export line.

### Step 4 — Update internal test imports (15 min)

`packages/core/src/utils/__tests__/position.test.ts` likely tests all 12+ functions. For the 4 moved functions, update the import:

```ts
// Was:
import { calculatePosition, wouldOverflow, getFallbackPlacements, calculatePositionWithCollision } from '../position'
// Now:
import { calculatePosition, wouldOverflow, getFallbackPlacements, calculatePositionWithCollision } from '../_position-fallback'
```

The 8 retained functions' tests stay as-is.

Run `pnpm --filter @tour-kit/core test` — expect all green.

### Step 5 — Add changeset (15 min)

**`.changeset/refactor-train-phase-3.md`**:

```md
---
'@tour-kit/core': minor
'@tour-kit/react': minor
---

**Public API removal:** `calculatePosition`, `calculatePositionWithCollision`, `wouldOverflow`, and `getFallbackPlacements` are no longer exported from `@tour-kit/core` (also no longer re-exported from `@tour-kit/react`). These manual-placement functions had zero non-test consumers in the tour-kit workspace; production positioning is handled by `@floating-ui/react` directly.

If you were using these:

\`\`\`ts
// Before
import { calculatePosition } from '@tour-kit/core'
const pos = calculatePosition(targetRect, tooltipSize, 'top-start')

// After — use @floating-ui/react
import { useFloating, offset, flip } from '@floating-ui/react'
const { refs, floatingStyles } = useFloating({
  placement: 'top-start',
  middleware: [offset(8), flip()],
})
\`\`\`

The `PositionResult` type is also no longer exported.

Retained: `getDocumentDirection`, `mirrorSide`, `mirrorAlignment`, `mirrorPlacementForRTL`, `parsePlacement`, `getOppositeSide`, `getElementRect`, `getViewportDimensions` — these are still used by the hint/tour placement adapters.
```

Note: the `minor` bump is per the linked-versioning rule in `CLAUDE.md` ("All three packages are linked for versioning"). Removing a public API on a minor is technically a breaking change but acceptable for a tour-kit pre-1.0 surface — confirm with project policy if uncertain. **Recommendation:** if this is the first removal since 1.x, file as `major` instead.

### Step 6 — Consolidate priority comparator (45 min)

**`packages/announcements/src/context/announcements-provider.tsx:451-461`** — replace:

```ts
const priorityOrder: Record<string, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
}
eligible.sort(
  (a, b) =>
    (priorityOrder[a.priority ?? 'normal'] ?? 2) - (priorityOrder[b.priority ?? 'normal'] ?? 2)
)
```

…with:

```ts
import { createComparator } from '../core/priority-queue'
// (add to imports at top of file)

// Inside the effect:
const order = schedulerRef.current.config.priorityOrder ?? 'priority'
const weights = schedulerRef.current.config.priorityWeights
const comparator = createComparator(order, weights)

// `createComparator` works on `QueueItem`, which has `priority`, `weight`,
// `sequence`, `addedAt`, and `id`. Build minimal stand-in items from the
// eligible configs so we can reuse the comparator.
eligible.sort((a, b) => comparator(
  { id: a.id, priority: a.priority ?? 'normal', weight: weights[a.priority ?? 'normal'], sequence: 0, addedAt: 0 },
  { id: b.id, priority: b.priority ?? 'normal', weight: weights[b.priority ?? 'normal'], sequence: 0, addedAt: 0 },
))
```

**Alternative — cleaner.** If the inline-item construction is too noisy, expose a thinner helper from `priority-queue.ts`:

```ts
// In packages/announcements/src/core/priority-queue.ts, add:
export function comparePriority(
  a: AnnouncementPriority | undefined,
  b: AnnouncementPriority | undefined,
  config: QueueConfig,
): number {
  const weights = config.priorityWeights
  return weights[b ?? 'normal'] - weights[a ?? 'normal']
}
```

…then in the provider:

```ts
eligible.sort((a, b) => comparePriority(a.priority, b.priority, schedulerRef.current.config))
```

**Recommendation:** ship the `comparePriority` helper variant. It's a one-line caller and avoids the synthetic-QueueItem noise.

### Step 7 — Add priority-ordering test (30 min)

**`packages/announcements/src/context/__tests__/auto-show-priority.test.tsx`**:

```tsx
import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { AnnouncementsProvider } from '../announcements-provider'
// ... import test harness fixtures

describe('auto-show priority ordering', () => {
  it('shows critical before high before normal before low', async () => {
    const onShow = vi.fn()
    // ... mount provider with 4 announcements of different priorities
    // ... assert onShow is called with `critical` first
  })

  it('respects custom priorityWeights from QueueConfig', async () => {
    // Provider configured with custom weights that invert priorities
    // ... assert order reflects the custom weights
  })

  // Optional: lifo ordering when configured
  it('uses fifo ordering when QueueConfig.priorityOrder = "fifo"', async () => {
    // ... assert the auto-show effect sorts by addedAt instead of priority
  })
})
```

These tests **lock the comparator semantics** so a future change to `priority-queue.ts` automatically propagates to the provider (and vice versa).

### Step 8 — Narrow `HiddenStep` (1 h)

**`packages/core/src/types/step.ts`** — read first to understand the existing union shape. Typical pattern (assuming a `TourStep = VisibleStep | HiddenStep` discriminated union):

```ts
// Existing (illustrative — read the actual file first):
export interface BaseStep {
  id: string
  audience?: AudienceProp
  // ... shared fields
}

export interface VisibleStep extends BaseStep {
  kind?: 'visible' | undefined  // or just absence-as-default
  target: TourTarget
  title?: LocalizedText | ReactNode
  content: LocalizedText | ReactNode
  placement?: Placement
  advanceOn?: AdvanceOn
}

export interface HiddenStep extends BaseStep {
  kind: 'hidden'
  // NEW — make the forbidden fields explicitly `never`:
  target?: never
  title?: never
  content?: never
  placement?: never
  advanceOn?: never
}

export type TourStep = VisibleStep | HiddenStep
```

Two approaches to narrow `HiddenStep`:

**Option A (preferred): explicit `?: never`.** Adds `target?: never` etc. directly to the `HiddenStep` interface. Pro: minimal change, IDE shows the impossibility clearly. Con: clutters the type.

**Option B: structural exclude.** `export type HiddenStep = Omit<BaseStep, 'target' | 'content' | 'title' | 'placement' | 'advanceOn'> & { kind: 'hidden' }`. Pro: declarative. Con: harder for IDE auto-complete; intersection types can confuse some tooling.

**Decision:** ship Option A. It's more explicit and the JSDoc on each `never` field can document why.

### Step 9 — Drop the cast in `validate-tour.ts` (30 min)

**`packages/core/src/lib/validate-tour.ts`**:

```ts
import type { Tour, TourStep } from '../types'

const FORBIDDEN_HIDDEN_FIELDS = ['target', 'content', 'title', 'placement', 'advanceOn'] as const

type TourValidationCode = 'INVALID_HIDDEN_STEP' | 'HIDDEN_STEP_LOOP'

export class TourValidationError extends Error {
  readonly code: TourValidationCode
  readonly stepId: string
  constructor(args: { code: TourValidationCode; stepId: string; message: string }) {
    super(args.message)
    this.name = 'TourValidationError'
    this.code = args.code
    this.stepId = args.stepId
  }
}

/**
 * Runtime validator for `Tour` configs that crossed an untyped boundary
 * (e.g. `JSON.parse` of user input, a `fetch().json()` response).
 *
 * With the `HiddenStep` type narrowed in v2.x, TypeScript catches the bad
 * shape at compile time when the config is typed. This function is a defensive
 * net for the cases where the type system was bypassed.
 */
export function validateTour(tour: Tour): void {
  for (const step of tour.steps) {
    if (step.kind !== 'hidden') continue
    // After narrowing, `step` is `HiddenStep` here, where every forbidden
    // field is typed `never`. But the runtime value may still carry these
    // fields if `tour` crossed an untyped boundary — that's why this runtime
    // check exists. We iterate via an indexed access that works on the typed
    // step but reads through to the actual runtime properties.
    const stepRecord = step as Record<string, unknown>  // wait — this is still a cast
    // ...
  }
}
```

**Problem:** Option A's narrowing still requires a cast to *read* a `never`-typed property, because TS won't let you `step.target` if `target?: never`.

**Solution:** use a typed indexed access via the literal field names + `as const`:

```ts
export function validateTour(tour: Tour): void {
  for (const step of tour.steps) {
    if (step.kind !== 'hidden') continue
    for (const field of FORBIDDEN_HIDDEN_FIELDS) {
      // Read with bracket access. After narrowing, `step[field]` is `never |
      // undefined` so TypeScript permits the access (any value coerces to the
      // narrowed type's `undefined` member at runtime).
      const value = (step as Record<typeof field, unknown>)[field]
      if (value != null) {
        throw new TourValidationError({
          code: 'INVALID_HIDDEN_STEP',
          stepId: step.id,
          message: `Hidden step "${step.id}" must not declare \`${field}\`.`,
        })
      }
    }
  }
}
```

This is still a small `as` cast — but it's now a **scoped cast on the access**, not a wholesale `as unknown as Record<string, unknown>` on the step object. The type-level guarantee is now strong (TS prevents the bad shape from being constructed), and the runtime check is a thin guard for untyped boundaries.

**Even cleaner alternative:** use `Object.prototype.hasOwnProperty.call(step, field)` instead of reading the value:

```ts
for (const field of FORBIDDEN_HIDDEN_FIELDS) {
  if (Object.hasOwn(step, field)) {  // ES2022; supported by all tour-kit target environments
    throw new TourValidationError({
      code: 'INVALID_HIDDEN_STEP',
      stepId: step.id,
      message: `Hidden step "${step.id}" must not declare \`${field}\`.`,
    })
  }
}
```

`Object.hasOwn` accepts any object as its first argument — no cast required. **This is the recommended form.**

### Step 10 — Add type-test for `HiddenStep` (30 min)

**`packages/core/src/types/__tests__/step-types.test-d.ts`** (or `.test.ts` if `expectError`/`expectAssignable` isn't set up):

```ts
// Type-level tests using @ts-expect-error to assert the narrowing rejects
// forbidden fields. These don't run code — they just need to compile.

import type { HiddenStep, VisibleStep } from '../step'

// OK — valid HiddenStep
const ok1: HiddenStep = { kind: 'hidden', id: 'a' }

// Forbidden — target on a hidden step
// @ts-expect-error — `target` is never on HiddenStep
const bad1: HiddenStep = { kind: 'hidden', id: 'a', target: '.foo' }

// @ts-expect-error — `content` is never on HiddenStep
const bad2: HiddenStep = { kind: 'hidden', id: 'a', content: 'hi' }

// @ts-expect-error — `title` is never on HiddenStep
const bad3: HiddenStep = { kind: 'hidden', id: 'a', title: 'hi' }

// @ts-expect-error — `placement` is never on HiddenStep
const bad4: HiddenStep = { kind: 'hidden', id: 'a', placement: 'top' }

// @ts-expect-error — `advanceOn` is never on HiddenStep
const bad5: HiddenStep = { kind: 'hidden', id: 'a', advanceOn: { event: 'click' } }

// OK — valid VisibleStep
const ok2: VisibleStep = { id: 'b', target: '.foo', content: 'hi' }
```

Run `pnpm --filter @tour-kit/core typecheck` — expect all `@ts-expect-error` lines to be satisfied (i.e. the error happens at the line) and all `const ok = …` lines to compile cleanly.

### Step 11 — Validation (30 min)

```bash
# Public-API surface check
grep -n "calculatePosition\|wouldOverflow\|getFallbackPlacements\|calculatePositionWithCollision" \
  packages/core/src/index.ts packages/react/src/index.ts
# Expected: no matches

# Cast removal check
grep -n "as unknown" packages/core/src/lib/validate-tour.ts
# Expected: no matches

# Priority literal check
grep -n "priorityOrder: Record" packages/announcements/src/context/announcements-provider.tsx
# Expected: no matches

# Full validation
pnpm --filter @tour-kit/core test
pnpm --filter @tour-kit/announcements test
pnpm typecheck
pnpm build
pnpm size-limit
```

Expected size-limit delta: `@tour-kit/core` shrinks by ~3 KB gzipped (verify against memory `#198`'s known baseline noise — the delta should be **negative** relative to main).

---

## Validation Gates

1. `pnpm --filter @tour-kit/core test` exits 0.
2. `pnpm --filter @tour-kit/announcements test` exits 0, with the new auto-show priority tests included.
3. `pnpm typecheck` is clean except for the pre-existing dashboard-next failure (memory `#203`).
4. `pnpm build` produces all package `dist/` directories without error.
5. `pnpm size-limit`: `@tour-kit/core` and `@tour-kit/react` shrink, no other package grows.
6. The new type-test file compiles with all `@ts-expect-error` lines satisfied.
7. `grep -n "as unknown" packages/core/src/lib/validate-tour.ts` returns **0 lines**.
8. `grep -n "priorityOrder: Record" packages/announcements/src/context/announcements-provider.tsx` returns **0 lines**.
9. `grep -n "calculatePosition\|wouldOverflow\|getFallbackPlacements\|calculatePositionWithCollision" packages/core/src/index.ts packages/react/src/index.ts` returns **0 lines**.

---

## Rollback Plan

This phase ships as a single PR. Rollback is `git revert <merge-commit-sha>`. **Caveat:** the public-API removals are visible to downstream consumers; if a consumer is broken by the deletions, the revert un-breaks them at the cost of re-introducing dead code. Mitigation: ship behind a `minor` (or ideally `major`) bump per the changeset, and announce the deletions in release notes.

Per-cleanup rollback is also possible — the three changes (dead-code drop, comparator consolidation, type narrowing) live in different files and can be reverted independently with `git revert -n <sha> -- <path>`.

---

## Open Questions Surfaced During Planning

1. **Should the dead-code drop be a `minor` or `major` bump?** Per `CLAUDE.md`, the three core packages are linked for versioning. If this is the first removal-as-breaking-change since 1.x, file as `major`. If the project is comfortable burning public-API surface on minors during the 2.x train, `minor` is fine. Tagged `minor` in §5 above; revisit before merge.
2. **`Object.hasOwn` vs scoped cast for `validateTour`.** `Object.hasOwn` is cleaner but requires ES2022 — verify the tour-kit `target` in `tsconfig.json`. If it's still ES2020 (per `CLAUDE.md` ES2020 target), use `Object.prototype.hasOwnProperty.call(step, field)` (the legacy form, works everywhere).
3. **Should the in-file `position.test.ts` tests for the 4 moved functions be deleted entirely?** They test placement algebra in isolation, useful as documentation but redundant against `@floating-ui/react`'s own tests. **Recommendation:** keep them — they're cheap, they document the fallback contract, and they cost nothing in production bundle (the `_position-fallback.ts` is tree-shaken).

---

## Time Budget

| Step                                                       | Estimated |
| ---------------------------------------------------------- | --------- |
| 1. Verify zero external callers                            | 30 min    |
| 2. Move 4 functions to `_position-fallback.ts`             | 45 min    |
| 3. Update barrel exports                                   | 15 min    |
| 4. Update internal test imports                            | 15 min    |
| 5. Add changeset                                           | 15 min    |
| 6. Consolidate priority comparator                         | 45 min    |
| 7. Add priority-ordering test                              | 30 min    |
| 8. Narrow `HiddenStep`                                     | 1 h       |
| 9. Drop cast in `validate-tour.ts`                         | 30 min    |
| 10. Add type-test for `HiddenStep`                         | 30 min    |
| 11. Validation                                             | 30 min    |
| **Total**                                                  | **5.25 h**|

If §1's caller-scan turns up a consumer outside `packages/`, **stop** and re-scope §2 to preserve the symbol via `@deprecated` re-export. The dead-code drop is the riskiest step in this phase; the comparator and type-narrowing work can ship without it as a smaller PR.
