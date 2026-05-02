// Types - use explicit type exports for tree shaking
export type {
  // Branch types
  BranchTarget,
  BranchToTour,
  BranchSkip,
  BranchWait,
  BranchContext,
  BranchResolver,
  Branch,
  UseBranchReturn,
  // Config types
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
  TourStep,
  StepOptions,
  Tour,
  TourOptions,
  TourState,
  TourCallbackContext,
  TourActions,
  TourContextValue,
  HotspotPosition,
  HintConfig,
  HintState,
  HintsState,
  HintsActions,
  HintsContextValue,
  RouterAdapter,
  MultiPagePersistenceConfig,
} from './types'

// Type defaults (runtime values)
export {
  defaultKeyboardConfig,
  defaultSpotlightConfig,
  defaultPersistenceConfig,
  defaultA11yConfig,
  defaultScrollConfig,
  initialTourState,
} from './types'

// Context
export {
  TourKitContext,
  useTourKitContext,
  useDirection,
  TourKitProvider,
  TourContext,
  useTourContext,
  useTourContextOptional,
  TourProvider,
} from './context'
export type { TourKitContextValue, TourKitProviderProps, TourProviderProps } from './context'

// Hooks
export {
  useTour,
  useStep,
  useSpotlight,
  useElementPosition,
  useKeyboardNavigation,
  useFocusTrap,
  usePersistence,
  useMediaQuery,
  usePrefersReducedMotion,
  useRoutePersistence,
  useFlowSession,
  useBroadcast,
  useAdvanceOn,
  dispatchAdvanceEvent,
  useBranch,
} from './hooks'
export type {
  UseTourReturn,
  UseStepReturn,
  UseSpotlightReturn,
  ElementPositionResult,
  UseFocusTrapReturn,
  UsePersistenceReturn,
  UseRoutePersistenceReturn,
  UseFlowSessionConfig,
  UseFlowSessionReturn,
  UseBroadcastReturn,
  UseAdvanceOnOptions,
} from './hooks'

// Utilities
export {
  getElement,
  isElementVisible,
  isElementPartiallyVisible,
  waitForElement,
  getFocusableElements,
  getScrollParent,
  getElementRect,
  getViewportDimensions,
  parsePlacement,
  calculatePosition,
  wouldOverflow,
  getOppositeSide,
  getFallbackPlacements,
  calculatePositionWithCollision,
  getDocumentDirection,
  mirrorSide,
  mirrorAlignment,
  mirrorPlacementForRTL,
  scrollIntoView,
  scrollTo,
  getScrollPosition,
  lockScroll,
  createStorageAdapter,
  createNoopStorage,
  createCookieStorage,
  safeJSONParse,
  createPrefixedStorage,
  announce,
  generateId,
  prefersReducedMotion,
  getStepAnnouncement,
  createTour,
  createNamedTour,
  createStep,
  createNamedStep,
  logger,
  // Branch utilities
  MAX_BRANCH_DEPTH,
  isBranchToTour,
  isBranchSkip,
  isBranchWait,
  isSpecialTarget,
  isBranchResolver,
  resolveBranch,
  resolveTargetToIndex,
  isLoopDetected,
  // Throttle utilities
  throttleRAF,
  throttleTime,
  throttleLeading,
} from './utils'
export type {
  PositionResult,
  LogLevel,
  LoggerConfig,
  ThrottledFunction,
  ThrottledFunctionWithFlush,
} from './utils'

// Class-name merge utility (cn = clsx + tailwind-merge)
export { cn } from './lib/utils'

// Tour validation (hidden-step config gate + runtime loop guard)
export { TourValidationError, validateTour } from './lib/validate-tour'

// Unified Slot — supports both Radix UI (asChild element-clone) and Base UI (render-prop)
// patterns. forwardRef-wrapped to preserve `ref` on both React 18 and React 19.
export { UnifiedSlot } from './lib/unified-slot'
export type { UnifiedSlotProps, RenderProp } from './lib/unified-slot'

// UILibrary context — toggles Radix vs Base UI rendering for downstream UnifiedSlot consumers.
export { UILibraryProvider, useUILibrary } from './lib/ui-library-context'
export type { UILibrary, UILibraryProviderProps } from './lib/ui-library-context'
