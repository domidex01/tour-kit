'use client'

import {
  type FrequencyRule,
  type FrequencyState,
  canShowAfterDismissal,
  canShowByFrequency,
  createPrefixedStorage,
  safeJSONParse,
} from '@tour-kit/core'
import * as React from 'react'
import { useHintFilter } from '../hooks/use-hint-filter'
import type { HintConfig, HintState, HintsContextValue } from '../types'
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

const emptyFrequencyState = (): FrequencyState => ({
  viewCount: 0,
  isDismissed: false,
  lastViewedAt: null,
})

type HintsAction =
  | { type: 'REGISTER'; id: string }
  | { type: 'UNREGISTER'; id: string }
  | { type: 'SHOW'; id: string }
  | { type: 'HIDE'; id: string }
  | { type: 'DISMISS'; id: string }
  | { type: 'RESET'; id: string }
  | { type: 'RESET_ALL' }
  | { type: 'RECORD_VIEW'; id: string }
  | { type: 'CLEAR_DISMISSAL'; id: string }
  | { type: 'HYDRATE_FREQUENCY'; entries: ReadonlyArray<readonly [string, FrequencyState]> }

interface HintsState {
  hints: Map<string, HintState>
  activeHint: string | null
  frequencyState: Map<string, FrequencyState>
}

function handleRegister(state: HintsState, id: string): HintsState {
  const newHints = new Map(state.hints)
  if (!newHints.has(id)) {
    newHints.set(id, { id, isOpen: false, isDismissed: false })
  }
  return { ...state, hints: newHints }
}

function handleUnregister(state: HintsState, id: string): HintsState {
  const newHints = new Map(state.hints)
  newHints.delete(id)
  return {
    ...state,
    hints: newHints,
    activeHint: state.activeHint === id ? null : state.activeHint,
  }
}

function handleShow(state: HintsState, id: string): HintsState {
  const hint = state.hints.get(id)
  if (!hint || hint.isDismissed) return state
  if (hint.isOpen && state.activeHint === id) return state

  const newHints = new Map(state.hints)
  if (state.activeHint && state.activeHint !== id) {
    const activeHint = newHints.get(state.activeHint)
    if (activeHint?.isOpen) {
      newHints.set(state.activeHint, { ...activeHint, isOpen: false })
    }
  }
  newHints.set(id, { ...hint, isOpen: true })
  return { ...state, hints: newHints, activeHint: id }
}

function handleHide(state: HintsState, id: string): HintsState {
  const hint = state.hints.get(id)
  if (!hint) return state
  const wasActive = state.activeHint === id
  if (!hint.isOpen && !wasActive) return state

  const newHints = new Map(state.hints)
  newHints.set(id, { ...hint, isOpen: false })
  return {
    ...state,
    hints: newHints,
    activeHint: wasActive ? null : state.activeHint,
  }
}

function handleDismiss(state: HintsState, id: string): HintsState {
  const hint = state.hints.get(id)
  if (!hint) return state
  if (hint.isDismissed && !hint.isOpen && state.activeHint !== id) return state

  const newHints = new Map(state.hints)
  newHints.set(id, { ...hint, isOpen: false, isDismissed: true })

  // Mirror dismissal into the frequency slice so canShowByFrequency
  // sees the persisted dismissal across mounts.
  const newFreq = new Map(state.frequencyState)
  const prevFreq = newFreq.get(id) ?? emptyFrequencyState()
  newFreq.set(id, { ...prevFreq, isDismissed: true })

  return {
    ...state,
    hints: newHints,
    frequencyState: newFreq,
    activeHint: state.activeHint === id ? null : state.activeHint,
  }
}

function handleReset(state: HintsState, id: string): HintsState {
  const newHints = new Map(state.hints)
  const hint = newHints.get(id)
  if (hint) {
    newHints.set(id, { ...hint, isDismissed: false })
  }
  const newFreq = new Map(state.frequencyState)
  newFreq.delete(id)
  return { ...state, hints: newHints, frequencyState: newFreq }
}

function handleResetAll(state: HintsState): HintsState {
  const newHints = new Map(state.hints)
  newHints.forEach((hint, id) => {
    newHints.set(id, { ...hint, isDismissed: false })
  })
  return { ...state, hints: newHints, frequencyState: new Map() }
}

function handleClearDismissal(state: HintsState, id: string): HintsState {
  // Lighter than RESET: clears `isDismissed` on both the public hint state
  // and the frequency slice WITHOUT resetting viewCount. Used by the
  // frequency-aware showHint flow so `{ type: 'times' }` rules still
  // accumulate views across dismiss/show cycles.
  const newHints = new Map(state.hints)
  const hint = newHints.get(id)
  if (hint?.isDismissed) {
    newHints.set(id, { ...hint, isDismissed: false })
  }
  const newFreq = new Map(state.frequencyState)
  const prevFreq = newFreq.get(id)
  if (prevFreq?.isDismissed) {
    newFreq.set(id, { ...prevFreq, isDismissed: false })
  }
  return { ...state, hints: newHints, frequencyState: newFreq }
}

function handleRecordView(state: HintsState, id: string): HintsState {
  const newFreq = new Map(state.frequencyState)
  const prev = newFreq.get(id) ?? emptyFrequencyState()
  newFreq.set(id, {
    viewCount: prev.viewCount + 1,
    isDismissed: prev.isDismissed,
    lastViewedAt: new Date(),
  })
  return { ...state, frequencyState: newFreq }
}

function handleHydrate(
  state: HintsState,
  entries: ReadonlyArray<readonly [string, FrequencyState]>
): HintsState {
  const newFreq = new Map(state.frequencyState)
  for (const [id, value] of entries) {
    newFreq.set(id, value)
  }
  // Reflect persisted dismissal into hint state so existing `isDismissed`
  // consumers (UI) see it on mount.
  const newHints = new Map(state.hints)
  for (const [id, value] of entries) {
    if (value.isDismissed) {
      const existing = newHints.get(id) ?? { id, isOpen: false, isDismissed: false }
      newHints.set(id, { ...existing, isDismissed: true })
    }
  }
  return { ...state, hints: newHints, frequencyState: newFreq }
}

function hintsReducer(state: HintsState, action: HintsAction): HintsState {
  switch (action.type) {
    case 'REGISTER':
      return handleRegister(state, action.id)
    case 'UNREGISTER':
      return handleUnregister(state, action.id)
    case 'SHOW':
      return handleShow(state, action.id)
    case 'HIDE':
      return handleHide(state, action.id)
    case 'DISMISS':
      return handleDismiss(state, action.id)
    case 'RESET':
      return handleReset(state, action.id)
    case 'RESET_ALL':
      return handleResetAll(state)
    case 'RECORD_VIEW':
      return handleRecordView(state, action.id)
    case 'CLEAR_DISMISSAL':
      return handleClearDismissal(state, action.id)
    case 'HYDRATE_FREQUENCY':
      return handleHydrate(state, action.entries)
    default:
      return state
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

function getDefaultStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
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
  const prefixedStorage = React.useMemo<Storage | null>(() => {
    const raw = storage ?? getDefaultStorage()
    if (!raw) return null
    return createPrefixedStorage(raw, 'tourkit') as Storage
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

  // Hydrate frequency state on mount + when the relevant id set changes.
  React.useEffect(() => {
    if (!prefixedStorage) return
    if (!hints) return
    const entries: Array<[string, FrequencyState]> = []
    for (const h of filteredHints) {
      const raw = prefixedStorage.getItem(freqKey(h.id))
      if (!raw) continue
      const persisted = safeJSONParse<PersistedFrequencyState | null>(raw, null)
      if (!persisted) continue
      entries.push([h.id, thawState(persisted)])
    }
    if (entries.length > 0) {
      dispatch({ type: 'HYDRATE_FREQUENCY', entries })
    }
    // hints config identity drives this effect — filteredHints is derived.
  }, [hints, filteredHints, prefixedStorage])

  // Persist on every frequency change. Skip on first render when we just
  // hydrated (state.frequencyState already matches storage).
  const lastPersistedRef = React.useRef(state.frequencyState)
  React.useEffect(() => {
    if (!prefixedStorage) return
    if (lastPersistedRef.current === state.frequencyState) return
    lastPersistedRef.current = state.frequencyState
    for (const [id, value] of state.frequencyState) {
      try {
        prefixedStorage.setItem(freqKey(id), JSON.stringify(freezeState(value)))
      } catch {
        // ignore quota / serialization failures — frequency rules degrade
        // gracefully when storage is unavailable
      }
    }
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
  // (e.g. <Hint autoShow>) that depend on it. Reading state via refs keeps
  // showHint a permanent function reference per provider mount.
  const hintsByIdRef = React.useRef(hintsById)
  hintsByIdRef.current = hintsById
  const frequencyStateRef = React.useRef(state.frequencyState)
  frequencyStateRef.current = state.frequencyState

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
        console.debug(
          `[tour-kit] showHint("${id}") suppressed by frequency rule ${JSON.stringify(rule)}`
        )
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
