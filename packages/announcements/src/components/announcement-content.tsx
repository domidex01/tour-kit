'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@tour-kit/core'
import { MediaSlot } from '@tour-kit/media'
import * as React from 'react'
import { toMediaSlotProps } from '../lib/media-slot-adapter'
import type { AnnouncementMedia } from '../types/announcement'

export interface AnnouncementContentProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Title of the announcement (any ReactNode — strings render as <h2>, JSX passes through). */
  title?: React.ReactNode
  /** Description/body content */
  description?: React.ReactNode
  /** Media to display */
  media?: AnnouncementMedia
  /** Render title/description using Radix Dialog primitives. */
  asDialogContent?: boolean
  /** Title element props */
  titleProps?: React.HTMLAttributes<HTMLHeadingElement>
  /** Description element props */
  descriptionProps?: React.HTMLAttributes<HTMLDivElement>
}

const visuallyHiddenStyle: React.CSSProperties = {
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
}

export const AnnouncementContent = React.forwardRef<HTMLDivElement, AnnouncementContentProps>(
  (
    {
      className,
      title,
      description,
      media,
      asDialogContent = false,
      titleProps,
      descriptionProps,
      children,
      ...props
    },
    ref
  ) => {
    const hasTitle = Boolean(title)

    return (
      <div ref={ref} className={cn('space-y-4', className)} {...props}>
        {media && (
          <div className="relative overflow-hidden rounded-lg" data-slot="announcement-media">
            <MediaSlot {...toMediaSlotProps(media)} />
          </div>
        )}

        {asDialogContent ? (
          <Dialog.Title
            {...titleProps}
            className={cn(
              hasTitle && 'text-lg font-semibold leading-none tracking-tight',
              titleProps?.className
            )}
            style={!hasTitle ? { ...visuallyHiddenStyle, ...titleProps?.style } : titleProps?.style}
          >
            {hasTitle ? title : 'Announcement'}
          </Dialog.Title>
        ) : (
          title && (
            <h2
              {...titleProps}
              className={cn(
                'text-lg font-semibold leading-none tracking-tight',
                titleProps?.className
              )}
            >
              {title}
            </h2>
          )
        )}

        {description &&
          (asDialogContent ? (
            <Dialog.Description
              {...descriptionProps}
              className={cn('text-sm text-muted-foreground', descriptionProps?.className)}
            >
              {description}
            </Dialog.Description>
          ) : (
            <div
              {...descriptionProps}
              className={cn('text-sm text-muted-foreground', descriptionProps?.className)}
            >
              {description}
            </div>
          ))}

        {children}
      </div>
    )
  }
)
AnnouncementContent.displayName = 'AnnouncementContent'
