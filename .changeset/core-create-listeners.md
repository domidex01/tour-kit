---
"@tour-kit/core": minor
---

`createListeners`, the fault-isolated subscriber fan-out every engine keeps, exported from `@tour-kit/core/engine`.

A throwing subscriber no longer aborts the notify loop. `createTourEngine` already isolated listener faults; `createHintsEngine` re-derived the same loop in the v3 Phase 1 extraction and dropped the try/catch, so one broken subscriber stopped every listener registered after it from firing — after the state change and its storage write had already landed, leaving state, storage and subscribers out of step with nothing to surface the cause. Both engines now route through one implementation, and it has direct test coverage that core's inline version never had.

Exported from `/engine` because a package engine needs the same guarantee — `@tour-kit/hints/engine` uses it today, and `checklists`, `announcements` and `surveys` follow.
