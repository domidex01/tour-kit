/**
 * v3 Phase 2 — `createChecklistsEngine()`, the React-free checklists state
 * machine.
 *
 * Contract (copied from `create-tour-engine.ts:16-27`):
 *  - the constructor is INERT: no storage, no `window`, no listener attached
 *    until `boot()`. Constructing one on a server is safe and does nothing.
 *  - `getState()` is reference-stable between dispatches — it returns the
 *    reducer's own object, so `useSyncExternalStore` and Vue's `shallowRef`
 *    can compare with `Object.is`.
 *  - `subscribe()` notifies synchronously and takes no argument; listeners
 *    read `getState()`.
 *  - `destroy()` is terminal: every verb becomes a no-op and listeners drop.
 *
 * Persistence is engine-owned rather than an `attach*` leaf, for the reason
 * core's storage adapters are: the hydrated `completed` set gates
 * `canCompleteTask`, so hydration is lifecycle, not decoration.
 */
import { createListeners } from '@tour-kit/core/engine'
import { freezeState, loadState, saveState } from './persistence'
import { progressOf } from './progress'
import { checklistsReducer, markNewlyComplete } from './reducer'
import type {
  ChecklistContextData,
  ChecklistPersistenceConfig,
  ChecklistProgress,
  ChecklistsAction,
  ChecklistsEngineCallbacks,
  ChecklistsEngineState,
  EngineChecklistConfig,
  EngineChecklistState,
} from './types'

export interface CreateChecklistsEngineOptions<TConfig extends EngineChecklistConfig>
  extends ChecklistsEngineCallbacks {
  checklists?: TConfig[]
  context?: Partial<ChecklistContextData>
  persistence?: ChecklistPersistenceConfig
  /**
   * The state to start from, instead of deriving one from `checklists`.
   *
   * A binding that also seeds its handle passes the SAME object to both, so
   * that `handle.getState()` is identity-stable across the first `ensure()`.
   * Without it the construction fan-out hands `useSyncExternalStore` an equal
   * but distinct snapshot and every consumer renders a second time — measured
   * against `checklist.test.tsx`, which counts `renderTask` calls.
   */
  initialState?: ChecklistsEngineState<TConfig>
}

export interface ChecklistsEngine<TConfig extends EngineChecklistConfig = EngineChecklistConfig> {
  getState: () => ChecklistsEngineState<TConfig>
  subscribe: (listener: () => void) => () => void
  /** Resolve storage and hydrate. Idempotent. */
  boot: () => void
  /** Register/refresh the config set. Safe before and after `boot()`. */
  setChecklists: (checklists: TConfig[]) => void
  setContext: (context: Partial<ChecklistContextData>) => void
  completeTask: (checklistId: string, taskId: string) => void
  uncompleteTask: (checklistId: string, taskId: string) => void
  executeAction: (checklistId: string, taskId: string) => void
  dismissChecklist: (checklistId: string) => void
  restoreChecklist: (checklistId: string) => void
  toggleExpanded: (checklistId: string) => void
  setExpanded: (checklistId: string, expanded: boolean) => void
  resetChecklist: (checklistId: string) => void
  resetAll: () => void
  getChecklist: (id: string) => EngineChecklistState<TConfig> | undefined
  getProgress: (checklistId: string) => ChecklistProgress
  destroy: () => void
}

const EMPTY_STATE: ChecklistsEngineState<never> = Object.freeze({
  checklists: new Map(),
  completed: {},
  dismissed: new Set<string>(),
  completedAt: {},
  notifiedComplete: new Set<string>(),
})

/**
 * The snapshot every binding reads before the first verb — on the server,
 * where no effect runs, the only snapshot it ever reads. One module constant:
 * `useSyncExternalStore` compares with `Object.is`.
 */
export function initialChecklistsState<
  TConfig extends EngineChecklistConfig,
>(): ChecklistsEngineState<TConfig> {
  return EMPTY_STATE
}

const resolveContext = (next?: Partial<ChecklistContextData>): ChecklistContextData => ({
  user: next?.user ?? {},
  data: next?.data ?? {},
  completedTasks: [],
  completedTours: next?.completedTours ?? [],
})

/**
 * The state a fresh engine would hold — config-derived, storage-free,
 * `boot()`-free, and built without constructing anything.
 *
 * A binding hands this to `createChecklistsHandle` as the snapshot to answer
 * with before the first verb. `createHandle` is lazy by contract ("never from
 * render"), so on a server NO verb ever runs; without a seed the whole server
 * render sees the empty constant and every `<ChecklistPanel>` returns `null`.
 * Measured: the pre-extraction provider server-renders the panel, so this is
 * what keeps the SSR payload intact (v3 Phase 2, Decision 5a). It deliberately
 * does NOT read storage — persisted state must not reach the first render
 * (`dee2a1f1`).
 */
export function seedChecklistsState<TConfig extends EngineChecklistConfig>(
  checklists: TConfig[],
  context?: Partial<ChecklistContextData>
): ChecklistsEngineState<TConfig> {
  if (checklists.length === 0) return initialChecklistsState<TConfig>()
  return checklistsReducer(
    initialChecklistsState<TConfig>(),
    { type: 'SET_CHECKLISTS' },
    { configs: checklists, context: resolveContext(context) }
  )
}

const NO_PERSISTENCE: ChecklistPersistenceConfig = { enabled: false }

/**
 * Ids only — see the ponytail note in Decision 16 for the ceiling.
 * Exported for `url-visit-tasks.ts`, which needs the same "did the config set
 * actually move" question. NOT on the `/engine` barrel: it is a seam two files
 * in this directory share, not a consumer API.
 *
 * ponytail: id-level comparison. A config whose task TITLE changes while every
 * id stays put will not re-register. Upgrade path when that bites: hash the
 * fields the engine actually reads (`when`, `dependsOn`, `completedWhen`,
 * `manualComplete`) rather than deep-equal the whole config, which would pull
 * function identity into the comparison and never settle.
 */
export const signature = (cs: readonly EngineChecklistConfig[]): string =>
  cs.map((c) => `${c.id}:${c.tasks.map((t) => t.id).join(',')}`).join('|')

const shallowEqual = (a: Record<string, unknown>, b: Record<string, unknown>): boolean => {
  const ka = Object.keys(a)
  return ka.length === Object.keys(b).length && ka.every((k) => a[k] === b[k])
}

const sameContext = (a: ChecklistContextData, b: ChecklistContextData): boolean =>
  shallowEqual(a.user, b.user) &&
  shallowEqual(a.data, b.data) &&
  a.completedTours.join(',') === b.completedTours.join(',')

/**
 * The ids `markNewlyComplete` added — i.e. the checklists that completed in
 * this transition.
 *
 * Diffing the post-mark set against the PRE-mark one is what keeps a reload
 * silent: `LOAD_PERSISTED` restores a whole `notifiedComplete` set from
 * storage, and those are records of past completions, not new ones. Diffing
 * against the previous state instead would re-fire every one of them on boot.
 */
const addedTo = (before: ReadonlySet<string>, after: ReadonlySet<string>): string[] => {
  if (before === after) return []
  const added: string[] = []
  for (const id of after) if (!before.has(id)) added.push(id)
  return added
}

export function createChecklistsEngine<
  TConfig extends EngineChecklistConfig = EngineChecklistConfig,
>(options: CreateChecklistsEngineOptions<TConfig> = {}): ChecklistsEngine<TConfig> {
  let configs: TConfig[] = options.checklists ?? []
  let context: ChecklistContextData = resolveContext(options.context)
  const persistence = options.persistence ?? NO_PERSISTENCE
  let state: ChecklistsEngineState<TConfig> = initialChecklistsState<TConfig>()
  let booted = false
  let destroyed = false
  // Shared and fault-isolated since PR #137 — a throwing subscriber must not
  // drop the ones after it. Never hand-roll this Set again.
  const listeners = createListeners('createChecklistsEngine')

  /** Run `mutate`, report whether the state actually moved. */
  const changed = (mutate: () => void): boolean => {
    const before = state
    mutate()
    return state !== before
  }

  const dispatch = (action: ChecklistsAction): void => {
    if (destroyed) return
    const reduced = checklistsReducer(state, action, { configs, context })
    const next = markNewlyComplete(reduced)
    if (next === state) return
    const persistedSlicesChanged =
      next.completed !== state.completed ||
      next.dismissed !== state.dismissed ||
      next.completedAt !== state.completedAt ||
      next.notifiedComplete !== state.notifiedComplete
    const newlyComplete = addedTo(reduced.notifiedComplete, next.notifiedComplete)
    state = next
    if (booted && persistedSlicesChanged) saveState(persistence, freezeState(state))
    listeners.notify()
    for (const id of newlyComplete) {
      options.onChecklistComplete?.(id)
      state.checklists.get(id)?.config.onComplete?.()
    }
  }

  const api: ChecklistsEngine<TConfig> = {
    getState: () => state,

    subscribe: (listener) => listeners.add(listener),

    boot: () => {
      if (destroyed || booted) return
      booted = true
      const result = loadState(persistence)
      if (result instanceof Promise) {
        result.then((persisted) => {
          if (!destroyed && persisted) dispatch({ type: 'LOAD_PERSISTED', state: persisted })
        })
      } else if (result) {
        dispatch({ type: 'LOAD_PERSISTED', state: result })
      }
    },

    // Value-diffed, not identity-diffed: every example in this repo passes an
    // inline `checklists={[…]}` literal, so identity moves on every parent
    // render while nothing about the configs has changed. Dispatching there
    // would rebuild the whole map and re-render every consumer for nothing.
    setChecklists: (next) => {
      if (destroyed) return
      if (signature(next) === signature(configs)) {
        configs = next
        return
      }
      configs = next
      dispatch({ type: 'SET_CHECKLISTS' })
    },

    // Same guard, same reason: `context` defaults to a fresh `{}` per render.
    setContext: (next) => {
      if (destroyed) return
      const resolved = resolveContext(next)
      if (sameContext(resolved, context)) return
      context = resolved
      dispatch({ type: 'SET_CHECKLISTS' })
    },

    // The `changed` flag is what lets the binding keep the provider's
    // `!task.completed` analytics guard (`checklist-provider.tsx:443`) without
    // being able to see the pre-dispatch state — and it makes `destroy()`
    // terminal for callbacks, not just for state.
    completeTask: (checklistId, taskId) => {
      const moved = changed(() =>
        dispatch({ type: 'COMPLETE_TASK', checklistId, taskId, at: Date.now() })
      )
      if (!destroyed) options.onTaskComplete?.(checklistId, taskId, moved)
    },

    uncompleteTask: (checklistId, taskId) => {
      const moved = changed(() => dispatch({ type: 'UNCOMPLETE_TASK', checklistId, taskId }))
      if (!destroyed) options.onTaskUncomplete?.(checklistId, taskId, moved)
    },

    executeAction: (checklistId, taskId) => {
      if (destroyed) return
      const checklist = state.checklists.get(checklistId)
      const task = checklist?.tasks.find((t) => t.config.id === taskId)
      if (!task?.config.action) return

      options.onTaskAction?.(checklistId, taskId, task.config.action)

      const action = task.config.action
      switch (action.type) {
        case 'navigate':
          if (typeof window !== 'undefined') {
            if (action.external) {
              window.open(action.url, '_blank')
            } else {
              window.location.href = action.url
            }
          }
          break
        case 'callback':
          action.handler()
          break
        case 'tour':
        case 'modal':
        case 'custom':
          break
      }

      if (task.config.manualComplete !== false) {
        api.completeTask(checklistId, taskId)
      }
    },

    dismissChecklist: (checklistId) => {
      const moved = changed(() => dispatch({ type: 'DISMISS_CHECKLIST', checklistId }))
      if (destroyed) return
      options.onChecklistDismiss?.(checklistId, moved)
      // Unconditional, exactly as `checklist-provider.tsx` did — a second
      // dismiss re-fires `config.onDismiss` today and must keep doing so.
      // Only the ANALYTICS side reads `moved`.
      state.checklists.get(checklistId)?.config.onDismiss?.()
    },

    restoreChecklist: (checklistId) => {
      dispatch({ type: 'RESTORE_CHECKLIST', checklistId })
    },

    toggleExpanded: (checklistId) => {
      const current = state.checklists.get(checklistId)?.isExpanded ?? true
      dispatch({ type: 'SET_EXPANDED', checklistId, expanded: !current })
    },

    setExpanded: (checklistId, expanded) => {
      dispatch({ type: 'SET_EXPANDED', checklistId, expanded })
    },

    resetChecklist: (checklistId) => {
      dispatch({ type: 'RESET_CHECKLIST', checklistId })
    },

    resetAll: () => {
      dispatch({ type: 'RESET_ALL' })
    },

    getChecklist: (id) => state.checklists.get(id),

    getProgress: (checklistId) => progressOf(state, checklistId),

    destroy: () => {
      if (destroyed) return
      destroyed = true
      listeners.clear()
    },
  }

  state = options.initialState ?? seedChecklistsState<TConfig>(configs, options.context)

  return api
}
