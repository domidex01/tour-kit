import * as React from 'react'
import type { HintState, HintsContextValue } from '../types'
import { HintsContext } from './hints-context'

type HintsAction =
  | { type: 'REGISTER'; id: string }
  | { type: 'UNREGISTER'; id: string }
  | { type: 'SHOW'; id: string }
  | { type: 'HIDE'; id: string }
  | { type: 'DISMISS'; id: string }
  | { type: 'RESET'; id: string }
  | { type: 'RESET_ALL' }

interface HintsState {
  hints: Map<string, HintState>
  activeHint: string | null
}

function handleRegister(state: HintsState, id: string): HintsState {
  const newHints = new Map(state.hints)
  if (!newHints.has(id)) {
    newHints.set(id, {
      id,
      isOpen: false,
      isDismissed: false,
    })
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
  const newHints = new Map(state.hints)
  const hint = newHints.get(id)
  if (hint && !hint.isDismissed) {
    // Close currently active hint
    if (state.activeHint && state.activeHint !== id) {
      const activeHint = newHints.get(state.activeHint)
      if (activeHint) {
        newHints.set(state.activeHint, { ...activeHint, isOpen: false })
      }
    }
    newHints.set(id, { ...hint, isOpen: true })
    return { hints: newHints, activeHint: id }
  }
  return state
}

function handleHide(state: HintsState, id: string): HintsState {
  const newHints = new Map(state.hints)
  const hint = newHints.get(id)
  if (hint) {
    newHints.set(id, { ...hint, isOpen: false })
    return {
      hints: newHints,
      activeHint: state.activeHint === id ? null : state.activeHint,
    }
  }
  return state
}

function handleDismiss(state: HintsState, id: string): HintsState {
  const newHints = new Map(state.hints)
  const hint = newHints.get(id)
  if (hint) {
    newHints.set(id, { ...hint, isOpen: false, isDismissed: true })
    return {
      hints: newHints,
      activeHint: state.activeHint === id ? null : state.activeHint,
    }
  }
  return state
}

function handleReset(state: HintsState, id: string): HintsState {
  const newHints = new Map(state.hints)
  const hint = newHints.get(id)
  if (hint) {
    newHints.set(id, { ...hint, isDismissed: false })
  }
  return { ...state, hints: newHints }
}

function handleResetAll(state: HintsState): HintsState {
  const newHints = new Map(state.hints)
  newHints.forEach((hint, id) => {
    newHints.set(id, { ...hint, isDismissed: false })
  })
  return { ...state, hints: newHints }
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
    default:
      return state
  }
}

interface HintsProviderProps {
  children: React.ReactNode
}

export function HintsProvider({ children }: HintsProviderProps) {
  const [state, dispatch] = React.useReducer(hintsReducer, {
    hints: new Map(),
    activeHint: null,
  })

  // Stable callbacks that don't change between renders
  const registerHint = React.useCallback((id: string) => dispatch({ type: 'REGISTER', id }), [])
  const unregisterHint = React.useCallback((id: string) => dispatch({ type: 'UNREGISTER', id }), [])
  const showHint = React.useCallback((id: string) => dispatch({ type: 'SHOW', id }), [])
  const hideHint = React.useCallback((id: string) => dispatch({ type: 'HIDE', id }), [])
  const dismissHint = React.useCallback((id: string) => dispatch({ type: 'DISMISS', id }), [])
  const resetHint = React.useCallback((id: string) => dispatch({ type: 'RESET', id }), [])
  const resetAllHints = React.useCallback(() => dispatch({ type: 'RESET_ALL' }), [])

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
