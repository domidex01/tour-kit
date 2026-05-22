---
'@tour-kit/core': patch
---

Extract TourProvider navigation orchestrators into the new internal
`tour-engine` module (refactor-train phase 5).

`navigateToStep`, `handleBranchTarget`, and the related step-visibility
helpers (`buildCallbackContext`, `evaluateStepWhen`, `findNextVisibleStepIndex`,
`findNearestVisibleStepIndex`, `isNavigationNeeded`) move out of
`tour-provider.tsx` into pure module-level functions under
`packages/core/src/lib/tour-engine/`. The engine impls receive a
`TourEngineContext` (refs/getters) so async navigation reads fresh state
across await boundaries.

Behavior is preserved: all 928 existing core tests pass, plus 34 new direct
engine unit tests. Provider LOC drops from 1803 to 1372, and the
`noExcessiveCognitiveComplexity` ignore count drops from 5 to 3 (reducer,
flow-restore, prev — `navigateToStep` and `handleBranchTarget` no longer
need provider-side ignores).

No public API change.
