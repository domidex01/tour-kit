'use client'

import {
  type FrequencyRule,
  type FrequencyState,
  canShowAfterDismissal,
  canShowByFrequency,
  createPrefixedStorage,
  logger,
  safeJSONParse,
} from '@tour-kit/core'
import * as React from 'react'
import { useHintFilter } from '../hooks/use-hint-filter'
import { emptyFrequencyState, hintsReducer } from '../lib/hints-engine/reducer'
import type { HintConfig, HintsContextValue } from '../types'
import { HintsContext } from './hints-context'

const FREQ_KEY_PREFIX = 'hint:freq:'

interface PersistedFrequencyState {
  viewCount: number
  isDismissed: boolean
  /** ISO string — `null` for never-viewed. */
  lastViewedAt: string | null
}

function freqKey(id: string): string {
  return `${FREQ_KEY_PREFIX}${id}`
}

function freezeState(state: FrequencyState): PersistedFrequencyState {
  return {
    viewCount: state.viewCount,
    isDismissed: state.isDismissed,
    lastViewedAt: state.lastViewedAt ? state.lastViewedAt.toISOString() : null,
  }
}

function thawState(persisted: PersistedFrequencyState): FrequencyState {
  return {
    viewCount: persisted.viewCount ?? 0,
    isDismissed: persisted.isDismissed ?? false,
    lastViewedAt: persisted.lastViewedAt ? new Date(persisted.lastViewedAt) : null,
  }
}

export interface HintsProviderProps {
  children: React.ReactNode
  /**
   * Optional config-driven mode. When provided, the provider auto-registers
   * each hint, applies `useHintFilter` for audience gating, and consults
   * `frequency` rules before allowing `showHint`. Omit to keep the legacy
   * imperative `registerHint(id)` API.
   */
  hints?: HintConfig[]
  /**
   * Backing storage for hint frequency persistence (Phase 3a). Defaults to
   * `localStorage`. Tests inject an in-memory mock to keep jsdom global state
   * untouched. Keys are namespaced as `tourkit:hint:freq:<hintId>`.
   */
  storage?: Storage
}

/**
 * The minimal subset of the DOM `Storage` interface used by the persistence
 * effect. Both `window.localStorage` (DOM `Storage`) and the result of
 * `createPrefixedStorage` (core's narrower `Storage` shape) satisfy it, so
 * we can avoid casting between the two types.
 *
 * NOTE: callers must pass a SYNCHRONOUS adapter — the persistence effect
 * reads `getItem` synchronously. Core's `Storage` declares `string | null
 * | Promise<…>` for async adapters, but those won't work here. localStorage
 * and the in-memory test mock are both synchronous.
 */
interface PersistAdapter {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function getDefaultStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/**
 * Read persisted frequency state for any hint id not already hydrated.
 * Returns the entries to dispatch via `HYDRATE_FREQUENCY` and mutates
 * `hydratedIds` to record which ids were touched.
 */
function readPersistedEntries(
  storage: PersistAdapter,
  ids: ReadonlyArray<string>,
  hydratedIds: Set<string>
): Array<[string, FrequencyState]> {
  const entries: Array<[string, FrequencyState]> = []
  for (const id of ids) {
    if (hydratedIds.has(id)) continue
    hydratedIds.add(id)
    const raw = storage.getItem(freqKey(id))
    if (!raw) continue
    const persisted = safeJSONParse<PersistedFrequencyState | null>(raw, null)
    if (!persisted) continue
    entries.push([id, thawState(persisted)])
  }
  return entries
}

/**
 * Diff two frequency-state Maps against storage. Removes keys present in
 * `prev` but not in `next`; writes every entry in `next`. Failures (quota,
 * serialization) are swallowed — frequency rules degrade gracefully when
 * storage is unavailable.
 */
function syncStorage(
  storage: PersistAdapter,
  prev: ReadonlyMap<string, FrequencyState>,
  next: ReadonlyMap<string, FrequencyState>,
  hydratedIds: Set<string>
): void {
  for (const id of prev.keys()) {
    if (next.has(id)) continue
    try {
      storage.removeItem(freqKey(id))
    } catch {
      // ignore
    }
    hydratedIds.delete(id)
  }
  for (const [id, value] of next) {
    try {
      storage.setItem(freqKey(id), JSON.stringify(freezeState(value)))
    } catch {
      // ignore
    }
  }
}

export function HintsProvider({ children, hints, storage }: HintsProviderProps) {
  const filteredHints = useHintFilter(hints ?? [])
  const hintsById = React.useMemo(() => {
    const m = new Map<string, HintConfig>()
    for (const h of filteredHints) m.set(h.id, h)
    return m
  }, [filteredHints])

  // Resolve storage once per mount. Wrapped via createPrefixedStorage so
  // every persisted key carries the `tourkit:` namespace consistently.
  // The cast narrows core's Storage type — which permits async adapters
  // (Promise-returning getItem/setItem) — down to the sync `PersistAdapter`
  // this provider relies on. Both DOM `localStorage` and the in-memory test
  // mock are synchronous; passing an async adapter would silently break the
  // persistence effect (it reads getItem synchronously).
  const prefixedStorage = React.useMemo<PersistAdapter | null>(() => {
    const raw = storage ?? getDefaultStorage()
    if (!raw) return null
    return createPrefixedStorage(raw, 'tourkit') as PersistAdapter
  }, [storage])

  const [state, dispatch] = React.useReducer(hintsReducer, {
    hints: new Map(),
    activeHint: null,
    frequencyState: new Map(),
  })

  // Auto-register every config-driven hint, unregister when the list shrinks.
  const registeredIds = React.useRef(new Set<string>())
  React.useEffect(() => {
    if (!hints) return
    const next = new Set(filteredHints.map((h) => h.id))
    for (const id of next) {
      if (!registeredIds.current.has(id)) {
        dispatch({ type: 'REGISTER', id })
      }
    }
    for (const id of registeredIds.current) {
      if (!next.has(id)) {
        dispatch({ type: 'UNREGISTER', id })
      }
    }
    registeredIds.current = next
  }, [hints, filteredHints])

  // Hydrate frequency state ONCE per provider mount + lazily for
  // newly-added hint ids. Re-running on every userContext change would
  // round-trip storage (read → dispatch → write back) and clobber any
  // in-flight RECORD_VIEW / DISMISS that landed between mount and the
  // userContext change.
  const hydratedIdsRef = React.useRef<Set<string>>(new Set())
  React.useEffect(() => {
    if (!prefixedStorage || !hints) return
    const entries = readPersistedEntries(
      prefixedStorage,
      filteredHints.map((h) => h.id),
      hydratedIdsRef.current
    )
    if (entries.length > 0) {
      dispatch({ type: 'HYDRATE_FREQUENCY', entries })
    }
  }, [hints, filteredHints, prefixedStorage])

  // Persist on every frequency change. The diff against the previous Map
  // ensures removed ids (resetHint / resetAllHints) get deleted from
  // storage — otherwise a remount would re-hydrate the dropped state and
  // silently undo the reset.
  const lastPersistedRef = React.useRef(state.frequencyState)
  React.useEffect(() => {
    if (!prefixedStorage) return
    const prev = lastPersistedRef.current
    if (prev === state.frequencyState) return
    lastPersistedRef.current = state.frequencyState
    syncStorage(prefixedStorage, prev, state.frequencyState, hydratedIdsRef.current)
  }, [state.frequencyState, prefixedStorage])

  const registerHint = React.useCallback((id: string) => dispatch({ type: 'REGISTER', id }), [])
  const unregisterHint = React.useCallback((id: string) => dispatch({ type: 'UNREGISTER', id }), [])
  const hideHint = React.useCallback((id: string) => dispatch({ type: 'HIDE', id }), [])
  const dismissHint = React.useCallback((id: string) => dispatch({ type: 'DISMISS', id }), [])
  const resetHint = React.useCallback((id: string) => dispatch({ type: 'RESET', id }), [])
  const resetAllHints = React.useCallback(() => dispatch({ type: 'RESET_ALL' }), [])

  // Stable refs over hintsById + frequencyState so `showHint`'s own
  // identity is invariant — otherwise dispatching `RECORD_VIEW` from inside
  // showHint would change its identity, retriggering downstream effects
  // (e.g. <Hint autoShow>) that depend on it. Refs are updated in an
  // effect (not during render) for concurrent-mode safety; showHint is
  // event-driven, so a microtask of staleness is inconsequential.
  const hintsByIdRef = React.useRef(hintsById)
  const frequencyStateRef = React.useRef(state.frequencyState)
  React.useEffect(() => {
    hintsByIdRef.current = hintsById
    frequencyStateRef.current = state.frequencyState
  })

  // Gate `showHint` on frequency rules when a config exists for the id.
  // No config (= legacy imperative caller) → fall through to plain SHOW.
  // RECORD_VIEW is dispatched only when a frequency rule is in play; this
  // keeps the legacy path's behavior byte-identical and avoids waking the
  // persistence effect for callers that never opted in to frequency.
  const showHint = React.useCallback((id: string) => {
    const config = hintsByIdRef.current.get(id)
    const rule: FrequencyRule | undefined = config?.frequency
    const persistedState = frequencyStateRef.current.get(id) ?? emptyFrequencyState()
    if (rule && !canShowByFrequency(persistedState, rule)) {
      if (process.env.NODE_ENV !== 'production') {
        logger.debug(`showHint("${id}") suppressed by frequency rule ${JSON.stringify(rule)}`)
      }
      return
    }
    // For rules that permit re-showing after dismissal (`times`, `interval`,
    // `always`), clear the per-hint dismissed flag before SHOW — handleShow
    // would otherwise treat the hint as permanently dismissed and no-op.
    // `'once'` / `'session'` are NOT auto-reset; their dismissal is sticky
    // by design.
    if (rule && canShowAfterDismissal(rule)) {
      dispatch({ type: 'CLEAR_DISMISSAL', id })
    }
    dispatch({ type: 'SHOW', id })
    if (rule) {
      dispatch({ type: 'RECORD_VIEW', id })
    }
  }, [])

  const contextValue = React.useMemo<HintsContextValue>(
    () => ({
      hints: state.hints,
      activeHint: state.activeHint,
      registerHint,
      unregisterHint,
      showHint,
      hideHint,
      dismissHint,
      resetHint,
      resetAllHints,
    }),
    [
      state.hints,
      state.activeHint,
      registerHint,
      unregisterHint,
      showHint,
      hideHint,
      dismissHint,
      resetHint,
      resetAllHints,
    ]
  )

  return <HintsContext.Provider value={contextValue}>{children}</HintsContext.Provider>
}
