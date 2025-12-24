import * as React from 'react'
import { HintsContext } from './hints-context'
import type { HintState, HintsContextValue } from '../types'

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

function hintsReducer(state: HintsState, action: HintsAction): HintsState {
  switch (action.type) {
    case 'REGISTER': {
      const newHints = new Map(state.hints)
      if (!newHints.has(action.id)) {
        newHints.set(action.id, {
          id: action.id,
          isOpen: false,
          isDismissed: false,
        })
      }
      return { ...state, hints: newHints }
    }

    case 'UNREGISTER': {
      const newHints = new Map(state.hints)
      newHints.delete(action.id)
      return {
        ...state,
        hints: newHints,
        activeHint: state.activeHint === action.id ? null : state.activeHint,
      }
    }

    case 'SHOW': {
      const newHints = new Map(state.hints)
      const hint = newHints.get(action.id)
      if (hint && !hint.isDismissed) {
        // Close currently active hint
        if (state.activeHint && state.activeHint !== action.id) {
          const activeHint = newHints.get(state.activeHint)
          if (activeHint) {
            newHints.set(state.activeHint, { ...activeHint, isOpen: false })
          }
        }
        newHints.set(action.id, { ...hint, isOpen: true })
        return { hints: newHints, activeHint: action.id }
      }
      return state
    }

    case 'HIDE': {
      const newHints = new Map(state.hints)
      const hint = newHints.get(action.id)
      if (hint) {
        newHints.set(action.id, { ...hint, isOpen: false })
        return {
          hints: newHints,
          activeHint: state.activeHint === action.id ? null : state.activeHint,
        }
      }
      return state
    }

    case 'DISMISS': {
      const newHints = new Map(state.hints)
      const hint = newHints.get(action.id)
      if (hint) {
        newHints.set(action.id, { ...hint, isOpen: false, isDismissed: true })
        return {
          hints: newHints,
          activeHint: state.activeHint === action.id ? null : state.activeHint,
        }
      }
      return state
    }

    case 'RESET': {
      const newHints = new Map(state.hints)
      const hint = newHints.get(action.id)
      if (hint) {
        newHints.set(action.id, { ...hint, isDismissed: false })
      }
      return { ...state, hints: newHints }
    }

    case 'RESET_ALL': {
      const newHints = new Map(state.hints)
      newHints.forEach((hint, id) => {
        newHints.set(id, { ...hint, isDismissed: false })
      })
      return { ...state, hints: newHints }
    }

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
  const registerHint = React.useCallback(
    (id: string) => dispatch({ type: 'REGISTER', id }),
    []
  )
  const unregisterHint = React.useCallback(
    (id: string) => dispatch({ type: 'UNREGISTER', id }),
    []
  )
  const showHint = React.useCallback(
    (id: string) => dispatch({ type: 'SHOW', id }),
    []
  )
  const hideHint = React.useCallback(
    (id: string) => dispatch({ type: 'HIDE', id }),
    []
  )
  const dismissHint = React.useCallback(
    (id: string) => dispatch({ type: 'DISMISS', id }),
    []
  )
  const resetHint = React.useCallback(
    (id: string) => dispatch({ type: 'RESET', id }),
    []
  )
  const resetAllHints = React.useCallback(
    () => dispatch({ type: 'RESET_ALL' }),
    []
  )

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

  return (
    <HintsContext.Provider value={contextValue}>
      {children}
    </HintsContext.Provider>
  )
}
