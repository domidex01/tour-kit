import { useCallback, useMemo } from 'react'
import { useAnnouncementsContext } from '../context/announcements-context'
import type { AnnouncementConfig, AnnouncementState, DismissalReason } from '../types/announcement'

/**
 * Return type for useAnnouncement hook
 */
export interface UseAnnouncementReturn {
  /** Current state of the announcement */
  state: AnnouncementState | undefined
  /** Configuration of the announcement */
  config: AnnouncementConfig | undefined
  /** Whether the announcement is currently visible */
  isVisible: boolean
  /** Whether the announcement is active (being displayed) */
  isActive: boolean
  /** Whether the announcement has been dismissed */
  isDismissed: boolean
  /** Whether the announcement can be shown (respects frequency, schedule, etc.) */
  canShow: boolean
  /** Number of times the announcement has been viewed */
  viewCount: number
  /** Show the announcement */
  show: () => void
  /** Hide the announcement temporarily */
  hide: () => void
  /** Dismiss the announcement (marks as dismissed) */
  dismiss: (reason?: DismissalReason) => void
  /** Complete the announcement (primary action taken) */
  complete: () => void
  /** Reset the announcement (clear dismissed state) */
  reset: () => void
}

/**
 * Hook to interact with a single announcement
 * @param id - The announcement ID
 * @returns Announcement state and control methods
 */
export function useAnnouncement(id: string): UseAnnouncementReturn {
  const context = useAnnouncementsContext()

  const state = context.getState(id)
  const config = context.getConfig(id)

  const show = useCallback(() => {
    context.show(id)
  }, [context, id])

  const hide = useCallback(() => {
    context.hide(id)
  }, [context, id])

  const dismiss = useCallback(
    (reason?: DismissalReason) => {
      context.dismiss(id, reason)
    },
    [context, id]
  )

  const complete = useCallback(() => {
    context.complete(id)
  }, [context, id])

  const reset = useCallback(() => {
    context.reset(id)
  }, [context, id])

  const canShowValue = context.canShow(id)

  return useMemo(
    () => ({
      state,
      config,
      isVisible: state?.isVisible ?? false,
      isActive: state?.isActive ?? false,
      isDismissed: state?.isDismissed ?? false,
      canShow: canShowValue,
      viewCount: state?.viewCount ?? 0,
      show,
      hide,
      dismiss,
      complete,
      reset,
    }),
    [state, config, canShowValue, show, hide, dismiss, complete, reset]
  )
}
