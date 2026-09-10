import { useAnalyticsOptional } from '@tour-kit/analytics'
import { LicenseGate } from '@tour-kit/license'
import * as React from 'react'
import { createAnnouncementComparator } from '../core/priority-queue'
import { AnnouncementScheduler } from '../core/scheduler'
import { useFilteredAnnouncements } from '../hooks/use-filtered-announcements'
import {
  type AnnouncementConfig,
  type AnnouncementState,
  type DismissalReason,
  isSegmentAudience,
} from '../types/announcement'
import type { AnnouncementsContextValue, AnnouncementsProviderProps } from '../types/context'
import type { QueueConfig } from '../types/queue'
import { DEFAULT_QUEUE_CONFIG } from '../types/queue'
import { getAnnouncementAnalyticsMetadata } from '../lib/announcements-engine/analytics'
import { STORAGE_KEY_PREFIX, getStorageKey } from '../lib/announcements-engine/persistence'
import { announcementsReducer } from '../lib/announcements-engine/reducer'
import { AnnouncementsContext } from './announcements-context'

/**
 * v3 Phase 3 Task 3.2 — the reducer, the storage-key helpers and the analytics
 * payload derivation moved to `../lib/announcements-engine/`.
 *
 * `FORCE_SHOW_BYPASS` is re-exported from THIS module path under the same name
 * on purpose: `__tests__/force-show.test.tsx:11` imports it from
 * `'../context/announcements-provider'` and pins it with a literal array. A
 * moved import path would be a test edit, and Decision 11 forbids that — the
 * re-export is the cheaper half of the trade.
 */
export { FORCE_SHOW_BYPASS, type ForceShowBypassKey } from '../lib/announcements-engine/reducer'


export function AnnouncementsProvider({
  children,
  announcements: initialAnnouncements = [],
  queueConfig: queueConfigOverrides,
  storage = typeof window !== 'undefined' ? localStorage : null,
  storageKey = STORAGE_KEY_PREFIX,
  userContext,
  onAnnouncementShow,
  onAnnouncementDismiss,
  onAnnouncementComplete,
  toastAdapter,
}: AnnouncementsProviderProps) {
  const analytics = useAnalyticsOptional()
  const queueConfig: QueueConfig = React.useMemo(
    () => ({ ...DEFAULT_QUEUE_CONFIG, ...queueConfigOverrides }),
    [queueConfigOverrides]
  )

  // Phase 3c — filter announcements by audience (segment + array shapes) once
  // at the top of the provider so the scheduler / auto-show / canShow
  // eligibility paths only see eligible candidates. The array-shape audience
  // is also re-checked downstream by the scheduler for backward compat.
  const filteredAnnouncements = useFilteredAnnouncements(initialAnnouncements)

  // Set of segment-eligible IDs — used to gate imperative `show(id)` and
  // `canShow(id)` against segment-shape audiences. Without this, an
  // `audience: { segment: 'admins' }` announcement could be shown via
  // `useAnnouncement(id).show()` to non-admins because the scheduler only
  // evaluates the array-shape branch.
  const filteredIds = React.useMemo(
    () => new Set(filteredAnnouncements.map((a) => a.id)),
    [filteredAnnouncements]
  )

  const [state, dispatch] = React.useReducer(announcementsReducer, {
    announcements: new Map(),
    configs: new Map(),
    activeAnnouncement: null,
    queue: [],
  })

  const schedulerRef = React.useRef<AnnouncementScheduler>(new AnnouncementScheduler(queueConfig))

  // Tracks pending "show next in queue" timers so they can be cleared on unmount.
  const queueTimersRef = React.useRef<Set<ReturnType<typeof setTimeout>>>(new Set())

  // Update scheduler config when it changes
  React.useEffect(() => {
    schedulerRef.current.updateConfig(queueConfig)
  }, [queueConfig])

  // Clear any pending queue advance timers when the provider unmounts.
  React.useEffect(() => {
    const timers = queueTimersRef.current
    return () => {
      for (const t of timers) clearTimeout(t)
      timers.clear()
    }
  }, [])

  // Persist state to storage
  const persistState = React.useCallback(
    (id: string, announcementState: AnnouncementState) => {
      if (!storage) return

      try {
        const key = getStorageKey(storageKey, id)
        const data = {
          viewCount: announcementState.viewCount,
          lastViewedAt: announcementState.lastViewedAt?.toISOString() ?? null,
          isDismissed: announcementState.isDismissed,
          dismissedAt: announcementState.dismissedAt?.toISOString() ?? null,
          dismissalReason: announcementState.dismissalReason,
          completedAt: announcementState.completedAt?.toISOString() ?? null,
        }
        storage.setItem(key, JSON.stringify(data))
      } catch {
        // Storage might be full or unavailable
      }
    },
    [storage, storageKey]
  )

  // Restore state from storage
  const restoreState = React.useCallback(
    (id: string): Partial<AnnouncementState> | null => {
      if (!storage) return null

      try {
        const key = getStorageKey(storageKey, id)
        const data = storage.getItem(key)
        if (!data) return null

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
    },
    [storage, storageKey]
  )

  // Register initial announcements
  React.useEffect(() => {
    const statesToRestore = new Map<string, Partial<AnnouncementState>>()

    for (const config of initialAnnouncements) {
      dispatch({ type: 'REGISTER', config })

      const restored = restoreState(config.id)
      if (restored) {
        statesToRestore.set(config.id, restored)
      }
    }

    if (statesToRestore.size > 0) {
      dispatch({ type: 'RESTORE_STATE', states: statesToRestore })
    }
  }, [initialAnnouncements, restoreState])

  // Auto-show eligible announcements after registration / on userContext change.
  // Respects priority queueing via the scheduler.
  // biome-ignore lint/correctness/useExhaustiveDependencies: evaluates on register + audience changes
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: orchestrates eligibility filtering, priority sort, and queue/show dispatch — splitting would fragment the scheduler contract
  React.useEffect(() => {
    if (state.announcements.size === 0) return

    // Collect eligible candidates first so we can show highest-priority immediately
    // and queue the rest. `filteredAnnouncements` already excludes anything
    // ruled out by audience (segment + array shapes) so the scheduler only
    // re-checks the array path for backward-compat semantics.
    const eligible: AnnouncementConfig[] = []
    for (const config of filteredAnnouncements) {
      if (config.autoShow === false) continue
      const st = state.announcements.get(config.id)
      if (!st) continue
      // Skip already active / visible / queued
      if (st.isActive || st.isVisible) continue
      if (schedulerRef.current.isQueued(config.id)) continue
      if (!schedulerRef.current.canShow(config, st, userContext)) continue
      eligible.push(config)
    }

    if (eligible.length === 0) return

    // Phase 3 (refactor train) — sort auto-show candidates by the configured
    // `priorityOrder` + `priorityWeights` (no more hardcoded critical/high/
    // normal/low literal). `sequenceById` carries the insertion order from
    // `filteredAnnouncements` so fifo / lifo break ties deterministically.
    const queueCfg = schedulerRef.current.queueConfig
    const sequenceById = new Map(filteredAnnouncements.map((a, index) => [a.id, index]))
    eligible.sort(
      createAnnouncementComparator(queueCfg.priorityOrder, queueCfg.priorityWeights, sequenceById)
    )

    for (const config of eligible) {
      const st = state.announcements.get(config.id)
      if (!st) continue

      if (schedulerRef.current.shouldQueue(config, st, userContext)) {
        schedulerRef.current.enqueue(config)
        dispatch({ type: 'ADVANCE_QUEUE', queue: schedulerRef.current.getQueuedIds() })
        continue
      }

      schedulerRef.current.markActive()
      dispatch({ type: 'SHOW', id: config.id })

      const updatedState: AnnouncementState = {
        ...st,
        isActive: true,
        isVisible: true,
        viewCount: st.viewCount + 1,
        lastViewedAt: new Date(),
      }
      persistState(config.id, updatedState)

      analytics?.track('announcement_shown', {
        tourId: config.id,
        metadata: getAnnouncementAnalyticsMetadata(config, {
          trigger: 'auto',
          viewCount: updatedState.viewCount,
        }),
      })
      config.onShow?.()
      onAnnouncementShow?.(config.id)
    }
  }, [
    state.announcements,
    userContext,
    filteredAnnouncements,
    persistState,
    analytics,
    onAnnouncementShow,
  ])

  // Context methods
  const register = React.useCallback((config: AnnouncementConfig) => {
    dispatch({ type: 'REGISTER', config })
  }, [])

  const unregister = React.useCallback((id: string) => {
    dispatch({ type: 'UNREGISTER', id })
    schedulerRef.current.remove(id)
  }, [])

  const show = React.useCallback(
    (id: string) => {
      const announcementState = state.announcements.get(id)
      const config = state.configs.get(id)

      if (!announcementState || !config) return

      // Phase 3c — gate imperative show on segment-shape audience eligibility.
      // The scheduler only evaluates array-shape audiences; segment shapes
      // are resolved by `useFilteredAnnouncements` upstream and exposed here
      // via `filteredIds`.
      if (config.audience && isSegmentAudience(config.audience) && !filteredIds.has(id)) {
        return
      }

      if (!schedulerRef.current.canShow(config, announcementState, userContext)) {
        return
      }

      if (schedulerRef.current.shouldQueue(config, announcementState, userContext)) {
        schedulerRef.current.enqueue(config)
        dispatch({ type: 'ADVANCE_QUEUE', queue: schedulerRef.current.getQueuedIds() })
        return
      }

      // Show immediately
      schedulerRef.current.markActive()
      dispatch({ type: 'SHOW', id })

      const updatedState = {
        ...announcementState,
        isActive: true,
        isVisible: true,
        viewCount: announcementState.viewCount + 1,
        lastViewedAt: new Date(),
      }
      persistState(id, updatedState)

      analytics?.track('announcement_shown', {
        tourId: id,
        metadata: getAnnouncementAnalyticsMetadata(config, {
          trigger: 'manual',
          viewCount: updatedState.viewCount,
        }),
      })
      config.onShow?.()
      onAnnouncementShow?.(id)
    },
    [
      state.announcements,
      state.configs,
      userContext,
      persistState,
      analytics,
      onAnnouncementShow,
      filteredIds,
    ]
  )

  // Phase 1 (v2 polish) — admin/demo bypass. Skips every gate listed in
  // `FORCE_SHOW_BYPASS`; the LicenseGate soft wrapper still enforces the
  // unlicensed watermark/warning. Increments `viewCount` and stamps the
  // analytics event with `metadata.trigger="forced"` so dashboards can
  // filter forced previews out of real-user counts.
  const forceShow = React.useCallback(
    (id: string) => {
      const announcementState = state.announcements.get(id)
      const config = state.configs.get(id)
      if (!announcementState || !config) return

      schedulerRef.current.markActive()
      dispatch({ type: 'FORCE_SHOW', id })

      const updatedState: AnnouncementState = {
        ...announcementState,
        isActive: true,
        isVisible: true,
        viewCount: announcementState.viewCount + 1,
        lastViewedAt: new Date(),
        isDismissed: false,
        dismissedAt: null,
        dismissalReason: null,
      }
      persistState(id, updatedState)

      analytics?.track('announcement_shown', {
        tourId: id,
        metadata: getAnnouncementAnalyticsMetadata(config, {
          trigger: 'forced',
          viewCount: updatedState.viewCount,
        }),
      })
      config.onShow?.()
      onAnnouncementShow?.(id)
    },
    [state.announcements, state.configs, persistState, analytics, onAnnouncementShow]
  )

  const hide = React.useCallback((id: string) => {
    dispatch({ type: 'HIDE', id })
    schedulerRef.current.markInactive()
  }, [])

  const dismiss = React.useCallback(
    (id: string, reason: DismissalReason = 'programmatic') => {
      const announcementState = state.announcements.get(id)
      const config = state.configs.get(id)

      if (!announcementState) return

      dispatch({ type: 'DISMISS', id, reason })
      schedulerRef.current.markInactive()
      schedulerRef.current.remove(id)
      dispatch({ type: 'ADVANCE_QUEUE', queue: schedulerRef.current.getQueuedIds() })

      const updatedState = {
        ...announcementState,
        isActive: false,
        isVisible: false,
        isDismissed: true,
        dismissedAt: new Date(),
        dismissalReason: reason,
      }
      persistState(id, updatedState)

      if (config) {
        analytics?.track('announcement_dismissed', {
          tourId: id,
          metadata: getAnnouncementAnalyticsMetadata(config, { reason }),
        })
      }
      config?.onDismiss?.(reason)
      onAnnouncementDismiss?.(id, reason)

      // Show next in queue after delay
      if (schedulerRef.current.autoShow && schedulerRef.current.queueSize > 0) {
        const timer = setTimeout(() => {
          queueTimersRef.current.delete(timer)
          const nextId = schedulerRef.current.getNext()
          if (nextId) {
            // `getNext()` dequeued `nextId` from the scheduler, so re-sync
            // `state.queue` before showing it — otherwise the promoted (now
            // visible) announcement keeps appearing in the reported queue.
            // Mirrors `showNext()`.
            dispatch({ type: 'ADVANCE_QUEUE', queue: schedulerRef.current.getQueuedIds() })
            show(nextId)
          }
        }, schedulerRef.current.delayBetween)
        queueTimersRef.current.add(timer)
      }
    },
    [state.announcements, state.configs, persistState, analytics, onAnnouncementDismiss, show]
  )

  const complete = React.useCallback(
    (id: string) => {
      const announcementState = state.announcements.get(id)
      const config = state.configs.get(id)

      if (!announcementState) return

      dispatch({ type: 'COMPLETE', id })
      schedulerRef.current.markInactive()

      const updatedState = {
        ...announcementState,
        isActive: false,
        isVisible: false,
        completedAt: new Date(),
      }
      persistState(id, updatedState)

      if (config) {
        analytics?.track('announcement_completed', {
          tourId: id,
          metadata: getAnnouncementAnalyticsMetadata(config),
        })
      }
      config?.onComplete?.()
      onAnnouncementComplete?.(id)

      // Show next in queue after delay
      if (schedulerRef.current.autoShow && schedulerRef.current.queueSize > 0) {
        const timer = setTimeout(() => {
          queueTimersRef.current.delete(timer)
          const nextId = schedulerRef.current.getNext()
          if (nextId) {
            // `getNext()` dequeued `nextId` from the scheduler, so re-sync
            // `state.queue` before showing it — otherwise the promoted (now
            // visible) announcement keeps appearing in the reported queue.
            // Mirrors `showNext()`.
            dispatch({ type: 'ADVANCE_QUEUE', queue: schedulerRef.current.getQueuedIds() })
            show(nextId)
          }
        }, schedulerRef.current.delayBetween)
        queueTimersRef.current.add(timer)
      }
    },
    [state.announcements, state.configs, persistState, analytics, onAnnouncementComplete, show]
  )

  const reset = React.useCallback(
    (id: string) => {
      dispatch({ type: 'RESET', id })

      if (storage) {
        try {
          storage.removeItem(getStorageKey(storageKey, id))
        } catch {
          // Ignore storage errors
        }
      }
    },
    [storage, storageKey]
  )

  const resetAll = React.useCallback(() => {
    dispatch({ type: 'RESET_ALL' })

    if (storage) {
      state.announcements.forEach((_, id) => {
        try {
          storage.removeItem(getStorageKey(storageKey, id))
        } catch {
          // Ignore storage errors
        }
      })
    }
  }, [storage, storageKey, state.announcements])

  const getState = React.useCallback(
    (id: string) => state.announcements.get(id),
    [state.announcements]
  )

  const getConfig = React.useCallback((id: string) => state.configs.get(id), [state.configs])

  const canShow = React.useCallback(
    (id: string): boolean => {
      const announcementState = state.announcements.get(id)
      const config = state.configs.get(id)

      if (!announcementState || !config) return false

      // Phase 3c — segment-shape audience eligibility (mirrors `show()`).
      if (config.audience && isSegmentAudience(config.audience) && !filteredIds.has(id)) {
        return false
      }

      return schedulerRef.current.canShow(config, announcementState, userContext)
    },
    [state.announcements, state.configs, userContext, filteredIds]
  )

  const showNext = React.useCallback(() => {
    const nextId = schedulerRef.current.getNext()
    if (nextId) {
      dispatch({ type: 'ADVANCE_QUEUE', queue: schedulerRef.current.getQueuedIds() })
      show(nextId)
    }
  }, [show])

  const clearQueue = React.useCallback(() => {
    schedulerRef.current.clearQueue()
    dispatch({ type: 'ADVANCE_QUEUE', queue: [] })
  }, [])

  const contextValue = React.useMemo<AnnouncementsContextValue>(
    () => ({
      announcements: state.announcements,
      activeAnnouncement: state.activeAnnouncement,
      queue: state.queue,
      queueConfig,
      register,
      unregister,
      show,
      forceShow,
      hide,
      dismiss,
      complete,
      reset,
      resetAll,
      getState,
      getConfig,
      canShow,
      showNext,
      clearQueue,
      toastAdapter: toastAdapter ?? null,
    }),
    [
      state.announcements,
      state.activeAnnouncement,
      state.queue,
      queueConfig,
      register,
      unregister,
      show,
      forceShow,
      hide,
      dismiss,
      complete,
      reset,
      resetAll,
      getState,
      getConfig,
      canShow,
      showNext,
      clearQueue,
      toastAdapter,
    ]
  )

  return (
    <LicenseGate require="pro">
      <AnnouncementsContext.Provider value={contextValue}>{children}</AnnouncementsContext.Provider>
    </LicenseGate>
  )
}
