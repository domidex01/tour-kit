/**
 * v2 §1.3a — the tour reducer, moved out from under React.
 *
 * Pure code motion from `context/tour-provider.tsx` lines 40–217. Nothing here
 * imports React and nothing here reads a ref: `(state, action) => state` is the
 * whole contract. The provider keeps dispatching into it through
 * `React.useReducer`; `createTourEngine()` (§1.3f) will dispatch into the same
 * function from a plain store.
 */
import type { Tour } from '../../types/tour'
import type { TourAction, TourReducerState } from '../../types/tour-reducer'

/** Maximum hidden-step chain length before throwing HIDDEN_STEP_LOOP. */
export const MAX_HIDDEN_CHAIN = 50

/** First registered `autoStart` tour the user hasn't already completed. */
export function findAutoStartTour(_tours: Tour[], _completedTours: string[]): Tour | undefined {
  throw new Error('findAutoStartTour: not implemented (v2 §1.3a)')
}

export function tourReducer(_state: TourReducerState, _action: TourAction): TourReducerState {
  throw new Error('tourReducer: not implemented (v2 §1.3a)')
}
