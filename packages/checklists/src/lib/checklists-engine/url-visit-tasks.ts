/**
 * v3 Phase 2 — the `urlVisit` auto-completion behaviour as an `attach*` leaf.
 *
 * It is NOT engine lifecycle. `boot()` owns everything a verb can read back
 * (storage, the hydrated `completed` set that gates `canCompleteTask`); this
 * only listens. Ownership matters because `createHandle.release()` defers
 * `destroy()` by a microtask, so a behaviour torn down in `destroy()` still
 * holds its listeners for one tick after `unmount()` — which an existing spec
 * counts synchronously. The binding attaches it, and the binding's own
 * teardown detaches it in the same tick.
 *
 * Re-registers only when the state change forces a rebuild: the config set or
 * the completed set (`concepts/tour-engine.md`).
 */
import { type ChecklistsEngine, signature } from './create-checklists-engine'
import type { EngineChecklistConfig } from './types'
import { registerUrlVisitTask } from './url-visit-listener'

export function attachUrlVisitTasks<TConfig extends EngineChecklistConfig>(
  engine: ChecklistsEngine<TConfig>
): () => void {
  let cleanups: Array<() => void> = []
  let lastCompleted: unknown = null
  // The config set moves too, now that `setChecklists` exists: a checklist
  // added after mount can carry a `urlVisit` task, and `completed` would not
  // move for it. The old provider's effect keyed on `checklistConfigs` as well
  // as `state.completed` — this is that pair. It is the SIGNATURE, not the map
  // identity: `SET_EXPANDED` and `COMPLETE_TASK` both hand back a new Map with
  // the same ids, and re-registering every listener on an expand/collapse
  // would be pure churn.
  let lastSignature = ''

  const configsOf = (state: ReturnType<typeof engine.getState>) =>
    [...state.checklists.values()].map((c) => c.config)

  /** Register every not-yet-completed `urlVisit` task of one checklist. */
  const registerChecklist = (
    checklistId: string,
    tasks: TConfig['tasks'],
    completedSet: Set<string> | undefined
  ): void => {
    for (const task of tasks) {
      const cw = task.completedWhen
      if (!cw || !('type' in cw) || cw.type !== 'urlVisit') continue
      if (completedSet?.has(task.id)) continue
      cleanups.push(
        registerUrlVisitTask(`${checklistId}:${task.id}`, cw.urlPattern, () =>
          engine.completeTask(checklistId, task.id)
        )
      )
    }
  }

  const rebuild = (): void => {
    for (const fn of cleanups) fn()
    cleanups = []
    const state = engine.getState()
    lastCompleted = state.completed
    lastSignature = signature(configsOf(state))
    for (const checklist of state.checklists.values()) {
      registerChecklist(
        checklist.config.id,
        checklist.config.tasks,
        state.completed[checklist.config.id]
      )
    }
  }

  rebuild()

  const unsubscribe = engine.subscribe(() => {
    const next = engine.getState()
    if (next.completed === lastCompleted && signature(configsOf(next)) === lastSignature) return
    rebuild()
  })

  let detached = false
  return () => {
    if (detached) return
    detached = true
    unsubscribe()
    for (const fn of cleanups) fn()
    cleanups = []
  }
}
