# Phase 1: Hoist HIGH Duplication To Core

**Risk:** Medium.
**Estimated effort:** 8-10 hours.
**Primary packages:** `core`, `react`, `hints`, `announcements`, `checklists`, `surveys`.
**Goal:** Delete the four HIGH duplication candidates without changing runtime behavior.

---

## Current State

Verified against the source tree on 2026-05-21:

- `packages/surveys/src/core/audience.ts` duplicates the operator switch from `packages/core/src/lib/audience.ts`.
- `packages/react/src/hooks/use-step-filter.tsx`, `packages/hints/src/hooks/use-hint-filter.tsx`, and `packages/announcements/src/hooks/use-filtered-announcements.tsx` each own a segment-audience evaluator and `warnedUnknownSegments` set.
- `packages/core/src/hooks/use-route-persistence.ts` has a clean closure-backed memory `Storage`; `packages/checklists/src/hooks/use-checklist-persistence.ts` has the same idea implemented with six `as unknown as { _data: ... }` casts.
- `packages/react/src/hooks/use-resolved-text.tsx`, `packages/hints/src/hooks/use-resolved-text.tsx`, and `packages/announcements/src/lib/use-resolved-text.tsx` are the same ReactNode-preserving text resolver.
- Core already has the string-only sibling `packages/core/src/lib/i18n/use-resolve-localized-text.ts`; put the new hook beside it.

---

## Non-Negotiable Behavior

- React and hints evaluate array-shaped audiences immediately with `matchesAudience(audience, userContext)`.
- Announcements **must not** evaluate array-shaped audiences inside `useFilteredAnnouncements`; arrays pass through to the scheduler and are evaluated there against `<AnnouncementsProvider userContext>`.
- Unknown segment warnings must still name the calling hook (`useStepFilter`, `useHintFilter`, `useFilteredAnnouncements`).
- Do not export a test-only `__resetWarnedSegments` helper from the public `@tour-kit/core` barrel. Tests can use unique segment names or module reset.
- Use the DOM `globalThis.Storage` shape for `createMemoryStorage()` because `useRoutePersistence` and `useChecklistPersistence` currently expect `length` and `key(index)`.

---

## Implementation Steps

### 1. Preflight Audit

Run these before editing:

```bash
rg -n "evaluateAudience|evaluateHintAudience|evaluateAnnouncementAudience|warnedUnknownSegments" packages apps examples --glob '*.{ts,tsx}' --glob '!**/dist/**'
rg -n "useResolvedText" packages apps examples --glob '*.{ts,tsx}' --glob '!**/dist/**'
rg -n "_data: Record<string|as unknown as \\{ _data" packages/checklists packages/core --glob '*.{ts,tsx}'
rg -n "matchesAudience|AudienceCondition" packages/surveys/src packages/core/src --glob '*.{ts,tsx}'
```

If any root package barrel currently exposes a soon-to-be-deleted symbol, preserve that symbol as a wrapper for one release instead of deleting it. Today, `@tour-kit/announcements` exposes `evaluateAnnouncementAudience`, so keep a wrapper with the same signature.

### 2. Core Audience Helper

Add to `packages/core/src/lib/audience.ts`:

- `isSegmentAudience(audience): audience is { segment: string }`.
- `evaluateAudience(audience, segments, userContext, caller): boolean`.
- One module-scope `warnedUnknownSegments` set.

Export `evaluateAudience` from `packages/core/src/index.ts`.

Implementation rule:

```ts
if (!audience) return true
if (isSegmentAudience(audience)) {
  // dev-only unknown-segment warning
  return segments[audience.segment] === true
}
return matchesAudience(audience, userContext)
```

Phase 2 will migrate the warning from `console.warn` to `logger.warn`; this phase may either use `logger.warn` immediately or leave a narrowly justified temporary `console.warn`. Prefer using `logger.warn` now if tests are straightforward.

### 3. Replace Audience Copies

`packages/react/src/hooks/use-step-filter.tsx`:

- Delete local `isSegmentAudience`, `evaluateAudience`, and `warnedUnknownSegments`.
- Import `evaluateAudience` from core.
- Call `evaluateAudience(step.audience, segments, userContext, 'useStepFilter')`.

`packages/hints/src/hooks/use-hint-filter.tsx`:

- Same pattern.
- Keep `evaluateHintAudience` as a local exported wrapper only if existing tests import it directly:
  `export const evaluateHintAudience = (...) => evaluateAudience(..., 'useHintFilter')`.

`packages/announcements/src/hooks/use-filtered-announcements.tsx`:

- Keep the public `evaluateAnnouncementAudience(audience, segments)` signature.
- Its implementation should branch:
  - `undefined` -> `true`
  - `Array.isArray(audience)` -> `true`
  - segment object -> core `evaluateAudience(audience, segments, undefined, 'useFilteredAnnouncements')`

Add or update tests so array-shaped announcements pass through this hook even when no `userContext` is available.

### 4. Core `useResolvedText`

Create `packages/core/src/lib/i18n/use-resolved-text.ts` with the ReactNode-preserving hook.

Use existing core imports:

- `interpolate` from `../interpolate`
- `LocalizedText` and `isI18nKey` from `../localized-text`
- `useSegmentationContext` from `../segmentation/segmentation-context`
- `useT` from `./use-t`

Export from:

- `packages/core/src/lib/i18n/index.ts`
- `packages/core/src/index.ts`

Then replace the three package copies with re-export files:

```ts
'use client'

export { useResolvedText } from '@tour-kit/core'
```

Internal component imports can stay package-local (`../hooks/use-resolved-text` / `../lib/use-resolved-text`) so this is a mechanical diff.

### 5. Core Memory Storage

Add `createMemoryStorage(): globalThis.Storage` to `packages/core/src/utils/storage.ts`.
That file currently imports the project storage adapter type as `Storage`; alias it to avoid shadowing the DOM type, for example `import type { Storage as StorageAdapter } from '../types'`.

Use a closure-backed implementation matching the existing route-persistence behavior:

- `getItem`
- `setItem`
- `removeItem`
- `clear`
- `length` getter
- `key(index)`

Export it from:

- `packages/core/src/utils/index.ts`
- `packages/core/src/index.ts`

Update:

- `packages/core/src/hooks/use-route-persistence.ts`
- `packages/checklists/src/hooks/use-checklist-persistence.ts`

Both should keep one module-scope instance:

```ts
const memoryStorage = createMemoryStorage()
```

### 6. Surveys Audience Absorption

In `packages/surveys/src/types/survey.ts`, replace the local `AudienceCondition` interface with a type alias:

```ts
export type { AudienceCondition } from '@tour-kit/core'
```

In `packages/surveys/src/core/audience.ts`, replace the duplicate implementation with:

```ts
export { matchesAudience } from '@tour-kit/core'
```

Keep existing survey audience tests and make sure they still cover the exported symbol through the surveys package path.

---

## Tests To Add Or Update

- Core audience tests in `packages/core/src/lib/audience.test.ts`:
  - array audience delegates to `matchesAudience`
  - segment audience reads `segments`
  - unknown segment warns once per segment name in dev
- Announcements segmentation test:
  - array-shaped audience passes through `useFilteredAnnouncements`
  - segment-shaped audience still filters with `useSegments()`
- Core i18n test beside existing i18n tests:
  - string interpolation
  - `{ key }` translation
  - ReactNode pass-through
  - explicit vars override segmentation context
- Core storage test:
  - `length` updates dynamically
  - `key(index)` works
  - two storage instances are isolated
- Existing react/hints `useResolvedText` tests should either stay against package-local re-export files or be moved to core with package tests reduced to smoke coverage.

---

## Validation Gates

```bash
rg -n "Keep in lockstep|per-package duplicate" packages --glob '*.{ts,tsx}'
rg -n "warnedUnknownSegments" packages --glob '*.{ts,tsx}'
rg -n "export function useResolvedText" packages --glob '*.{ts,tsx}'
rg -n "_data: Record<string|as unknown as \\{ _data" packages/core packages/checklists --glob '*.{ts,tsx}'
pnpm --filter @tour-kit/core test
pnpm --filter @tour-kit/react test
pnpm --filter @tour-kit/hints test
pnpm --filter @tour-kit/announcements test
pnpm --filter @tour-kit/checklists test
pnpm --filter @tour-kit/surveys test
pnpm typecheck
pnpm build
```

Expected grep results:

- No lockstep/per-package duplicate comments.
- One `warnedUnknownSegments` occurrence in core.
- One implementation of `useResolvedText` in core; package files are re-exports.
- No checklist `_data` cast pattern.

---

## Rollback

This phase is a single PR. Rollback is `git revert <merge-commit-sha>`.

If a single helper causes trouble, the work is separable by package:

- audience helper
- memory storage
- text resolver
- surveys audience

Keep commits grouped that way inside the PR if possible.
