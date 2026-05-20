/**
 * Return shape of `useTourActions(tourId)`.
 *
 * `useTourActions` reads from a module-level registry that every `<TourProvider>`
 * and standalone `<Tour id="...">` populates on mount. The hook lets a sibling
 * subtree control a tour without prop drilling or window events.
 *
 * When the tour id is unknown (e.g., during a route transition before the tour
 * has mounted), `useTourActions` returns a module-level **frozen no-op** object
 * — every method is a silent no-op and the state slice reports `isActive: false`.
 * The frozen return shape lets call sites write `useTourActions(id).start()`
 * without optional chaining; the call quietly drops on the floor instead of
 * throwing.
 */
export interface UseTourActionsReturn {
  /** True when the tour is registered AND currently the active tour. */
  isActive: boolean
  /** Current step id when the tour is active; `null` otherwise. */
  currentStepId: string | null
  /** `(currentStepIndex + 1) / totalSteps`, clamped to 0..1. */
  progress: number

  /** Start the tour from its `startAt` step (no-op if id is unknown). */
  start: () => void
  /** Stop the tour (no-op if id is unknown or the tour is not active). */
  stop: () => void
  /** Restart the tour from step 0, regardless of `startAt`. */
  restart: () => void
  /** Advance to the next step (only when this tour is active). */
  next: () => void
  /** Go to the previous step (only when this tour is active). */
  prev: () => void
  /** Jump to a specific step by id (only when this tour is active). */
  goToStep: (stepId: string) => void
}
