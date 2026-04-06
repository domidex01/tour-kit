import type { ReactNode } from 'react'

/** Survey measurement types */
export type SurveyType = 'nps' | 'csat' | 'ces' | 'custom'

/** Display mode variants */
export type DisplayMode = 'popover' | 'modal' | 'slideout' | 'banner' | 'inline'

/** Survey priority levels for queue ordering */
export type SurveyPriority = 'critical' | 'high' | 'normal' | 'low'

/** Frequency rules for how often a survey can be shown */
export type FrequencyRule =
  | 'once'
  | 'session'
  | 'always'
  | { type: 'times'; count: number }
  | { type: 'interval'; days: number }

/** Reasons a survey was dismissed */
export type DismissalReason =
  | 'close_button'
  | 'overlay_click'
  | 'escape_key'
  | 'snooze'
  | 'completed'
  | 'programmatic'

/** Runtime state for a single survey */
export interface SurveyState {
  id: string
  isActive: boolean
  isVisible: boolean
  isDismissed: boolean
  isSnoozed: boolean
  isCompleted: boolean
  viewCount: number
  lastViewedAt: Date | null
  dismissedAt: Date | null
  dismissalReason: DismissalReason | null
  completedAt: Date | null
  snoozeCount: number
  snoozeUntil: Date | null
  currentStep: number
  responses: Map<string, import('./question').AnswerValue>
}

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

/** Audience targeting condition */
export interface AudienceCondition {
  type: 'user_property' | 'segment' | 'feature_flag' | 'custom'
  key: string
  operator:
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'not_contains'
    | 'in'
    | 'not_in'
    | 'exists'
    | 'not_exists'
  value?: unknown
}

/** Main survey configuration */
export interface SurveyConfig {
  /** Unique identifier for the survey */
  id: string

  /** Survey measurement type */
  type: SurveyType

  /** Display mode variant */
  displayMode: DisplayMode

  /** Priority for queue ordering */
  priority?: SurveyPriority

  /** Survey title */
  title?: string

  /** Survey description or intro text */
  description?: string | ReactNode

  /** Ordered list of questions */
  questions: import('./question').QuestionConfig[]

  /** Frequency rule for showing this survey */
  frequency?: FrequencyRule

  /** Schedule configuration (requires @tour-kit/scheduling) */
  schedule?: unknown

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
