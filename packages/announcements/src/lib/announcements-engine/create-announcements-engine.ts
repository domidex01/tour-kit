/**
 * `createAnnouncementsEngine()` — the React-free half of
 * `<AnnouncementsProvider>` (v3 Phase 3, Task 3.3).
 *
 * Step-3 contract (quoted at `core/src/lib/tour-engine/create-tour-engine.ts:16`):
 * the constructor is INERT — no storage read, no `window`, no timer — so a
 * module-scope construction in an SSR bundle cannot throw. `boot()` is the
 * first thing that touches anything. `getState()` is reference-stable across
 * no-op dispatches, `subscribe()` is synchronous, `destroy()` is terminal.
 *
 * Three seams are injected, each defaulting to today's behaviour:
 *   - `analytics`  a callback, never `@tour-kit/analytics` (a React hook)
 *   - `now`        for deterministic frequency/schedule tests
 *   - `isScheduleActive`  the optional `@tour-kit/scheduling` peer (Decision 7b)
 * and one signal is forwarded by the binding: `setSegments()` (Decision 7a).
 */
import { createListeners } from '@tour-kit/core/engine'
import { createAnnouncementComparator } from '../../core/priority-queue'
import { AnnouncementScheduler } from '../../core/scheduler'
import { getAnnouncementAnalyticsMetadata } from './analytics'
import { computeEligibleIds } from './eligibility'
import { STORAGE_KEY_PREFIX, getStorageKey } from './persistence'
import { announcementsReducer } from './reducer'
import {
  type AnnouncementState,
  type AnnouncementStorageAdapter,
  type AnnouncementsAction,
  type AnnouncementsEngineState,
  DEFAULT_QUEUE_CONFIG,
  type DismissalReason,
  type EngineAnnouncementConfig,
  type IsScheduleActive,
  type QueueConfig,
} from './types'

/**
 * The three events the engine emits. A literal union rather than `string`, so
 * the binding can forward straight into `@tour-kit/analytics`' `track` —
 * whose parameter is the narrower `TourEventName` — with no cast at the
 * boundary. (All three are members of that union; measured.)
 */
export type AnnouncementsAnalyticsEvent =
  | 'announcement_shown'
  | 'announcement_dismissed'
  | 'announcement_completed'

/** The analytics shape the engine needs — a callback, not a package. */
export interface AnnouncementsAnalytics {
  track(
    event: AnnouncementsAnalyticsEvent,
    payload: { tourId: string; metadata: Record<string, unknown> }
  ): void
}

export interface AnnouncementsEngineOptions<TConfig extends EngineAnnouncementConfig> {
  announcements?: TConfig[]
  queueConfig?: Partial<QueueConfig>
  storage?: AnnouncementStorageAdapter | null
  storageKey?: string
  userContext?: Record<string, unknown>
  /** Segment map. `{}` fails every segment audience CLOSED — today's default. */
  segments?: Record<string, boolean>
  analytics?: AnnouncementsAnalytics | null
  now?: () => Date
  /**
   * The optional `@tour-kit/scheduling` peer. Default is the scheduler's own
   * call-time `require`, which degrades OPEN when `require` is absent — i.e.
   * in every ESM build. An ESM consumer passes `isScheduleActive` from
   * `@tour-kit/scheduling/engine` to get real gating (Decision 7b).
   */
  isScheduleActive?: IsScheduleActive
  onShow?: (id: string) => void
  onDismiss?: (id: string, reason: DismissalReason) => void
  onComplete?: (id: string) => void
  /**
   * A pre-built seed. `createAnnouncementsHandle` passes the SAME object it
   * serves as its pre-verb snapshot — two equal-but-distinct objects make
   * `Object.is` false and every consumer renders twice on construction
   * (Phase 2's finding).
   */
  initialState?: AnnouncementsEngineState<TConfig>
}

export interface AnnouncementsEngine<TConfig extends EngineAnnouncementConfig> {
  getState: () => AnnouncementsEngineState<TConfig>
  subscribe: (listener: () => void) => () => void
  destroy: () => void
  boot: () => void
  register: (config: TConfig) => void
  unregister: (id: string) => void
  setAnnouncements: (configs: TConfig[]) => void
  setUserContext: (userContext: Record<string, unknown> | undefined) => void
  setSegments: (segments: Record<string, boolean>) => void
  setQueueConfig: (queueConfig: Partial<QueueConfig>) => void
  show: (id: string) => void
  forceShow: (id: string) => void
  hide: (id: string) => void
  dismiss: (id: string, reason?: DismissalReason) => void
  complete: (id: string) => void
  reset: (id: string) => void
  resetAll: () => void
  getAnnouncementState: (id: string) => AnnouncementState | undefined
  getConfig: (id: string) => TConfig | undefined
  canShow: (id: string) => boolean
  showNext: () => void
  clearQueue: () => void
  /** The eligible-id set, for the binding's own filtered list. */
  getEligibleIds: () => ReadonlySet<string>
}

/**
 * The frozen empty snapshot. `useSyncExternalStore` compares with `Object.is`,
 * and a module constant cannot be generic — so it is built at `never` and
 * handed out through an identity function (plan Decision 4 / Phase 2's rule).
 */
const EMPTY_STATE: AnnouncementsEngineState<never> = Object.freeze({
  announcements: new Map<string, AnnouncementState>(),
  configs: new Map<string, never>(),
  activeAnnouncement: null,
  queue: [] as string[],
})

export function emptyAnnouncementsState<
  TConfig extends EngineAnnouncementConfig,
>(): AnnouncementsEngineState<TConfig> {
  return EMPTY_STATE as unknown as AnnouncementsEngineState<TConfig>
}

/**
 * A storage-free, boot-free seed so a binding's FIRST render already carries
 * the configs. One reducer pass, no side effects — the shape Phase 2 landed as
 * `seedChecklistsState`.
 */
export function seedAnnouncementsState<TConfig extends EngineAnnouncementConfig>(
  configs: TConfig[]
): AnnouncementsEngineState<TConfig> {
  let state = emptyAnnouncementsState<TConfig>()
  for (const config of configs) state = announcementsReducer(state, { type: 'REGISTER', config })
  return state
}

export function createAnnouncementsEngine<TConfig extends EngineAnnouncementConfig>(
  options: AnnouncementsEngineOptions<TConfig> = {}
): AnnouncementsEngine<TConfig> {
  const {
    announcements: initialAnnouncements = [],
    storage = null,
    storageKey = STORAGE_KEY_PREFIX,
    analytics = null,
    now = () => new Date(),
    isScheduleActive,
    onShow,
    onDismiss,
    onComplete,
  } = options

  let configs = initialAnnouncements
  let userContext = options.userContext
  let segments = options.segments ?? {}
  let queueConfig: QueueConfig = { ...DEFAULT_QUEUE_CONFIG, ...options.queueConfig }
  let eligibleIds = computeEligibleIds(configs, segments)

  // Inert: `new AnnouncementScheduler` allocates a PriorityQueue and nothing else.
  const scheduler = new AnnouncementScheduler(queueConfig, isScheduleActive)
  const listeners = createListeners('announcements-engine')
  const timers = new Set<ReturnType<typeof setTimeout>>()

  let state = options.initialState ?? seedAnnouncementsState<TConfig>(configs)
  let booted = false
  let destroyed = false

  const dispatch = (action: AnnouncementsAction<TConfig>): void => {
    // `destroy()` is TERMINAL, and that means for verbs, not just for the
    // fan-out. Clearing the listener set alone leaves `show()` still mutating
    // state after teardown: nobody is told, but the next `getState()` reports
    // it — a torn-down engine that keeps changing its answer. Caught by the
    // plain-Node case in `subpath-resolution.test.ts`.
    if (destroyed) return
    const next = announcementsReducer(state, action)
    if (next === state) return
    state = next
    listeners.notify()
  }

  // ── persistence ────────────────────────────────────────────────────────────
  const persist = (id: string, s: AnnouncementState): void => {
    if (!storage) return
    try {
      storage.setItem(
        getStorageKey(storageKey, id),
        JSON.stringify({
          viewCount: s.viewCount,
          lastViewedAt: s.lastViewedAt?.toISOString() ?? null,
          isDismissed: s.isDismissed,
          dismissedAt: s.dismissedAt?.toISOString() ?? null,
          dismissalReason: s.dismissalReason,
          completedAt: s.completedAt?.toISOString() ?? null,
        })
      )
    } catch {
      // Storage might be full or unavailable
    }
  }

  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: field-by-field
  // narrowing of an untrusted `localStorage` blob. The `??` fallbacks and the
  // ternaries ARE the validation — collapsing them into a helper would hide the
  // allow-list this deliberately spells out. Moved verbatim from the provider.
  const restore = (id: string): Partial<AnnouncementState> | null => {
    if (!storage) return null
    try {
      const data = storage.getItem(getStorageKey(storageKey, id))
      if (!data || typeof data !== 'string') return null
      const parsed = JSON.parse(data)
      return {
        viewCount: parsed.viewCount ?? 0,
        lastViewedAt: parsed.lastViewedAt ? new Date(parsed.lastViewedAt) : null,
        isDismissed: parsed.isDismissed ?? false,
        dismissedAt: parsed.dismissedAt ? new Date(parsed.dismissedAt) : null,
        dismissalReason: parsed.dismissalReason ?? null,
        completedAt: parsed.completedAt ? new Date(parsed.completedAt) : null,
      }
    } catch {
      return null
    }
  }

  // ── the show pipeline's side effects, shared by every entry point ──────────
  const emitShown = (config: TConfig, before: AnnouncementState, trigger: string): void => {
    const after: AnnouncementState = {
      ...before,
      isActive: true,
      isVisible: true,
      viewCount: before.viewCount + 1,
      lastViewedAt: now(),
    }
    persist(config.id, after)
    analytics?.track('announcement_shown', {
      tourId: config.id,
      metadata: getAnnouncementAnalyticsMetadata(config, {
        trigger,
        viewCount: after.viewCount,
      }),
    })
    config.onShow?.()
    onShow?.(config.id)
  }

  /** Segment-shape audiences are refused until `setSegments` admits them. */
  const segmentAdmits = (config: TConfig): boolean =>
    !(config.audience && !Array.isArray(config.audience) && !eligibleIds.has(config.id))

  const showInternal = (id: string, trigger: string): boolean => {
    const before = state.announcements.get(id)
    const config = state.configs.get(id)
    if (!before || !config) return false
    if (!segmentAdmits(config)) return false
    if (!scheduler.canShow(config, before, userContext)) return false

    if (scheduler.shouldQueue(config, before, userContext)) {
      scheduler.enqueue(config)
      dispatch({ type: 'ADVANCE_QUEUE', queue: scheduler.getQueuedIds() })
      return false
    }

    scheduler.markActive()
    dispatch({ type: 'SHOW', id })
    emitShown(config, before, trigger)
    return true
  }

  /**
   * Advance to the next queued announcement, in ONE transition (Decision 5).
   *
   * `scheduler.getNext()` MUTATES the scheduler — it dequeues. The provider
   * then re-synced `state.queue` with a separate dispatch and showed with a
   * third, so a subscriber could observe a frame in which the promoted id had
   * left the queue and not yet arrived. Here the gates run first and a single
   * `ADVANCE_QUEUE` carries both the new queue and the id to promote, so that
   * frame cannot exist and the advance costs one notification.
   */
  const advanceQueue = (): void => {
    const nextId = scheduler.getNext()
    if (!nextId) return

    const before = state.announcements.get(nextId)
    const config = state.configs.get(nextId)

    // Every refusal path still re-syncs the queue, because `getNext()` already
    // dequeued — dropping the re-sync is the original desync.
    if (
      !before ||
      !config ||
      !segmentAdmits(config) ||
      !scheduler.canShow(config, before, userContext)
    ) {
      dispatch({ type: 'ADVANCE_QUEUE', queue: scheduler.getQueuedIds() })
      return
    }

    if (scheduler.shouldQueue(config, before, userContext)) {
      scheduler.enqueue(config)
      dispatch({ type: 'ADVANCE_QUEUE', queue: scheduler.getQueuedIds() })
      return
    }

    scheduler.markActive()
    dispatch({ type: 'ADVANCE_QUEUE', queue: scheduler.getQueuedIds(), show: nextId })
    emitShown(config, before, 'queue')
  }

  const scheduleAdvance = (): void => {
    if (!(scheduler.autoShow && scheduler.queueSize > 0)) return
    const timer = setTimeout(() => {
      timers.delete(timer)
      advanceQueue()
    }, scheduler.delayBetween)
    timers.add(timer)
  }

  const recomputeEligibility = (): void => {
    eligibleIds = computeEligibleIds(configs, segments)
  }

  /** The auto-show pass — the engine port of the provider's `:432` effect. */
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: orchestrates
  // eligibility filtering, the priority sort and the queue/show dispatch —
  // splitting would fragment the scheduler contract. Carried over from the
  // provider effect it replaces, which had the same suppression.
  const autoShow = (): void => {
    if (state.announcements.size === 0) return

    const eligible: TConfig[] = []
    for (const config of configs) {
      if (config.autoShow === false) continue
      if (!eligibleIds.has(config.id)) continue
      const st = state.announcements.get(config.id)
      if (!st) continue
      if (st.isActive || st.isVisible) continue
      if (scheduler.isQueued(config.id)) continue
      if (!scheduler.canShow(config, st, userContext)) continue
      eligible.push(config)
    }
    if (eligible.length === 0) return

    const cfg = scheduler.queueConfig
    const sequenceById = new Map(configs.map((a, index) => [a.id, index]))
    eligible.sort(
      createAnnouncementComparator(cfg.priorityOrder, cfg.priorityWeights, sequenceById)
    )

    for (const config of eligible) {
      const st = state.announcements.get(config.id)
      if (!st) continue
      if (scheduler.shouldQueue(config, st, userContext)) {
        scheduler.enqueue(config)
        dispatch({ type: 'ADVANCE_QUEUE', queue: scheduler.getQueuedIds() })
        continue
      }
      scheduler.markActive()
      dispatch({ type: 'SHOW', id: config.id })
      emitShown(config, st, 'auto')
    }
  }

  return {
    getState: () => state,
    subscribe: listeners.add,

    destroy: () => {
      if (destroyed) return
      destroyed = true
      for (const t of timers) clearTimeout(t)
      timers.clear()
      listeners.clear()
    },

    boot: () => {
      if (booted || destroyed) return
      booted = true
      const restored = new Map<string, Partial<AnnouncementState>>()
      for (const config of configs) {
        dispatch({ type: 'REGISTER', config })
        const r = restore(config.id)
        if (r) restored.set(config.id, r)
      }
      if (restored.size > 0) dispatch({ type: 'RESTORE_STATE', states: restored })
      autoShow()
    },

    register: (config) => {
      dispatch({ type: 'REGISTER', config })
      if (!configs.some((c) => c.id === config.id)) configs = [...configs, config]
      recomputeEligibility()
    },

    unregister: (id) => {
      dispatch({ type: 'UNREGISTER', id })
      scheduler.remove(id)
      configs = configs.filter((c) => c.id !== id)
      recomputeEligibility()
    },

    setAnnouncements: (next) => {
      configs = next
      recomputeEligibility()
      const restored = new Map<string, Partial<AnnouncementState>>()
      for (const config of next) {
        dispatch({ type: 'REGISTER', config })
        if (!booted) continue
        const r = restore(config.id)
        if (r) restored.set(config.id, r)
      }
      if (restored.size > 0) dispatch({ type: 'RESTORE_STATE', states: restored })
      if (booted) autoShow()
    },

    setUserContext: (next) => {
      userContext = next
      if (booted) autoShow()
    },

    setSegments: (next) => {
      segments = next
      recomputeEligibility()
      if (booted) autoShow()
    },

    setQueueConfig: (next) => {
      queueConfig = { ...DEFAULT_QUEUE_CONFIG, ...next }
      scheduler.updateConfig(queueConfig)
    },

    show: (id) => void showInternal(id, 'manual'),

    forceShow: (id) => {
      const before = state.announcements.get(id)
      const config = state.configs.get(id)
      if (!before || !config) return
      scheduler.markActive()
      dispatch({ type: 'FORCE_SHOW', id })
      const after: AnnouncementState = {
        ...before,
        isActive: true,
        isVisible: true,
        viewCount: before.viewCount + 1,
        lastViewedAt: now(),
        isDismissed: false,
        dismissedAt: null,
        dismissalReason: null,
      }
      persist(id, after)
      analytics?.track('announcement_shown', {
        tourId: id,
        metadata: getAnnouncementAnalyticsMetadata(config, {
          trigger: 'forced',
          viewCount: after.viewCount,
        }),
      })
      config.onShow?.()
      onShow?.(id)
    },

    hide: (id) => {
      dispatch({ type: 'HIDE', id })
      scheduler.markInactive()
    },

    dismiss: (id, reason: DismissalReason = 'programmatic') => {
      const before = state.announcements.get(id)
      const config = state.configs.get(id)
      if (!before) return

      dispatch({ type: 'DISMISS', id, reason })
      scheduler.markInactive()
      scheduler.remove(id)
      dispatch({ type: 'ADVANCE_QUEUE', queue: scheduler.getQueuedIds() })

      persist(id, {
        ...before,
        isActive: false,
        isVisible: false,
        isDismissed: true,
        dismissedAt: now(),
        dismissalReason: reason,
      })
      if (config) {
        analytics?.track('announcement_dismissed', {
          tourId: id,
          metadata: getAnnouncementAnalyticsMetadata(config, { reason }),
        })
      }
      config?.onDismiss?.(reason)
      onDismiss?.(id, reason)
      scheduleAdvance()
    },

    complete: (id) => {
      const before = state.announcements.get(id)
      const config = state.configs.get(id)
      if (!before) return

      dispatch({ type: 'COMPLETE', id })
      scheduler.markInactive()
      persist(id, { ...before, isActive: false, isVisible: false, completedAt: now() })
      if (config) {
        analytics?.track('announcement_completed', {
          tourId: id,
          metadata: getAnnouncementAnalyticsMetadata(config),
        })
      }
      config?.onComplete?.()
      onComplete?.(id)
      scheduleAdvance()
    },

    reset: (id) => {
      dispatch({ type: 'RESET', id })
      try {
        storage?.removeItem(getStorageKey(storageKey, id))
      } catch {
        // Ignore storage errors
      }
    },

    resetAll: () => {
      const ids = [...state.announcements.keys()]
      dispatch({ type: 'RESET_ALL' })
      for (const id of ids) {
        try {
          storage?.removeItem(getStorageKey(storageKey, id))
        } catch {
          // Ignore storage errors
        }
      }
    },

    getAnnouncementState: (id) => state.announcements.get(id),
    getConfig: (id) => state.configs.get(id),

    canShow: (id) => {
      const st = state.announcements.get(id)
      const config = state.configs.get(id)
      if (!st || !config) return false
      if (!segmentAdmits(config)) return false
      return scheduler.canShow(config, st, userContext)
    },

    showNext: advanceQueue,

    clearQueue: () => {
      scheduler.clearQueue()
      dispatch({ type: 'ADVANCE_QUEUE', queue: [] })
    },

    getEligibleIds: () => eligibleIds,
  }
}
