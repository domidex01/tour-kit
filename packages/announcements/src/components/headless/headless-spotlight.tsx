'use client'

import * as React from 'react'
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  type Placement,
} from '@floating-ui/react'
import { useAnnouncement } from '../../hooks/use-announcement'
import type { DismissalReason, SpotlightOptions } from '../../types/announcement'

export interface HeadlessSpotlightRenderProps {
  /** Whether the spotlight is visible */
  open: boolean
  /** The announcement state */
  state: ReturnType<typeof useAnnouncement>['state']
  /** The announcement config */
  config: ReturnType<typeof useAnnouncement>['config']
  /** Close the spotlight */
  close: () => void
  /** Dismiss the spotlight */
  dismiss: (reason?: DismissalReason) => void
  /** Complete the announcement */
  complete: () => void
  /** Target element */
  targetElement: Element | null
  /** Target element rect */
  targetRect: DOMRect | null
  /** Floating styles from @floating-ui */
  floatingStyles: React.CSSProperties
  /** Set floating element ref */
  setFloating: (node: HTMLElement | null) => void
  /** Props for the overlay element */
  overlayProps: {
    onClick: () => void
    'aria-hidden': boolean
  }
  /** Props for the content element */
  contentProps: {
    role: string
    'aria-labelledby': string
  }
  /** Spotlight options */
  options: SpotlightOptions
}

export interface HeadlessSpotlightProps {
  /** Announcement ID */
  id: string
  /** Whether the spotlight is visible (controlled) */
  open?: boolean
  /** Callback when visibility changes */
  onOpenChange?: (open: boolean) => void
  /** Spotlight options */
  options?: SpotlightOptions
  /** Render function */
  children: (props: HeadlessSpotlightRenderProps) => React.ReactNode
}

export function HeadlessSpotlight({
  id,
  open: openProp,
  onOpenChange,
  options,
  children,
}: HeadlessSpotlightProps) {
  const announcement = useAnnouncement(id)
  const config = announcement.config
  const [targetElement, setTargetElement] = React.useState<Element | null>(null)
  const [targetRect, setTargetRect] = React.useState<DOMRect | null>(null)

  // Controlled or uncontrolled open state
  const isControlled = openProp !== undefined
  const open = isControlled ? openProp : announcement.isVisible

  const spotlightOptions: SpotlightOptions = {
    targetSelector: '',
    placement: 'bottom',
    offset: 8,
    showOverlay: true,
    overlayOpacity: 0.5,
    closeOnOverlayClick: true,
    ...options,
    ...config?.spotlightOptions,
  }

  // Find target element
  React.useEffect(() => {
    if (!open || !spotlightOptions.targetSelector) {
      setTargetElement(null)
      setTargetRect(null)
      return
    }

    const element = document.querySelector(spotlightOptions.targetSelector)
    setTargetElement(element)
    if (element) {
      setTargetRect(element.getBoundingClientRect())
    }
  }, [open, spotlightOptions.targetSelector])

  const { refs, floatingStyles } = useFloating({
    placement: spotlightOptions.placement as Placement,
    middleware: [
      offset(spotlightOptions.offset ?? 8),
      flip(),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  })

  // Set reference element when target is found
  React.useEffect(() => {
    if (targetElement) {
      refs.setReference(targetElement)
    }
  }, [targetElement, refs])

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

  const overlayProps = {
    onClick: spotlightOptions.closeOnOverlayClick ? () => dismiss('overlay_click') : () => {},
    'aria-hidden': true as boolean,
  }

  const contentProps = {
    role: 'dialog',
    'aria-labelledby': `${id}-title`,
  }

  return children({
    open,
    state: announcement.state,
    config: announcement.config,
    close,
    dismiss,
    complete,
    targetElement,
    targetRect,
    floatingStyles,
    setFloating: refs.setFloating,
    overlayProps,
    contentProps,
    options: spotlightOptions,
  })
}
