import type { AnnouncementConfig, AnnouncementState, DismissalReason } from './announcement'
import type { QueueConfig } from './queue'
import type { ToastAdapter } from './toast-adapter'

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

  /**
   * Force-show an announcement, bypassing every gate enumerated in
   * `FORCE_SHOW_BYPASS` (frequency, scheduler cooldown, viewCount, isDismissed,
   * audience). The `<LicenseGate require="pro">` wrapper is NOT bypassed —
   * unlicensed renders still show the license watermark/warning state.
   *
   * Used by admin previews and demo affordances. `viewCount` is still
   * incremented (so admins see real telemetry deltas) and analytics events
   * are stamped with `metadata.trigger="forced"` for downstream filtering.
   */
  forceShow: (id: string) => void

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

  /**
   * Optional toast adapter routing `variant="toast"` announcements through an
   * external transport (Sonner, react-hot-toast, …). When `null`, the built-in
   * `<AnnouncementToast>` portal renders. See `@tour-kit/announcements/adapters/sonner`.
   */
  toastAdapter: ToastAdapter | null
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

  /**
   * Optional toast adapter routing `variant="toast"` announcements through an
   * external transport (Sonner, react-hot-toast, …). The adapter is invoked
   * inside `<AnnouncementToast>` via context — when `render` returns a non-null
   * handle, the built-in portal toast is suppressed; when it returns `null`
   * (e.g., sonner isn't installed), the portal renders as before.
   *
   * @example
   * ```tsx
   * import { sonnerAdapter } from '@tour-kit/announcements/adapters/sonner'
   * <AnnouncementsProvider toastAdapter={sonnerAdapter}>{children}</AnnouncementsProvider>
   * ```
   */
  toastAdapter?: ToastAdapter
}
