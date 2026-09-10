/**
 * React-free type surface for `@tour-kit/announcements/engine`.
 *
 * v3 Phase 3, Task 3.1. Every type the engine barrel reaches lives here, and
 * nothing here may reach `../../types/` — that barrel type-imports ReactNode,
 * and a type import leaves no trace in the emitted JS, so a `dist:size` gate
 * and a JS closure scan both stay green while React sits in the declaration
 * chain (recipe gap 18). The source walk in `no-react-in-engine-dist.test.ts`
 * is what catches it.
 *
 * NOTE — do not write the bare specifier in prose here. rollup-dts preserves
 * doc comments into `dist/engine/index.d.ts`, so a comment quoting it trips
 * the declaration-closure guard. Measured 2026-09-10: this very block did.
 *
 * The direction of dependency is the point: `../../types/announcement.ts`
 * imports FROM here and widens `title`/`description` to `ReactNode`. The
 * engine never learns that those fields exist.
 */
import type { AudienceProp, FrequencyRule } from '@tour-kit/core/engine'
import type { Schedule } from '@tour-kit/scheduling/engine'

/** Announcement display variants. React-free — a string union. */
export type AnnouncementVariant = 'modal' | 'slideout' | 'banner' | 'toast' | 'spotlight'

/** Announcement priority levels */
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'critical'

/** Dismissal reasons for analytics and state tracking */
export type DismissalReason =
  | 'close_button'
  | 'overlay_click'
  | 'escape_key'
  | 'primary_action'
  | 'secondary_action'
  | 'auto_dismiss'
  | 'programmatic'

/** Queue priority ordering */
export type PriorityOrder = 'priority' | 'fifo' | 'lifo'

/** Behavior when a new announcement is added while one is active */
export type StackBehavior = 'queue' | 'replace' | 'stack'

/**
 * Per-announcement runtime state. Measured React-free before the extraction —
 * this interface moved verbatim.
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

/** Queue configuration */
export interface QueueConfig {
  /** Maximum number of announcements that can be shown concurrently */
  maxConcurrent: number
  /** How to order announcements in the queue */
  priorityOrder: PriorityOrder
  /** Behavior when new announcements are added */
  stackBehavior: StackBehavior
  /** Default delay between announcements (ms) */
  delayBetween: number
  /** Priority weights for ordering (higher = more important) */
  priorityWeights: Record<AnnouncementPriority, number>
  /** Whether to auto-show queued announcements */
  autoShow: boolean
}

/** Default queue configuration */
export const DEFAULT_QUEUE_CONFIG: QueueConfig = {
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

/** Queue item with metadata */
export interface QueueItem {
  id: string
  priority: AnnouncementPriority
  addedAt: number
  weight: number
  /** Monotonic sequence number for ordering items with same timestamp */
  sequence: number
}

/**
 * The half of `AnnouncementConfig` the engine reads.
 *
 * `title`, `description`, `media`, `primaryAction` and `secondaryAction` are
 * deliberately absent: they are presentation, they carry `ReactNode`, and the
 * scheduler/reducer/eligibility never look at them. `AnnouncementConfig`
 * extends this and adds them back on the React side (plan Decision 4).
 *
 * `variant` is optional here and required there — narrowing an optional
 * property in an extending interface is legal, and it lets an engine-only
 * consumer register `{ id }` without inventing a presentation choice.
 */
export interface EngineAnnouncementConfig {
  /** Unique identifier */
  id: string
  /** Display variant — presentation metadata the engine only forwards to analytics */
  variant?: AnnouncementVariant
  /** Priority for queue ordering */
  priority?: AnnouncementPriority
  /** Frequency rule for showing this announcement */
  frequency?: FrequencyRule
  /**
   * Schedule configuration. Typed from `@tour-kit/scheduling/engine`, never the
   * main entry — the main entry's `.d.ts` names `react` four times, which would
   * put React in this engine's declaration closure (plan Decision 7b item 2).
   */
  schedule?: Schedule
  /** Audience targeting — an inline condition array or a `{ segment }` reference */
  audience?: AudienceProp
  /** Free-form category tag */
  category?: string
  /** Custom metadata */
  metadata?: Record<string, unknown>
  /** Show automatically on register or when eligibility changes. Default `true`. */
  autoShow?: boolean
  /** Callback when announcement is shown */
  onShow?: () => void
  /** Callback when announcement is dismissed */
  onDismiss?: (reason: DismissalReason) => void
  /** Callback when primary action is completed */
  onComplete?: () => void
}

/**
 * Engine state, with ONE generic parameter carrying the config map.
 *
 * `announcements` is React-free already, so unlike checklists this needs no
 * indexed-access trick — the whole of the React contamination is `configs`.
 */
export interface AnnouncementsEngineState<
  TConfig extends EngineAnnouncementConfig = EngineAnnouncementConfig,
> {
  announcements: Map<string, AnnouncementState>
  configs: Map<string, TConfig>
  activeAnnouncement: string | null
  queue: string[]
}

/**
 * The reducer's action union, discriminated on `type`.
 *
 * Every arm that stamps a timestamp carries `at`, so the ENGINE's injected
 * clock is the only clock. Before this, the reducer called `new Date()` while
 * the engine called `now()` for the SAME three fields — `lastViewedAt`,
 * `dismissedAt`, `completedAt` — so state and the persisted blob recorded
 * different times for one event, and an injected `now` silently controlled
 * nothing a frequency rule reads.
 */
export type AnnouncementsAction<
  TConfig extends EngineAnnouncementConfig = EngineAnnouncementConfig,
> =
  | { type: 'REGISTER'; config: TConfig }
  | { type: 'UNREGISTER'; id: string }
  | { type: 'SHOW'; id: string; at: Date }
  | { type: 'FORCE_SHOW'; id: string; at: Date }
  | { type: 'HIDE'; id: string }
  | { type: 'DISMISS'; id: string; reason: DismissalReason; at: Date }
  | { type: 'COMPLETE'; id: string; at: Date }
  | { type: 'RESET'; id: string }
  | { type: 'RESET_ALL' }
  | { type: 'SET_ACTIVE'; id: string | null }
  /**
   * The single writer of `state.queue` (plan Decision 5). Carries the id to
   * promote so the re-sync and the SHOW land in ONE reducer pass — a two-step
   * advance leaves a frame where the promoted id is neither queued nor active,
   * and that frame is what a binding renders.
   */
  | { type: 'ADVANCE_QUEUE'; queue: string[]; show?: string | null; at: Date }
  | { type: 'RESTORE_STATE'; states: Map<string, Partial<AnnouncementState>> }

/**
 * The optional-peer seam (plan Decision 7b).
 *
 * Mirrors `@tour-kit/scheduling/engine`'s own `isScheduleActive`, whose second
 * parameter is optional — so that export is assignable here and a consumer
 * passes it straight through with no adapter.
 */
export type IsScheduleActive = (schedule: Schedule, options: { now: Date }) => { isActive: boolean }

/** Storage adapter interface for persistence — a subset of `Storage`. */
export interface AnnouncementStorageAdapter {
  getItem(key: string): string | null | Promise<string | null>
  setItem(key: string, value: string): void | Promise<void>
  removeItem(key: string): void | Promise<void>
}
