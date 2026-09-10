/**
 * React-free type surface for `@tour-kit/surveys/engine`.
 *
 * v3 Phase 3, Task 3.6. Nothing here may reach `../../types/` — `types/survey.ts`
 * type-imports ReactNode and `types/question.ts` reaches `@tour-kit/media`,
 * whose declarations name React. A type import leaves no trace in the emitted
 * JS, so a size gate and a JS closure scan both stay green while React sits in
 * the declaration chain (recipe gap 18); only the source walk sees it.
 *
 * Unlike announcements, the surveys STATE needs no generic parameter — it was
 * measured React-free already and holds no config at all (configs lived in a
 * `useRef`). Only the options/verb surface takes `TConfig`.
 *
 * NOTE — do not write a bare specifier inside a doc comment here. rollup-dts
 * preserves comments into `dist/engine/index.d.ts`, so prose quoting one trips
 * the declaration-closure guard (measured in PR A).
 */
import type { AudienceCondition } from '@tour-kit/core/engine'
import type { Schedule } from '@tour-kit/scheduling/engine'

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

/**
 * Answer value union covering all question types.
 *
 * Moved here from `types/question.ts` (§0 C3): that file imports
 * `MediaSlotProps` from `@tour-kit/media`, and `SurveyState.responses`
 * referenced it through four inline `import('./question')` type imports, which
 * `reachableFrom` follows. `AnswerValue` itself is four primitives — trivially
 * React-free — while `QuestionConfig` genuinely carries media and stays on the
 * React side.
 */
export type AnswerValue = string | number | boolean | string[]

/** Queue priority ordering strategy */
export type PriorityOrder = 'priority' | 'fifo' | 'lifo'

/** Behavior when a new survey is added while one is active */
export type StackBehavior = 'queue' | 'replace' | 'stack'

/** Runtime state for a single survey. Measured React-free; moved verbatim. */
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
  responses: Map<string, AnswerValue>
  /**
   * Transient per-question validation errors keyed by question id. Populated by
   * `nextQuestion` when a `QuestionConfig.validation` returns a non-null string;
   * cleared on a passing advance. NOT persisted — errors are UI state and must
   * never resurface after a reload.
   */
  validationErrors: Map<string, string>
}

/** Survey queue configuration */
export interface SurveyQueueConfig {
  /** Maximum concurrent surveys (default: 1) */
  maxConcurrent: number
  /** Queue ordering strategy */
  priorityOrder: PriorityOrder
  /** Behavior when adding surveys while one is active */
  stackBehavior: StackBehavior
  /** Delay in ms between consecutive surveys */
  delayBetween: number
  /** Priority weights for ordering */
  priorityWeights: Record<SurveyPriority, number>
  /** Whether to auto-show queued surveys */
  autoShow: boolean
}

/** Default queue configuration */
export const DEFAULT_SURVEY_QUEUE_CONFIG: SurveyQueueConfig = {
  maxConcurrent: 1,
  priorityOrder: 'priority',
  stackBehavior: 'queue',
  delayBetween: 500,
  priorityWeights: {
    critical: 1000,
    high: 100,
    normal: 10,
    low: 1,
  },
  autoShow: true,
}

/** A queued survey with its ordering metadata */
export interface SurveyQueueItem {
  id: string
  priority: SurveyPriority
  addedAt: number
  weight: number
  sequence: number
}

/**
 * The half of `SurveyConfig` the engine reads.
 *
 * `title`, `description` and `questions` are deliberately absent: they are
 * presentation, `description` carries ReactNode and `questions` carries media.
 * The scheduler, the reducer and the six fatigue gates never look at them.
 * `SurveyConfig` extends this and adds them back on the React side.
 */
export interface EngineSurveyConfig {
  /** Unique identifier */
  id: string
  /** Measurement type — drives which scorer applies */
  type?: SurveyType
  /** Display mode — presentation metadata the engine only forwards */
  displayMode?: DisplayMode
  /** Priority for queue ordering */
  priority?: SurveyPriority
  /** How often this survey may be shown */
  frequency?: FrequencyRule
  /**
   * Schedule configuration. Typed from the scheduling package's `/engine`
   * subpath, never its main entry, whose declarations name React.
   */
  schedule?: Schedule
  /** Audience targeting conditions, evaluated against `userContext` */
  audience?: AudienceCondition[]
  /** Minimum days since ANY survey was shown */
  globalCooldownDays?: number
  /** 0–1 fraction of users eligible, resolved once per mount */
  samplingRate?: number
  /** Maximum times this survey may be snoozed */
  maxSnoozeCount?: number
  /** Days to snooze for */
  snoozeDelayDays?: number
  /** Maximum times this survey may be shown per session */
  maxPerSession?: number
  /** Custom metadata */
  metadata?: Record<string, unknown>
  /** Callback when this survey is shown */
  onShow?: () => void
  /** Callback when this survey is dismissed */
  onDismiss?: (reason: DismissalReason) => void
  /** Callback when this survey is completed, with every recorded response */
  onComplete?: (responses: Map<string, AnswerValue>) => void
  /** Callback for each answer recorded */
  onAnswer?: (questionId: string, value: AnswerValue) => void
}

/** Engine state. NO generic parameter — it holds no config (plan Decision 4). */
export interface SurveysEngineState {
  surveys: Map<string, SurveyState>
  activeSurvey: string | null
  queue: string[]
}

/** The reducer's action union, discriminated on `type`. */
export type SurveysAction =
  | { type: 'REGISTER'; config: EngineSurveyConfig }
  | { type: 'UNREGISTER'; id: string }
  | { type: 'SHOW'; id: string }
  | { type: 'HIDE'; id: string; drain: boolean }
  | { type: 'DISMISS'; id: string; reason: DismissalReason; drain: boolean }
  | { type: 'SNOOZE'; id: string; delayDays?: number; drain: boolean }
  | { type: 'ANSWER'; id: string; questionId: string; value: AnswerValue }
  | { type: 'NEXT_QUESTION'; id: string }
  | { type: 'PREV_QUESTION'; id: string }
  | { type: 'SET_VALIDATION_ERROR'; id: string; questionId: string; error: string }
  | { type: 'CLEAR_VALIDATION_ERROR'; id: string; questionId: string }
  | { type: 'COMPLETE'; id: string; drain: boolean }
  | { type: 'RESET'; id: string }
  | { type: 'RESET_ALL' }
  | { type: 'HYDRATE'; surveys: Map<string, SurveyState>; queue: string[] }

/** The optional-peer seam (plan Decision 7b). */
export type IsScheduleActive = (schedule: Schedule, options: { now: Date }) => { isActive: boolean }

/**
 * The storage shape the engine writes through.
 *
 * Injected rather than built inside (§0 C5): six existing suites stub
 * `createStorageAdapter` with `vi.mock('@tour-kit/core')`, and `vi.mock` does
 * NOT intercept the `/engine` subpath. If the engine resolved its own adapter
 * through `/engine`, all six would silently start running against real jsdom
 * `localStorage` — still passing, no longer testing what they say. The binding
 * passes the adapter it already builds from the bare barrel, so every mock
 * stays live and no existing test moves.
 */
export interface SurveyStorageAdapter {
  /**
   * May be async. core's `createStorageAdapter` can return a promise (that is
   * why `boot()` is async and cancellable in the first place), so this must not
   * be narrowed to the synchronous case — narrowing it would force a cast at
   * the binding boundary, which is the one place a cast must never appear.
   */
  getItem(key: string): string | null | Promise<string | null>
  setItem(key: string, value: string): void | Promise<void>
  removeItem(key: string): void | Promise<void>
}
