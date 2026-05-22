# Phase 3: Dead API, Hidden-Step Types, Priority Comparator

**Risk:** Medium.
**Estimated effort:** 6-8 hours.
**Primary packages:** `core`, `react`, `announcements`.
**Goal:** Resolve three MED findings with small, independently reviewable changes in one PR.

---

## Current State

Verified against the source tree on 2026-05-21:

- `calculatePosition`, `calculatePositionWithCollision`, `wouldOverflow`, `getFallbackPlacements`, and `PositionResult` live in `packages/core/src/utils/position.ts`.
- Those names are re-exported from:
  - `packages/core/src/index.ts`
  - `packages/core/src/utils/index.ts`
  - `packages/react/src/index.ts` (`calculatePosition` only)
- No non-test, non-barrel production caller was found in packages/apps/examples.
- `packages/announcements/src/context/announcements-provider.tsx` sorts auto-show candidates with an inline `priorityOrder` literal even though `packages/announcements/src/core/priority-queue.ts` owns `createComparator`.
- `TourStep` is currently one interface with required `target` and `content`. Hidden steps are therefore cast in tests, and `validateTour` uses `as unknown as Record<string, unknown>` to check forbidden fields.

---

## Workstream A: Position Public API Removal

### Steps

1. Re-run caller scan:

   ```bash
   rg -n "calculatePosition|calculatePositionWithCollision|wouldOverflow|getFallbackPlacements|PositionResult" \
     packages apps examples \
     --glob '*.{ts,tsx}' \
     --glob '!**/dist/**' \
     --glob '!**/__tests__/**' \
     --glob '!**/*.test.*' \
     --glob '!**/*.spec.*'
   ```

2. Search sibling/private apps if available, especially `/home/domidex/projects/tourkit-dash`.
3. If any real consumer exists, stop and preserve deprecated exports for one release.
4. If no consumers exist, remove the names from:
   - `packages/core/src/index.ts`
   - `packages/core/src/utils/index.ts`
   - `packages/react/src/index.ts`
5. Move the manual math functions to `packages/core/src/utils/_position-fallback.ts` only if existing tests still provide useful documentation. Otherwise delete the functions and delete redundant tests.

### Do Not Confuse With `ElementPositionResult`

`packages/core/src/index.ts` exports **both** `PositionResult` (the dead one being removed here, sourced from `utils/position.ts`) and `ElementPositionResult` (sourced from `hooks/use-element-position.ts` and consumed by `useElementPosition`). The names are deliberately close. Removal is scoped to `PositionResult` only — `ElementPositionResult` stays. Call this out explicitly in the changeset so reviewers and downstream users do not assume both are gone.

The grep pattern in step 1 intentionally matches `PositionResult` only and not `ElementPositionResult`. Do not widen it.

Preferred route: keep `_position-fallback.ts` internal for now so `packages/core/src/__tests__/utils/position.test.ts` can continue documenting placement algebra without keeping the functions public.

### Changeset

Add a changeset that calls this out as a public API removal for `@tour-kit/core` and `@tour-kit/react`. Because the packages are pre-1.0 for core/react, a minor bump may be acceptable, but confirm release policy before merge. If in doubt, use a major changeset.

---

## Workstream B: Announcements Priority Comparator

### Problem

The provider currently has:

```ts
const priorityOrder: Record<string, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
}
```

That duplicates `QueueConfig.priorityWeights` and ignores `priorityOrder: 'fifo' | 'lifo'`.

### Preferred Fix

Add a helper in `packages/announcements/src/core/priority-queue.ts`:

```ts
export function createAnnouncementComparator(
  order: PriorityOrder,
  weights: Record<AnnouncementPriority, number>
): (a: Pick<AnnouncementConfig, 'id' | 'priority'>, b: Pick<AnnouncementConfig, 'id' | 'priority'>) => number
```

or a similarly named helper that avoids constructing fake `QueueItem` objects in the provider.

To use `fifo` / `lifo` correctly for auto-show candidates, the provider needs deterministic sequence values. Prefer sorting by the order of `filteredAnnouncements` for sequence:

```ts
const sequenceById = new Map(filteredAnnouncements.map((a, index) => [a.id, index]))
```

Then either:

- pass sequence into a queue-like comparator, or
- create a helper that accepts `sequenceById`.

Do not reach into `schedulerRef.current.config`; that field is private. If provider needs config, add an explicit getter to `AnnouncementScheduler`:

```ts
get queueConfig(): Readonly<QueueConfig> {
  return this.config
}
```

### Tests

Update or add tests in `packages/announcements/src/__tests__/hooks/auto-show.test.tsx` or nearby:

- priority order uses configured weights, not the hard-coded critical/high/normal/low literal
- FIFO and LIFO produce the same order as `PriorityQueue` for eligible auto-show candidates
- existing queue behavior remains unchanged

---

## Workstream C: Hidden-Step Type Tightening

### Current Problem

`TourStep` requires UI fields even when `kind: 'hidden'`, so valid hidden steps need casts:

```ts
{ id: 'h', kind: 'hidden', onEnter: async () => {} } as any
```

The type should say what runtime validation already enforces.

### Type Shape

Refactor `packages/core/src/types/step.ts` toward:

```ts
interface BaseTourStep<TId extends string = string> {
  id: TId
  audience?: AudienceProp
  route?: string
  // shared lifecycle/branch fields
}

export interface VisibleTourStep<TId extends string = string> extends BaseTourStep<TId> {
  kind?: 'visible'
  target: TourTarget
  title?: React.ReactNode | LocalizedText
  description?: LocalizedText
  content: React.ReactNode
  placement?: Placement
  advanceOn?: { /* existing shape */ }
}

export interface HiddenTourStep<TId extends string = string> extends BaseTourStep<TId> {
  kind: 'hidden'
  target?: never
  title?: never
  content?: never
  placement?: never
  advanceOn?: never
}

export type TourStep<TId extends string = string> =
  | VisibleTourStep<TId>
  | HiddenTourStep<TId>
```

Use `?: never` rather than omitting the fields entirely. That allows `validateTour` to read `step[field]` without a cast while TypeScript rejects authored hidden steps that declare those fields.

### Follow-On Type Updates

Some helpers currently assume every `TourStep` has UI fields. Update those to use `VisibleTourStep` where appropriate:

- `packages/core/src/utils/create-step.ts`
- tests that construct visible step fixtures
- any component prop or helper that needs `target` / `content`

Also export `VisibleTourStep` and `HiddenTourStep` from `packages/core/src/types/index.ts` and the core package barrel so downstream type users have an explicit escape hatch instead of reverse-engineering the union.

Provider code that handles `state.currentStep` should keep accepting `TourStep` and narrow with `step.kind !== 'hidden'` before reading UI-only fields.

### Validate Tour

Update `packages/core/src/lib/validate-tour.ts`:

```ts
if (step.kind !== 'hidden') continue
for (const field of FORBIDDEN_HIDDEN_FIELDS) {
  if (step[field] != null) {
    throw new TourValidationError(...)
  }
}
```

No `as unknown as Record<string, unknown>` should remain. Keep the runtime validator because it protects JSON/untyped boundaries and invalid `as any` inputs.

### Type Tests

Add `packages/core/src/__tests__/types/hidden-step.test-d.ts`:

- visible step with target/content compiles
- hidden step without UI fields compiles
- hidden step with `target` fails
- hidden step with `content` fails
- `Tour` accepts mixed visible/hidden steps

Run:

```bash
pnpm --filter @tour-kit/core typecheck:types
```

---

## Validation Gates

```bash
rg -n "calculatePosition|calculatePositionWithCollision|wouldOverflow|getFallbackPlacements|PositionResult" \
  packages/core/src/index.ts packages/core/src/utils/index.ts packages/react/src/index.ts
rg -n "priorityOrder: Record" packages/announcements/src/context/announcements-provider.tsx
rg -n "as unknown as Record<string, unknown>" packages/core/src/lib/validate-tour.ts
pnpm --filter @tour-kit/core test
pnpm --filter @tour-kit/core typecheck:types
pnpm --filter @tour-kit/announcements test
pnpm --filter @tour-kit/react test
pnpm typecheck
pnpm build
```

Expected grep results:

- no dead position names in public barrels
- no inline priority literal in announcements provider
- no `as unknown as Record<string, unknown>` in `validate-tour.ts`

---

## Rollback

The three workstreams are independent. If the position export removal is too risky, revert only that workstream and still ship the comparator/type improvements.

If the hidden-step union causes widespread type fallout, stop before changing runtime code and split it into its own PR. The type change is the highest blast-radius part of this phase.
