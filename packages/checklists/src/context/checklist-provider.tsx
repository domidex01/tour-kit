'use client'

import { ProGate } from '@tour-kit/license'
import * as React from 'react'
import { useChecklistPersistence } from '../hooks/use-checklist-persistence'
import type {
  ChecklistConfig,
  ChecklistContext as ChecklistContextType,
  ChecklistProgress,
  ChecklistProviderConfig,
  ChecklistState,
  ChecklistTaskState,
  PersistedChecklistState,
} from '../types'
import { canCompleteTask } from '../utils/dependencies'
import { calculateProgress } from '../utils/progress'
import { ChecklistContext, type ChecklistContextValue } from './checklist-context'

interface ChecklistProviderProps extends ChecklistProviderConfig {
  children: React.ReactNode
}

type ChecklistAction =
  | { type: 'COMPLETE_TASK'; checklistId: string; taskId: string }
  | { type: 'UNCOMPLETE_TASK'; checklistId: string; taskId: string }
  | { type: 'DISMISS_CHECKLIST'; checklistId: string }
  | { type: 'RESTORE_CHECKLIST'; checklistId: string }
  | { type: 'SET_EXPANDED'; checklistId: string; expanded: boolean }
  | { type: 'RESET_CHECKLIST'; checklistId: string }
  | { type: 'RESET_ALL' }
  | { type: 'LOAD_PERSISTED'; state: PersistedChecklistState }

interface ChecklistReducerState {
  checklists: Map<string, ChecklistState>
  completed: Record<string, Set<string>>
  dismissed: Set<string>
}

function createInitialTaskState(
  task: ChecklistConfig['tasks'][0],
  context: ChecklistContextType,
  completedTasks: Set<string>,
  allTasks: ChecklistConfig['tasks']
): ChecklistTaskState {
  const visible = task.when ? task.when(context) : true
  const locked = !canCompleteTask(task, completedTasks, allTasks)
  const completed = completedTasks.has(task.id)

  return {
    config: task,
    completed,
    locked,
    visible,
    active: false,
    completedAt: completed ? Date.now() : undefined,
  }
}

function createChecklistState(
  config: ChecklistConfig,
  context: ChecklistContextType,
  completedTasks: Set<string>,
  isDismissed: boolean,
  isExpanded: boolean
): ChecklistState {
  const tasks = config.tasks.map((task) =>
    createInitialTaskState(task, context, completedTasks, config.tasks)
  )

  const visibleTasks = tasks.filter((t) => t.visible)
  const completedCount = visibleTasks.filter((t) => t.completed).length
  const totalCount = visibleTasks.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return {
    config,
    tasks,
    progress,
    completedCount,
    totalCount,
    isComplete: completedCount === totalCount && totalCount > 0,
    isDismissed,
    isExpanded,
  }
}

interface ReducerContext {
  configs: ChecklistConfig[]
  context: ChecklistContextType
}

function handleTaskCompletion(
  state: ChecklistReducerState,
  checklistId: string,
  taskId: string,
  complete: boolean,
  { configs, context }: ReducerContext
): ChecklistReducerState {
  const existing = state.completed[checklistId] ?? new Set<string>()
  const alreadyComplete = existing.has(taskId)
  if (complete === alreadyComplete) return state

  const newCompleted = { ...state.completed }
  const tasks = new Set(existing)
  if (complete) {
    tasks.add(taskId)
  } else {
    tasks.delete(taskId)
  }
  newCompleted[checklistId] = tasks

  const config = configs.find((c) => c.id === checklistId)
  if (!config) return state

  const newChecklists = new Map(state.checklists)
  newChecklists.set(
    checklistId,
    createChecklistState(
      config,
      { ...context, completedTasks: Array.from(tasks) },
      tasks,
      state.dismissed.has(checklistId),
      state.checklists.get(checklistId)?.isExpanded ?? true
    )
  )

  return { ...state, completed: newCompleted, checklists: newChecklists }
}

function handleDismissRestore(
  state: ChecklistReducerState,
  checklistId: string,
  dismiss: boolean
): ChecklistReducerState {
  const newDismissed = new Set(state.dismissed)
  if (dismiss) {
    newDismissed.add(checklistId)
  } else {
    newDismissed.delete(checklistId)
  }

  const newChecklists = new Map(state.checklists)
  const existing = newChecklists.get(checklistId)
  if (existing) {
    newChecklists.set(checklistId, { ...existing, isDismissed: dismiss })
  }

  return { ...state, dismissed: newDismissed, checklists: newChecklists }
}

function handleLoadPersisted(
  state: PersistedChecklistState,
  { configs, context }: ReducerContext
): ChecklistReducerState {
  const newCompleted: Record<string, Set<string>> = {}
  for (const [id, tasks] of Object.entries(state.completed)) {
    newCompleted[id] = new Set(tasks)
  }
  const newDismissed = new Set(state.dismissed)

  const newChecklists = new Map<string, ChecklistState>()
  for (const config of configs) {
    const tasks = newCompleted[config.id] ?? new Set()
    newChecklists.set(
      config.id,
      createChecklistState(
        config,
        { ...context, completedTasks: Array.from(tasks) },
        tasks,
        newDismissed.has(config.id),
        true
      )
    )
  }

  return { completed: newCompleted, dismissed: newDismissed, checklists: newChecklists }
}

function checklistReducer(
  state: ChecklistReducerState,
  action: ChecklistAction,
  configs: ChecklistConfig[],
  context: ChecklistContextType
): ChecklistReducerState {
  const reducerCtx: ReducerContext = { configs, context }

  switch (action.type) {
    case 'COMPLETE_TASK':
      return handleTaskCompletion(state, action.checklistId, action.taskId, true, reducerCtx)

    case 'UNCOMPLETE_TASK':
      return handleTaskCompletion(state, action.checklistId, action.taskId, false, reducerCtx)

    case 'DISMISS_CHECKLIST': {
      if (state.dismissed.has(action.checklistId)) return state
      return handleDismissRestore(state, action.checklistId, true)
    }

    case 'RESTORE_CHECKLIST': {
      if (!state.dismissed.has(action.checklistId)) return state
      return handleDismissRestore(state, action.checklistId, false)
    }

    case 'SET_EXPANDED': {
      const existing = state.checklists.get(action.checklistId)
      if (!existing) return state
      if (existing.isExpanded === action.expanded) return state
      const newChecklists = new Map(state.checklists)
      newChecklists.set(action.checklistId, { ...existing, isExpanded: action.expanded })
      return { ...state, checklists: newChecklists }
    }

    case 'RESET_CHECKLIST': {
      const config = configs.find((c) => c.id === action.checklistId)
      if (!config) return state

      const newCompleted = { ...state.completed }
      delete newCompleted[action.checklistId]

      const newDismissed = new Set(state.dismissed)
      newDismissed.delete(action.checklistId)

      const newChecklists = new Map(state.checklists)
      newChecklists.set(
        action.checklistId,
        createChecklistState(config, context, new Set(), false, true)
      )

      return { completed: newCompleted, dismissed: newDismissed, checklists: newChecklists }
    }

    case 'RESET_ALL': {
      const newChecklists = new Map<string, ChecklistState>()
      for (const config of configs) {
        newChecklists.set(config.id, createChecklistState(config, context, new Set(), false, true))
      }
      return { completed: {}, dismissed: new Set(), checklists: newChecklists }
    }

    case 'LOAD_PERSISTED':
      return handleLoadPersisted(action.state, reducerCtx)

    default:
      return state
  }
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
  // Track completed checklists to prevent duplicate callbacks
  const completedChecklistsRef = React.useRef(new Set<string>())

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
        createChecklistState(config, checklistContext, new Set(), false, true)
      )
    }
    return {
      checklists,
      completed: {},
      dismissed: new Set(),
    }
  }, [checklistConfigs, checklistContext])

  const [state, dispatch] = React.useReducer(
    (s: ChecklistReducerState, a: ChecklistAction) =>
      checklistReducer(s, a, checklistConfigs, checklistContext),
    initialState
  )

  // Persistence
  const { save, load } = useChecklistPersistence(persistence)

  // Load persisted state on mount
  React.useEffect(() => {
    const persisted = load()
    if (persisted) {
      dispatch({ type: 'LOAD_PERSISTED', state: persisted })
    }
  }, [load])

  // Save state changes
  React.useEffect(() => {
    const persistedState: PersistedChecklistState = {
      completed: Object.fromEntries(
        Object.entries(state.completed).map(([k, v]) => [k, Array.from(v)])
      ),
      dismissed: Array.from(state.dismissed),
      timestamp: Date.now(),
    }
    save(persistedState)
  }, [state.completed, state.dismissed, save])

  // Check for checklist completion
  React.useEffect(() => {
    for (const [id, checklist] of state.checklists) {
      if (checklist.isComplete && !completedChecklistsRef.current.has(id)) {
        completedChecklistsRef.current.add(id)
        onChecklistComplete?.(id)
        checklist.config.onComplete?.()
      }
    }
  }, [state.checklists, onChecklistComplete])

  // Actions
  const completeTask = React.useCallback(
    (checklistId: string, taskId: string) => {
      dispatch({ type: 'COMPLETE_TASK', checklistId, taskId })
      onTaskComplete?.(checklistId, taskId)
    },
    [onTaskComplete]
  )

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
    completedChecklistsRef.current.delete(checklistId)
    dispatch({ type: 'RESET_CHECKLIST', checklistId })
  }, [])

  const resetAll = React.useCallback(() => {
    completedChecklistsRef.current.clear()
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
    <ProGate package="@tour-kit/checklists">
      <ChecklistContext.Provider value={contextValue}>{children}</ChecklistContext.Provider>
    </ProGate>
  )
}
