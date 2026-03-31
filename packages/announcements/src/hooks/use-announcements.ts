import { useMemo } from 'react'
import { useAnnouncementsContext } from '../context/announcements-context'
import type {
  AnnouncementConfig,
  AnnouncementState,
  AnnouncementVariant,
} from '../types/announcement'

/**
 * Filter options for announcements
 */
export interface AnnouncementsFilter {
  /** Filter by variant type */
  variant?: AnnouncementVariant | AnnouncementVariant[]
  /** Filter by dismissed state */
  isDismissed?: boolean
  /** Filter by active state */
  isActive?: boolean
  /** Filter by visibility */
  isVisible?: boolean
  /** Custom filter function */
  filter?: (state: AnnouncementState, config: AnnouncementConfig) => boolean
}

/**
 * Return type for useAnnouncements hook
 */
export interface UseAnnouncementsReturn {
  /** All announcement states */
  announcements: Map<string, AnnouncementState>
  /** Currently active announcement ID */
  activeId: string | null
  /** Get all announcement IDs */
  ids: string[]
  /** Get announcements by filter */
  getFiltered: (filter: AnnouncementsFilter) => AnnouncementState[]
  /** Get visible announcements */
  visible: AnnouncementState[]
  /** Get dismissed announcements */
  dismissed: AnnouncementState[]
  /** Get count of announcements */
  count: number
  /** Reset all announcements */
  resetAll: () => void
}

/**
 * Hook to access all announcements
 * @returns All announcements state and query methods
 */
export function useAnnouncements(): UseAnnouncementsReturn {
  const context = useAnnouncementsContext()

  const ids = useMemo(() => Array.from(context.announcements.keys()), [context.announcements])

  const getFiltered = useMemo(
    () =>
      (filter: AnnouncementsFilter): AnnouncementState[] => {
        const results: AnnouncementState[] = []

        // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: filter logic with multiple criteria
        context.announcements.forEach((state, id) => {
          const config = context.getConfig(id)
          if (!config) return

          // Filter by variant
          if (filter.variant !== undefined) {
            const variants = Array.isArray(filter.variant) ? filter.variant : [filter.variant]
            if (!variants.includes(config.variant)) return
          }

          // Filter by dismissed state
          if (filter.isDismissed !== undefined && state.isDismissed !== filter.isDismissed) {
            return
          }

          // Filter by active state
          if (filter.isActive !== undefined && state.isActive !== filter.isActive) {
            return
          }

          // Filter by visibility
          if (filter.isVisible !== undefined && state.isVisible !== filter.isVisible) {
            return
          }

          // Custom filter
          if (filter.filter && !filter.filter(state, config)) {
            return
          }

          results.push(state)
        })

        return results
      },
    [context]
  )

  const visible = useMemo(() => getFiltered({ isVisible: true }), [getFiltered])

  const dismissed = useMemo(() => getFiltered({ isDismissed: true }), [getFiltered])

  return useMemo(
    () => ({
      announcements: context.announcements,
      activeId: context.activeAnnouncement,
      ids,
      getFiltered,
      visible,
      dismissed,
      count: context.announcements.size,
      resetAll: context.resetAll,
    }),
    [
      context.announcements,
      context.activeAnnouncement,
      context.resetAll,
      ids,
      getFiltered,
      visible,
      dismissed,
    ]
  )
}
