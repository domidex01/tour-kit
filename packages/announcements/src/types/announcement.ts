import type { ReactNode } from 'react'

// AudienceCondition was promoted to @tour-kit/core in Phase 1 of the
// UserGuiding parity initiative. FrequencyRule was promoted in Phase 3a.
// Re-exported here for backward compat — existing
// `import { AudienceCondition, FrequencyRule } from '@tour-kit/announcements'`
// consumers continue to work without source changes.
import type { AudienceCondition, AudienceProp, FrequencyRule, LocalizedText } from '@tour-kit/core'
import type { MediaSlotType } from '@tour-kit/media'
// v3 Phase 3 — the React-free half of this barrel lives in the engine now, and
// the dependency runs THIS way: the engine never learns that `title` exists.
import type {
  AnnouncementVariant,
  DismissalReason,
  EngineAnnouncementConfig,
} from '../lib/announcements-engine/types'

export type { AudienceCondition, AudienceProp, FrequencyRule }
export type {
  AnnouncementPriority,
  AnnouncementState,
  AnnouncementStorageAdapter,
  AnnouncementVariant,
  DismissalReason,
} from '../lib/announcements-engine/types'

// Phase 5a — re-export changelog types for discoverability. Source-of-truth
// definitions live in `../changelog/feed.ts`; this barrel keeps the
// announcement type surface unified.
export type { ChangelogEntry, SerializeFeedOptions } from '../changelog/feed'

// Phase 1 hoist — segment-audience type guard now lives in @tour-kit/core.
// Re-export preserves the public `@tour-kit/announcements` surface.
export { isSegmentAudience } from '@tour-kit/core'

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
export interface AnnouncementConfig extends EngineAnnouncementConfig {
  /** Unique identifier for the announcement */
  id: string

  /**
   * Display variant. Required here, optional on `EngineAnnouncementConfig` —
   * an engine-only consumer renders its own UI and has no variant to pick.
   */
  variant: AnnouncementVariant

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
