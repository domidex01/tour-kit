/**
 * The announcements reducer, moved verbatim from `announcements-provider.tsx`
 * in v3 Phase 3 Task 3.2. Pure `(state, action) => state`, no React, no DOM.
 *
 * The local `AnnouncementsState` / `AnnouncementsAction` declarations that sat
 * beside it are gone: they live in `./types` now, parameterised by `TConfig`
 * so the React side can widen `configs` to configs carrying `ReactNode`.
 */
import type {
  AnnouncementState,
  AnnouncementsAction,
  AnnouncementsEngineState,
  EngineAnnouncementConfig,
} from './types'

/**
 * Whitelist of gates `forceShow(id)` may bypass.
 *
 * Phase 0 §4 sign-off; pinned by a literal-array test in
 * `__tests__/force-show.test.tsx`. New gates added to `show()` MUST default to
 * "respect, don't bypass" — adding a gate name here is a deliberate API change
 * and breaks the pinned test, forcing a review.
 *
 * The `<LicenseGate require="pro">` wrapper is intentionally NOT a member of
 * this list — `forceShow` must not strip the license soft-gate watermark. See
 * `apps/docs/content/docs/guides/imperative-control.mdx`.
 */
export const FORCE_SHOW_BYPASS = [
  'frequency',
  'cooldown',
  'viewCount',
  'isDismissed',
  'audience',
] as const

export type ForceShowBypassKey = (typeof FORCE_SHOW_BYPASS)[number]

export function createInitialState(id: string): AnnouncementState {
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

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: reducer handling multiple action types
export function announcementsReducer<TConfig extends EngineAnnouncementConfig>(
  state: AnnouncementsEngineState<TConfig>,
  action: AnnouncementsAction<TConfig>
): AnnouncementsEngineState<TConfig> {
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
        activeAnnouncement:
          state.activeAnnouncement === action.id ? null : state.activeAnnouncement,
        queue: state.queue.filter((id) => id !== action.id),
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
          lastViewedAt: action.at,
        })
        return {
          ...state,
          announcements: newAnnouncements,
          activeAnnouncement: action.id,
        }
      }
      return state
    }

    case 'FORCE_SHOW': {
      // Mirror SHOW but bypass the isDismissed guard and clear the dismissal
      // record. Every other gate (frequency/cooldown/viewCount/audience) is
      // enforced in `show()` and skipped by `forceShow()` per Phase 0 §4.
      const newAnnouncements = new Map(state.announcements)
      const announcement = newAnnouncements.get(action.id)

      if (!announcement) return state

      newAnnouncements.set(action.id, {
        ...announcement,
        isActive: true,
        isVisible: true,
        viewCount: announcement.viewCount + 1,
        lastViewedAt: action.at,
        isDismissed: false,
        dismissedAt: null,
        dismissalReason: null,
      })
      return {
        ...state,
        announcements: newAnnouncements,
        activeAnnouncement: action.id,
      }
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
          activeAnnouncement:
            state.activeAnnouncement === action.id ? null : state.activeAnnouncement,
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
          dismissedAt: action.at,
          dismissalReason: action.reason,
        })
        return {
          ...state,
          announcements: newAnnouncements,
          activeAnnouncement:
            state.activeAnnouncement === action.id ? null : state.activeAnnouncement,
          queue: state.queue.filter((id) => id !== action.id),
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
          completedAt: action.at,
        })
        return {
          ...state,
          announcements: newAnnouncements,
          activeAnnouncement:
            state.activeAnnouncement === action.id ? null : state.activeAnnouncement,
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
          viewCount: 0,
          lastViewedAt: null,
          completedAt: null,
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
          viewCount: 0,
          lastViewedAt: null,
          completedAt: null,
        })
      })
      return { ...state, announcements: newAnnouncements }
    }

    case 'SET_ACTIVE': {
      return { ...state, activeAnnouncement: action.id }
    }

    case 'ADVANCE_QUEUE': {
      // The ONLY arm that writes `state.queue` (plan Decision 5). When `show`
      // is set it applies the promotion in the SAME pass, so no snapshot ever
      // exists in which the promoted id has left the queue without arriving.
      const queueChanged =
        state.queue.length !== action.queue.length ||
        state.queue.some((id, i) => id !== action.queue[i])

      if (!action.show) {
        return queueChanged ? { ...state, queue: action.queue } : state
      }

      const newAnnouncements = new Map(state.announcements)
      const announcement = newAnnouncements.get(action.show)
      if (!announcement || announcement.isDismissed) {
        return queueChanged ? { ...state, queue: action.queue } : state
      }

      newAnnouncements.set(action.show, {
        ...announcement,
        isActive: true,
        isVisible: true,
        viewCount: announcement.viewCount + 1,
        lastViewedAt: action.at,
      })
      return {
        ...state,
        announcements: newAnnouncements,
        activeAnnouncement: action.show,
        queue: action.queue,
      }
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
