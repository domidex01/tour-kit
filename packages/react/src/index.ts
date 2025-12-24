// Components
export * from './components'

// Utilities
export { cn } from './utils/cn'

// Re-export core types (with explicit exports to avoid conflicts)
export type {
  // Config types
  Side,
  Alignment,
  Placement,
  Position,
  Rect,
  SpotlightConfig,
  KeyboardConfig,
  PersistenceConfig,
  TourKitConfig,
  A11yConfig,
  ScrollConfig,
  Storage,
  // Step types
  TourStep as TourStepConfig,
  StepOptions,
  // Tour types
  Tour as TourConfig,
  TourOptions,
  // State types
  TourState,
  TourCallbackContext,
  // Hint types
  HintConfig,
  HintState,
  HintsState,
  BeaconPosition,
} from '@tour-kit/core'

// Re-export hooks and utilities
export {
  // Context
  TourContext,
  TourProvider,
  TourKitContext,
  TourKitProvider,
  // Hooks
  useTour,
  useStep,
  useSpotlight,
  useElementPosition,
  useKeyboardNavigation,
  useFocusTrap,
  usePersistence,
  useMediaQuery,
  usePrefersReducedMotion,
  // Utilities
  createTour,
  createStep,
  waitForElement,
  isElementVisible,
  getScrollParent,
  scrollIntoView,
  generateId,
  announce,
  prefersReducedMotion,
  getStepAnnouncement,
  createStorageAdapter,
  createPrefixedStorage,
  safeJSONParse,
  calculatePosition,
  // Default configs
  defaultSpotlightConfig,
  defaultKeyboardConfig,
  defaultPersistenceConfig,
  defaultA11yConfig,
  defaultScrollConfig,
} from '@tour-kit/core'

// Re-export hook return types
export type {
  UseTourReturn,
  UseStepReturn,
  UseSpotlightReturn,
  UseFocusTrapReturn,
  UsePersistenceReturn,
} from '@tour-kit/core'
