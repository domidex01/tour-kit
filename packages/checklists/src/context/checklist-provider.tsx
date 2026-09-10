'use client'

import { useAnalyticsOptional } from '@tour-kit/analytics'
import { LicenseGate } from '@tour-kit/license'
import * as React from 'react'
import {
  type ChecklistsEngine,
  createChecklistsEngine,
  seedChecklistsState,
} from '../lib/checklists-engine/create-checklists-engine'
import { createChecklistsHandle } from '../lib/checklists-engine/handle'
import { attachUrlVisitTasks } from '../lib/checklists-engine/url-visit-tasks'
import type { ChecklistConfig, ChecklistProviderConfig } from '../types'
import { ChecklistContext, type ChecklistContextValue } from './checklist-context'

interface ChecklistProviderProps extends ChecklistProviderConfig {
  children: React.ReactNode
}

export function ChecklistProvider({
  children,
  checklists: checklistConfigs,
  persistence = { enabled: false },
  context: userContext = {},
  onTaskComplete,
  onTaskUncomplete,
  onChecklistComplete,
  onChecklistDismiss,
  onTaskAction,
}: ChecklistProviderProps) {
  const analytics = useAnalyticsOptional()

  // Every value the engine may read back through a callback, kept fresh
  // without rebuilding the engine. The factory below closes over this ref, not
  // over the props, so the engine is constructed exactly once per mount.
  // `completedTours` is pinned to [] here, not forwarded: the provider has
  // hard-coded it since forever and nothing in the package reads it except a
  // consumer's own `when(context)` predicate, so forwarding it would un-hide
  // tasks on a MINOR bump. Quirk 15.6 — the engine itself honours the field
  // for consumers with no legacy to preserve.
  const engineContext = React.useMemo(
    () => ({
      user: userContext.user ?? {},
      data: userContext.data ?? {},
      completedTasks: [] as string[],
      completedTours: [] as string[],
    }),
    [userContext]
  )

  // ONE literal, referenced twice. Written during render on purpose: a child's
  // layout effect can call a verb before this provider's effects run, so the
  // factory must already see this render's props. Two literals here would be a
  // silent bug the types cannot catch — add a key to one and not the other and
  // the factory reads `undefined` on first construction.
  const current = {
    checklists: checklistConfigs,
    context: engineContext,
    persistence,
    analytics,
    onTaskComplete,
    onTaskUncomplete,
    onChecklistComplete,
    onChecklistDismiss,
    onTaskAction,
  }
  const latest = React.useRef(current)
  latest.current = current

  // Two seeds, and they are not the same seed.
  //
  // The FACTORY seeds the engine: a child's layout effect (`<ChecklistPanel>`
  // calls `setExpanded(defaultExpanded)`) runs before this provider's own
  // effects, so everything a child verb can read has to exist at `ensure()`.
  // `boot()` is NOT called here — it reads storage, and this package is
  // SSR-hydrated (see `handle.ts`).
  //
  // The HANDLE seeds the pre-verb SNAPSHOT: `createHandle` is lazy by contract
  // and NO verb runs on a server, so without `seedChecklistsState` every read
  // during the server render answers from the empty constant and every
  // `<ChecklistPanel>` returns null — the checklist would simply stop being in
  // the HTML we send. Decision 5a; `ssr-render.test.tsx` pins it. Computed in
  // this initializer so it is ONE object for the life of the mount —
  // `useSyncExternalStore` compares with `Object.is`.
  const [handle] = React.useState(() => {
    // ONE seed object, handed to both the handle and the engine. If the engine
    // derived its own, `handle.getState()` would return an equal-but-distinct
    // object after the first `ensure()`, the construction fan-out would look
    // like a state change, and every consumer would render twice.
    const seed = seedChecklistsState<ChecklistConfig>(
      latest.current.checklists,
      latest.current.context
    )
    return createChecklistsHandle<ChecklistConfig>(() => {
      const engine: ChecklistsEngine<ChecklistConfig> = createChecklistsEngine<ChecklistConfig>({
        checklists: latest.current.checklists,
        context: latest.current.context,
        persistence: latest.current.persistence,
        initialState: seed,
        onTaskComplete: (checklistId, taskId, changed) => {
          const checklist = engine.getState().checklists.get(checklistId)
          const task = checklist?.tasks.find((t) => t.config.id === taskId)
          // `changed` is the provider's old `!task.completed` guard, which a
          // post-dispatch read cannot reconstruct. Without it a redundant
          // `completeTask` double-fires the event — a bug this repo has
          // shipped before. `completedCount` needs no `+ 1` here: the old
          // guard read a PRE-dispatch snapshot, this reads the post-dispatch
          // one, so the number is already the same.
          if (changed && checklist && task) {
            latest.current.analytics?.track('checklist_task_completed', {
              tourId: checklistId,
              metadata: {
                checklistId,
                taskId,
                taskTitle: task.config.title,
                completedCount: checklist.completedCount,
                totalCount: checklist.totalCount,
              },
            })
          }
          latest.current.onTaskComplete?.(checklistId, taskId)
        },
        onTaskUncomplete: (checklistId, taskId) =>
          latest.current.onTaskUncomplete?.(checklistId, taskId),
        // Note both of these forward WITHOUT `changed`: the consumer's props
        // fire unconditionally today and must keep doing so. Only analytics
        // reads the flag.
        onChecklistComplete: (checklistId) => {
          const checklist = engine.getState().checklists.get(checklistId)
          latest.current.analytics?.track('checklist_completed', {
            tourId: checklistId,
            metadata: {
              checklistId,
              completedCount: checklist?.completedCount ?? 0,
              totalCount: checklist?.totalCount ?? 0,
            },
          })
          latest.current.onChecklistComplete?.(checklistId)
        },
        onChecklistDismiss: (checklistId) => latest.current.onChecklistDismiss?.(checklistId),
        onTaskAction: (checklistId, taskId, action) =>
          latest.current.onTaskAction?.(checklistId, taskId, action),
      })
      return engine
    }, seed)
  })

  const snapshot = React.useSyncExternalStore(handle.subscribe, handle.getState, handle.getState)

  // Config / context changes after mount. The provider had no equivalent — a
  // `useReducer` closure just read the new value on the next dispatch — so
  // these two are new, and both would fire on EVERY render if they were not
  // guarded: `checklists={[…]}` is an inline literal in every example and doc
  // in this repo, and `context` defaults to a fresh `{}`. The guard lives in
  // the engine (`setChecklists`/`setContext` diff by value and return before
  // dispatching), so an identity-only change costs one string compare and
  // notifies nobody. Decision 16.
  React.useEffect(() => {
    handle.setChecklists(checklistConfigs)
  }, [checklistConfigs, handle])

  React.useEffect(() => {
    handle.setContext(engineContext)
  }, [engineContext, handle])

  React.useEffect(() => {
    handle.boot()
    // The urlVisit behaviour is attached by the binding, not by `boot()`:
    // `release()` defers `destroy()` by a microtask, and this teardown has to
    // land in the same tick as the unmount.
    const detachUrlVisit = attachUrlVisitTasks(handle.ensure())
    return () => {
      detachUrlVisit()
      handle.release()
    }
  }, [handle])

  // Same object the engine got — one memo, not two, and `completedTours` is
  // `[]` on both sides exactly as the pre-extraction provider had it.
  const contextValue = React.useMemo<ChecklistContextValue>(
    () => ({
      checklists: snapshot.checklists,
      context: engineContext,
      getChecklist: handle.getChecklist,
      completeTask: handle.completeTask,
      uncompleteTask: handle.uncompleteTask,
      executeAction: handle.executeAction,
      dismissChecklist: handle.dismissChecklist,
      restoreChecklist: handle.restoreChecklist,
      toggleExpanded: handle.toggleExpanded,
      setExpanded: handle.setExpanded,
      resetChecklist: handle.resetChecklist,
      resetAll: handle.resetAll,
      getProgress: handle.getProgress,
    }),
    [snapshot.checklists, engineContext, handle]
  )

  return (
    <LicenseGate require="pro">
      <ChecklistContext.Provider value={contextValue}>{children}</ChecklistContext.Provider>
    </LicenseGate>
  )
}
