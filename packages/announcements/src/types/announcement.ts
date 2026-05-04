import type { ReactNode } from 'react'

// AudienceCondition was promoted to @tour-kit/core in Phase 1 of the
// UserGuiding parity initiative. FrequencyRule was promoted in Phase 3a.
// Re-exported here for backward compat — existing
// `import { AudienceCondition, FrequencyRule } from '@tour-kit/announcements'`
// consumers continue to work without source changes.
import type { AudienceCondition, AudienceProp, FrequencyRule, LocalizedText } from '@tour-kit/core'
import type { MediaSlotType } from '@tour-kit/media'

export type { AudienceCondition, AudienceProp, FrequencyRule }

/**
 * Type guard narrowing `AudienceProp` to its segment-named branch. Mirrors the
 * private guard in `@tour-kit/hints` — keep both in lockstep when changing the
 * discriminator.
 */
export function isSegmentAudience(a: AudienceProp): a is { segment: string } {
  return !Array.isArray(a) && typeof a === 'object' && a !== null && 'segment' in a
}

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
 * Media configuration for announcements.
 *
 * Phase 4 widening: `type` was previously `'image' | 'video' | 'lottie'`. It is
 * now the full `MediaSlotType` union (9 values incl. `'auto'`) so consumers can
 * point at YouTube/Vimeo/Loom/Wistia/GIF URLs and have `<MediaSlot>` dispatch
 * automatically. The narrower legacy values stay assignable — non-breaking.
 */
export interface AnnouncementMedia {
  type?: MediaSlotType
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

  /**
   * Title of the announcement. Supports plain strings (interpolated against
   * `userContext` from `<SegmentationProvider>`), i18n keys
   * (`{ key: 'announcement.foo.title' }` resolved via `useT()`), or any
   * `ReactNode` body. Strings without `{{var}}` tokens render unchanged.
   */
  title?: ReactNode | LocalizedText

  /**
   * Description or body content. Same `ReactNode | LocalizedText` shape as
   * `title`; ReactNode children pass through unchanged so consumers can
   * supply rich JSX bodies.
   */
  description?: ReactNode | LocalizedText

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

  /**
   * Audience targeting. Accepts either an inline `AudienceCondition[]` (legacy)
   * evaluated by `matchesAudience(...)`, or a `{ segment: string }` reference
   * to a segment registered in `<SegmentationProvider>` and evaluated by
   * `useSegments()`. The array branch is fully backward-compatible.
   */
  audience?: AudienceProp

  /** Variant-specific options */
  modalOptions?: ModalOptions
  slideoutOptions?: SlideoutOptions
  bannerOptions?: BannerOptions
  toastOptions?: ToastOptions
  spotlightOptions?: SpotlightOptions

  /**
   * Optional free-form category tag — presentation-layer metadata only.
   * Phase 5a's changelog feed will read this for grouping and filtering;
   * 3c only round-trips the field through the type system. Examples:
   * `'feature'`, `'fix'`, `'breaking'`, `'security'`.
   */
  category?: string

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
