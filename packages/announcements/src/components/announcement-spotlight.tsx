'use client'

import { type Placement, autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react'
import { cn } from '@tour-kit/core'
import type { VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { createPortal } from 'react-dom'
import { useAnnouncement } from '../hooks/use-announcement'
import type { DismissalReason, SpotlightOptions } from '../types/announcement'
import { AnnouncementActions } from './announcement-actions'
import { AnnouncementClose } from './announcement-close'
import { AnnouncementContent } from './announcement-content'
import { spotlightContentVariants, spotlightOverlayVariants } from './ui/spotlight-variants'

export interface AnnouncementSpotlightProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof spotlightContentVariants> {
  /** Announcement ID */
  id: string
  /** Whether the spotlight is visible (controlled) */
  open?: boolean
  /** Callback when visibility changes */
  onOpenChange?: (open: boolean) => void
  /** Spotlight options */
  options?: SpotlightOptions
  /** Content to render inside spotlight */
  children?: React.ReactNode
  /** Use config from provider */
  useConfig?: boolean
}

export const AnnouncementSpotlight = React.forwardRef<HTMLDivElement, AnnouncementSpotlightProps>(
  (
    {
      id,
      open: openProp,
      onOpenChange,
      placement: placementProp,
      options,
      className,
      children,
      useConfig = true,
      ...props
    },
    ref
  ) => {
    const announcement = useAnnouncement(id)
    const config = announcement.config
    const [mounted, setMounted] = React.useState(false)
    const [targetElement, setTargetElement] = React.useState<Element | null>(null)

    // Controlled or uncontrolled open state
    const isControlled = openProp !== undefined
    const open = isControlled ? openProp : announcement.isVisible

    React.useEffect(() => {
      setMounted(true)
    }, [])

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

    const effectivePlacement = placementProp ?? spotlightOptions.placement ?? 'bottom'

    // Find target element
    React.useEffect(() => {
      if (!open || !spotlightOptions.targetSelector) {
        setTargetElement(null)
        return
      }

      const element = document.querySelector(spotlightOptions.targetSelector)
      setTargetElement(element)
    }, [open, spotlightOptions.targetSelector])

    const { refs, floatingStyles } = useFloating({
      placement: effectivePlacement as Placement,
      middleware: [offset(spotlightOptions.offset ?? 8), flip(), shift({ padding: 8 })],
      whileElementsMounted: autoUpdate,
    })

    // Set reference element when target is found
    React.useEffect(() => {
      if (targetElement) {
        refs.setReference(targetElement)
      }
    }, [targetElement, refs])

    const handleDismiss = React.useCallback(
      (reason: DismissalReason = 'close_button') => {
        announcement.dismiss(reason)
        onOpenChange?.(false)
      },
      [announcement, onOpenChange]
    )

    const handleComplete = React.useCallback(() => {
      announcement.complete()
      onOpenChange?.(false)
    }, [announcement, onOpenChange])

    if (!open || !mounted || !targetElement) return null

    // Calculate spotlight cutout position
    const targetRect = targetElement.getBoundingClientRect()
    const padding = 4
    const overlayBg = `radial-gradient(circle at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent ${Math.max(targetRect.width, targetRect.height) / 2 + padding}px, rgba(0, 0, 0, ${spotlightOptions.overlayOpacity}) ${Math.max(targetRect.width, targetRect.height) / 2 + padding + 1}px)`

    const spotlightContent = (
      <>
        {/* Overlay with cutout — statically either an interactive <button> or
            an inert aria-hidden div so the element shape never mixes
            interactive ARIA on a non-interactive element. */}
        {spotlightOptions.showOverlay &&
          (spotlightOptions.closeOnOverlayClick ? (
            <button
              type="button"
              className={cn(
                spotlightOverlayVariants({ visible: true }),
                'pointer-events-auto cursor-pointer border-0 p-0'
              )}
              style={{ background: overlayBg }}
              onClick={() => handleDismiss('overlay_click')}
              aria-label="Close spotlight"
            />
          ) : (
            <div
              className={cn(spotlightOverlayVariants({ visible: true }))}
              style={{ background: overlayBg }}
              aria-hidden="true"
            />
          ))}

        {/* Spotlight content */}
        <div
          ref={(node) => {
            refs.setFloating(node)
            if (typeof ref === 'function') {
              ref(node)
            } else if (ref) {
              ref.current = node
            }
          }}
          data-state={open ? 'open' : 'closed'}
          className={cn(
            spotlightContentVariants({ placement: effectivePlacement }),
            'pointer-events-auto',
            className
          )}
          style={floatingStyles}
          {...props}
        >
          <AnnouncementClose onClose={() => handleDismiss('close_button')} />

          {useConfig && config ? (
            <>
              <AnnouncementContent
                title={config.title}
                description={config.description}
                media={config.media}
              />
              <AnnouncementActions
                primaryAction={config.primaryAction}
                secondaryAction={config.secondaryAction}
                onAction={(type) => {
                  if (type === 'primary') {
                    handleComplete()
                  }
                }}
                onDismiss={() => handleDismiss('primary_action')}
              />
            </>
          ) : (
            children
          )}
        </div>
      </>
    )

    return createPortal(spotlightContent, document.body)
  }
)
AnnouncementSpotlight.displayName = 'AnnouncementSpotlight'
