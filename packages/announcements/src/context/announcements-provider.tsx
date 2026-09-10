'use client'

import { useAnalyticsOptional } from '@tour-kit/analytics'
import { useSegments } from '@tour-kit/core'
import { LicenseGate } from '@tour-kit/license'
import * as React from 'react'
import { createAnnouncementsHandle } from '../lib/announcements-engine/create-announcements-handle'
import { STORAGE_KEY_PREFIX } from '../lib/announcements-engine/persistence'
import type { AnnouncementConfig, DismissalReason } from '../types/announcement'
import type { AnnouncementsContextValue, AnnouncementsProviderProps } from '../types/context'
import { DEFAULT_QUEUE_CONFIG, type QueueConfig } from '../types/queue'
import { AnnouncementsContext } from './announcements-context'

/**
 * v3 Phase 3 — this provider is a BINDING over `@tour-kit/announcements/engine`.
 *
 * Everything that was 831 lines of reducer, scheduler orchestration, queue
 * timers, persistence and eligibility now lives in `lib/announcements-engine/`
 * and runs with no React at all. What is left here is the four things only
 * React can do: read the two hooks the engine cannot (`useSegments`,
 * `useAnalyticsOptional`), subscribe a component tree to the engine's snapshot,
 * forward prop changes as verbs, and wrap the tree in the licence gate.
 *
 * `FORCE_SHOW_BYPASS` is re-exported from THIS module path under the same name
 * on purpose: `__tests__/force-show.test.tsx:11` imports it from
 * `'../context/announcements-provider'` and pins it with a literal array. A
 * moved import path would be a test edit, and Decision 11 forbids that.
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
  // Decision 7a — the engine owns eligibility; the binding forwards ONE signal.
  // `useSegments()` is a React hook from core's main barrel and cannot enter a
  // React-free engine, but the filtering cannot live here either: `REGISTER`
  // is unfiltered, so an excluded announcement must still answer `getConfig`.
  const segments = useSegments()

  const queueConfig: QueueConfig = React.useMemo(
    () => ({ ...DEFAULT_QUEUE_CONFIG, ...queueConfigOverrides }),
    [queueConfigOverrides]
  )

  // The engine is constructed once and reads these through stable callbacks, so
  // a changed `analytics` or a changed `onAnnouncementShow` never rebuilds it.
  const live = React.useRef({
    analytics,
    onAnnouncementShow,
    onAnnouncementDismiss,
    onAnnouncementComplete,
  })
  live.current = { analytics, onAnnouncementShow, onAnnouncementDismiss, onAnnouncementComplete }

  // Construct the HANDLE in render (cheap, inert, allocates nothing that
  // matters) but never the engine: `createHandle` builds that on the first
  // verb, which is what keeps StrictMode's double render and child-effects-
  // before-parent-effects from producing two engines.
  const [handle] = React.useState(() =>
    createAnnouncementsHandle<AnnouncementConfig>({
      announcements: initialAnnouncements,
      queueConfig: queueConfigOverrides,
      storage,
      storageKey,
      userContext,
      segments,
      analytics: {
        track: (event, payload) => live.current.analytics?.track(event, payload),
      },
      onShow: (id) => live.current.onAnnouncementShow?.(id),
      onDismiss: (id, reason) => live.current.onAnnouncementDismiss?.(id, reason),
      onComplete: (id) => live.current.onAnnouncementComplete?.(id),
    })
  )

  const state = React.useSyncExternalStore(handle.subscribe, handle.getState, handle.getState)

  React.useEffect(() => {
    handle.ensure().boot()
    return () => handle.release()
  }, [handle])

  // Prop → verb. Each is guarded against its first run: `boot()` above already
  // registered, restored and ran the auto-show pass with these exact values, so
  // an unguarded effect would run the whole pass a second time on mount.
  const mounted = React.useRef(false)
  React.useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    const engine = handle.ensure()
    engine.setAnnouncements(initialAnnouncements)
  }, [handle, initialAnnouncements])

  const synced = React.useRef(false)
  React.useEffect(() => {
    if (!synced.current) {
      synced.current = true
      return
    }
    const engine = handle.ensure()
    engine.setSegments(segments)
    engine.setUserContext(userContext)
    engine.setQueueConfig(queueConfig)
  }, [handle, segments, userContext, queueConfig])

  const verbs = React.useMemo(
    () => ({
      register: (config: AnnouncementConfig) => handle.ensure().register(config),
      unregister: (id: string) => handle.ensure().unregister(id),
      show: (id: string) => handle.ensure().show(id),
      forceShow: (id: string) => handle.ensure().forceShow(id),
      hide: (id: string) => handle.ensure().hide(id),
      dismiss: (id: string, reason: DismissalReason = 'programmatic') =>
        handle.ensure().dismiss(id, reason),
      complete: (id: string) => handle.ensure().complete(id),
      reset: (id: string) => handle.ensure().reset(id),
      resetAll: () => handle.ensure().resetAll(),
      getState: (id: string) => handle.ensure().getAnnouncementState(id),
      getConfig: (id: string) => handle.ensure().getConfig(id),
      canShow: (id: string) => handle.ensure().canShow(id),
      showNext: () => handle.ensure().showNext(),
      clearQueue: () => handle.ensure().clearQueue(),
    }),
    [handle]
  )

  const contextValue = React.useMemo<AnnouncementsContextValue>(
    () => ({
      announcements: state.announcements,
      activeAnnouncement: state.activeAnnouncement,
      queue: state.queue,
      queueConfig,
      ...verbs,
      toastAdapter: toastAdapter ?? null,
    }),
    [state, queueConfig, verbs, toastAdapter]
  )

  return (
    <LicenseGate require="pro">
      <AnnouncementsContext.Provider value={contextValue}>{children}</AnnouncementsContext.Provider>
    </LicenseGate>
  )
}
