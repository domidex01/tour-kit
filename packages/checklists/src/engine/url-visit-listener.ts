/**
 * v3 Phase 2 — the implementation moved to `lib/checklists-engine/` (the
 * React-free half of the package). This re-export keeps the two existing spec
 * files and `src/__tests__/setup.ts` importing the path they always have; a
 * re-export shares the module instance, so `__resetForTests()` still resets the
 * one singleton registry.
 */
export {
  LOCATION_CHANGE_EVENT,
  __resetForTests,
  matchesPattern,
  registerUrlVisitTask,
} from '../lib/checklists-engine/url-visit-listener'
