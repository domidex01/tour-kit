import * as React from 'react'
import type {
  AnnouncementConfig,
  AnnouncementState,
  DismissalReason,
} from '../types/announcement'
import type { AnnouncementsContextValue, AnnouncementsProviderProps } from '../types/context'
import type { QueueConfig } from '../types/queue'
import { DEFAULT_QUEUE_CONFIG } from '../types/queue'
import { AnnouncementsContext } from './announcements-context'
import { AnnouncementScheduler } from '../core/scheduler'

// Action types
type AnnouncementsAction =
  | { type: 'REGISTER'; config: AnnouncementConfig }
  | { type: 'UNREGISTER'; id: string }
  | { type: 'SHOW'; id: string }
  | { type: 'HIDE'; id: string }
  | { type: 'DISMISS'; id: string; reason: DismissalReason }
  | { type: 'COMPLETE'; id: string }
  | { type: 'RESET'; id: string }
  | { type: 'RESET_ALL' }
  | { type: 'SET_ACTIVE'; id: string | null }
  | { type: 'UPDATE_QUEUE'; queue: string[] }
  | { type: 'RESTORE_STATE'; states: Map<string, Partial<AnnouncementState>> }

interface AnnouncementsState {
  announcements: Map<string, AnnouncementState>
  configs: Map<string, AnnouncementConfig>
  activeAnnouncement: string | null
  queue: string[]
}

function createInitialState(id: string): AnnouncementState {
  return {
    id,
    isActive: false,
    isVisible: false,
    isDismissed: false,
    viewCount: 0,
    lastViewedAt: null,
    dismissedAt: null,
    dismissalReason: null,
    completedAt: null,
  }
}

function announcementsReducer(
  state: AnnouncementsState,
  action: AnnouncementsAction
): AnnouncementsState {
  switch (action.type) {
    case 'REGISTER': {
      const newAnnouncements = new Map(state.announcements)
      const newConfigs = new Map(state.configs)

      if (!newAnnouncements.has(action.config.id)) {
        newAnnouncements.set(action.config.id, createInitialState(action.config.id))
      }
      newConfigs.set(action.config.id, action.config)

      return { ...state, announcements: newAnnouncements, configs: newConfigs }
    }

    case 'UNREGISTER': {
      const newAnnouncements = new Map(state.announcements)
      const newConfigs = new Map(state.configs)
      newAnnouncements.delete(action.id)
      newConfigs.delete(action.id)

      return {
        ...state,
        announcements: newAnnouncements,
        configs: newConfigs,
        activeAnnouncement: state.activeAnnouncement === action.id ? null : state.activeAnnouncement,
        queue: state.queue.filter(id => id !== action.id),
      }
    }

    case 'SHOW': {
      const newAnnouncements = new Map(state.announcements)
      const announcement = newAnnouncements.get(action.id)

      if (announcement && !announcement.isDismissed) {
        newAnnouncements.set(action.id, {
          ...announcement,
          isActive: true,
          isVisible: true,
          viewCount: announcement.viewCount + 1,
          lastViewedAt: new Date(),
        })
        return {
          ...state,
          announcements: newAnnouncements,
          activeAnnouncement: action.id,
        }
      }
      return state
    }

    case 'HIDE': {
      const newAnnouncements = new Map(state.announcements)
      const announcement = newAnnouncements.get(action.id)

      if (announcement) {
        newAnnouncements.set(action.id, {
          ...announcement,
          isActive: false,
          isVisible: false,
        })
        return {
          ...state,
          announcements: newAnnouncements,
          activeAnnouncement: state.activeAnnouncement === action.id ? null : state.activeAnnouncement,
        }
      }
      return state
    }

    case 'DISMISS': {
      const newAnnouncements = new Map(state.announcements)
      const announcement = newAnnouncements.get(action.id)

      if (announcement) {
        newAnnouncements.set(action.id, {
          ...announcement,
          isActive: false,
          isVisible: false,
          isDismissed: true,
          dismissedAt: new Date(),
          dismissalReason: action.reason,
        })
        return {
          ...state,
          announcements: newAnnouncements,
          activeAnnouncement: state.activeAnnouncement === action.id ? null : state.activeAnnouncement,
          queue: state.queue.filter(id => id !== action.id),
        }
      }
      return state
    }

    case 'COMPLETE': {
      const newAnnouncements = new Map(state.announcements)
      const announcement = newAnnouncements.get(action.id)

      if (announcement) {
        newAnnouncements.set(action.id, {
          ...announcement,
          isActive: false,
          isVisible: false,
          completedAt: new Date(),
        })
        return {
          ...state,
          announcements: newAnnouncements,
          activeAnnouncement: state.activeAnnouncement === action.id ? null : state.activeAnnouncement,
        }
      }
      return state
    }

    case 'RESET': {
      const newAnnouncements = new Map(state.announcements)
      const announcement = newAnnouncements.get(action.id)

      if (announcement) {
        newAnnouncements.set(action.id, {
          ...announcement,
          isDismissed: false,
          dismissedAt: null,
          dismissalReason: null,
        })
        return { ...state, announcements: newAnnouncements }
      }
      return state
    }

    case 'RESET_ALL': {
      const newAnnouncements = new Map(state.announcements)
      newAnnouncements.forEach((announcement, id) => {
        newAnnouncements.set(id, {
          ...announcement,
          isDismissed: false,
          dismissedAt: null,
          dismissalReason: null,
        })
      })
      return { ...state, announcements: newAnnouncements }
    }

    case 'SET_ACTIVE': {
      return { ...state, activeAnnouncement: action.id }
    }

    case 'UPDATE_QUEUE': {
      return { ...state, queue: action.queue }
    }

    case 'RESTORE_STATE': {
      const newAnnouncements = new Map(state.announcements)
      action.states.forEach((partialState, id) => {
        const current = newAnnouncements.get(id)
        if (current) {
          newAnnouncements.set(id, { ...current, ...partialState })
        }
      })
      return { ...state, announcements: newAnnouncements }
    }

    default:
      return state
  }
}

const STORAGE_KEY_PREFIX = 'tour-kit:announcements:'

function getStorageKey(prefix: string, id: string): string {
  return `${prefix}${id}`
}

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
}: AnnouncementsProviderProps) {
  const queueConfig: QueueConfig = React.useMemo(
    () => ({ ...DEFAULT_QUEUE_CONFIG, ...queueConfigOverrides }),
    [queueConfigOverrides]
  )

  const [state, dispatch] = React.useReducer(announcementsReducer, {
    announcements: new Map(),
    configs: new Map(),
    activeAnnouncement: null,
    queue: [],
  })

  const schedulerRef = React.useRef<AnnouncementScheduler>(
    new AnnouncementScheduler(queueConfig)
  )

  // Update scheduler config when it changes
  React.useEffect(() => {
    schedulerRef.current.updateConfig(queueConfig)
  }, [queueConfig])

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

      // Check if can show
      if (!schedulerRef.current.canShow(config, announcementState, userContext)) {
        return
      }

      // Check if should queue
      if (schedulerRef.current.shouldQueue(config, announcementState, userContext)) {
        schedulerRef.current.enqueue(config)
        dispatch({ type: 'UPDATE_QUEUE', queue: schedulerRef.current.getQueuedIds() })
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

      config.onShow?.()
      onAnnouncementShow?.(id)
    },
    [state.announcements, state.configs, userContext, persistState, onAnnouncementShow]
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
      dispatch({ type: 'UPDATE_QUEUE', queue: schedulerRef.current.getQueuedIds() })

      const updatedState = {
        ...announcementState,
        isActive: false,
        isVisible: false,
        isDismissed: true,
        dismissedAt: new Date(),
        dismissalReason: reason,
      }
      persistState(id, updatedState)

      config?.onDismiss?.(reason)
      onAnnouncementDismiss?.(id, reason)

      // Show next in queue after delay
      if (schedulerRef.current.autoShow && schedulerRef.current.queueSize > 0) {
        setTimeout(() => {
          const nextId = schedulerRef.current.getNext()
          if (nextId) {
            show(nextId)
          }
        }, schedulerRef.current.delayBetween)
      }
    },
    [state.announcements, state.configs, persistState, onAnnouncementDismiss, show]
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

      config?.onComplete?.()
      onAnnouncementComplete?.(id)

      // Show next in queue after delay
      if (schedulerRef.current.autoShow && schedulerRef.current.queueSize > 0) {
        setTimeout(() => {
          const nextId = schedulerRef.current.getNext()
          if (nextId) {
            show(nextId)
          }
        }, schedulerRef.current.delayBetween)
      }
    },
    [state.announcements, state.configs, persistState, onAnnouncementComplete, show]
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

  const getConfig = React.useCallback(
    (id: string) => state.configs.get(id),
    [state.configs]
  )

  const canShow = React.useCallback(
    (id: string): boolean => {
      const announcementState = state.announcements.get(id)
      const config = state.configs.get(id)

      if (!announcementState || !config) return false

      return schedulerRef.current.canShow(config, announcementState, userContext)
    },
    [state.announcements, state.configs, userContext]
  )

  const showNext = React.useCallback(() => {
    const nextId = schedulerRef.current.getNext()
    if (nextId) {
      dispatch({ type: 'UPDATE_QUEUE', queue: schedulerRef.current.getQueuedIds() })
      show(nextId)
    }
  }, [show])

  const clearQueue = React.useCallback(() => {
    schedulerRef.current.clearQueue()
    dispatch({ type: 'UPDATE_QUEUE', queue: [] })
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
    }),
    [
      state.announcements,
      state.activeAnnouncement,
      state.queue,
      queueConfig,
      register,
      unregister,
      show,
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
    ]
  )

  return (
    <AnnouncementsContext.Provider value={contextValue}>
      {children}
    </AnnouncementsContext.Provider>
  )
}
