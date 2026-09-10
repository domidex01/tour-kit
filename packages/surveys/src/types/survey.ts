// Re-export `AudienceCondition` from `@tour-kit/core` (Phase 1 hoist). The
// surveys-local interface had a byte-identical shape, so the alias is
// type-equivalent and existing consumers keep their import path.
import type { AudienceCondition } from '@tour-kit/core'
import type { ReactNode } from 'react'
// v3 Phase 3 — the React-free half of this barrel lives in the engine now, and
// the dependency runs THIS way: the engine never learns that `description`
// carries ReactNode or that `questions` carry media.
import type {
  DismissalReason,
  DisplayMode,
  EngineSurveyConfig,
  FrequencyRule,
  SurveyType,
} from '../lib/surveys-engine/types'
export type { AudienceCondition }
export type {
  DismissalReason,
  DisplayMode,
  FrequencyRule,
  SurveyPriority,
  SurveyState,
  SurveyType,
} from '../lib/surveys-engine/types'


/** Position options for slideout variant */
export type SlideoutPosition = 'left' | 'right'

/** Position options for banner variant */
export type BannerPosition = 'top' | 'bottom'

/** Position options for popover variant */
export type PopoverPosition = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'

/** Modal variant options */
export interface ModalOptions {
  size?: 'sm' | 'md' | 'lg'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
}

/** Slideout variant options */
export interface SlideoutOptions {
  position?: SlideoutPosition
  size?: 'sm' | 'md' | 'lg'
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
}

/** Banner variant options */
export interface BannerOptions {
  position?: BannerPosition
  sticky?: boolean
  dismissable?: boolean
  intent?: 'info' | 'feedback'
}

/** Popover variant options */
export interface PopoverOptions {
  position?: PopoverPosition
  offset?: number
  showCloseButton?: boolean
}

// `AudienceCondition` was re-exported from `@tour-kit/core` at the top of
// this file (Phase 1 refactor train) — the surveys-local copy is gone.

/** Main survey configuration */
export interface SurveyConfig extends EngineSurveyConfig {
  /** Unique identifier for the survey */
  id: string

  /** Survey measurement type */
  type: SurveyType

  /** Display mode variant */
  displayMode: DisplayMode


  /** Survey title */
  title?: string

  /** Survey description or intro text */
  description?: string | ReactNode

  /** Ordered list of questions */
  questions: import('./question').QuestionConfig[]

  /** Frequency rule for showing this survey */
  frequency?: FrequencyRule


  /** Audience targeting conditions */
  audience?: AudienceCondition[]

  /** Global cooldown in days between any survey (overrides provider default) */
  globalCooldownDays?: number

  /** Probability (0-1) that this survey is shown to a given user */
  samplingRate?: number

  /** Maximum times user can snooze this survey */
  maxSnoozeCount?: number

  /** Days before snoozed survey returns */
  snoozeDelayDays?: number

  /** Maximum surveys shown per session (overrides provider default) */
  maxPerSession?: number

  /** Modal variant options */
  modalOptions?: ModalOptions

  /** Slideout variant options */
  slideoutOptions?: SlideoutOptions

  /** Banner variant options */
  bannerOptions?: BannerOptions

  /** Popover variant options */
  popoverOptions?: PopoverOptions

  /** Custom metadata */
  metadata?: Record<string, unknown>

  /** Callback when survey is shown */
  onShow?: () => void

  /** Callback when survey is dismissed */
  onDismiss?: (reason: DismissalReason) => void

  /** Callback when survey is completed */
  onComplete?: (responses: Map<string, import('./question').AnswerValue>) => void

  /** Callback when a question is answered */
  onAnswer?: (questionId: string, value: import('./question').AnswerValue) => void
}

/** Storage adapter interface for persistence */
export interface SurveyStorageAdapter {
  getItem(key: string): string | null | Promise<string | null>
  setItem(key: string, value: string): void | Promise<void>
  removeItem(key: string): void | Promise<void>
}
