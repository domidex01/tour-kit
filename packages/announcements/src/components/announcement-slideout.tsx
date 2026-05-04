'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@tour-kit/core'
import type { VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { useAnnouncement } from '../hooks/use-announcement'
import { useResolvedText } from '../lib/use-resolved-text'
import type { DismissalReason, SlideoutOptions } from '../types/announcement'
import { AnnouncementActions } from './announcement-actions'
import { AnnouncementClose } from './announcement-close'
import { AnnouncementContent } from './announcement-content'
import { slideoutContentVariants, slideoutOverlayVariants } from './ui/slideout-variants'

export interface AnnouncementSlideoutProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof slideoutContentVariants> {
  /** Announcement ID */
  id: string
  /** Whether the slideout is open (controlled) */
  open?: boolean
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void
  /** Slideout options */
  options?: SlideoutOptions
  /** Content to render inside slideout */
  children?: React.ReactNode
  /** Use config from provider */
  useConfig?: boolean
}

export const AnnouncementSlideout = React.forwardRef<HTMLDivElement, AnnouncementSlideoutProps>(
  (
    {
      id,
      open: openProp,
      onOpenChange,
      position,
      size,
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

    const resolvedTitle = useResolvedText(config?.title)
    const resolvedDescription = useResolvedText(config?.description)

    // Controlled or uncontrolled open state
    const isControlled = openProp !== undefined
    const open = isControlled ? openProp : announcement.isVisible

    const handleOpenChange = React.useCallback(
      (newOpen: boolean) => {
        onOpenChange?.(newOpen)
        if (!isControlled) {
          if (newOpen) {
            announcement.show()
          } else {
            announcement.hide()
          }
        }
      },
      [onOpenChange, isControlled, announcement]
    )

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

    const slideoutOptions: SlideoutOptions = {
      closeOnOverlayClick: true,
      closeOnEscape: true,
      showCloseButton: true,
      ...options,
      ...config?.slideoutOptions,
    }

    const effectivePosition = position ?? config?.slideoutOptions?.position ?? 'right'
    const effectiveSize = size ?? config?.slideoutOptions?.size ?? 'md'

    return (
      <Dialog.Root open={open} onOpenChange={handleOpenChange}>
        <Dialog.Portal>
          <Dialog.Overlay
            className={cn(slideoutOverlayVariants())}
            onClick={
              slideoutOptions.closeOnOverlayClick ? () => handleDismiss('overlay_click') : undefined
            }
          />
          <Dialog.Content
            ref={ref}
            className={cn(
              slideoutContentVariants({ position: effectivePosition, size: effectiveSize }),
              className
            )}
            onEscapeKeyDown={
              slideoutOptions.closeOnEscape
                ? () => handleDismiss('escape_key')
                : (e) => e.preventDefault()
            }
            {...props}
          >
            {slideoutOptions.showCloseButton && (
              <AnnouncementClose onClose={() => handleDismiss('close_button')} />
            )}

            {useConfig && config ? (
              <div className="flex h-full flex-col">
                <AnnouncementContent
                  title={resolvedTitle}
                  description={resolvedDescription}
                  media={config.media}
                  className="flex-1"
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
                  direction="vertical"
                  className="mt-auto pt-4"
                />
              </div>
            ) : (
              children
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    )
  }
)
AnnouncementSlideout.displayName = 'AnnouncementSlideout'
