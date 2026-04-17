// ============================================
// STYLED COMPONENTS
// ============================================

export { AnnouncementOverlay } from './components/announcement-overlay'
export type { AnnouncementOverlayProps } from './components/announcement-overlay'

export { AnnouncementClose } from './components/announcement-close'
export type { AnnouncementCloseProps } from './components/announcement-close'

export { AnnouncementContent } from './components/announcement-content'
export type { AnnouncementContentProps } from './components/announcement-content'

export { AnnouncementActions } from './components/announcement-actions'
export type { AnnouncementActionsProps } from './components/announcement-actions'

export { AnnouncementModal } from './components/announcement-modal'
export type { AnnouncementModalProps } from './components/announcement-modal'

export { AnnouncementSlideout } from './components/announcement-slideout'
export type { AnnouncementSlideoutProps } from './components/announcement-slideout'

export { AnnouncementBanner } from './components/announcement-banner'
export type { AnnouncementBannerProps } from './components/announcement-banner'

export { AnnouncementToast } from './components/announcement-toast'
export type { AnnouncementToastProps } from './components/announcement-toast'

export { AnnouncementSpotlight } from './components/announcement-spotlight'
export type { AnnouncementSpotlightProps } from './components/announcement-spotlight'

// ============================================
// HEADLESS COMPONENTS
// ============================================

export { HeadlessModal } from './components/headless/headless-modal'
export type {
  HeadlessModalProps,
  HeadlessModalRenderProps,
} from './components/headless/headless-modal'

export { HeadlessSlideout } from './components/headless/headless-slideout'
export type {
  HeadlessSlideoutProps,
  HeadlessSlideoutRenderProps,
} from './components/headless/headless-slideout'

export { HeadlessBanner } from './components/headless/headless-banner'
export type {
  HeadlessBannerProps,
  HeadlessBannerRenderProps,
} from './components/headless/headless-banner'

export { HeadlessToast } from './components/headless/headless-toast'
export type {
  HeadlessToastProps,
  HeadlessToastRenderProps,
} from './components/headless/headless-toast'

export { HeadlessSpotlight } from './components/headless/headless-spotlight'
export type {
  HeadlessSpotlightProps,
  HeadlessSpotlightRenderProps,
} from './components/headless/headless-spotlight'

// ============================================
// UI VARIANTS (for customization)
// ============================================

export { modalOverlayVariants, modalContentVariants } from './components/ui/modal-variants'

export { slideoutOverlayVariants, slideoutContentVariants } from './components/ui/slideout-variants'

export { bannerVariants } from './components/ui/banner-variants'

export {
  toastContainerVariants,
  toastVariants,
  toastProgressVariants,
} from './components/ui/toast-variants'

export {
  spotlightOverlayVariants,
  spotlightContentVariants,
} from './components/ui/spotlight-variants'

// ============================================
// CONTEXT & PROVIDERS
// ============================================

export { AnnouncementsContext, useAnnouncementsContext } from './context/announcements-context'
export { AnnouncementsProvider } from './context/announcements-provider'

// ============================================
// HOOKS
// ============================================

export { useAnnouncement } from './hooks/use-announcement'
export type { UseAnnouncementReturn } from './hooks/use-announcement'

export { useAnnouncements } from './hooks/use-announcements'
export type { AnnouncementsFilter, UseAnnouncementsReturn } from './hooks/use-announcements'

export { useAnnouncementQueue } from './hooks/use-announcement-queue'
export type { UseAnnouncementQueueReturn } from './hooks/use-announcement-queue'

// ============================================
// CORE UTILITIES
// ============================================

export { PriorityQueue, createComparator } from './core/priority-queue'
export { AnnouncementScheduler } from './core/scheduler'
export { canShowByFrequency, canShowAfterDismissal, getViewLimit } from './core/frequency'
export { matchesAudience, validateConditions } from './core/audience'

// ============================================
// UTILITIES
// ============================================

export { cn } from './lib/utils'
export { Slot } from './lib/slot'
export { UnifiedSlot } from './lib/slot'
export type { RenderProp, UnifiedSlotProps } from './lib/slot'

// UI Library Provider (Base UI support)
export {
  UILibraryProvider,
  useUILibrary,
  type UILibrary,
  type UILibraryProviderProps,
} from './lib/ui-library-context'

// ============================================
// TYPES
// ============================================

export type {
  // Announcement types
  AnnouncementVariant,
  AnnouncementPriority,
  FrequencyRule,
  DismissalReason,
  AnnouncementState,
  AnnouncementAction,
  AnnouncementMedia,
  BannerPosition,
  SlideoutPosition,
  ToastPosition,
  ModalOptions,
  SlideoutOptions,
  BannerOptions,
  ToastOptions,
  SpotlightOptions,
  AnnouncementConfig,
  AudienceCondition,
  AnnouncementStorageAdapter,
} from './types/announcement'

export type {
  // Context types
  AnnouncementsContextValue,
  AnnouncementsProviderProps,
} from './types/context'

export type {
  // Queue types
  PriorityOrder,
  StackBehavior,
  QueueConfig,
  QueueItem,
} from './types/queue'

export { DEFAULT_QUEUE_CONFIG } from './types/queue'

export type {
  // Event types
  AnnouncementEventType,
  BaseAnnouncementEvent,
  AnnouncementRegisteredEvent,
  AnnouncementShownEvent,
  AnnouncementDismissedEvent,
  AnnouncementCompletedEvent,
  AnnouncementActionClickedEvent,
  AnnouncementQueuedEvent,
  AnnouncementDequeuedEvent,
  AnnouncementEvent,
} from './types/events'
