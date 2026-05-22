# Phase 1 — Testing: Helper Hoisting To Core

**Scope:** `packages/core/src/lib/audience.ts`, `packages/core/src/lib/i18n/use-resolved-text.ts`, `packages/core/src/utils/storage.ts` (`createMemoryStorage`), and the six call-site re-exports in `react`, `hints`, `announcements`, `checklists`, `surveys`.
**Key Pattern:** Pure-logic phase. No heavy fakes — the hoist must preserve runtime behavior, so tests pin the **invariants that survive the move** (segment vs array branch in announcements, dev-only warn-once, dot-path resolution in resolved text, isolated memory storages). Mock surface is limited to `logger`, `console.warn`, and React context providers.
**Dependencies:** vitest, @testing-library/react, jsdom, existing setup at `packages/core/src/__tests__/setup.ts`.

---

## User Stories

| # | User Story | Validation Check | Pass Condition |
|---|-----------|-----------------|----------------|
| US-1 | As a tour author, I want segment-shaped audiences in react/hints to filter steps identically after the helper hoist, so existing tours don't silently change behavior | `audience.test.ts` — `evaluateAudience` segment branch + `use-step-filter.test.tsx` parity | Both hooks call `core.evaluateAudience` with caller label, segment hit ⇒ visible, segment miss ⇒ hidden |
| US-2 | As an announcements user, I want array-shape audiences to keep passing through `useFilteredAnnouncements` to the scheduler, so my existing `userContext`-based targeting still works | `use-filtered-announcements.test.tsx` — array-shape pass-through test | `evaluateAnnouncementAudience([...], {})` returns `true` even with `userContext` undefined |
| US-3 | As a developer in dev mode, I want unknown segments to log a warning that names the calling hook, exactly once per segment name | `audience.test.ts` — warn-once + caller-label tests | `logger.warn` (or `console.warn`) spy called once with substring `"useStepFilter"`/`"useHintFilter"`/`"useFilteredAnnouncements"` per unique segment name |
| US-4 | As a checklist consumer with no `localStorage`, I want my checklist state stored in memory with a working `length`/`key(index)` API, so SSR/private-mode renders don't crash | `storage.test.ts` — `createMemoryStorage` Storage-shape suite | `length` updates after `setItem`/`removeItem`; `key(0)` returns the inserted key; two instances have isolated state |
| US-5 | As a downstream consumer of `@tour-kit/announcements`, I want `evaluateAnnouncementAudience` to remain exported with the same signature for one release | `barrel-exports.test.ts` (extend) + `use-filtered-announcements.test.tsx` | Symbol resolvable from `@tour-kit/announcements`; signature is `(audience, segments) => boolean` |

---

## Component Mock Strategy

| Component | Mock Strategy | What to Assert | User Story |
|-----------|--------------|----------------|------------|
| `core.evaluateAudience` (new) | None — pure function | `undefined` ⇒ `true`; segment hit ⇒ `true`; segment miss ⇒ `false`; array delegates to `matchesAudience` with `userContext` | US-1, US-3 |
| `core.warnedUnknownSegments` (module-scope set) | Reset between tests by importing a `vi.resetModules()` helper or using unique segment names per test | After 3 calls with same unknown segment, spy called once; different segment ⇒ spy called again | US-3 |
| `logger.warn` / `console.warn` | `vi.spyOn(logger, 'warn')` if migrated this phase, otherwise `vi.spyOn(console, 'warn').mockImplementation(() => {})` | Caller label string substring present; called exactly once per unknown segment | US-3 |
| `useStepFilter` / `useHintFilter` | Render with `<SegmentationProvider>` wrapper; pass `userContext` directly | Filtered step list matches expected `id` order for segment + array shapes | US-1 |
| `useFilteredAnnouncements` (announcements) | Render-hook with `<SegmentationProvider segments={{...}}>` wrapper | Array-shape audience announcements pass through unchanged; segment-shape filter applied | US-2, US-5 |
| `useResolvedText` (core) | Wrap with `<TranslationProvider>` + `<SegmentationContext.Provider>`; pass component children | String interpolation, `{ key }` translation, ReactNode pass-through, explicit `vars` override segmentation | US-1 (i18n parity) |
| `useResolvedText` (re-exports in react/hints/announcements) | None — assert `===` reference equality with `import { useResolvedText } from '@tour-kit/core'` | Same function identity across all four import paths | US-5 |
| `createMemoryStorage` | None — Storage shape is internal | Implements full DOM `Storage` shape including `length` getter and `key(index)` | US-4 |
| `useRoutePersistence` / `useChecklistPersistence` | Stub `window.localStorage` with `Object.defineProperty` to `undefined` and assert memory fallback used | Set value survives a re-render; cleared on `clear()`; `_data` cast pattern gone (grep gate) | US-4 |
| `surveys/audience` re-export | None — type-only re-export | `AudienceCondition` from `@tour-kit/surveys` is reference-equal to the type from `@tour-kit/core` (compile-time tsd test) | US-1 |

---

## Test Tier Table

| Tier | Dependencies | Speed | When to Run |
|------|-------------|-------|-------------|
| Unit | jsdom + RTL only; no real `localStorage` writes outside scoped tests | <5s per package | Every push |
| Integration (in-repo) | All affected packages built, runs barrel-resolution test | <15s total | Pre-merge (`pnpm test` workspace-wide) |
| Type (`*.test-d.ts`) | tsc via vitest's tsd integration or `pnpm typecheck:types` | <5s | Pre-merge |

No E2E tier — Phase 1 is a code-motion phase. The dashboard smoke is covered by Phase 5's manual flow.

---

## Fake / Mock Implementations

This is a **pure-logic / refactor phase**. No heavy dependency is faked. Two recurring helpers are needed:

### `createSegmentationWrapper(segments)` — test helper, not a fake

```ts
// packages/core/src/__tests__/_helpers/segmentation-wrapper.tsx
import * as React from 'react'
import { SegmentationProvider } from '../../lib/segmentation/segmentation-context'

export function makeSegmentationWrapper(segments: Record<string, boolean>) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <SegmentationProvider segments={segments}>{children}</SegmentationProvider>
  }
}
```

### `resetWarnedSegments()` — test-only module reset

`warnedUnknownSegments` is module-scope in `core/lib/audience.ts`. Do **not** export a reset helper from the public barrel (per non-negotiable in [`phase-1.md`](../phase-1.md#non-negotiable-behavior)). Instead, isolate via either:

```ts
// Option A: unique segment names per test
const segName = `unknown-${expect.getState().currentTestName?.replace(/\W/g, '_')}`

// Option B: module reset before each test
beforeEach(async () => {
  vi.resetModules()
  ;({ evaluateAudience } = await import('../../lib/audience'))
})
```

Prefer Option A — it's faster and doesn't break the `logger.warn` spy.

---

## Test File List

```
packages/core/src/lib/
├── audience.test.ts                                # EXTEND: add evaluateAudience, isSegmentAudience, warnedUnknownSegments warn-once
└── i18n/
    └── use-resolved-text.test.tsx                  # NEW: ReactNode pass-through, string interpolate, { key } translation, vars override segmentation

packages/core/src/__tests__/utils/
└── storage.test.ts                                 # EXTEND: createMemoryStorage Storage-shape suite (length getter, key(index), isolation, clear)

packages/core/src/__tests__/hooks/
└── use-route-persistence.test.ts                   # EXTEND (if exists) or NEW: assert memory fallback uses createMemoryStorage when localStorage undefined

packages/core/src/__tests__/
└── barrel-exports.test.ts                          # EXTEND: assert evaluateAudience, useResolvedText, createMemoryStorage exported from index

packages/react/src/__tests__/hooks/
├── use-step-filter.test.tsx                        # NEW or EXTEND: segment hit/miss + array delegates to matchesAudience; warns name "useStepFilter"
└── use-resolved-text.test.tsx                      # NEW: re-export identity ===  core useResolvedText

packages/hints/src/__tests__/hooks/
├── use-hint-filter.test.tsx                        # NEW or EXTEND: same shape as use-step-filter; warns name "useHintFilter"
└── use-resolved-text.test.tsx                      # NEW: re-export identity

packages/announcements/src/__tests__/hooks/
├── use-filtered-announcements.test.tsx             # NEW or EXTEND: array-shape PASS-THROUGH (critical regression test); segment-shape filter; warns name "useFilteredAnnouncements"
└── use-resolved-text.test.tsx                      # NEW: re-export identity

packages/checklists/src/__tests__/
└── use-checklist-persistence.test.tsx              # NEW or EXTEND: memory fallback round-trip; assert no `_data` cast pattern (grep gate in PR)

packages/surveys/src/__tests__/core/
└── audience.test.ts                                # EXTEND: assert matchesAudience identity === core.matchesAudience after re-export

packages/surveys/src/__tests__/types/
└── audience-alias.test-d.ts                        # NEW: AudienceCondition from surveys is type-equal to core's
```

Every deliverable in `big-plan.md`'s Phase 1 source-changes tree has a row above.

---

## `conftest.ts` Equivalent — Vitest Setup Additions

**Additions to existing setup at** `packages/core/src/__tests__/setup.ts`, `packages/react/vitest.setup.ts`, `packages/hints/vitest.setup.ts`, `packages/announcements/vitest.setup.ts`, `packages/checklists/vitest.setup.ts`. Do not replace existing content.

Add a workspace-level helper for segment-warn isolation:

```ts
// packages/core/src/__tests__/_helpers/unique-segment.ts
let counter = 0
export function uniqueSegment(prefix: string): string {
  counter += 1
  return `${prefix}-${counter}-${Math.random().toString(36).slice(2, 8)}`
}
```

Per-test setup in every audience-related file:

```ts
import { afterEach, beforeEach, vi } from 'vitest'
import { logger } from '@tour-kit/core' // if migrated to logger in Phase 1
// or: const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

let warnSpy: ReturnType<typeof vi.spyOn>
beforeEach(() => {
  // After Phase 2 this becomes `logger.warn`. Phase 1 may go either way per implementation note.
  warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})
})
afterEach(() => {
  warnSpy.mockRestore()
})
```

No new vitest CLI flags needed — Phase 1 has no integration tier.

---

## Key Testing Decisions

| Decision | Approach | Rationale |
|----------|----------|-----------|
| Don't export `__resetWarnedSegments` from public barrel | Use unique segment names per test (Option A) | Phase 1 non-negotiable forbids public reset helper; unique names also catch accidental cross-test coupling |
| Test announcements array-shape pass-through explicitly | Render `useFilteredAnnouncements` with array-shape audience and **no** `userContext` available; assert result includes that announcement | Memory #204 / Open Question 1: the hoisted version returns `true` unconditionally for arrays; a regression test pins it so a future inline-evaluate "fix" fails loudly |
| Assert re-export identity, not behavior re-test | `expect(packageReExport).toBe(coreImpl)` | Re-test of full behavior would balloon test count; identity check proves the re-export file actually re-exports from core |
| Mock `logger.warn`, not `console.warn`, IF Phase 1 migrates the warning | `vi.spyOn(logger, 'warn')` | Phase 1 may pre-empt Phase 2's migration here; if it does, test against logger; otherwise keep `console.warn` spy and update in Phase 2 |
| Use type-tests (`.test-d.ts`) for `AudienceCondition` alias | tsd or `expectTypeOf` from vitest | Re-export of a type produces no runtime artifact; compile-time check is the only way to assert equivalence |
| Stub `localStorage` to `undefined` via `Object.defineProperty(window, 'localStorage', ...)` | `vi.stubGlobal` doesn't restore cleanly between tests; defineProperty + restore in afterEach is more deterministic | Memory fallback path runs only when `localStorage` lookup throws or is undefined; faithfully reproducing that branch is what the test must cover |
| Add a grep-style assertion for `_data` cast pattern | A test that reads the source file and asserts `as unknown as { _data` does not appear | The cast is the symptom; PR-level grep can drift between phases, so a co-located test prevents regression |

---

## Example Test Case

```ts
// packages/announcements/src/__tests__/hooks/use-filtered-announcements.test.tsx

import { logger, SegmentationProvider } from '@tour-kit/core'
import { renderHook } from '@testing-library/react'
import * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  evaluateAnnouncementAudience,
  useFilteredAnnouncements,
} from '../../hooks/use-filtered-announcements'
import type { AnnouncementConfig, AudienceCondition } from '../../types/announcement'
import { uniqueSegment } from '@tour-kit/core/__tests__/_helpers/unique-segment'

function makeAnnouncement(overrides: Partial<AnnouncementConfig>): AnnouncementConfig {
  return {
    id: 'ann-1',
    variant: 'banner',
    content: 'hello',
    ...overrides,
  } as AnnouncementConfig
}

function wrapper(segments: Record<string, boolean>) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <SegmentationProvider segments={segments}>{children}</SegmentationProvider>
  }
}

describe('evaluateAnnouncementAudience', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>
  beforeEach(() => {
    warnSpy = vi.spyOn(logger, 'warn').mockImplementation(() => {})
  })
  afterEach(() => {
    warnSpy.mockRestore()
  })

  describe('short-circuits (the regression-critical surface)', () => {
    it('returns true for undefined audience', () => {
      expect(evaluateAnnouncementAudience(undefined, {})).toBe(true)
    })

    it('returns true for ARRAY-shape audience (pass-through to scheduler)', () => {
      // CRITICAL: this is the announcements-specific divergence from react/hints.
      // The hoisted core helper evaluates arrays; the announcements wrapper must
      // short-circuit BEFORE delegating, because no userContext is available here.
      const arrAudience: AudienceCondition[] = [
        { type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' },
      ]
      expect(evaluateAnnouncementAudience(arrAudience, {})).toBe(true)
    })
  })

  describe('segment branch (delegates to core.evaluateAudience)', () => {
    it('passes when registered segment is true', () => {
      expect(evaluateAnnouncementAudience({ segment: 'beta' }, { beta: true })).toBe(true)
    })

    it('filters out when segment is false', () => {
      expect(evaluateAnnouncementAudience({ segment: 'beta' }, { beta: false })).toBe(false)
    })

    it('warns ONCE per unknown segment naming useFilteredAnnouncements', () => {
      const seg = uniqueSegment('unk')
      evaluateAnnouncementAudience({ segment: seg }, {})
      evaluateAnnouncementAudience({ segment: seg }, {})
      evaluateAnnouncementAudience({ segment: seg }, {})
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy.mock.calls[0]?.[0]).toMatch(/useFilteredAnnouncements/)
    })
  })
})

describe('useFilteredAnnouncements', () => {
  it('keeps array-shape announcements when no userContext is provided', () => {
    const arr = [makeAnnouncement({ id: 'a', audience: [{ type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' }] })]
    const { result } = renderHook(() => useFilteredAnnouncements(arr), {
      wrapper: wrapper({}),
    })
    expect(result.current.map((a) => a.id)).toEqual(['a'])
  })

  it('drops segment-shape announcements whose segment is false', () => {
    const arr = [
      makeAnnouncement({ id: 'beta-only', audience: { segment: 'beta' } }),
      makeAnnouncement({ id: 'everyone' }),
    ]
    const { result } = renderHook(() => useFilteredAnnouncements(arr), {
      wrapper: wrapper({ beta: false }),
    })
    expect(result.current.map((a) => a.id)).toEqual(['everyone'])
  })
})
```

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to write this test suite:

---
You are writing the complete test suite for Phase 1 of the **Tour Kit Refactor Train** — Helper Hoisting To Core.

### What This Project Is
Tour Kit is a TypeScript monorepo of headless React tour/onboarding packages (`@tour-kit/core`, `@tour-kit/react`, `@tour-kit/hints`, `@tour-kit/announcements`, `@tour-kit/checklists`, `@tour-kit/surveys`, etc.). Phase 1 of the refactor train moves four duplicated helpers up to `@tour-kit/core`: an audience evaluator, a memory storage factory, a `useResolvedText` hook, and a surveys audience type alias. The constraint: **runtime behavior must not change**, especially announcements' array-shape audience pass-through (which differs from react/hints).

### Acceptance Criteria (from User Stories)

| # | User Story | Validation Check | Pass Condition |
|---|-----------|-----------------|----------------|
| US-1 | Segment audience filtering in react/hints | `audience.test.ts` evaluateAudience + use-step-filter parity | hooks call core, segment hit/miss correctness |
| US-2 | Announcements array pass-through preserved | `use-filtered-announcements.test.tsx` array-shape test | `evaluateAnnouncementAudience([...], {})` returns `true` |
| US-3 | Warn-once + named caller | `audience.test.ts` warn tests | `logger.warn` (or `console.warn`) called once per unknown segment with caller string |
| US-4 | Memory storage Storage-shape API works | `storage.test.ts` createMemoryStorage suite | `length`, `key(index)`, isolation, `clear()` all correct |
| US-5 | Public surface preserved | `barrel-exports.test.ts` + identity tests | `evaluateAnnouncementAudience`, `useResolvedText` still exported from package barrels |

### Why Fakes Are Required
None — this is a pure-logic / refactor phase. The only mock surface is `logger.warn` / `console.warn` (spied with `vi.spyOn`) and React context providers (`SegmentationProvider`, `TranslationProvider`) rendered via RTL's `renderHook` `wrapper` option.

### What NOT to Test
- Don't re-test every operator in `matchesAudience` from each package — the core `audience.test.ts` already covers this comprehensively (179 lines). Test only that the **delegation** happens.
- Don't test `useResolvedText` behavior in three packages — assert re-export identity (`packageRef === coreRef`) and rely on the core test for behavior.
- Don't test localStorage real-write paths — Phase 1 changes only the memory fallback. The localStorage happy path is already covered by existing tests.
- Don't export `__resetWarnedSegments` from any public barrel; tests must isolate via unique segment names or `vi.resetModules()`.
- Don't migrate Phase 2's logger work into Phase 1 tests — if Phase 1 leaves a `console.warn`, test against `console.warn` and let Phase 2 update assertions.

### Critical: Helpers To Add To Test Setup

```ts
// packages/core/src/__tests__/_helpers/unique-segment.ts
let counter = 0
export function uniqueSegment(prefix: string): string {
  counter += 1
  return `${prefix}-${counter}-${Math.random().toString(36).slice(2, 8)}`
}

// packages/core/src/__tests__/_helpers/segmentation-wrapper.tsx
import * as React from 'react'
import { SegmentationProvider } from '../../lib/segmentation/segmentation-context'

export function makeSegmentationWrapper(segments: Record<string, boolean>) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <SegmentationProvider segments={segments}>{children}</SegmentationProvider>
  }
}
```

### Test Files To Create

```
packages/core/src/lib/audience.test.ts                                 # EXTEND
packages/core/src/lib/i18n/use-resolved-text.test.tsx                  # NEW
packages/core/src/__tests__/utils/storage.test.ts                      # EXTEND
packages/core/src/__tests__/hooks/use-route-persistence.test.ts        # EXTEND
packages/core/src/__tests__/barrel-exports.test.ts                     # EXTEND
packages/react/src/__tests__/hooks/use-step-filter.test.tsx            # NEW/EXTEND
packages/react/src/__tests__/hooks/use-resolved-text.test.tsx          # NEW
packages/hints/src/__tests__/hooks/use-hint-filter.test.tsx            # NEW/EXTEND
packages/hints/src/__tests__/hooks/use-resolved-text.test.tsx          # NEW
packages/announcements/src/__tests__/hooks/use-filtered-announcements.test.tsx  # NEW/EXTEND
packages/announcements/src/__tests__/hooks/use-resolved-text.test.tsx  # NEW
packages/checklists/src/__tests__/use-checklist-persistence.test.tsx   # NEW/EXTEND
packages/surveys/src/__tests__/core/audience.test.ts                   # EXTEND
packages/surveys/src/__tests__/types/audience-alias.test-d.ts          # NEW
```

### Per-File Coverage Guidance

#### `packages/core/src/lib/audience.test.ts` (EXTEND)
Add these describe blocks to the existing file:
- `describe('isSegmentAudience')` — narrowing returns `true` for `{ segment: 'x' }`, `false` for arrays and `undefined`
- `describe('evaluateAudience')` — covers four branches: undefined→true; segment-hit→true; segment-miss→false; array→delegates to `matchesAudience(audience, userContext)`
- `describe('evaluateAudience warn behavior')` — uses `uniqueSegment()`, asserts `logger.warn` called once per unknown segment with the `caller` string embedded; warns suppressed in `process.env.NODE_ENV === 'production'`

#### `packages/core/src/lib/i18n/use-resolved-text.test.tsx` (NEW)
Test the ReactNode-preserving hook with these tiers:
- string input → returns interpolated string
- `LocalizedText` object `{ key: 'greeting' }` → uses `useT` translation
- `React.ReactNode` (a `<span>` element) → returns the node unchanged (no toString())
- explicit `vars` override `useSegmentationContext()` user properties
- Wrap with `<TranslationProvider messages={{...}}>` and `<SegmentationProvider segments={{}} userContext={{ name: 'A' }}>`

#### `packages/core/src/__tests__/utils/storage.test.ts` (EXTEND)
Add `describe('createMemoryStorage')`:
- returns object with full DOM `Storage` shape (`getItem`, `setItem`, `removeItem`, `clear`, `length`, `key`)
- `setItem('a', '1'); expect(storage.length).toBe(1)`
- `key(0)` returns `'a'` after one insert
- `removeItem` decrements length and `key(0)` is now `null` (or the next key)
- two `createMemoryStorage()` instances have isolated state
- `clear()` empties length to 0 and `key(0)` is `null`

#### `packages/core/src/__tests__/hooks/use-route-persistence.test.ts` (EXTEND)
- stub `window.localStorage` to throw via `Object.defineProperty` and assert the hook still round-trips state via the memory fallback
- restore the property in `afterEach`

#### `packages/core/src/__tests__/barrel-exports.test.ts` (EXTEND)
- `expect(coreIndex.evaluateAudience).toBeTypeOf('function')`
- `expect(coreIndex.useResolvedText).toBeTypeOf('function')`
- `expect(coreIndex.createMemoryStorage).toBeTypeOf('function')`

#### `packages/react/src/__tests__/hooks/use-step-filter.test.tsx`, `packages/hints/.../use-hint-filter.test.tsx`
Both follow the same shape:
- render-hook with `<SegmentationProvider segments={{ beta: true }}>`; pass `userContext={{ plan: 'pro' }}`
- a step list with three audience shapes (segment hit, segment miss, array delegating to `matchesAudience`)
- assert filtered output matches expected `id` list
- assert `logger.warn`'s first call substring includes `useStepFilter` or `useHintFilter`

#### `packages/announcements/src/__tests__/hooks/use-filtered-announcements.test.tsx`
The single most important regression test in Phase 1. Add a `describe('regression: array pass-through (memory #204)')` block containing the example test case shown in the test plan.

#### `packages/checklists/src/__tests__/use-checklist-persistence.test.tsx`
- stub `window.localStorage` undefined, mount the hook, write state, unmount, remount, assert state survives via memory storage
- include a source-grep assertion that fails if `as unknown as { _data` appears in `packages/checklists/src/hooks/use-checklist-persistence.ts`

#### `packages/surveys/src/__tests__/types/audience-alias.test-d.ts`
```ts
import { expectTypeOf } from 'vitest'
import type { AudienceCondition as CoreCond } from '@tour-kit/core'
import type { AudienceCondition as SurveysCond } from '@tour-kit/surveys'

expectTypeOf<SurveysCond>().toEqualTypeOf<CoreCond>()
```

### Data Model Notes
- All `vi.spyOn` mocks must be restored in `afterEach` — see `packages/core/src/__tests__/setup.ts:5-12` for the workspace cleanup pattern.
- `process.env.NODE_ENV` is `'test'` under vitest; warn behavior must trigger because the source checks `!== 'production'`.
- Use `renderHook` from `@testing-library/react` (the v14+ shape, not the deprecated `@testing-library/react-hooks`).
- For the `logger.warn` spy, `import { logger } from '@tour-kit/core'` and `vi.spyOn(logger, 'warn')`. The module-scope `logger` singleton is the same across packages.

### Success Criteria
- `pnpm --filter @tour-kit/core test` exits 0
- `pnpm --filter @tour-kit/react test` exits 0
- `pnpm --filter @tour-kit/hints test` exits 0
- `pnpm --filter @tour-kit/announcements test` exits 0
- `pnpm --filter @tour-kit/checklists test` exits 0
- `pnpm --filter @tour-kit/surveys test` exits 0
- `rg -n "Keep in lockstep|per-package duplicate" packages --glob '*.{ts,tsx}'` returns nothing
- `rg -n "warnedUnknownSegments" packages --glob '*.{ts,tsx}'` returns exactly one match in `packages/core/src/lib/audience.ts`
- `rg -n "_data: Record<string|as unknown as \{ _data" packages/core packages/checklists` returns nothing

### Expected File Structure at End
See "Test Files To Create" — every path above must exist and contain at least one `it()`.
---

---

## Run Commands

```bash
# Fast unit tests, single package
pnpm --filter @tour-kit/core test
pnpm --filter @tour-kit/react test
pnpm --filter @tour-kit/hints test
pnpm --filter @tour-kit/announcements test
pnpm --filter @tour-kit/checklists test
pnpm --filter @tour-kit/surveys test

# Workspace-wide pre-merge
pnpm test
pnpm typecheck
pnpm build

# Single test file
pnpm --filter @tour-kit/announcements test -- use-filtered-announcements

# Focus on the array pass-through regression
pnpm --filter @tour-kit/announcements test -- -t "array pass-through"

# Type tests only
pnpm --filter @tour-kit/core typecheck
```
