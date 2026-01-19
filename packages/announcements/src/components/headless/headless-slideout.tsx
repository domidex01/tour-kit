'use client'

import * as React from 'react'
import { useAnnouncement } from '../../hooks/use-announcement'
import type { DismissalReason, SlideoutOptions } from '../../types/announcement'

export interface HeadlessSlideoutRenderProps {
  /** Whether the slideout is open */
  open: boolean
  /** The announcement state */
  state: ReturnType<typeof useAnnouncement>['state']
  /** The announcement config */
  config: ReturnType<typeof useAnnouncement>['config']
  /** Close the slideout */
  close: () => void
  /** Dismiss the slideout */
  dismiss: (reason?: DismissalReason) => void
  /** Complete the announcement */
  complete: () => void
  /** Props for the overlay element */
  overlayProps: {
    onClick: () => void
    'aria-hidden': boolean
  }
  /** Props for the content element */
  contentProps: {
    role: string
    'aria-modal': boolean
    'aria-labelledby': string
    onKeyDown: (e: React.KeyboardEvent) => void
  }
  /** Slideout options */
  options: SlideoutOptions
}

export interface HeadlessSlideoutProps {
  /** Announcement ID */
  id: string
  /** Whether the slideout is open (controlled) */
  open?: boolean
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
  /** Slideout options */
  options?: SlideoutOptions
  /** Render function */
  children: (props: HeadlessSlideoutRenderProps) => React.ReactNode
}

export function HeadlessSlideout({
  id,
  open: openProp,
  onOpenChange,
  options,
  children,
}: HeadlessSlideoutProps) {
  const announcement = useAnnouncement(id)
  const config = announcement.config

  // Controlled or uncontrolled open state
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : announcement.isVisible

  const close = React.useCallback(() => {
    if (!isControlled) {
      announcement.hide()
    }
    onOpenChange?.(false)
  }, [isControlled, announcement, onOpenChange])

  const dismiss = React.useCallback(
    (reason: DismissalReason = 'close_button') => {
      announcement.dismiss(reason)
      onOpenChange?.(false)
    },
    [announcement, onOpenChange]
  )

  const complete = React.useCallback(() => {
    announcement.complete()
    onOpenChange?.(false)
  }, [announcement, onOpenChange])

  const slideoutOptions: SlideoutOptions = {
    position: 'right',
    closeOnOverlayClick: true,
    closeOnEscape: true,
    showCloseButton: true,
    ...options,
    ...config?.slideoutOptions,
  }

  const overlayProps = {
    onClick: slideoutOptions.closeOnOverlayClick ? () => dismiss('overlay_click') : () => {},
    'aria-hidden': true as boolean,
  }

  const contentProps = {
    role: 'dialog',
    'aria-modal': true as boolean,
    'aria-labelledby': `${id}-title`,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key === 'Escape' && slideoutOptions.closeOnEscape) {
        dismiss('escape_key')
      }
    },
  }

  return children({
    open,
    state: announcement.state,
    config: announcement.config,
    close,
    dismiss,
    complete,
    overlayProps,
    contentProps,
    options: slideoutOptions,
  })
}
