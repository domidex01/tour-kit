# Phase 1 — Hoist HIGH dedup candidates to core

**Duration:** Days 1–4 (~7.5 hours)
**Depends on:** none (entry phase)
**Blocks:** none (informationally helpful for Phase 2's `console.warn` migration since the three `evaluateAudience` copies all carry a `console.warn` that will be migrated in Phase 2 — doing this first collapses 3 sites into 1)
**Risk Level:** MEDIUM — touches 6 packages, but every absorbed helper is a pure function or closure with no React-rendered side effects. Rollback is `git revert`.
**Stack:** typescript, react

---

## Objective

Resolve the 4 HIGH-priority entries from [`docs/refactor-candidates.md`](../../docs/refactor-candidates.md) in a single PR by lifting the duplicated helpers up to `@tour-kit/core` and replacing each package's copy with a re-export or a thin import:

1. **`matchesCondition` + `getNestedValue`** are duplicated byte-for-byte between `packages/surveys/src/core/audience.ts:17-67` and `packages/core/src/lib/audience.ts:111-186`. `core/lib/audience.ts:1-3` already announces "promoted from announcements" — surveys never followed. **Action:** delete `surveys/src/core/audience.ts`'s local switch, re-export from core, and alias `AudienceCondition` from core.
2. **`evaluateAudience`** is triple-cloned across `packages/react/src/hooks/use-step-filter.tsx:33-54` (`evaluateAudience`), `packages/hints/src/hooks/use-hint-filter.tsx:26-46` (`evaluateHintAudience`), and `packages/announcements/src/hooks/use-filtered-announcements.tsx:33-54` (`evaluateAnnouncementAudience`). Each file's header comment admits the duplication and asks "keep all three in lockstep" — a known-bad maintenance contract. **Action:** promote a single `evaluateAudience(audience, segments, userContext, caller)` to `packages/core/src/lib/audience.ts` and have the three packages delegate, including consolidating their three module-scope `warnedUnknownSegments` dedup sets into one.
3. **`memoryStorage` SSR shim** is duplicated between `packages/core/src/hooks/use-route-persistence.ts:34-59` (clean closure form) and `packages/checklists/src/hooks/use-checklist-persistence.ts:15-36` (cast-laden form with six `(this as unknown as { _data: Record<string, string> })` re-casts). **Action:** export `createMemoryStorage()` from `packages/core/src/utils/storage.ts`, import in both call sites, delete the cast-laden duplicate.
4. **`useResolvedText`** is triple-cloned across `packages/react/src/hooks/use-resolved-text.tsx:27-39`, `packages/hints/src/hooks/use-resolved-text.tsx:18-30`, `packages/announcements/src/lib/use-resolved-text.tsx:27-39`. Every dep this hook touches (`interpolate`, `isI18nKey`, `useT`, `useSegmentationContext`) is already in `@tour-kit/core` — the "deferred to next phase" rationale in the JSDoc is no longer load-bearing. **Action:** promote to `packages/core/src/lib/i18n/use-resolved-text.tsx`, re-export from the package barrels.

After this phase, `grep -rn "Keep in lockstep\|per-package duplicate so" packages/*/src --include="*.tsx" --include="*.ts"` returns **0 lines**.

---

## What Success Looks Like

1. **`evaluateAudience` is a single function in core.** `packages/core/src/lib/audience.ts` exports `evaluateAudience(audience, segments, userContext, caller)`. The three previous copies in react/hints/announcements are deleted; the three call sites use `evaluateAudience(audience, segments, userContext, 'useStepFilter')` / `'useHintFilter'` / `'useFilteredAnnouncements'`. Verified by `grep -rn "function evaluateAudience\|function evaluateHintAudience\|function evaluateAnnouncementAudience" packages/*/src` returning exactly one match (in `packages/core/src/lib/audience.ts`).
2. **One module-scope `warnedUnknownSegments` Set exists.** Lives in `packages/core/src/lib/audience.ts`. Verified by `grep -rn "warnedUnknownSegments" packages/*/src` returning a single line.
3. **`useResolvedText` is a single hook in core.** `packages/core/src/lib/i18n/use-resolved-text.tsx` exports the hook; react/hints/announcements export it via `export { useResolvedText } from '@tour-kit/core'`. Verified by `grep -rn "export function useResolvedText" packages/*/src` returning exactly one match.
4. **`createMemoryStorage()` factory exists in core.** `packages/core/src/utils/storage.ts` adds the factory next to `createPrefixedStorage`. `use-route-persistence.ts` and `use-checklist-persistence.ts` both consume it. No `as unknown as { _data: Record<string, string> }` casts remain in either file. Verified by `grep -rn "_data: Record<string" packages/*/src` returning 0 lines.
5. **`AudienceCondition` has one source of truth.** `packages/surveys/src/types/survey.ts:90-99` re-exports the type from `@tour-kit/core` instead of redeclaring it. Verified by `grep -rn "^export.*AudienceCondition.*=\|^export type AudienceCondition" packages/*/src` returning exactly one declaration in core.
6. **No `Keep in lockstep` / `per-package duplicate` warnings remain.** Per the M1 milestone gate.
7. **All existing per-package tests pass without modification.** `pnpm --filter @tour-kit/core test && pnpm --filter @tour-kit/announcements test && pnpm --filter @tour-kit/hints test && pnpm --filter @tour-kit/react test && pnpm --filter @tour-kit/checklists test && pnpm --filter @tour-kit/surveys test` all exit 0.
8. **One new core test pinned per hoisted helper.** Four new tests in `packages/core/src/lib/__tests__/audience.test.ts` (`evaluateAudience` segment vs array dispatch), `packages/core/src/lib/i18n/__tests__/use-resolved-text.test.tsx` (string/i18n-key/ReactNode branches), `packages/core/src/utils/__tests__/storage.test.ts` (`createMemoryStorage` SSR-safety + isolation between instances), and an integration test in `packages/surveys/src/core/__tests__/audience.test.ts` confirming surveys' `matchesAudience` still passes its existing operator suite.
9. **`pnpm typecheck` clean.** Note: dashboard-next baseline failure (memory `#203`) stays as-is — that's pre-existing, not caused by this phase.
10. **Workspace build clean.** `pnpm build` produces all packages without error; `pnpm size-limit` does not exceed budget (this phase is net-neutral to slightly-negative on bundle size since duplicated code becomes shared).

---

## What Failure Looks Like (and what to do)

- **A circular dep emerges (e.g. `@tour-kit/surveys` imports from core which imports from surveys).** The four absorbed helpers are pure — none of them require any per-package type beyond `AudienceCondition` (already in core). If `pnpm typecheck` reports a cycle, the most likely cause is an over-eager type alias change in `surveys/src/types/survey.ts` — revert the alias change and keep surveys' local type re-exported from a new `packages/core/src/types/audience.ts` declaration only (no value re-exports from surveys back into core).
- **`useResolvedText` breaks under React 19 because the hoisted version doesn't carry `'use client'`.** The three deleted copies all carry `'use client'`; the new core version must too. The core barrel (`packages/core/src/index.ts`) is server-safe, but the file housing `useResolvedText` is not (it calls `useT` / `useSegmentationContext`). **Fix:** add `'use client'` to `packages/core/src/lib/i18n/use-resolved-text.tsx` and verify with a server-component import in `apps/docs/` or `examples/dashboard-next/`.
- **The `warnedUnknownSegments` set leaks across Vitest runs.** Module-scope state in a hoisted helper persists across the four packages' tests, which run in different vitest processes per-package via Turbo. Likelihood: low because tests run in isolated workers, but if a flaky test surfaces, export a `__resetWarnedSegments()` test-only helper from core and call it in each package's `vitest.setup.ts`.
- **A consumer outside this repo imports `evaluateHintAudience` / `evaluateAnnouncementAudience` directly.** These were exported from the package barrels per `packages/hints/src/index.ts` / `packages/announcements/src/index.ts` (verify before deletion — see §1 step 1 below). **Fix:** preserve the symbol as a `@deprecated` re-export from core under the old name (e.g. `export { evaluateAudience as evaluateHintAudience } from '@tour-kit/core'`) until the next major.
- **`createMemoryStorage()` returns a `Storage` whose `length` getter is broken under iteration.** The original closure version in `use-route-persistence.ts` uses `get length() { return Object.keys(data).length }`. Make sure the factory uses the same getter pattern (not a stale snapshot value). Test it with `const s = createMemoryStorage(); s.setItem('a','1'); s.setItem('b','2'); expect(s.length).toBe(2)`.
- **Existing tests fail because a test assertion checked the exact warning string format.** The hoisted warning will be `[tour-kit] ${caller}: ${audience.segment} not registered…` — the three pre-existing warnings each prefix with the hook name (`useStepFilter`, `useHintFilter`, `useFilteredAnnouncements`). Run the test suites first, identify any string-equality assertions, update them to match the new format (or to use `expect(...).toMatch(/segment.*not registered/)`). The format change is **deliberate** to encode the caller name explicitly.

---

## Files Touched

### Added

| Path                                                      | Purpose                                                                 | LOC (approx) |
| --------------------------------------------------------- | ----------------------------------------------------------------------- | ------------ |
| `packages/core/src/lib/i18n/use-resolved-text.tsx`        | Promoted hook + JSDoc                                                   | 30           |
| `packages/core/src/lib/i18n/__tests__/use-resolved-text.test.tsx` | New core test (3 branches: string/i18n/ReactNode)                | 60           |
| `packages/core/src/lib/__tests__/audience.test.ts`        | New tests for `evaluateAudience` segment + array dispatch + caller name in warning | 80           |
| `packages/core/src/utils/__tests__/storage.test.ts`       | New test for `createMemoryStorage` SSR + isolation                      | 40           |

### Modified

| Path                                                            | Change                                                                              | Δ LOC (approx) |
| --------------------------------------------------------------- | ----------------------------------------------------------------------------------- | -------------- |
| `packages/core/src/lib/audience.ts`                             | Add `evaluateAudience` export + shared `warnedUnknownSegments` Set                  | +35            |
| `packages/core/src/utils/storage.ts`                            | Add `createMemoryStorage()` factory                                                 | +25            |
| `packages/core/src/index.ts`                                    | Re-export `evaluateAudience`, `useResolvedText`, `createMemoryStorage`              | +4             |
| `packages/core/src/hooks/use-route-persistence.ts`              | Replace local `memoryStorage` closure with `createMemoryStorage()` call             | −22 / +1       |
| `packages/checklists/src/hooks/use-checklist-persistence.ts`    | Replace local cast-laden `memoryStorage` with `createMemoryStorage()`               | −22 / +1       |
| `packages/react/src/hooks/use-step-filter.tsx`                  | Delete local `evaluateAudience` + `isSegmentAudience` + `warnedUnknownSegments`; call core's `evaluateAudience(audience, segments, userContext, 'useStepFilter')` | −30 / +4       |
| `packages/hints/src/hooks/use-hint-filter.tsx`                  | Same as above with caller `'useHintFilter'`                                         | −30 / +4       |
| `packages/announcements/src/hooks/use-filtered-announcements.tsx` | Same as above with caller `'useFilteredAnnouncements'`                            | −30 / +4       |
| `packages/react/src/hooks/use-resolved-text.tsx`                | Replace body with `export { useResolvedText } from '@tour-kit/core'`                | −38 / +2       |
| `packages/hints/src/hooks/use-resolved-text.tsx`                | Same as above                                                                       | −29 / +2       |
| `packages/announcements/src/lib/use-resolved-text.tsx`          | Same as above                                                                       | −38 / +2       |
| `packages/surveys/src/core/audience.ts`                         | Replace body with `export { matchesAudience } from '@tour-kit/core'`                | −67 / +2       |
| `packages/surveys/src/types/survey.ts:90-99`                    | Replace local `AudienceCondition` type with `import type { AudienceCondition } from '@tour-kit/core'` and re-export | −10 / +2       |

### Net delta

- **Lines deleted:** ~330
- **Lines added:** ~290 (mostly tests)
- **Production-code net:** ~−160 LOC across the workspace

---

## Step-by-Step Implementation

### Step 1 — Audit external consumers of soon-to-be-deleted symbols (15 min)

```bash
# Confirm nothing outside the deleting package imports these symbols.
grep -rn "evaluateHintAudience\|evaluateAnnouncementAudience\|evaluateAudience" \
  packages/ apps/ examples/ --include="*.ts" --include="*.tsx" \
  | grep -v __tests__ | grep -v dist | grep -v ".test." | grep -v ".spec."
grep -rn "from '@tour-kit/hints'" packages/ apps/ examples/ --include="*.ts" --include="*.tsx" \
  | grep -E "evaluateHintAudience"
```

If a consumer outside `packages/hints/` imports `evaluateHintAudience`, escalate to "What Failure Looks Like" §4 — preserve as `@deprecated` re-export from core under the old name.

### Step 2 — Promote `evaluateAudience` to core (1.5 h)

**File:** `packages/core/src/lib/audience.ts`

Add at the bottom of the existing file (after `validateConditions`):

```ts
import type { AudienceProp } from '../types/step'

function isSegmentAudience(a: AudienceProp): a is { segment: string } {
  return !Array.isArray(a) && typeof a === 'object' && a !== null && 'segment' in a
}

// Module-scope dedupe set: shared across the entire workspace. Previously
// triplicated as per-package sets in react/hints/announcements; the consolidation
// is intentional — segment names are app-wide stable so a single set is correct.
const warnedUnknownSegments = new Set<string>()

/**
 * Pure boolean test: does the current user satisfy this audience prop?
 *
 * Dispatches between the legacy array shape (delegates to `matchesAudience`
 * against `userContext`) and the named-segment shape (looks up `segments`
 * provided by `<SegmentationProvider>`).
 *
 * @param audience - The audience prop (array, segment object, or undefined)
 * @param segments - Bulk-read segment membership from `useSegments()`
 * @param userContext - The user context from `useSegmentationContext()`
 * @param caller - Short identifier of the calling hook (`'useStepFilter'`, etc.)
 *                 used purely in the dev warning emitted for unknown segments.
 */
export function evaluateAudience(
  audience: AudienceProp | undefined,
  segments: Record<string, boolean>,
  userContext: Record<string, unknown> | undefined,
  caller: string
): boolean {
  if (!audience) return true
  if (isSegmentAudience(audience)) {
    if (
      !(audience.segment in segments) &&
      process.env.NODE_ENV !== 'production' &&
      !warnedUnknownSegments.has(audience.segment)
    ) {
      warnedUnknownSegments.add(audience.segment)
      // biome-ignore lint/suspicious/noConsole: dev warning predates the logger migration; intentional console.warn so unmodified consumer setups still see the warning before they configure the logger
      console.warn(
        `[tour-kit] ${caller}: references segment "${audience.segment}" not registered in <SegmentationProvider>`
      )
    }
    return segments[audience.segment] === true
  }
  return matchesAudience(audience, userContext)
}

// Test-only: clears the dedupe set so unit tests can assert "first call warns".
// NOT exported from the public barrel.
export function __resetWarnedSegments(): void {
  warnedUnknownSegments.clear()
}
```

Note the deliberate `biome-ignore` for `noConsole`: this site predates Phase 2's logger migration. **Phase 2 will revisit this** and either migrate to `logger.warn` or replace the ignore with a `tooling/biome/biome.json` override. Document this in `phase-2.md` to make sure it's not missed.

Update `packages/core/src/index.ts` to add:

```ts
export { evaluateAudience, __resetWarnedSegments } from './lib/audience'
```

(The `__` prefix telegraphs internal-only; the export is still made because vitest configs in dependent packages need to call it from `vitest.setup.ts`.)

### Step 3 — Replace the 3 evaluateAudience copies (1 h)

**File:** `packages/react/src/hooks/use-step-filter.tsx`

Replace the entire file body with:

```tsx
'use client'

import {
  type AudienceProp,
  type TourStep,
  evaluateAudience,
  useSegmentationContext,
  useSegments,
} from '@tour-kit/core'
import * as React from 'react'

/**
 * Filter a step list by per-step `audience`. Keeps steps without `audience`
 * unconditionally; for steps with `audience` delegates to core's
 * `evaluateAudience`, which dispatches on segment-vs-array shape.
 *
 * **Critical:** uses `useSegments()` (single bulk read), NOT `useSegment` in
 * a `.map`. Per-segment hooks inside iteration violate rules-of-hooks if the
 * step list changes identity across renders.
 */
export function useStepFilter(steps: TourStep[]): TourStep[] {
  const segments = useSegments()
  const { userContext } = useSegmentationContext()
  return React.useMemo(
    () =>
      steps.filter((step) =>
        evaluateAudience(step.audience, segments, userContext, 'useStepFilter')
      ),
    [steps, segments, userContext]
  )
}
```

(The local `evaluateAudience`/`isSegmentAudience`/`warnedUnknownSegments` are deleted.)

Repeat the same shape for:

- `packages/hints/src/hooks/use-hint-filter.tsx` with caller `'useHintFilter'`
- `packages/announcements/src/hooks/use-filtered-announcements.tsx` with caller `'useFilteredAnnouncements'`. Note that this file additionally has the "array audiences pass through to scheduler" comment — preserve that comment but remove the `evaluateAnnouncementAudience` local function entirely. The hook's filter just calls `evaluateAudience(a.audience, segments, undefined, 'useFilteredAnnouncements')` — for the announcements case, `userContext` was deliberately `undefined` because array-shape audiences were forwarded unchanged to the scheduler. The core implementation still returns `true` for array shape when called this way (because `matchesAudience(audience, undefined)` only returns `true` if every condition has `operator === 'not_exists'`). **This is a behavioural mismatch** — see §Open Question 1 below.

> **Open Question 1:** The pre-existing `evaluateAnnouncementAudience` returned `true` for array audiences unconditionally (deferring to the scheduler). The new `evaluateAudience` does not. We need to preserve the legacy contract by passing `userContext: undefined` does not preserve the legacy contract (would now block on `not_exists` ones). **Resolution:** in the announcements call site, branch before calling core:
>
> ```ts
> announcements.filter((a) => {
>   if (a.audience && Array.isArray(a.audience)) return true  // legacy contract
>   return evaluateAudience(a.audience, segments, undefined, 'useFilteredAnnouncements')
> })
> ```
>
> Document this in the JSDoc on `useFilteredAnnouncements` — same wording as the pre-existing "array-shape audiences are forwarded to the scheduler" comment. Add a test in `packages/announcements/src/hooks/__tests__/use-filtered-announcements.test.tsx` that asserts: array-shape audience never blocks filtering in the hook (scheduler handles it).

### Step 4 — Promote `useResolvedText` to core (1 h)

**Create file:** `packages/core/src/lib/i18n/use-resolved-text.tsx`

Copy the body from `packages/react/src/hooks/use-resolved-text.tsx` (lines 1-39) verbatim — it's already framework-agnostic and the imports are all relative to core. The only delta from the existing react copy: change the JSDoc to drop the "Per-package duplicate" rationale.

```tsx
'use client'

import * as React from 'react'
import { type LocalizedText, isI18nKey } from '../../types/i18n'
import { useSegmentationContext } from '../segmentation/use-segmentation-context'
import { useT } from './use-t'
import { interpolate } from '../interpolate'

/**
 * Resolve a `LocalizedText | ReactNode` value into a `ReactNode`:
 *
 *   - `string` → `interpolate(value, vars)` (templated literal)
 *   - `{ key }` → `useT()(value.key, vars)` (i18n dictionary)
 *   - any other `ReactNode` → returned as-is
 *
 * `vars` defaults to `useSegmentationContext().userContext` so consumers
 * authoring `'Hi {{user.name}}'` get interpolation against the same context
 * driving audience targeting.
 *
 * **Hook, not function** — `useT()` requires React render context. Call from
 * a component body, never from an event handler or `.map()` callback.
 */
export function useResolvedText(
  value: React.ReactNode | LocalizedText | undefined,
  vars?: Record<string, unknown>
): React.ReactNode {
  const t = useT()
  const { userContext } = useSegmentationContext()
  const effectiveVars = vars ?? userContext

  if (value === undefined || value === null) return value
  if (typeof value === 'string') return interpolate(value, effectiveVars)
  if (isI18nKey(value)) return t(value.key, effectiveVars)
  return value as React.ReactNode
}
```

(Adjust the relative-path imports to match the actual core file layout — read `packages/core/src/lib/i18n/use-t.ts` first to confirm sibling structure.)

Update `packages/core/src/index.ts` to add:

```ts
export { useResolvedText } from './lib/i18n/use-resolved-text'
```

### Step 5 — Replace the 3 useResolvedText copies with re-exports (30 min)

For each of `packages/react/src/hooks/use-resolved-text.tsx`, `packages/hints/src/hooks/use-resolved-text.tsx`, and `packages/announcements/src/lib/use-resolved-text.tsx`, replace the entire file with:

```tsx
'use client'

export { useResolvedText } from '@tour-kit/core'
```

Two-line files. (`'use client'` is preserved so any tsup/bundler heuristic that looks for the directive still sees it on the re-export.)

### Step 6 — Add `createMemoryStorage()` to core (45 min)

**File:** `packages/core/src/utils/storage.ts`

Add at the bottom (after `createPrefixedStorage`):

```ts
/**
 * Factory that returns a `Storage`-shape closure-backed in-memory store.
 *
 * Designed for SSR fallback in `useRoutePersistence` / `useChecklistPersistence`.
 * Each call returns a fresh instance — instances do NOT share state. Use a
 * module-scope `const memory = createMemoryStorage()` if you want one shared.
 *
 * Implementation note: closure-based (not class-based) to avoid `this`
 * gymnastics, and matches the historical shape `use-route-persistence.ts`
 * was already using internally.
 */
export function createMemoryStorage(): Storage {
  const data: Record<string, string> = {}
  return {
    getItem(key) {
      return data[key] ?? null
    },
    setItem(key, value) {
      data[key] = value
    },
    removeItem(key) {
      delete data[key]
    },
    clear() {
      for (const key of Object.keys(data)) {
        delete data[key]
      }
    },
    get length() {
      return Object.keys(data).length
    },
    key(index) {
      return Object.keys(data)[index] ?? null
    },
  }
}
```

Update `packages/core/src/index.ts` to add:

```ts
export { createMemoryStorage } from './utils/storage'
```

### Step 7 — Adopt `createMemoryStorage` in two call sites (30 min)

**`packages/core/src/hooks/use-route-persistence.ts`**

Replace lines 34-59 (the local `memoryStorage` IIFE) with:

```ts
import { createMemoryStorage } from '../utils/storage'

const memoryStorage = createMemoryStorage()
```

**`packages/checklists/src/hooks/use-checklist-persistence.ts`**

Replace lines 15-36 (the cast-laden `memoryStorage` literal) with:

```ts
import { createMemoryStorage } from '@tour-kit/core'

const memoryStorage = createMemoryStorage()
```

The six `(this as unknown as { _data: Record<string, string> })` casts are eliminated by this single change. Run `pnpm --filter @tour-kit/checklists typecheck` to confirm no other casts depended on the old `_data` shape (none should — the old shape was self-contained).

### Step 8 — Surveys absorb core `AudienceCondition` + `matchesAudience` (45 min)

**`packages/surveys/src/types/survey.ts`** (around lines 90-99)

Replace the local `AudienceCondition` type with:

```ts
export type { AudienceCondition } from '@tour-kit/core'
```

(`export type` preserves the re-export at the surveys public-API boundary so consumers can still write `import type { AudienceCondition } from '@tour-kit/surveys'`.)

**`packages/surveys/src/core/audience.ts`** — replace the entire file body with:

```ts
export { matchesAudience } from '@tour-kit/core'
```

(A two-line file. The `matchesCondition` + `getNestedValue` helpers were never exported — they were private to surveys. Deleting them is safe.)

Verify with `pnpm --filter @tour-kit/surveys typecheck` and `pnpm --filter @tour-kit/surveys test`.

### Step 9 — Add new core tests (1 h)

**`packages/core/src/lib/__tests__/audience.test.ts`** (new file)

```ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { evaluateAudience, __resetWarnedSegments } from '../audience'

afterEach(() => {
  __resetWarnedSegments()
  vi.restoreAllMocks()
})

describe('evaluateAudience', () => {
  it('returns true for undefined audience', () => {
    expect(evaluateAudience(undefined, {}, undefined, 'test')).toBe(true)
  })

  it('dispatches to segment branch for { segment } shape', () => {
    expect(evaluateAudience({ segment: 'pro' }, { pro: true }, undefined, 'test')).toBe(true)
    expect(evaluateAudience({ segment: 'pro' }, { pro: false }, undefined, 'test')).toBe(false)
  })

  it('warns once for unknown segment with caller name', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    evaluateAudience({ segment: 'admins' }, {}, undefined, 'useStepFilter')
    evaluateAudience({ segment: 'admins' }, {}, undefined, 'useHintFilter')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy.mock.calls[0][0]).toMatch(/useStepFilter.*admins.*not registered/)
  })

  it('dispatches to matchesAudience for array shape', () => {
    expect(
      evaluateAudience(
        [{ key: 'plan', operator: 'equals', value: 'pro' }],
        {},
        { plan: 'pro' },
        'test'
      )
    ).toBe(true)
    expect(
      evaluateAudience(
        [{ key: 'plan', operator: 'equals', value: 'pro' }],
        {},
        { plan: 'free' },
        'test'
      )
    ).toBe(false)
  })
})
```

**`packages/core/src/lib/i18n/__tests__/use-resolved-text.test.tsx`** (new file) — see `phase-1-tests.md` for the full body; key assertions: string→interpolate, `{key:'x'}`→useT, ReactNode passthrough.

**`packages/core/src/utils/__tests__/storage.test.ts`** (new file)

```ts
import { describe, it, expect } from 'vitest'
import { createMemoryStorage } from '../storage'

describe('createMemoryStorage', () => {
  it('returns a Storage-shape object', () => {
    const s = createMemoryStorage()
    expect(typeof s.getItem).toBe('function')
    expect(typeof s.setItem).toBe('function')
    expect(typeof s.removeItem).toBe('function')
    expect(typeof s.clear).toBe('function')
    expect(typeof s.key).toBe('function')
    expect(typeof s.length).toBe('number')
  })

  it('round-trips set/get/remove', () => {
    const s = createMemoryStorage()
    s.setItem('a', '1')
    expect(s.getItem('a')).toBe('1')
    expect(s.length).toBe(1)
    s.removeItem('a')
    expect(s.getItem('a')).toBeNull()
    expect(s.length).toBe(0)
  })

  it('isolates instances', () => {
    const s1 = createMemoryStorage()
    const s2 = createMemoryStorage()
    s1.setItem('a', '1')
    expect(s2.getItem('a')).toBeNull()
  })

  it('clear empties all entries', () => {
    const s = createMemoryStorage()
    s.setItem('a', '1')
    s.setItem('b', '2')
    s.clear()
    expect(s.length).toBe(0)
  })
})
```

### Step 10 — Update vitest setup files to reset warned-segments between tests (15 min)

For each of `packages/react`, `packages/hints`, `packages/announcements`, add to `vitest.setup.ts`:

```ts
import { afterEach } from 'vitest'
import { __resetWarnedSegments } from '@tour-kit/core'

afterEach(() => {
  __resetWarnedSegments()
})
```

If a setup file doesn't exist, create one and wire it into the package's `vitest.config.ts` via `setupFiles: ['./vitest.setup.ts']`.

### Step 11 — Run the full validation suite (30 min)

```bash
# Per-package
pnpm --filter @tour-kit/core test
pnpm --filter @tour-kit/announcements test
pnpm --filter @tour-kit/hints test
pnpm --filter @tour-kit/react test
pnpm --filter @tour-kit/checklists test
pnpm --filter @tour-kit/surveys test

# Workspace
pnpm typecheck   # expect dashboard-next failure per memory #203, nothing else
pnpm build
pnpm size-limit  # expect no regressions; see memory #198 for baseline noise
```

If any test fails, classify the failure: regression (the helper changed behaviour) or test-assertion brittleness (the warning string format changed). The latter is acceptable — update the assertion to match the new format.

---

## Validation Gates

1. `grep -rn "function evaluateAudience\|function evaluateHintAudience\|function evaluateAnnouncementAudience" packages/*/src` returns **exactly 1 match** (in `packages/core/src/lib/audience.ts`).
2. `grep -rn "warnedUnknownSegments" packages/*/src` returns **exactly 1 line**.
3. `grep -rn "export function useResolvedText" packages/*/src` returns **exactly 1 match**.
4. `grep -rn "_data: Record<string" packages/*/src` returns **0 lines**.
5. `grep -rn "Keep in lockstep\|per-package duplicate" packages/*/src` returns **0 lines**.
6. `pnpm typecheck` is clean except for the pre-existing dashboard-next failure (memory `#203`).
7. `pnpm --filter '@tour-kit/*' test` exits 0 across all packages.
8. `pnpm build` produces all package `dist/` directories without error.
9. `pnpm size-limit` does not regress beyond the pre-existing baseline (memory `#198`).

---

## Rollback Plan

This phase ships as a single PR. Rollback is `git revert <merge-commit-sha>` followed by re-running `pnpm install && pnpm build`. The change set is mechanical and reversible — no schema migrations, no public-API removals (only consolidations).

If a partial rollback is needed (e.g. `createMemoryStorage` is fine but the surveys absorption broke a downstream consumer), the file changes are independent enough that individual reverts per `git revert -n <sha> -- packages/surveys/` work cleanly.

---

## Open Questions Surfaced During Planning

1. **The pre-existing `evaluateAnnouncementAudience` returned `true` for array audiences unconditionally.** The hoisted version must preserve this. Decision: branch in the announcements call site (see Step 3) rather than complicate the core helper's API. Documented in JSDoc and tested.
2. **`__resetWarnedSegments` is a test-only export — should it be in a `/testing` subpath instead of the main barrel?** For consistency with `useTour`-style test utilities (which historically live in main barrels), keep in main barrel but prefix `__`. Revisit during a future API hygiene pass.
3. **Surveys' `AudienceCondition` had its own JSDoc** noting subtle semantic differences from core (per the original duplication's "byte-for-byte" report — there were no real semantic differences, just spacing). Verified — surveys' type is identical to core's. Safe to re-export.

---

## Time Budget

| Step                                                       | Estimated |
| ---------------------------------------------------------- | --------- |
| 1. Audit external consumers                                | 15 min    |
| 2. Promote `evaluateAudience`                              | 1.5 h     |
| 3. Replace 3 evaluateAudience copies                       | 1 h       |
| 4. Promote `useResolvedText`                               | 1 h       |
| 5. Replace 3 useResolvedText copies                        | 30 min    |
| 6. Add `createMemoryStorage`                               | 45 min    |
| 7. Adopt in 2 call sites                                   | 30 min    |
| 8. Surveys absorption                                      | 45 min    |
| 9. Add core tests                                          | 1 h       |
| 10. Update vitest setup files                              | 15 min    |
| 11. Run full validation                                    | 30 min    |
| **Total**                                                  | **7.5 h** |

If any step blows its budget by 50%+, stop and inspect — that's a signal the helper is less pure than the report suggests, and the abstraction needs revisiting before continuing.
