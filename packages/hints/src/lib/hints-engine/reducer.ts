/**
 * v3 Phase 1 — the hints state machine, moved verbatim out of
 * `context/hints-provider.tsx` (lines 46-236 of the 2.1.0 file).
 *
 * Ten handlers and one `switch`, all pure and all synchronous. Nothing here
 * changed in the move except the names: `HintsState` is `HintsEngineState`,
 * and the action union and the state interface live in `./types`. The 295
 * existing React tests are the oracle for every branch below.
 *
 * NOT on `@tour-kit/hints/engine`: a reducer is the seam the engine and a
 * binding share, not a consumer API — core withholds `tourReducer` for the
 * same reason.
 */
import type { FrequencyState } from '@tour-kit/core/engine'
import type { HintsAction, HintsEngineState } from './types'

export const emptyFrequencyState = (): FrequencyState => ({
  viewCount: 0,
  isDismissed: false,
  lastViewedAt: null,
})

function handleRegister(state: HintsEngineState, id: string): HintsEngineState {
  const newHints = new Map(state.hints)
  if (!newHints.has(id)) {
    newHints.set(id, { id, isOpen: false, isDismissed: false })
  }
  return { ...state, hints: newHints }
}

function handleUnregister(state: HintsEngineState, id: string): HintsEngineState {
  const newHints = new Map(state.hints)
  newHints.delete(id)
  return {
    ...state,
    hints: newHints,
    activeHint: state.activeHint === id ? null : state.activeHint,
  }
}

function handleShow(state: HintsEngineState, id: string): HintsEngineState {
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

function handleHide(state: HintsEngineState, id: string): HintsEngineState {
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

function handleDismiss(state: HintsEngineState, id: string): HintsEngineState {
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

function handleReset(state: HintsEngineState, id: string): HintsEngineState {
  const newHints = new Map(state.hints)
  const hint = newHints.get(id)
  if (hint) {
    newHints.set(id, { ...hint, isDismissed: false })
  }
  const newFreq = new Map(state.frequencyState)
  newFreq.delete(id)
  return { ...state, hints: newHints, frequencyState: newFreq }
}

function handleResetAll(state: HintsEngineState): HintsEngineState {
  const newHints = new Map(state.hints)
  newHints.forEach((hint, id) => {
    newHints.set(id, { ...hint, isDismissed: false })
  })
  return { ...state, hints: newHints, frequencyState: new Map() }
}

function handleClearDismissal(state: HintsEngineState, id: string): HintsEngineState {
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

function handleRecordView(state: HintsEngineState, id: string): HintsEngineState {
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
  state: HintsEngineState,
  entries: ReadonlyArray<readonly [string, FrequencyState]>
): HintsEngineState {
  const newFreq = new Map(state.frequencyState)
  for (const [id, value] of entries) {
    newFreq.set(id, value)
  }
  // Reflect persisted dismissal into hint state so existing `isDismissed`
  // consumers (UI) see it on mount. Only mirror onto already-registered
  // hint slots — materializing a slot here would bypass the auto-register
  // tracking and leave an orphan when filteredHints shrinks.
  const newHints = new Map(state.hints)
  for (const [id, value] of entries) {
    if (!value.isDismissed) continue
    const existing = newHints.get(id)
    if (!existing) continue
    newHints.set(id, { ...existing, isDismissed: true })
  }
  return { ...state, hints: newHints, frequencyState: newFreq }
}

export function hintsReducer(state: HintsEngineState, action: HintsAction): HintsEngineState {
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
