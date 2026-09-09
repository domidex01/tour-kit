/**
 * v3 Phase 2 — `createChecklistsHandle`, the binding contract.
 *
 * `createHandle` from `@tour-kit/core/engine` supplies the lifecycle half:
 * lazy `ensure()`, a listener set that outlives any one engine, one fan-out on
 * construction, and a microtask-deferred `release()` so StrictMode's
 * effect double-invoke is a remount rather than a re-boot.
 *
 * The split that matters here: **the four reads never `ensure()`**. React
 * calls `getChecklist`/`getProgress` during render, and this package is
 * SSR-hydrated — building the engine there would read `localStorage` before
 * the first paint and reopen the mismatch `dee2a1f1` closed. Reads answer from
 * `getState()`, which is the seeded (or empty) snapshot until a verb runs.
 */
import { createHandle } from '@tour-kit/core/engine'
import { type ChecklistsEngine, initialChecklistsState } from './create-checklists-engine'
import { calculateProgress } from './progress'
import type {
  ChecklistProgress,
  ChecklistsEngineState,
  EngineChecklistConfig,
  EngineChecklistState,
} from './types'

export interface ChecklistsHandle<TConfig extends EngineChecklistConfig = EngineChecklistConfig> {
  ensure: () => ChecklistsEngine<TConfig>
  getState: () => ChecklistsEngineState<TConfig>
  subscribe: (listener: () => void) => () => void
  release: () => void
  boot: () => void
  setChecklists: (checklists: TConfig[]) => void
  setContext: (context: Parameters<ChecklistsEngine<TConfig>['setContext']>[0]) => void
  completeTask: (checklistId: string, taskId: string) => void
  uncompleteTask: (checklistId: string, taskId: string) => void
  executeAction: (checklistId: string, taskId: string) => void
  dismissChecklist: (checklistId: string) => void
  restoreChecklist: (checklistId: string) => void
  toggleExpanded: (checklistId: string) => void
  setExpanded: (checklistId: string, expanded: boolean) => void
  resetChecklist: (checklistId: string) => void
  resetAll: () => void
  /** Read-only: answers from the current snapshot, never constructs. */
  getChecklist: (id: string) => EngineChecklistState<TConfig> | undefined
  /** Read-only: answers from the current snapshot, never constructs. */
  getProgress: (checklistId: string) => ChecklistProgress
}

/**
 * @param initial the snapshot every read answers with until the first verb
 *   constructs the engine. Defaults to the empty module constant; a binding
 *   that renders content on a server passes `seedChecklistsState(configs,
 *   context)` instead, computed ONCE for the life of the mount
 *   (`useSyncExternalStore` compares with `Object.is`). Decision 5a — without
 *   it the whole server render sees an empty map, because no verb ever runs
 *   on a server and `createHandle` is lazy by contract.
 */
export function createChecklistsHandle<TConfig extends EngineChecklistConfig>(
  factory: () => ChecklistsEngine<TConfig>,
  initial: ChecklistsEngineState<TConfig> = initialChecklistsState<TConfig>()
): ChecklistsHandle<TConfig> {
  const handle = createHandle<ChecklistsEngine<TConfig>, ChecklistsEngineState<TConfig>>(
    factory,
    initial
  )

  return {
    ensure: handle.ensure,
    getState: handle.getState,
    subscribe: handle.subscribe,
    release: handle.release,

    boot: () => {
      handle.ensure().boot()
    },
    setChecklists: (checklists) => handle.ensure().setChecklists(checklists),
    setContext: (context) => handle.ensure().setContext(context),
    completeTask: (checklistId, taskId) => handle.ensure().completeTask(checklistId, taskId),
    uncompleteTask: (checklistId, taskId) => handle.ensure().uncompleteTask(checklistId, taskId),
    executeAction: (checklistId, taskId) => handle.ensure().executeAction(checklistId, taskId),
    dismissChecklist: (checklistId) => handle.ensure().dismissChecklist(checklistId),
    restoreChecklist: (checklistId) => handle.ensure().restoreChecklist(checklistId),
    toggleExpanded: (checklistId) => handle.ensure().toggleExpanded(checklistId),
    setExpanded: (checklistId, expanded) => handle.ensure().setExpanded(checklistId, expanded),
    resetChecklist: (checklistId) => handle.ensure().resetChecklist(checklistId),
    resetAll: () => handle.ensure().resetAll(),

    getChecklist: (id) => handle.getState().checklists.get(id),
    getProgress: (checklistId) => {
      const checklist = handle.getState().checklists.get(checklistId)
      if (!checklist) return { completed: 0, total: 0, percentage: 0, remaining: 0 }
      return calculateProgress(checklist)
    },
  }
}
