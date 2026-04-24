// ============================================
// STYLED COMPONENTS
// ============================================

// Tour components
export { Tour } from './components/tour/tour'
export { TourStep } from './components/tour/tour-step'
export type { TourProps } from './components/tour/tour'

// Card components
export { TourCard, type TourCardProps } from './components/card/tour-card'
export { TourCardHeader, type TourCardHeaderProps } from './components/card/tour-card-header'
export { TourCardContent, type TourCardContentProps } from './components/card/tour-card-content'
export { TourCardFooter, type TourCardFooterProps } from './components/card/tour-card-footer'

// Navigation components
export { TourNavigation, type TourNavigationProps } from './components/navigation/tour-navigation'
export { TourProgress, type TourProgressProps } from './components/navigation/tour-progress'
export { TourClose, type TourCloseProps } from './components/navigation/tour-close'
export { TourRoutePrompt } from './components/navigation/tour-route-prompt'

// Overlay components
export { TourOverlay, type TourOverlayProps } from './components/overlay/tour-overlay'

// Primitives
export { TourPortal, type TourPortalProps } from './components/primitives/tour-portal'
export { TourArrow } from './components/primitives/tour-arrow'

// Provider components
export {
  MultiTourKitProvider,
  type MultiTourKitProviderProps,
} from './components/provider/tourkit-provider'

// ============================================
// UI VARIANTS (for customization)
// ============================================

export {
  // Button variants
  tourButtonVariants,
  type TourButtonVariants,
  // Card variants
  tourCardVariants,
  tourCardHeaderVariants,
  tourCardContentVariants,
  tourCardFooterVariants,
  type TourCardVariants,
  type TourCardHeaderVariants,
  type TourCardContentVariants,
  type TourCardFooterVariants,
  // Progress variants
  tourProgressVariants,
  tourProgressDotVariants,
  type TourProgressVariants,
  type TourProgressDotVariants,
  // Overlay variants
  tourOverlayVariants,
  type TourOverlayVariants,
} from './components/ui'

// ============================================
// UTILITIES
// ============================================

export { cn } from './lib/utils'
export { Slot, Slottable, UnifiedSlot, type RenderProp, type UnifiedSlotProps } from './lib/slot'

// UI Library Provider (Base UI support)
export {
  UILibraryProvider,
  useUILibrary,
  type UILibrary,
  type UILibraryProviderProps,
} from './lib/ui-library-context'

// ============================================
// HOOKS
// ============================================

export { useTours } from './hooks/use-tours'
export { useTourRoute } from './hooks/use-tour-route'
export type { TourInfo, UseToursReturn } from './hooks/use-tours'

// ============================================
// ADAPTERS
// ============================================

export {
  useNextAppRouter,
  useNextPagesRouter,
  useReactRouter,
  createNextAppRouterAdapter,
  createNextPagesRouterAdapter,
  createReactRouterAdapter,
} from './adapters'

// ============================================
// RE-EXPORTS FROM @tour-kit/core
// ============================================

// Context & Providers
export {
  TourContext,
  TourProvider,
  TourKitContext,
  TourKitProvider,
} from '@tour-kit/core'

// Hooks
export {
  useTour,
  useStep,
  useSpotlight,
  useElementPosition,
  useKeyboardNavigation,
  useFocusTrap,
  usePersistence,
  useRoutePersistence,
  useMediaQuery,
  usePrefersReducedMotion,
  useBranch,
} from '@tour-kit/core'

// Utilities
export {
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
} from '@tour-kit/core'

// Default configs
export {
  defaultSpotlightConfig,
  defaultKeyboardConfig,
  defaultPersistenceConfig,
  defaultA11yConfig,
  defaultScrollConfig,
} from '@tour-kit/core'

// Types
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
  HotspotPosition,
  // Router types
  RouterAdapter,
  MultiPagePersistenceConfig,
  // Hook return types
  UseTourReturn,
  UseStepReturn,
  UseSpotlightReturn,
  UseFocusTrapReturn,
  UsePersistenceReturn,
  UseRoutePersistenceReturn,
  // Branch types
  BranchTarget,
  BranchToTour,
  BranchSkip,
  BranchWait,
  BranchContext,
  BranchResolver,
  Branch,
  UseBranchReturn,
} from '@tour-kit/core'
