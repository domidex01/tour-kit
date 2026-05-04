// Branch types (erased at runtime for tree shaking)
export type {
  BranchTarget,
  BranchToTour,
  BranchSkip,
  BranchWait,
  BranchContext,
  BranchResolver,
  Branch,
  UseBranchReturn,
} from './branch'

// Config types (erased at runtime for tree shaking)
export type {
  Side,
  Alignment,
  Placement,
  Position,
  Rect,
  KeyboardConfig,
  SpotlightConfig,
  Storage,
  PersistenceConfig,
  FlowSessionConfig,
  CrossTabConfig,
  A11yConfig,
  ScrollConfig,
  Direction,
  TourKitConfig,
} from './config'

// Config defaults (runtime values)
export {
  defaultKeyboardConfig,
  defaultSpotlightConfig,
  defaultPersistenceConfig,
  defaultA11yConfig,
  defaultScrollConfig,
} from './config'

// Step types
export type { TourStep, StepOptions, AudienceProp } from './step'

// Tour types
export type { Tour, TourOptions } from './tour'

// State types
export type {
  TourState,
  TourCallbackContext,
  TourActions,
  TourContextValue,
} from './state'

// State initial value (runtime)
export { initialTourState } from './state'

// Hint types
export type {
  HotspotPosition,
  HintConfig,
  HintState,
  HintsState,
  HintsActions,
  HintsContextValue,
} from './hints'

// Router types
export type { RouterAdapter, MultiPagePersistenceConfig } from './router'
