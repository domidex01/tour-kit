/**
 * v3 Phase 1 — the hints engine: the provider's logic with React removed.
 *
 * Inert until `boot()`. The constructor touches nothing — no `window`, no
 * storage, no timer — so a non-React consumer can build one on the server and
 * boot it on the client. `boot()` resolves storage and hydrates every id
 * `setHints` has seen; after that, writes happen synchronously inside
 * `dispatch` whenever `frequencyState` changes, which is the provider's
 * persist-effect condition minus React's post-commit delay.
 *
 * Persistence lives HERE rather than as a detachable `attach*` leaf because
 * `showHint`'s frequency gate reads the HYDRATED state: hydration has to land
 * before the first verb that consults it, and a leaf would make that ordering
 * the consumer's problem. Core does the same — storage adapters are
 * engine-owned; `attach*` is for focus, keys, rects and spotlight.
 *
 * Four deliberate differences from the provider, all documented in the plan's
 * Decision 2: storage resolves at `boot()` not in render; there is no `hints`
 * constructor option (`setHints` is the one writer); `getState()` returns the
 * whole reducer state including `frequencyState`; and a dispatch notifies
 * per action rather than per React commit. Observable state is identical.
 */
import {
  canShowAfterDismissal,
  canShowByFrequency,
  createListeners,
  logger,
} from '@tour-kit/core/engine'
import type { FrequencyRule, HintsActions } from '@tour-kit/core/engine'
import { readPersistedEntries, resolveStorage, syncStorage } from './persistence'
import { emptyFrequencyState, hintsReducer } from './reducer'
import type { HintEngineConfig, HintsAction, HintsEngineState, HintsStorage } from './types'

export interface CreateHintsEngineOptions {
  /** Resolved at `boot()`, never in the constructor. `undefined` = `window.localStorage`. */
  storage?: HintsStorage
}

export interface HintsEngine extends HintsActions {
  /** Reference-stable between dispatches: the reducer's own state object. */
  getState: () => HintsEngineState
  /** Synchronous notify; listeners take no arguments and read `getState()`. */
  subscribe: (listener: () => void) => () => void
  /** Resolve storage and hydrate every id `setHints` has seen. Idempotent. */
  boot: () => void
  /** Register/unregister diff against the previous list; hydrates new ids once booted. */
  setHints: (hints: ReadonlyArray<HintEngineConfig>) => void
  /** Terminal: every verb becomes a no-op and listeners are dropped. */
  destroy: () => void
}

function index(hints: ReadonlyArray<HintEngineConfig>): Map<string, HintEngineConfig> {
  const m = new Map<string, HintEngineConfig>()
  for (const h of hints) m.set(h.id, h)
  return m
}

export function createHintsEngine(options: CreateHintsEngineOptions = {}): HintsEngine {
  let state: HintsEngineState = { hints: new Map(), activeHint: null, frequencyState: new Map() }
  let destroyed = false
  let booted = false
  let storage: HintsStorage | null = null
  let configs: ReadonlyMap<string, HintEngineConfig> = new Map()
  const registered = new Set<string>()
  const hydrated = new Set<string>()
  const listeners = createListeners('createHintsEngine')

  function dispatch(action: HintsAction): void {
    if (destroyed) return
    const next = hintsReducer(state, action)
    if (next === state) return
    const prev = state
    state = next
    // The provider's persist effect, minus React's post-commit delay: same
    // condition, same diff, same swallowed failures.
    if (storage && prev.frequencyState !== next.frequencyState) {
      syncStorage(storage, prev.frequencyState, next.frequencyState, hydrated)
    }
    // Fault-isolated: a throwing subscriber must not abort the fan-out. The
    // storage write above has already landed, so a listener that took the loop
    // down would leave later subscribers reading state that storage no longer
    // agrees with.
    listeners.notify()
  }

  function hydrate(): void {
    if (!storage) return
    const entries = readPersistedEntries(storage, [...configs.keys()], hydrated)
    if (entries.length > 0) dispatch({ type: 'HYDRATE_FREQUENCY', entries })
  }

  function setHints(hints: ReadonlyArray<HintEngineConfig>): void {
    if (destroyed) return
    configs = index(hints)
    for (const id of configs.keys()) {
      if (!registered.has(id)) dispatch({ type: 'REGISTER', id })
    }
    for (const id of registered) {
      if (!configs.has(id)) dispatch({ type: 'UNREGISTER', id })
    }
    registered.clear()
    for (const id of configs.keys()) registered.add(id)
    hydrate()
  }

  function boot(): void {
    if (destroyed || booted) return
    booted = true
    // ponytail: `options.storage` is read ONCE, here. The provider had the same
    // shape (a `useMemo` keyed on the prop that only re-ran hydrate for
    // unhydrated ids), and no test or example changes storage mid-life. The
    // upgrade path, if a consumer ever asks, is `engine.setStorage()` beside
    // `setHints`.
    storage = resolveStorage(options.storage)
    hydrate()
  }

  function showHint(id: string): void {
    const rule: FrequencyRule | undefined = configs.get(id)?.frequency
    const persisted = state.frequencyState.get(id) ?? emptyFrequencyState()
    if (rule && !canShowByFrequency(persisted, rule)) {
      if (process.env.NODE_ENV !== 'production') {
        logger.debug(`showHint("${id}") suppressed by frequency rule ${JSON.stringify(rule)}`)
      }
      return
    }
    // `times` / `interval` / `always` permit re-showing after dismissal; `once`
    // and `session` are sticky by design — same as the provider.
    if (rule && canShowAfterDismissal(rule)) dispatch({ type: 'CLEAR_DISMISSAL', id })
    dispatch({ type: 'SHOW', id })
    if (rule) dispatch({ type: 'RECORD_VIEW', id })
  }

  return {
    getState: () => state,
    subscribe: (listener) => {
      if (destroyed) return () => {}
      return listeners.add(listener)
    },
    boot,
    setHints,
    registerHint: (id) => dispatch({ type: 'REGISTER', id }),
    unregisterHint: (id) => dispatch({ type: 'UNREGISTER', id }),
    showHint,
    hideHint: (id) => dispatch({ type: 'HIDE', id }),
    dismissHint: (id) => dispatch({ type: 'DISMISS', id }),
    resetHint: (id) => dispatch({ type: 'RESET', id }),
    resetAllHints: () => dispatch({ type: 'RESET_ALL' }),
    destroy: () => {
      if (destroyed) return
      destroyed = true
      listeners.clear()
      storage = null
    },
  }
}
