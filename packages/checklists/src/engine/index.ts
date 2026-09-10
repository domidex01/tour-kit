/**
 * `@tour-kit/checklists/engine` — the React-free door (v3 Phase 2).
 *
 * Re-exports and comments only: `sideEffects: false` is true for this package
 * only while this barrel has nothing to run. Never add a declaration or a
 * side-effect import here, and never list `engine/index` in the tsup
 * `injectUseClient([...])` call — a 'use client' banner would mark a
 * framework-agnostic entry client-only.
 */
export { createChecklist, createTask } from '../lib/checklists-engine/create-checklist'
export type {
  ChecklistsEngine,
  CreateChecklistsEngineOptions,
} from '../lib/checklists-engine/create-checklists-engine'
export {
  createChecklistsEngine,
  initialChecklistsState,
  seedChecklistsState,
} from '../lib/checklists-engine/create-checklists-engine'
export {
  canCompleteTask,
  hasCircularDependency,
  resolveTaskDependencies,
} from '../lib/checklists-engine/dependencies'
export type { ChecklistsHandle } from '../lib/checklists-engine/handle'
export { createChecklistsHandle } from '../lib/checklists-engine/handle'
export type { ChecklistsStorage } from '../lib/checklists-engine/persistence'
export { calculateProgress, getLockedTasks, getNextTask } from '../lib/checklists-engine/progress'
export type {
  ChecklistContextData,
  ChecklistPersistenceConfig,
  ChecklistProgress,
  ChecklistsEngineCallbacks,
  ChecklistsEngineState,
  EngineChecklistConfig,
  EngineChecklistState,
  EngineTaskConfig,
  EngineTaskState,
  PersistedChecklistState,
  TaskAction,
  TaskCompletionCondition,
  UrlVisitCompletion,
} from '../lib/checklists-engine/types'
export {
  LOCATION_CHANGE_EVENT,
  matchesPattern,
  registerUrlVisitTask,
} from '../lib/checklists-engine/url-visit-listener'
export { attachUrlVisitTasks } from '../lib/checklists-engine/url-visit-tasks'
