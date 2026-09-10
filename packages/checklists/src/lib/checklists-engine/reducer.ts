/**
 * v3 Phase 2 — the checklists reducer, lifted out of `checklist-provider.tsx`
 * (`:25-324`) unchanged except for the two signature changes below.
 *
 * It was already pure; `useReducer` was currying `(configs, context)` into it.
 * That currying is now an explicit `ReducerContext` parameter, so a non-React
 * caller can drive the same state machine.
 */
import { canCompleteTask } from './dependencies'
import type {
  ChecklistContextData,
  ChecklistsAction,
  ChecklistsEngineState,
  EngineChecklistConfig,
  EngineChecklistState,
  EngineTaskState,
  PersistedChecklistState,
} from './types'

export interface ReducerContext<TConfig extends EngineChecklistConfig = EngineChecklistConfig> {
  configs: TConfig[]
  context: ChecklistContextData
}

function createInitialTaskState<TConfig extends EngineChecklistConfig>(
  task: TConfig['tasks'][number],
  context: ChecklistContextData,
  completedTasks: Set<string>,
  allTasks: TConfig['tasks'],
  completedAtMap: Record<string, number> | undefined
): EngineTaskState<TConfig['tasks'][number]> {
  const visible = task.when ? task.when(context) : true
  const locked = !canCompleteTask(task, completedTasks, allTasks)
  const completed = completedTasks.has(task.id)

  return {
    config: task,
    completed,
    locked,
    visible,
    completedAt: completed ? completedAtMap?.[task.id] : undefined,
  }
}

export function createChecklistState<TConfig extends EngineChecklistConfig>(
  config: TConfig,
  context: ChecklistContextData,
  completedTasks: Set<string>,
  isDismissed: boolean,
  isExpanded: boolean,
  completedAtMap: Record<string, number> | undefined
): EngineChecklistState<TConfig> {
  const tasks = config.tasks.map((task) =>
    createInitialTaskState<TConfig>(task, context, completedTasks, config.tasks, completedAtMap)
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

function handleTaskCompletion<TConfig extends EngineChecklistConfig>(
  state: ChecklistsEngineState<TConfig>,
  checklistId: string,
  taskId: string,
  complete: boolean,
  at: number | undefined,
  { configs, context }: ReducerContext<TConfig>
): ChecklistsEngineState<TConfig> {
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

  const newCompletedAt = { ...state.completedAt }
  const checklistCompletedAt = { ...(newCompletedAt[checklistId] ?? {}) }
  if (complete && at !== undefined) {
    checklistCompletedAt[taskId] = at
  } else {
    delete checklistCompletedAt[taskId]
  }
  newCompletedAt[checklistId] = checklistCompletedAt

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
      state.checklists.get(checklistId)?.isExpanded ?? true,
      checklistCompletedAt
    )
  )

  return {
    ...state,
    completed: newCompleted,
    completedAt: newCompletedAt,
    checklists: newChecklists,
  }
}

function handleDismissRestore<TConfig extends EngineChecklistConfig>(
  state: ChecklistsEngineState<TConfig>,
  checklistId: string,
  dismiss: boolean
): ChecklistsEngineState<TConfig> {
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

function handleLoadPersisted<TConfig extends EngineChecklistConfig>(
  current: ChecklistsEngineState<TConfig>,
  persisted: PersistedChecklistState,
  { configs, context }: ReducerContext<TConfig>
): ChecklistsEngineState<TConfig> {
  const newCompleted: Record<string, Set<string>> = {}
  for (const [id, tasks] of Object.entries(persisted.completed)) {
    newCompleted[id] = new Set(tasks)
  }
  const newDismissed = new Set(persisted.dismissed)
  const newCompletedAt: Record<string, Record<string, number>> = {}
  for (const [id, map] of Object.entries(persisted.completedAt ?? {})) {
    newCompletedAt[id] = { ...map }
  }
  const newNotifiedComplete = new Set(persisted.notifiedComplete ?? [])

  const newChecklists = new Map<string, EngineChecklistState<TConfig>>()
  for (const config of configs) {
    const tasks = newCompleted[config.id] ?? new Set<string>()
    newChecklists.set(
      config.id,
      createChecklistState(
        config,
        { ...context, completedTasks: Array.from(tasks) },
        tasks,
        newDismissed.has(config.id),
        // v3 Phase 2 — hydration must not clobber a live expansion. The
        // pre-extraction provider hard-coded `true` here, so a
        // `<ChecklistPanel defaultExpanded={false}>` re-expanded the moment a
        // persisted blob loaded (its own layout effect had already run).
        current.checklists.get(config.id)?.isExpanded ?? true,
        newCompletedAt[config.id]
      )
    )
  }

  return {
    completed: newCompleted,
    dismissed: newDismissed,
    checklists: newChecklists,
    completedAt: newCompletedAt,
    notifiedComplete: newNotifiedComplete,
  }
}

/**
 * Rebuild the checklist map from `configs`, preserving everything the user has
 * done to it: completions, timestamps, dismissals and per-checklist expansion.
 */
function handleSetChecklists<TConfig extends EngineChecklistConfig>(
  state: ChecklistsEngineState<TConfig>,
  { configs, context }: ReducerContext<TConfig>
): ChecklistsEngineState<TConfig> {
  const newChecklists = new Map<string, EngineChecklistState<TConfig>>()
  for (const config of configs) {
    const tasks = state.completed[config.id] ?? new Set<string>()
    newChecklists.set(
      config.id,
      createChecklistState(
        config,
        { ...context, completedTasks: Array.from(tasks) },
        tasks,
        state.dismissed.has(config.id),
        state.checklists.get(config.id)?.isExpanded ?? true,
        state.completedAt[config.id]
      )
    )
  }
  return { ...state, checklists: newChecklists }
}

/**
 * Record every checklist that is complete and not yet recorded.
 *
 * Applied by the engine immediately after the reducer, as a separate step, so
 * that the ids it ADDS are exactly the checklists that completed just now. The
 * engine fires `onChecklistComplete` for that difference instead of dispatching
 * a second action from inside the first — which used to notify subscribers a
 * second time, costing every consumer two renders on a completing verb where a
 * non-completing one cost a single render.
 *
 * It has to be separate from `LOAD_PERSISTED`'s own write: hydration restores a
 * whole `notifiedComplete` set from storage, and those are records of past
 * completions, not new ones. Diffing against the pre-mark state is what keeps a
 * reload silent.
 *
 * Returns the SAME object when nothing changed, so the identity no-ops hold.
 */
export function markNewlyComplete<TConfig extends EngineChecklistConfig>(
  state: ChecklistsEngineState<TConfig>
): ChecklistsEngineState<TConfig> {
  let notified: Set<string> | null = null
  for (const [id, checklist] of state.checklists) {
    if (checklist.isComplete && !state.notifiedComplete.has(id)) {
      notified ??= new Set(state.notifiedComplete)
      notified.add(id)
    }
  }
  return notified ? { ...state, notifiedComplete: notified } : state
}

export function checklistsReducer<TConfig extends EngineChecklistConfig>(
  state: ChecklistsEngineState<TConfig>,
  action: ChecklistsAction,
  reducerCtx: ReducerContext<TConfig>
): ChecklistsEngineState<TConfig> {
  const { configs, context } = reducerCtx

  switch (action.type) {
    case 'COMPLETE_TASK':
      return handleTaskCompletion(
        state,
        action.checklistId,
        action.taskId,
        true,
        action.at,
        reducerCtx
      )

    case 'UNCOMPLETE_TASK':
      return handleTaskCompletion(
        state,
        action.checklistId,
        action.taskId,
        false,
        undefined,
        reducerCtx
      )

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

      const newCompletedAt = { ...state.completedAt }
      delete newCompletedAt[action.checklistId]

      const newNotifiedComplete = new Set(state.notifiedComplete)
      newNotifiedComplete.delete(action.checklistId)

      const newChecklists = new Map(state.checklists)
      newChecklists.set(
        action.checklistId,
        createChecklistState(config, context, new Set(), false, true, undefined)
      )

      return {
        completed: newCompleted,
        dismissed: newDismissed,
        checklists: newChecklists,
        completedAt: newCompletedAt,
        notifiedComplete: newNotifiedComplete,
      }
    }

    case 'RESET_ALL': {
      const newChecklists = new Map<string, EngineChecklistState<TConfig>>()
      for (const config of configs) {
        newChecklists.set(
          config.id,
          createChecklistState(config, context, new Set(), false, true, undefined)
        )
      }
      return {
        completed: {},
        dismissed: new Set(),
        checklists: newChecklists,
        completedAt: {},
        notifiedComplete: new Set(),
      }
    }

    case 'LOAD_PERSISTED':
      return handleLoadPersisted(state, action.state, reducerCtx)

    case 'SET_CHECKLISTS':
      return handleSetChecklists(state, reducerCtx)

    default:
      return state
  }
}
