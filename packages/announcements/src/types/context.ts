import type {
  AnnouncementConfig,
  AnnouncementState,
  DismissalReason,
} from './announcement'
import type { QueueConfig } from './queue'

/**
 * Announcements context value
 */
export interface AnnouncementsContextValue {
  /** All registered announcements */
  announcements: Map<string, AnnouncementState>

  /** Currently active announcement (visible) */
  activeAnnouncement: string | null

  /** Queue of pending announcements */
  queue: string[]

  /** Queue configuration */
  queueConfig: QueueConfig

  /** Register an announcement */
  register: (config: AnnouncementConfig) => void

  /** Unregister an announcement */
  unregister: (id: string) => void

  /** Show an announcement */
  show: (id: string) => void

  /** Hide an announcement temporarily */
  hide: (id: string) => void

  /** Dismiss an announcement (marks as dismissed) */
  dismiss: (id: string, reason?: DismissalReason) => void

  /** Complete an announcement (primary action taken) */
  complete: (id: string) => void

  /** Reset a dismissed announcement */
  reset: (id: string) => void

  /** Reset all dismissed announcements */
  resetAll: () => void

  /** Get announcement state by ID */
  getState: (id: string) => AnnouncementState | undefined

  /** Get announcement config by ID */
  getConfig: (id: string) => AnnouncementConfig | undefined

  /** Check if an announcement can be shown (respects frequency, schedule, etc.) */
  canShow: (id: string) => boolean

  /** Force show next announcement in queue */
  showNext: () => void

  /** Clear the queue */
  clearQueue: () => void
}

/**
 * Provider props
 */
export interface AnnouncementsProviderProps {
  /** Child components */
  children: React.ReactNode

  /** Initial announcements to register */
  announcements?: AnnouncementConfig[]

  /** Queue configuration */
  queueConfig?: Partial<QueueConfig>

  /** Storage adapter for persistence */
  storage?: Storage | null

  /** Storage key prefix */
  storageKey?: string

  /** User context for audience targeting */
  userContext?: Record<string, unknown>

  /** Callback when any announcement is shown */
  onAnnouncementShow?: (id: string) => void

  /** Callback when any announcement is dismissed */
  onAnnouncementDismiss?: (id: string, reason: DismissalReason) => void

  /** Callback when any announcement is completed */
  onAnnouncementComplete?: (id: string) => void
}
