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
  AudienceProp,
  TourStepMedia,
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
  useReducedMotion,
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

// Cross-page navigation: typed error + thin wrapper over `waitForElement`
export { TourRouteError, waitForStepTarget } from './lib/wait-for-step-target'
export type { WaitForStepTargetOptions } from './lib/wait-for-step-target'

// Unified Slot — supports both Radix UI (asChild element-clone) and Base UI (render-prop)
// patterns. forwardRef-wrapped to preserve `ref` on both React 18 and React 19.
export { UnifiedSlot } from './lib/unified-slot'
export type { UnifiedSlotProps, RenderProp } from './lib/unified-slot'

// UILibrary context — toggles Radix vs Base UI rendering for downstream UnifiedSlot consumers.
export { UILibraryProvider, useUILibrary } from './lib/ui-library-context'
export type { UILibrary, UILibraryProviderProps } from './lib/ui-library-context'

// Interpolation — Phase 1 (UserGuiding parity)
export { interpolate } from './lib/interpolate'
export type { InterpolateOptions } from './lib/interpolate'

// i18n primitives — Phase 1 (UserGuiding parity)
export { LocaleProvider, useLocale } from './lib/i18n/locale-context'
export type { LocaleContextValue, LocaleProviderProps } from './lib/i18n/locale-context'
export { useT } from './lib/i18n/use-t'
export type { Messages, TranslateFn } from './lib/i18n/use-t'

// Audience targeting — promoted from @tour-kit/announcements in Phase 1
export { matchesAudience, validateConditions } from './lib/audience'
export type { AudienceCondition } from './types/audience'

// Frequency rules — Phase 3a (lifted from @tour-kit/announcements)
export {
  canShowByFrequency,
  canShowAfterDismissal,
  getViewLimit,
} from './lib/frequency'
export type { FrequencyRule, FrequencyState } from './lib/frequency'

// LocalizedText — Phase 3a (shared text shape) + Phase 3b (string-only resolver hook)
export { isI18nKey } from './lib/localized-text'
export type { LocalizedText } from './lib/localized-text'
export { useResolveLocalizedText } from './lib/i18n/use-resolve-localized-text'

// Segmentation primitives — Phase 2 (UserGuiding parity)
export {
  SegmentationProvider,
  useSegmentationContext,
  useSegment,
  useSegments,
  parseUserIdsFromCsv,
} from './lib/segmentation'
export type {
  SegmentDefinition,
  StaticSegment,
  SegmentSource,
  SegmentationContextValue,
  SegmentationProviderProps,
} from './lib/segmentation'
