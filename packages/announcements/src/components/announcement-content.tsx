'use client'

import { cn } from '@tour-kit/core'
import { MediaSlot } from '@tour-kit/media'
import * as React from 'react'
import type { AnnouncementMedia } from '../types/announcement'

const ASPECT_RATIOS = ['16/9', '4/3', '1/1', '9/16', '21/9', 'auto'] as const
type AspectRatio = (typeof ASPECT_RATIOS)[number]

function isAspectRatio(value: string | undefined): value is AspectRatio {
  return value !== undefined && (ASPECT_RATIOS as readonly string[]).includes(value)
}

export interface AnnouncementContentProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Title of the announcement (any ReactNode — strings render as <h2>, JSX passes through). */
  title?: React.ReactNode
  /** Description/body content */
  description?: React.ReactNode
  /** Media to display */
  media?: AnnouncementMedia
  /** Title element props */
  titleProps?: React.HTMLAttributes<HTMLHeadingElement>
  /** Description element props */
  descriptionProps?: React.HTMLAttributes<HTMLDivElement>
}

export const AnnouncementContent = React.forwardRef<HTMLDivElement, AnnouncementContentProps>(
  (
    { className, title, description, media, titleProps, descriptionProps, children, ...props },
    ref
  ) => {
    return (
      <div ref={ref} className={cn('space-y-4', className)} {...props}>
        {media && (
          <div className="relative overflow-hidden rounded-lg" data-slot="announcement-media">
            <MediaSlot
              src={media.src}
              type={media.type}
              alt={media.alt}
              poster={media.poster}
              aspectRatio={isAspectRatio(media.aspectRatio) ? media.aspectRatio : undefined}
              autoplay={media.autoplay}
              loop={media.loop}
              muted={media.muted}
            />
          </div>
        )}

        {title && (
          <h2
            {...titleProps}
            className={cn(
              'text-lg font-semibold leading-none tracking-tight',
              titleProps?.className
            )}
          >
            {title}
          </h2>
        )}

        {description && (
          <div
            {...descriptionProps}
            className={cn('text-sm text-muted-foreground', descriptionProps?.className)}
          >
            {description}
          </div>
        )}

        {children}
      </div>
    )
  }
)
AnnouncementContent.displayName = 'AnnouncementContent'
