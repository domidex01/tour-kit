import type { TourState } from './state'
import type { Tour } from './tour'

/**
 * Reducer-scoped tour state. Extends the public {@link TourState} with the
 * `tours` Map the reducer keeps to resolve `tourId → Tour` synchronously
 * inside action handlers. The public state surface (`TourContextValue`) does
 * not expose this Map — consumers receive `tour: Tour | null` instead.
 */
export interface TourReducerState extends TourState {
  tours: Map<string, Tour>
}

/**
 * Discriminated-union of reducer actions. Lives in `types/` so engine modules
 * (`lib/tour-engine/*`) can dispatch without importing the provider.
 */
export type TourAction =
  | { type: 'START_TOUR'; tourId: string; stepIndex?: number }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'GO_TO_STEP'; stepIndex: number }
  | { type: 'SKIP_TOUR' }
  | { type: 'COMPLETE_TOUR' }
  | { type: 'STOP_TOUR' }
  | { type: 'SET_LOADING'; isLoading: boolean }
  | { type: 'SET_TRANSITIONING'; isTransitioning: boolean }
  | { type: 'ADD_COMPLETED'; tourId: string }
  | { type: 'ADD_SKIPPED'; tourId: string }
  | { type: 'RESET'; tourId?: string }
  | { type: 'UPDATE_TOURS'; tours: Tour[] }
  | { type: 'TRACK_STEP_VISIT'; stepId: string; previousStepId: string | null }
  | { type: 'CLEAR_VISIT_TRACKING' }
