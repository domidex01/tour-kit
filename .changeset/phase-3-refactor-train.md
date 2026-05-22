---
'@tour-kit/core': major
'@tour-kit/react': major
'@tour-kit/announcements': minor
---

Phase 3 (refactor train) — Dead position API removal, hidden-step type tightening, announcements priority comparator.

**Workstream A — `@tour-kit/core` / `@tour-kit/react` BREAKING:**

Removed from public barrels (no production callers found in `packages`, `apps`, `examples`, or sibling `tourkit-dash`):

- `calculatePosition`
- `calculatePositionWithCollision`
- `wouldOverflow`
- `getFallbackPlacements`
- `PositionResult` (type)

`ElementPositionResult` (the deliberately similar but unrelated type consumed by `useElementPosition`) is preserved. The math functions still live in `packages/core/src/utils/position.ts` for internal use; only the public exports are gone.

**Workstream B — `@tour-kit/announcements` improvement:**

- New `createAnnouncementComparator(order, weights, sequenceById)` helper in `@tour-kit/announcements/core/priority-queue`. Replaces an inline `priorityOrder: Record<string, number>` literal in `<AnnouncementsProvider>` that hardcoded `{ critical: 0, high: 1, normal: 2, low: 3 }` and ignored both `QueueConfig.priorityWeights` and `priorityOrder: 'fifo' | 'lifo'`.
- New `AnnouncementScheduler.queueConfig` getter (`Readonly<QueueConfig>`). Provider now reads queue config through a public getter instead of poking the private `schedulerRef.current.config` field.
- Custom `priorityWeights` and `priorityOrder: 'fifo' | 'lifo'` now actually drive auto-show ordering. This is a behavior fix for users who relied on the previous (broken) default-weight behavior.

**Workstream C — `@tour-kit/core` API surface widening (mostly back-compat):**

- `TourStep` is now a discriminated union: `TourStep = VisibleTourStep | HiddenTourStep`.
- `VisibleTourStep` requires `target` and `content` (matches the previous required surface).
- `HiddenTourStep` declares `target?: never`, `content?: never`, `title?: never`, `placement?: never`, `advanceOn?: never` so authoring `{ kind: 'hidden', target: '#x' }` is a TypeScript error — mirroring the runtime check in `validateTour`.
- New `isVisibleStep(step): step is VisibleTourStep` type guard (runtime + type-level).
- New named exports `VisibleTourStep`, `HiddenTourStep`, and `isVisibleStep` from `@tour-kit/core`.
- `createStep` / `createNamedStep` return `VisibleTourStep` (was `TourStep`) — hidden steps were never constructable via this helper.
- `validateTour` no longer uses the `as unknown as Record<string, unknown>` cast; reads `step[field]` directly through the narrowed `HiddenTourStep` branch.
- `waitForStepTarget(step, opts)` now takes `VisibleTourStep` (was `TourStep`). The provider already narrowed before calling it.

Hidden step callers that read UI fields (`target`, `content`, etc.) need to narrow with `step.kind !== 'hidden'` or `isVisibleStep(step)` before access. This was a silent bug surface before — the union enforces it now.
