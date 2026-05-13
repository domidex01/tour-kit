// Error
export { TourKitTestingError, type TourKitTestingErrorOptions } from './error'

// Setup (re-exported here so consumers can import from the main barrel; the
// dedicated `./setup` subpath exists for setup files that don't want to pull
// the helpers' RTL dependency graph).
export { setupTourKitTesting, type SetupOptions } from './setup'

// Helpers
export { virtualTarget, type VirtualTarget } from './helpers/virtual-target'
export {
  expectStepVisible,
  type ExpectStepVisibleOptions,
} from './helpers/expect-step-visible'
export { advanceTour, type AdvanceTourOptions } from './helpers/advance-tour'
export { previousTour, type PreviousTourOptions } from './helpers/previous-tour'
export { skipTour, type SkipTourOptions } from './helpers/skip-tour'
export { completeTour, type CompleteTourOptions } from './helpers/complete-tour'
export { goToStep } from './helpers/go-to-step'

// Probe — required for `goToStep` to function; render inside <TourProvider>.
export { HookProbe, getActiveTourHandle } from './helpers/hook-probe'

// Re-exports for ergonomic consumer imports.
export { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react'
