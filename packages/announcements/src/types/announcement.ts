import type { ReactNode } from 'react'

// AudienceCondition was promoted to @tour-kit/core in Phase 1 of the
// UserGuiding parity initiative. FrequencyRule was promoted in Phase 3a.
// Re-exported here for backward compat — existing
// `import { AudienceCondition, FrequencyRule } from '@tour-kit/announcements'`
// consumers continue to work without source changes.
import type { AudienceCondition, FrequencyRule } from '@tour-kit/core'

export type { AudienceCondition, FrequencyRule }

/**
 * Announcement display variants
 */
export type AnnouncementVariant = 'modal' | 'slideout' | 'banner' | 'toast' | 'spotlight'

/**
 * Announcement priority levels
 */
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'critical'

/**
 * Dismissal reasons for analytics and state tracking
 */
export type DismissalReason =
  | 'close_button'
  | 'overlay_click'
  | 'escape_key'
  | 'primary_action'
  | 'secondary_action'
  | 'auto_dismiss'
  | 'programmatic'

/**
 * Announcement state
 */
export interface AnnouncementState {
  id: string
  isActive: boolean
  isVisible: boolean
  isDismissed: boolean
  viewCount: number
  lastViewedAt: Date | null
  dismissedAt: Date | null
  dismissalReason: DismissalReason | null
  completedAt: Date | null
}

/**
 * Action button configuration
 */
export interface AnnouncementAction {
  label: string
  onClick?: () => void
  href?: string
  variant?: 'primary' | 'secondary' | 'ghost' | 'link'
  /** If true, clicking this action dismisses the announcement */
  dismissOnClick?: boolean
}

/**
 * Media configuration for announcements
 */
export interface AnnouncementMedia {
  type: 'image' | 'video' | 'lottie'
  src: string
  alt?: string
  poster?: string
  aspectRatio?: string
  autoplay?: boolean
  loop?: boolean
  muted?: boolean
}

/**
 * Position options for different variants
 */
export type BannerPosition = 'top' | 'bottom'
export type SlideoutPosition = 'left' | 'right'
export type ToastPosition =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right'
  | 'top-center'
  | 'bottom-center'

/**
 * Variant-specific options
 */
export interface ModalOptions {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
}

export interface SlideoutOptions {
  position?: SlideoutPosition
  size?: 'sm' | 'md' | 'lg'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
}

export interface BannerOptions {
  position?: BannerPosition
  sticky?: boolean
  dismissable?: boolean
  intent?: 'info' | 'success' | 'warning' | 'error'
}

export interface ToastOptions {
  position?: ToastPosition
  autoDismiss?: boolean
  autoDismissDelay?: number
  showProgress?: boolean
  intent?: 'info' | 'success' | 'warning' | 'error'
}

export interface SpotlightOptions {
  targetSelector: string
  placement?: 'top' | 'right' | 'bottom' | 'left'
  offset?: number
  showOverlay?: boolean
  overlayOpacity?: number
  closeOnOverlayClick?: boolean
}

/**
 * Main announcement configuration
 */
export interface AnnouncementConfig {
  /** Unique identifier for the announcement */
  id: string

  /** Display variant */
  variant: AnnouncementVariant

  /** Priority for queue ordering */
  priority?: AnnouncementPriority

  /** Title of the announcement */
  title?: string

  /** Description or body content */
  description?: string | ReactNode

  /** Media to display */
  media?: AnnouncementMedia

  /** Primary action button */
  primaryAction?: AnnouncementAction

  /** Secondary action button */
  secondaryAction?: AnnouncementAction

  /** Frequency rule for showing this announcement */
  frequency?: FrequencyRule

  /** Schedule configuration (requires @tour-kit/scheduling) */
  schedule?: unknown // Will be Schedule type from @tour-kit/scheduling

  /** Audience targeting conditions */
  audience?: AudienceCondition[]

  /** Variant-specific options */
  modalOptions?: ModalOptions
  slideoutOptions?: SlideoutOptions
  bannerOptions?: BannerOptions
  toastOptions?: ToastOptions
  spotlightOptions?: SpotlightOptions

  /** Custom metadata */
  metadata?: Record<string, unknown>

  /**
   * Show this announcement automatically on mount or when eligibility changes.
   * Default: `true`. Set to `false` to trigger imperatively via `show(id)`.
   */
  autoShow?: boolean

  /** Callback when announcement is shown */
  onShow?: () => void

  /** Callback when announcement is dismissed */
  onDismiss?: (reason: DismissalReason) => void

  /** Callback when primary action is completed */
  onComplete?: () => void
}

/**
 * Storage adapter interface for persistence
 */
export interface AnnouncementStorageAdapter {
  getItem(key: string): string | null | Promise<string | null>
  setItem(key: string, value: string): void | Promise<void>
  removeItem(key: string): void | Promise<void>
}
