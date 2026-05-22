# Phase 3 — Testing: Dead API, Hidden-Step Types, Priority Comparator

**Scope:** Three independent workstreams in one PR:
- **A** — Remove dead `calculatePosition`/`PositionResult` family from public barrels (`packages/core/src/index.ts`, `packages/core/src/utils/index.ts`, `packages/react/src/index.ts`).
- **B** — Replace inline `priorityOrder` literal in `packages/announcements/src/context/announcements-provider.tsx` with a comparator helper sourced from `packages/announcements/src/core/priority-queue.ts`.
- **C** — Split `TourStep` into `VisibleTourStep | HiddenTourStep` with `?: never` forbidden fields; remove `as unknown as Record<string, unknown>` from `packages/core/src/lib/validate-tour.ts`.

**Key Pattern:** Mixed phase. Workstream A is **API surface** (barrel-export tests + grep gates). Workstream B is **pure-logic** (provider auto-show ordering under FIFO/LIFO + configured weights). Workstream C is **type-level** (`.test-d.ts` files using `expectTypeOf` / `tsd`) plus a small runtime test for `validateTour`.
**Dependencies:** vitest, @testing-library/react, `expectTypeOf` from vitest, optionally `tsd` if `pnpm --filter @tour-kit/core typecheck:types` already wires it.

---

## User Stories

| # | User Story | Validation Check | Pass Condition |
|---|-----------|-----------------|----------------|
| US-1 | As a `@tour-kit/core` consumer, I want the dead `calculatePosition` family removed from public exports so I can't accidentally depend on them | `barrel-exports.test.ts` + sibling-repo grep | `calculatePosition`, `calculatePositionWithCollision`, `wouldOverflow`, `getFallbackPlacements`, `PositionResult` absent from core/utils/react barrels; `ElementPositionResult` still present |
| US-2 | As an `@tour-kit/announcements` user, I want `priorityWeights` config and `priorityOrder: 'fifo' \| 'lifo'` to actually drive the auto-show ordering, not a hardcoded critical/high/normal/low literal | `auto-show.test.tsx` priority/FIFO/LIFO suite | Custom weights re-order auto-show queue; FIFO matches insertion order; LIFO matches reverse |
| US-3 | As a tour author writing hidden steps in TypeScript, I want the compiler to reject `{ kind: 'hidden', target: '#x' }` so I catch invalid steps at authoring time | `hidden-step.test-d.ts` | Visible step with target/content compiles; hidden step without UI fields compiles; hidden step with `target` is a TS error; hidden step with `content` is a TS error |
| US-4 | As a maintainer reading `validateTour`, I want no `as unknown as Record<string, unknown>` cast so the runtime check stays grep-clean and reviewable | `validate-tour.test.ts` (extend) + `as-cast-gone.test.ts` | Runtime: hidden step with forbidden field throws `TourValidationError`; source: grep returns 0 hits |
| US-5 | As a downstream consumer, I want `VisibleTourStep` and `HiddenTourStep` exported from `@tour-kit/core` so I can narrow without re-deriving the union | `barrel-exports.test.ts` + type test | Both type names resolvable from `@tour-kit/core`; `Extract<TourStep, { kind: 'hidden' }>` ≅ `HiddenTourStep` |

---

## Component Mock Strategy

| Component | Mock Strategy | What to Assert | User Story |
|-----------|--------------|----------------|------------|
| Public barrels (`@tour-kit/core`, `@tour-kit/core/utils`, `@tour-kit/react`) | None — import from package entry and read `Object.keys` | Dead names absent; `ElementPositionResult` still present (NOT confused with `PositionResult`) | US-1 |
| `packages/core/src/utils/_position-fallback.ts` (if kept internal) | None | Existing `position.test.ts` continues to pass against the moved internal location | US-1 |
| `<AnnouncementsProvider>` auto-show queue | Real provider; mount with `<SegmentationProvider>`; supply `queueConfig.priorityWeights` and `priorityOrder` | Auto-show pops announcements in expected order under three configs (default weights, custom weights, fifo, lifo) | US-2 |
| `createAnnouncementComparator(order, weights)` (new helper) | None — pure function | Pure comparator returns negative/positive for known inputs; respects `priorityOrder` for sequence ties | US-2 |
| `AnnouncementScheduler.queueConfig` getter (new) | None | `scheduler.queueConfig.priorityWeights` returns the configured weights; provider does NOT reach into `schedulerRef.current.config` directly | US-2 |
| `TourStep` union types | `expectTypeOf<TourStep>().toMatchTypeOf<VisibleTourStep \| HiddenTourStep>()`; use `// @ts-expect-error` lines for invalid hidden-step authoring | Visible accepts UI fields; hidden rejects them | US-3, US-5 |
| `validateTour` (runtime) | Real call against a fixture tour | Hidden step with `target` (passed via `as any` to bypass TS) throws `TourValidationError`; visible step with no target throws | US-4 |
| `validate-tour.ts` source grep | Read file with `fs.readFileSync`, assert `as unknown as Record<string, unknown>` substring absent | Grep gate co-located with the test | US-4 |

---

## Test Tier Table

| Tier | Dependencies | Speed | When to Run |
|------|-------------|-------|-------------|
| Unit | jsdom + vitest; pure-logic + small runtime | <5s per package | Every push |
| Type (`.test-d.ts`) | `expectTypeOf` and/or `tsd` via `pnpm --filter @tour-kit/core typecheck:types` | <10s | Every push (Phase 3 is type-heavy) |
| Provider integration (RTL) | RTL + jsdom + `<AnnouncementsProvider>` | <15s | Every push (small set) |
| Sibling-repo audit | Manual `rg` against `/home/domidex/projects/tourkit-dash` | <1s | Pre-merge only (run before deleting public exports) |

---

## Fake / Mock Implementations

**No fakes.** Phase 3 has no heavy deps. Three non-fake helpers:

### Type-test helper for hidden-step union
```ts
// packages/core/src/__tests__/types/hidden-step.test-d.ts
import { expectTypeOf } from 'vitest'
import type { HiddenTourStep, TourStep, VisibleTourStep } from '../../types/step'

// Visible step with target/content compiles
expectTypeOf<VisibleTourStep>().toMatchTypeOf<{
  id: string
  target: unknown
  content: unknown
}>()

// Hidden step without UI fields compiles
const hidden: HiddenTourStep = { id: 'h1', kind: 'hidden' }

// Hidden step with target fails (?: never)
// @ts-expect-error — hidden step cannot have target
const _bad1: HiddenTourStep = { id: 'h2', kind: 'hidden', target: '#x' }

// Hidden step with content fails
// @ts-expect-error — hidden step cannot have content
const _bad2: HiddenTourStep = { id: 'h3', kind: 'hidden', content: 'x' }

// Mixed tour accepts both
const _tour: TourStep[] = [
  { id: 'v', target: '#x', content: 'hi' } satisfies VisibleTourStep,
  hidden,
]
```

### Provider mounting helper for Workstream B
```ts
// packages/announcements/src/__tests__/_helpers/mount-provider.tsx
import { SegmentationProvider } from '@tour-kit/core'
import { render, type RenderResult } from '@testing-library/react'
import * as React from 'react'
import { AnnouncementsProvider, type AnnouncementsProviderProps } from '../../context/announcements-provider'

export function mountAnnouncements(
  announcements: AnnouncementsProviderProps['announcements'],
  queueConfig: AnnouncementsProviderProps['queueConfig'] = {},
  segments: Record<string, boolean> = {}
): RenderResult & { provider: HTMLElement } {
  const utils = render(
    <SegmentationProvider segments={segments}>
      <AnnouncementsProvider announcements={announcements} queueConfig={queueConfig}>
        <div data-testid="root" />
      </AnnouncementsProvider>
    </SegmentationProvider>
  )
  return { ...utils, provider: utils.getByTestId('root') }
}
```

### Source-grep gate
```ts
// packages/core/src/__tests__/lib/no-as-unknown-cast.test.ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('validate-tour.ts — no unsafe casts after hidden-step union', () => {
  it('does not contain "as unknown as Record<string, unknown>"', () => {
    const src = readFileSync(
      resolve(__dirname, '../../lib/validate-tour.ts'),
      'utf-8'
    )
    expect(src).not.toMatch(/as unknown as Record<string, unknown>/)
  })
})
```

---

## Test File List

```
# Workstream A — Position Public API Removal
packages/core/src/__tests__/
└── barrel-exports.test.ts                                 # EXTEND: assert calculatePosition*, wouldOverflow, getFallbackPlacements, PositionResult ABSENT from core barrel; ElementPositionResult PRESENT

packages/core/src/__tests__/utils/
└── barrel-utils.test.ts                                   # NEW: assert same names absent from utils barrel

packages/react/src/__tests__/
└── barrel-exports.test.ts                                 # NEW or EXTEND: assert calculatePosition ABSENT from react barrel

packages/core/src/__tests__/utils/
└── position.test.ts                                       # EXTEND or MOVE: if math moves to _position-fallback.ts, update import path; otherwise delete the parts that test now-removed public functions

# Workstream B — Announcements Priority Comparator
packages/announcements/src/core/
└── priority-queue.test.ts                                 # EXTEND: add createAnnouncementComparator tests — default weights, custom weights, FIFO tie-break, LIFO tie-break

packages/announcements/src/__tests__/hooks/
└── auto-show.test.tsx                                     # EXTEND: priority order uses configured weights (not hardcoded literal); FIFO/LIFO ordering parity with PriorityQueue

packages/announcements/src/__tests__/context/
└── announcements-provider-priority.test.tsx              # NEW: provider regression — no inline priorityOrder literal pattern in sort callback (grep-style)

packages/announcements/src/__tests__/core/
└── scheduler-queue-config.test.ts                         # NEW: queueConfig getter returns Readonly<QueueConfig>; provider uses public getter, not private field access

# Workstream C — Hidden-Step Type Tightening
packages/core/src/__tests__/types/
├── hidden-step.test-d.ts                                  # NEW: visible/hidden compile/reject matrix
└── tour-step-union.test-d.ts                              # NEW: TourStep = VisibleTourStep | HiddenTourStep; Extract<TourStep, { kind: 'hidden' }> ≅ HiddenTourStep

packages/core/src/__tests__/lib/
├── validate-tour.test.ts                                  # EXTEND: hidden step with forbidden runtime field throws TourValidationError (cast-free path)
└── no-as-unknown-cast.test.ts                             # NEW: source-grep test for the cast pattern

packages/core/src/__tests__/utils/
└── create-step.test.ts                                    # EXTEND: createStep returns VisibleTourStep type-narrowed; createHiddenStep (if exists) returns HiddenTourStep

packages/core/src/__tests__/                               # EXTEND: barrel test asserts VisibleTourStep, HiddenTourStep both exported from @tour-kit/core
└── barrel-exports.test.ts
```

Every workstream maps to at least 3 test files. The PR may ship as 3 independent commits; this file list mirrors that boundary.

---

## `conftest.ts` Equivalent — Vitest Setup Additions

**No changes** to the existing `packages/core/src/__tests__/setup.ts` or `packages/announcements/vitest.setup.ts` needed. Workstream B's provider tests use the helper `mountAnnouncements` (file path above). Workstream C's type tests are picked up automatically by:

```ts
// packages/core/vitest.config.ts (existing — already includes test-d.ts via the include glob if configured)
// include: ['src/**/*.{test,spec}.{ts,tsx}', 'src/**/*.test-d.ts', '__tests__/phase-0/**/*.test.ts'],
```

Verify the existing `include` pattern in `packages/core/vitest.config.ts:7` already covers `*.test-d.ts`. If not, **extend** it — do not replace.

---

## Key Testing Decisions

| Decision | Approach | Rationale |
|----------|----------|-----------|
| Test the absence of dead names, not the math | `expect(barrel).not.toHaveProperty('calculatePosition')` | The removal is the deliverable; re-testing the math under an internal name doesn't catch a re-leak from the barrel |
| Keep `ElementPositionResult` testing distinct | Add a positive assertion: `expect(barrel.ElementPositionResult).toBeDefined()` (or, for a type, an `expectTypeOf<ElementPositionResult>()` test) | Memory: per [`phase-3.md`'s callout](../phase-3.md#do-not-confuse-with-elementpositionresult), names are deliberately close; the test must explicitly say "this one stays" |
| Test the comparator pure first, provider second | Helper-level tests in `priority-queue.test.ts`; then provider integration | Pure comparator failure points at the helper; provider failure points at wiring; co-mingling them obscures which broke |
| Don't fake `AnnouncementScheduler` | Use real scheduler with real `QueueConfig` | The bug being fixed is the provider reaching into `schedulerRef.current.config`; a fake scheduler would hide that contract |
| Use `// @ts-expect-error` for invalid hidden-step authoring | Vitest type-tests run under `tsc`; `@ts-expect-error` fails if there's no error | This is the canonical pattern in TS — type tests must FAIL the build when the wrong shape compiles |
| Co-locate the grep gate for `as unknown as Record<string, unknown>` | Test reads source file; assertion is substring absence | PR-level greps drift between phases; co-locating the gate prevents Phase 4/5 from re-introducing the cast |
| Run sibling-repo grep BEFORE deletion, not in CI | Manual `rg ... /home/domidex/projects/tourkit-dash` documented in PR; do NOT add a CI step that reaches outside the repo | Memory #39: cross-repo links use pointer pages, not direct paths. CI cannot rely on a sibling checkout |
| One barrel test per package, not per name | `barrel-exports.test.ts` per package with a single `it` listing all expected absences | Less noise; easier to update when other refactors land |

---

## Example Test Case

```ts
// packages/announcements/src/__tests__/core/priority-queue.test.ts (EXTEND)

import { describe, expect, it } from 'vitest'
import {
  createAnnouncementComparator,
  type AnnouncementPriority,
  type PriorityOrder,
} from '../../core/priority-queue'
import type { AnnouncementConfig } from '../../types/announcement'

const ann = (id: string, priority: AnnouncementPriority): Pick<AnnouncementConfig, 'id' | 'priority'> => ({
  id,
  priority,
})

const sequenceById = (ids: string[]) => new Map(ids.map((id, i) => [id, i]))

describe('createAnnouncementComparator', () => {
  describe('default weights (critical < high < normal < low)', () => {
    const cmp = createAnnouncementComparator('fifo' as PriorityOrder, {
      critical: 0,
      high: 1,
      normal: 2,
      low: 3,
    })

    it('sorts critical before normal', () => {
      const list = [ann('a', 'normal'), ann('b', 'critical')]
      list.sort(cmp)
      expect(list.map((x) => x.id)).toEqual(['b', 'a'])
    })

    it('sorts high before low', () => {
      const list = [ann('a', 'low'), ann('b', 'high')]
      list.sort(cmp)
      expect(list.map((x) => x.id)).toEqual(['b', 'a'])
    })
  })

  describe('custom weights override defaults (regression: not hardcoded)', () => {
    // Inverted: low first, critical last
    const cmp = createAnnouncementComparator('fifo' as PriorityOrder, {
      critical: 3,
      high: 2,
      normal: 1,
      low: 0,
    })

    it('respects inverted weights', () => {
      const list = [ann('a', 'critical'), ann('b', 'low')]
      list.sort(cmp)
      expect(list.map((x) => x.id)).toEqual(['b', 'a'])
    })
  })

  describe('FIFO vs LIFO tie-break for equal priorities', () => {
    const weights = { critical: 0, high: 1, normal: 2, low: 3 }

    it('FIFO: earlier insertion sequence comes first on tie', () => {
      // Note: requires the comparator to accept a sequence map OR the helper signature
      // accepts (order, weights) and consumers pre-sort by sequenceById.
      // Match whichever shape Phase 3 ships — see phase-3.md Workstream B.
      const list = [
        { ...ann('a', 'normal'), _seq: 0 },
        { ...ann('b', 'normal'), _seq: 1 },
      ]
      // ... assertion matches phase-3.md final signature
    })
  })
})

// ─── Companion: Workstream A barrel test ─────────────────────────────────────
// packages/core/src/__tests__/barrel-exports.test.ts (EXTEND)

import * as core from '@tour-kit/core'
import * as coreUtils from '@tour-kit/core/utils'

describe('barrel — Phase 3 dead position exports', () => {
  it.each([
    'calculatePosition',
    'calculatePositionWithCollision',
    'wouldOverflow',
    'getFallbackPlacements',
    'PositionResult',
  ])('does not export %s from @tour-kit/core', (name) => {
    expect(core).not.toHaveProperty(name)
  })

  it.each([
    'calculatePosition',
    'calculatePositionWithCollision',
    'wouldOverflow',
    'getFallbackPlacements',
    'PositionResult',
  ])('does not export %s from @tour-kit/core/utils', (name) => {
    expect(coreUtils).not.toHaveProperty(name)
  })

  it('STILL exports ElementPositionResult (deliberately similar name, not removed)', () => {
    // ElementPositionResult is a type — assert via expectTypeOf in the type-test file.
    // Here we assert the value-level barrel does NOT remove the useElementPosition hook,
    // which is the consumer that produces ElementPositionResult.
    expect(core).toHaveProperty('useElementPosition')
  })
})

// ─── Companion: Workstream C type test ───────────────────────────────────────
// packages/core/src/__tests__/types/hidden-step.test-d.ts

import { expectTypeOf } from 'vitest'
import type {
  HiddenTourStep,
  TourStep,
  VisibleTourStep,
} from '../../types/step'

// Visible accepts target/content
const v: VisibleTourStep = { id: 'v1', target: '#x', content: 'hi' }
expectTypeOf(v).toMatchTypeOf<VisibleTourStep>()

// Hidden refuses target
// @ts-expect-error — hidden step cannot have target
const _bad: HiddenTourStep = { id: 'h1', kind: 'hidden', target: '#x' }

// Hidden refuses content
// @ts-expect-error — hidden step cannot have content
const _bad2: HiddenTourStep = { id: 'h2', kind: 'hidden', content: 'x' }

// Union accepts both
const _mix: TourStep[] = [v, { id: 'h3', kind: 'hidden' }]
```

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session:

---
You are writing the complete test suite for Phase 3 of the **Tour Kit Refactor Train** — Dead API, Hidden-Step Types, Priority Comparator.

### What This Project Is
Tour Kit is a TypeScript React monorepo. Phase 3 lands three independent MED cleanups in one PR:
- **A**: Remove dead `calculatePosition*` family from public barrels. `ElementPositionResult` stays — it's a deliberately similar but unrelated symbol.
- **B**: Replace inline `priorityOrder: Record<string, number>` literal in `<AnnouncementsProvider>` with `createAnnouncementComparator()` from `core/priority-queue.ts`. Add `AnnouncementScheduler.queueConfig` getter to avoid private-field access.
- **C**: Replace single `TourStep` interface with `VisibleTourStep | HiddenTourStep`. Hidden steps use `?: never` on forbidden fields. Remove `as unknown as Record<string, unknown>` from `validate-tour.ts`.

### Acceptance Criteria (from User Stories)

| # | User Story | Validation Check | Pass Condition |
|---|-----------|-----------------|----------------|
| US-1 | Dead position exports removed | barrel-exports.test.ts | `calculatePosition*` absent; `ElementPositionResult` present |
| US-2 | Priority weights actually drive ordering | priority-queue.test.ts + auto-show.test.tsx | Custom weights re-order; FIFO/LIFO tie-break matches PriorityQueue |
| US-3 | TypeScript rejects invalid hidden steps | hidden-step.test-d.ts | `@ts-expect-error` lines fire; visible compiles |
| US-4 | No `as unknown as` cast in validateTour | validate-tour.test.ts + no-as-unknown-cast.test.ts | Runtime: throws on forbidden field; source: grep clean |
| US-5 | Hidden/visible types exported | barrel-exports.test.ts + tour-step-union.test-d.ts | Both names resolvable; Extract narrows correctly |

### Why Fakes Are Required
None — Phase 3 is API-surface + type-level + a small pure helper. Mocks limited to:
- Workstream B: real `<AnnouncementsProvider>` mounted with a real `<SegmentationProvider>` wrapper
- Workstream C: `expectTypeOf` from vitest; `// @ts-expect-error` directives for invalid authoring

### What NOT to Test
- Don't re-test the placement math itself (it moves internal or stays internal). Workstream A is about the **public surface**, not the algorithm.
- Don't grep the broader name `PositionResult` against `ElementPositionResult` — they're deliberately similar but distinct.
- Don't write integration tests for the whole announcements scheduler — `priority-queue.test.ts` covers the comparator pure; `auto-show.test.tsx` covers the wiring. The full scheduler suite already exists.
- Don't widen the `HiddenTourStep` union with `?: never` for fields that aren't actually forbidden by `validateTour.ts`. Match the runtime validator exactly.
- Don't add tests for runtime hidden-step factories until Workstream C lands the type split. Type tests come first.

### Critical: Helper Files

```ts
// packages/announcements/src/__tests__/_helpers/mount-provider.tsx
import { SegmentationProvider } from '@tour-kit/core'
import { render, type RenderResult } from '@testing-library/react'
import * as React from 'react'
import { AnnouncementsProvider, type AnnouncementsProviderProps } from '../../context/announcements-provider'

export function mountAnnouncements(
  announcements: AnnouncementsProviderProps['announcements'],
  queueConfig: AnnouncementsProviderProps['queueConfig'] = {},
  segments: Record<string, boolean> = {}
) {
  return render(
    <SegmentationProvider segments={segments}>
      <AnnouncementsProvider announcements={announcements} queueConfig={queueConfig}>
        <div data-testid="root" />
      </AnnouncementsProvider>
    </SegmentationProvider>
  )
}
```

```ts
// packages/core/src/__tests__/lib/no-as-unknown-cast.test.ts
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('validate-tour.ts source — Phase 3 grep gate', () => {
  it('does not contain "as unknown as Record<string, unknown>"', () => {
    const src = readFileSync(
      resolve(__dirname, '../../lib/validate-tour.ts'),
      'utf-8'
    )
    expect(src).not.toMatch(/as unknown as Record<string, unknown>/)
  })
})
```

### Test Files to Create

```
# Workstream A
packages/core/src/__tests__/barrel-exports.test.ts                                  # EXTEND
packages/core/src/__tests__/utils/barrel-utils.test.ts                              # NEW
packages/react/src/__tests__/barrel-exports.test.ts                                 # NEW/EXTEND
packages/core/src/__tests__/utils/position.test.ts                                  # EXTEND (or trim)

# Workstream B
packages/announcements/src/core/priority-queue.test.ts                              # EXTEND
packages/announcements/src/__tests__/hooks/auto-show.test.tsx                       # EXTEND
packages/announcements/src/__tests__/context/announcements-provider-priority.test.tsx # NEW
packages/announcements/src/__tests__/core/scheduler-queue-config.test.ts            # NEW

# Workstream C
packages/core/src/__tests__/types/hidden-step.test-d.ts                             # NEW
packages/core/src/__tests__/types/tour-step-union.test-d.ts                         # NEW
packages/core/src/__tests__/lib/validate-tour.test.ts                               # EXTEND
packages/core/src/__tests__/lib/no-as-unknown-cast.test.ts                          # NEW
packages/core/src/__tests__/utils/create-step.test.ts                               # EXTEND
```

### Per-File Coverage Guidance

#### `packages/core/src/__tests__/barrel-exports.test.ts` (EXTEND)
- `it.each` over the 5 dead names: assert each is **not** a property of the core barrel
- `it` asserts `useElementPosition` IS still exported (proves the `ElementPositionResult` companion API survived)
- `it` asserts new types `VisibleTourStep` and `HiddenTourStep` are exported (consume them via a runtime instantiation in the test)

#### `packages/announcements/src/core/priority-queue.test.ts` (EXTEND)
- `describe('createAnnouncementComparator')` with three sub-describes: default weights, custom weights inverted, FIFO/LIFO tie-break
- Use the `sequenceById` map pattern documented in [`phase-3.md`'s Workstream B](../phase-3.md#preferred-fix)
- Match the final helper signature shipped in Phase 3 — it may accept `(order, weights, sequenceMap)` or `(order, weights)` with caller pre-sort. Test matches whichever ships.

#### `packages/announcements/src/__tests__/hooks/auto-show.test.tsx` (EXTEND)
- Render `<AnnouncementsProvider>` with `queueConfig.priorityWeights` set to `{ critical: 3, high: 2, normal: 1, low: 0 }` (inverted)
- Trigger auto-show for three announcements at different priorities
- Assert order matches the **provided** weights, not the previously-hardcoded literal

#### `packages/announcements/src/__tests__/context/announcements-provider-priority.test.tsx` (NEW)
- Read `packages/announcements/src/context/announcements-provider.tsx` as source
- Assert no `priorityOrder: Record<string, number>` substring remains (grep gate)
- Assert `createAnnouncementComparator` (or whichever helper is shipped) IS imported

#### `packages/announcements/src/__tests__/core/scheduler-queue-config.test.ts` (NEW)
- Construct an `AnnouncementScheduler` with a custom `QueueConfig`
- `expect(scheduler.queueConfig.priorityWeights).toEqual(passedWeights)`
- Assert returned value is `Readonly` by attempting mutation (vitest will catch the TS error via `@ts-expect-error`)

#### `packages/core/src/__tests__/types/hidden-step.test-d.ts` (NEW)
Use `expectTypeOf` + `// @ts-expect-error`:
- Visible step with `target` and `content` assigns to `VisibleTourStep` ✓
- Hidden step without UI fields assigns to `HiddenTourStep` ✓
- Hidden step with `target` triggers `@ts-expect-error` ✓
- Hidden step with `content` triggers `@ts-expect-error` ✓
- Hidden step with `placement` triggers `@ts-expect-error` ✓
- Hidden step with `advanceOn` triggers `@ts-expect-error` ✓
- Mixed `TourStep[]` accepts both ✓

#### `packages/core/src/__tests__/types/tour-step-union.test-d.ts` (NEW)
- `expectTypeOf<TourStep>().toEqualTypeOf<VisibleTourStep | HiddenTourStep>()`
- `expectTypeOf<Extract<TourStep, { kind: 'hidden' }>>().toEqualTypeOf<HiddenTourStep>()`

#### `packages/core/src/__tests__/lib/validate-tour.test.ts` (EXTEND)
- Hidden step authored via `as any` with `target` field → throws `TourValidationError`
- Hidden step authored via `as any` with `content` field → throws `TourValidationError`
- Visible step without `target` → throws `TourValidationError`
- Visible step without `content` → throws `TourValidationError`
- Well-formed mixed tour → no throw

#### `packages/core/src/__tests__/lib/no-as-unknown-cast.test.ts` (NEW)
See helper file above.

#### `packages/core/src/__tests__/utils/create-step.test.ts` (EXTEND)
- `createStep({...})` return type narrows to `VisibleTourStep` (assert via `expectTypeOf`)
- If a `createHiddenStep` helper is added, returns `HiddenTourStep`

### Data Model Notes
- `expectTypeOf` is exported from `vitest` directly (no extra import)
- `@ts-expect-error` MUST be on the line immediately before the erroring statement; vitest type-tests fail if the error is missing
- Sibling-repo check: run `rg "calculatePosition|wouldOverflow|getFallbackPlacements" /home/domidex/projects/tourkit-dash` manually before merging — do not add this to CI

### Success Criteria
- `pnpm --filter @tour-kit/core test` exits 0
- `pnpm --filter @tour-kit/core typecheck:types` exits 0 (covers `.test-d.ts` files)
- `pnpm --filter @tour-kit/announcements test` exits 0
- `pnpm --filter @tour-kit/react test` exits 0
- `pnpm typecheck` exits 0 across workspace
- `rg -n "calculatePosition|calculatePositionWithCollision|wouldOverflow|getFallbackPlacements|PositionResult" packages/core/src/index.ts packages/core/src/utils/index.ts packages/react/src/index.ts` returns 0 lines
- `rg -n "priorityOrder: Record" packages/announcements/src/context/announcements-provider.tsx` returns 0 lines
- `rg -n "as unknown as Record<string, unknown>" packages/core/src/lib/validate-tour.ts` returns 0 lines

### Expected File Structure at End
See "Test Files to Create" — every path above contains at least one `describe` and one `it`.
---

---

## Run Commands

```bash
# Per-workstream focus
pnpm --filter @tour-kit/core test -- barrel-exports
pnpm --filter @tour-kit/core test -- validate-tour
pnpm --filter @tour-kit/announcements test -- priority-queue
pnpm --filter @tour-kit/announcements test -- auto-show

# Type tests (Workstream C)
pnpm --filter @tour-kit/core typecheck:types

# Full per-package
pnpm --filter @tour-kit/core test
pnpm --filter @tour-kit/announcements test
pnpm --filter @tour-kit/react test

# Workspace pre-merge gates
pnpm typecheck
pnpm test
pnpm build

# Phase-3 grep gates (mirrors phase-3.md Validation Gates)
rg -n "calculatePosition|calculatePositionWithCollision|wouldOverflow|getFallbackPlacements|PositionResult" \
  packages/core/src/index.ts packages/core/src/utils/index.ts packages/react/src/index.ts
rg -n "priorityOrder: Record" packages/announcements/src/context/announcements-provider.tsx
rg -n "as unknown as Record<string, unknown>" packages/core/src/lib/validate-tour.ts

# Sibling-repo audit (manual, pre-merge)
rg -n "calculatePosition|wouldOverflow|getFallbackPlacements" /home/domidex/projects/tourkit-dash
```
