'use client'

import { cn } from '@tour-kit/core'
import { MediaSlot } from '@tour-kit/media'
import type { VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { useAnnouncement } from '../hooks/use-announcement'
import { toMediaSlotProps } from '../lib/media-slot-adapter'
import { useResolvedText } from '../lib/use-resolved-text'
import type { BannerOptions, DismissalReason } from '../types/announcement'
import { AnnouncementClose } from './announcement-close'
import { bannerVariants } from './ui/banner-variants'

export interface AnnouncementBannerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof bannerVariants> {
  /** Announcement ID */
  id: string
  /** Whether the banner is visible (controlled) */
  open?: boolean
  /** Callback when visibility changes */
  onOpenChange?: (open: boolean) => void
  /** Banner options */
  options?: BannerOptions
  /** Content to render inside banner */
  children?: React.ReactNode
  /** Use config from provider */
  useConfig?: boolean
}

export const AnnouncementBanner = React.forwardRef<HTMLDivElement, AnnouncementBannerProps>(
  (
    {
      id,
      open: openProp,
      onOpenChange,
      position,
      intent,
      sticky,
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

    const handleDismiss = React.useCallback(
      (reason: DismissalReason = 'close_button') => {
        announcement.dismiss(reason)
        onOpenChange?.(false)
      },
      [announcement, onOpenChange]
    )

    const bannerOptions: BannerOptions = {
      dismissable: true,
      ...options,
      ...config?.bannerOptions,
    }

    const effectivePosition = position ?? config?.bannerOptions?.position ?? 'top'
    const effectiveIntent = intent ?? config?.bannerOptions?.intent ?? 'info'
    const effectiveSticky = sticky ?? config?.bannerOptions?.sticky ?? false

    if (!open) return null

    return (
      <div
        ref={ref}
        role="alert"
        data-state={open ? 'open' : 'closed'}
        className={cn(
          bannerVariants({
            position: effectivePosition,
            intent: effectiveIntent,
            sticky: effectiveSticky,
          }),
          className
        )}
        {...props}
      >
        <div className="flex flex-1 items-center gap-3">
          {useConfig && config?.media && (
            <div className="shrink-0" data-slot="announcement-media" style={{ maxWidth: '8rem' }}>
              <MediaSlot {...toMediaSlotProps(config.media)} />
            </div>
          )}
          <div className="flex-1">
            {useConfig && config ? (
              <>
                {resolvedTitle && <span className="font-medium">{resolvedTitle}</span>}
                {resolvedTitle && resolvedDescription && ' — '}
                {resolvedDescription && <span>{resolvedDescription}</span>}
              </>
            ) : (
              children
            )}
          </div>
        </div>

        {useConfig && config?.primaryAction && (
          <button
            type="button"
            className="shrink-0 font-medium underline underline-offset-4 hover:no-underline"
            onClick={() => {
              config.primaryAction?.onClick?.()
              if (config.primaryAction?.dismissOnClick) {
                handleDismiss('primary_action')
              }
            }}
          >
            {config.primaryAction.label}
          </button>
        )}

        {bannerOptions.dismissable && (
          <AnnouncementClose
            onClose={() => handleDismiss('close_button')}
            className="relative right-0 top-0 shrink-0"
          />
        )}
      </div>
    )
  }
)
AnnouncementBanner.displayName = 'AnnouncementBanner'
