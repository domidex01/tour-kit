'use client'

import * as React from 'react'
import { cn } from '../lib/utils'
import type { AnnouncementMedia } from '../types/announcement'

export interface AnnouncementContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Title of the announcement */
  title?: string
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
  ({ className, title, description, media, titleProps, descriptionProps, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('space-y-4', className)} {...props}>
        {media && (
          <div className="relative overflow-hidden rounded-lg">
            {media.type === 'image' && (
              <img
                src={media.src}
                alt={media.alt ?? ''}
                className="w-full object-cover"
                style={{ aspectRatio: media.aspectRatio ?? '16/9' }}
              />
            )}
            {media.type === 'video' && (
              <video
                src={media.src}
                poster={media.poster}
                autoPlay={media.autoplay ?? false}
                loop={media.loop ?? false}
                muted={media.muted ?? true}
                playsInline
                className="w-full"
                style={{ aspectRatio: media.aspectRatio ?? '16/9' }}
              />
            )}
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
