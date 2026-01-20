'use client'

import * as React from 'react'
import { useAnnouncement } from '../../hooks/use-announcement'
import type { BannerOptions, DismissalReason } from '../../types/announcement'

export interface HeadlessBannerRenderProps {
  /** Whether the banner is visible */
  open: boolean
  /** The announcement state */
  state: ReturnType<typeof useAnnouncement>['state']
  /** The announcement config */
  config: ReturnType<typeof useAnnouncement>['config']
  /** Dismiss the banner */
  dismiss: (reason?: DismissalReason) => void
  /** Props for the banner element */
  bannerProps: {
    role: string
    'data-state': string
  }
  /** Banner options */
  options: BannerOptions
}

export interface HeadlessBannerProps {
  /** Announcement ID */
  id: string
  /** Whether the banner is visible (controlled) */
  open?: boolean
  /** Callback when visibility changes */
  onOpenChange?: (open: boolean) => void
  /** Banner options */
  options?: BannerOptions
  /** Render function */
  children: (props: HeadlessBannerRenderProps) => React.ReactNode
}

export function HeadlessBanner({
  id,
  open: openProp,
  onOpenChange,
  options,
  children,
}: HeadlessBannerProps) {
  const announcement = useAnnouncement(id)
  const config = announcement.config

  // Controlled or uncontrolled open state
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : announcement.isVisible

  const dismiss = React.useCallback(
    (reason: DismissalReason = 'close_button') => {
      announcement.dismiss(reason)
      onOpenChange?.(false)
    },
    [announcement, onOpenChange]
  )

  const bannerOptions: BannerOptions = {
    position: 'top',
    dismissable: true,
    intent: 'info',
    ...options,
    ...config?.bannerOptions,
  }

  const bannerProps = {
    role: 'alert',
    'data-state': open ? 'open' : 'closed',
  }

  return children({
    open,
    state: announcement.state,
    config: announcement.config,
    dismiss,
    bannerProps,
    options: bannerOptions,
  })
}
