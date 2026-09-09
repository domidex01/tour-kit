'use client'

import { useAnalyticsOptional } from '@tour-kit/analytics'
import { LicenseGate } from '@tour-kit/license'
import * as React from 'react'
import { registerUrlVisitTask } from '../engine/url-visit-listener'
import { useChecklistPersistence } from '../hooks/use-checklist-persistence'
import { freezeState } from '../lib/checklists-engine/persistence'
import { checklistsReducer, createChecklistState } from '../lib/checklists-engine/reducer'
import type { ChecklistsAction, ChecklistsEngineState } from '../lib/checklists-engine/types'
import type {
  ChecklistConfig,
  ChecklistContext as ChecklistContextType,
  ChecklistProgress,
  ChecklistProviderConfig,
  ChecklistState,
} from '../types'
import { calculateProgress } from '../utils/progress'
import { ChecklistContext, type ChecklistContextValue } from './checklist-context'

interface ChecklistProviderProps extends ChecklistProviderConfig {
  children: React.ReactNode
}

// v3 Phase 2 — the reducer, its five helpers and the state shape moved to
// `lib/checklists-engine/reducer.ts` (this file's former `:25-324`). The
// provider still drives them through `useReducer`; only the currying is
// explicit now. These two aliases keep the rest of this file unchanged.
type ChecklistAction = ChecklistsAction
type ChecklistReducerState = ChecklistsEngineState<ChecklistConfig>

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

  // Build context
  const checklistContext: ChecklistContextType = React.useMemo(
    () => ({
      user: userContext.user ?? {},
      data: userContext.data ?? {},
      completedTasks: [],
      completedTours: [],
    }),
    [userContext]
  )

  // Initialize state
  const initialState = React.useMemo<ChecklistReducerState>(() => {
    const checklists = new Map<string, ChecklistState>()
    for (const config of checklistConfigs) {
      checklists.set(
        config.id,
        createChecklistState(config, checklistContext, new Set(), false, true, undefined)
      )
    }
    return {
      checklists,
      completed: {},
      dismissed: new Set(),
      completedAt: {},
      notifiedComplete: new Set(),
    }
  }, [checklistConfigs, checklistContext])

  const [state, dispatch] = React.useReducer(
    (s: ChecklistReducerState, a: ChecklistAction) =>
      checklistsReducer(s, a, { configs: checklistConfigs, context: checklistContext }),
    initialState
  )

  // Persistence
  const { save, load } = useChecklistPersistence(persistence)

  // Load persisted state on mount (only once — re-running on consumer callback
  // ref changes causes race conditions with in-progress user edits).
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally mount-only
  React.useEffect(() => {
    const result = load()
    if (result instanceof Promise) {
      let cancelled = false
      result.then((persisted) => {
        if (!cancelled && persisted) {
          dispatch({ type: 'LOAD_PERSISTED', state: persisted })
        }
      })
      return () => {
        cancelled = true
      }
    }
    if (result) {
      dispatch({ type: 'LOAD_PERSISTED', state: result })
    }
    return undefined
  }, [])

  // Save state changes. Destructured so the effect depends on exactly the four
  // persisted slices — passing `state` whole would also re-save on every
  // expand/collapse, which is a write the pre-extraction provider never made.
  const { completed, dismissed, completedAt, notifiedComplete } = state
  React.useEffect(() => {
    save(freezeState({ completed, dismissed, completedAt, notifiedComplete }))
  }, [completed, dismissed, completedAt, notifiedComplete, save])

  // Check for checklist completion
  React.useEffect(() => {
    for (const [id, checklist] of state.checklists) {
      if (checklist.isComplete && !state.notifiedComplete.has(id)) {
        dispatch({ type: 'MARK_NOTIFIED_COMPLETE', checklistId: id })
        analytics?.track('checklist_completed', {
          tourId: id,
          metadata: {
            checklistId: id,
            completedCount: checklist.completedCount,
            totalCount: checklist.totalCount,
          },
        })
        onChecklistComplete?.(id)
        checklist.config.onComplete?.()
      }
    }
  }, [state.checklists, state.notifiedComplete, analytics, onChecklistComplete])

  // Actions
  const completeTask = React.useCallback(
    (checklistId: string, taskId: string) => {
      const checklist = state.checklists.get(checklistId)
      const task = checklist?.tasks.find((candidate) => candidate.config.id === taskId)

      dispatch({ type: 'COMPLETE_TASK', checklistId, taskId, at: Date.now() })
      if (checklist && task && !task.completed) {
        analytics?.track('checklist_task_completed', {
          tourId: checklistId,
          metadata: {
            checklistId,
            taskId,
            taskTitle: task.config.title,
            completedCount: checklist.completedCount + 1,
            totalCount: checklist.totalCount,
          },
        })
      }
      onTaskComplete?.(checklistId, taskId)
    },
    [state.checklists, analytics, onTaskComplete]
  )

  // Register `urlVisit` completions with the module-level listener.
  // Re-runs when configs change or when persistence loads (state.completed
  // shifts) so already-completed tasks aren't re-registered.
  React.useEffect(() => {
    const cleanups: Array<() => void> = []
    for (const checklist of checklistConfigs) {
      const completedSet = state.completed[checklist.id]
      for (const task of checklist.tasks) {
        const cw = task.completedWhen
        if (!cw || !('type' in cw) || cw.type !== 'urlVisit') continue
        if (completedSet?.has(task.id)) continue
        const compositeId = `${checklist.id}:${task.id}`
        cleanups.push(
          registerUrlVisitTask(compositeId, cw.urlPattern, () =>
            completeTask(checklist.id, task.id)
          )
        )
      }
    }
    return () => {
      for (const fn of cleanups) fn()
    }
  }, [checklistConfigs, state.completed, completeTask])

  const uncompleteTask = React.useCallback(
    (checklistId: string, taskId: string) => {
      dispatch({ type: 'UNCOMPLETE_TASK', checklistId, taskId })
      onTaskUncomplete?.(checklistId, taskId)
    },
    [onTaskUncomplete]
  )

  const executeAction = React.useCallback(
    (checklistId: string, taskId: string) => {
      const checklist = state.checklists.get(checklistId)
      const task = checklist?.tasks.find((t) => t.config.id === taskId)
      if (!task?.config.action) return

      onTaskAction?.(checklistId, taskId, task.config.action)

      const action = task.config.action
      switch (action.type) {
        case 'navigate':
          if (action.external) {
            window.open(action.url, '_blank')
          } else {
            window.location.href = action.url
          }
          break
        case 'callback':
          action.handler()
          break
        case 'tour':
          // Integration with TourKit
          // Will be handled by tour integration if enabled
          break
        case 'modal':
          // Custom modal handling
          break
        case 'custom':
          // Custom handling via onTaskAction
          break
      }

      // Auto-complete if manualComplete is true (default)
      if (task.config.manualComplete !== false) {
        completeTask(checklistId, taskId)
      }
    },
    [state.checklists, onTaskAction, completeTask]
  )

  const dismissChecklist = React.useCallback(
    (checklistId: string) => {
      dispatch({ type: 'DISMISS_CHECKLIST', checklistId })
      onChecklistDismiss?.(checklistId)
      state.checklists.get(checklistId)?.config.onDismiss?.()
    },
    [onChecklistDismiss, state.checklists]
  )

  const restoreChecklist = React.useCallback((checklistId: string) => {
    dispatch({ type: 'RESTORE_CHECKLIST', checklistId })
  }, [])

  const toggleExpanded = React.useCallback(
    (checklistId: string) => {
      const current = state.checklists.get(checklistId)?.isExpanded ?? true
      dispatch({ type: 'SET_EXPANDED', checklistId, expanded: !current })
    },
    [state.checklists]
  )

  const setExpanded = React.useCallback((checklistId: string, expanded: boolean) => {
    dispatch({ type: 'SET_EXPANDED', checklistId, expanded })
  }, [])

  const resetChecklist = React.useCallback((checklistId: string) => {
    dispatch({ type: 'RESET_CHECKLIST', checklistId })
  }, [])

  const resetAll = React.useCallback(() => {
    dispatch({ type: 'RESET_ALL' })
  }, [])

  const getChecklist = React.useCallback(
    (id: string) => state.checklists.get(id),
    [state.checklists]
  )

  const getProgress = React.useCallback(
    (checklistId: string): ChecklistProgress => {
      const checklist = state.checklists.get(checklistId)
      if (!checklist) {
        return { completed: 0, total: 0, percentage: 0, remaining: 0 }
      }
      return calculateProgress(checklist)
    },
    [state.checklists]
  )

  const contextValue = React.useMemo<ChecklistContextValue>(
    () => ({
      checklists: state.checklists,
      context: checklistContext,
      getChecklist,
      completeTask,
      uncompleteTask,
      executeAction,
      dismissChecklist,
      restoreChecklist,
      toggleExpanded,
      setExpanded,
      resetChecklist,
      resetAll,
      getProgress,
    }),
    [
      state.checklists,
      checklistContext,
      getChecklist,
      completeTask,
      uncompleteTask,
      executeAction,
      dismissChecklist,
      restoreChecklist,
      toggleExpanded,
      setExpanded,
      resetChecklist,
      resetAll,
      getProgress,
    ]
  )

  return (
    <LicenseGate require="pro">
      <ChecklistContext.Provider value={contextValue}>{children}</ChecklistContext.Provider>
    </LicenseGate>
  )
}
