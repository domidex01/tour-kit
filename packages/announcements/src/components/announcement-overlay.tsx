'use client'

import { cn } from '@tour-kit/core'
import { type VariantProps, cva } from 'class-variance-authority'
import * as React from 'react'

const overlayVariants = cva(
  'fixed inset-0 z-50 bg-black/80 data-[state=open]:motion-safe:animate-in data-[state=closed]:motion-safe:animate-out data-[state=closed]:motion-safe:fade-out-0 data-[state=open]:motion-safe:fade-in-0',
  {
    variants: {
      blur: {
        none: '',
        sm: 'backdrop-blur-sm',
        md: 'backdrop-blur-md',
        lg: 'backdrop-blur-lg',
      },
    },
    defaultVariants: {
      blur: 'none',
    },
  }
)

export interface AnnouncementOverlayProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof overlayVariants> {
  /** Whether the overlay is visible */
  open?: boolean
  /** Callback when overlay is clicked */
  onClose?: () => void
}

export const AnnouncementOverlay = React.forwardRef<HTMLDivElement, AnnouncementOverlayProps>(
  ({ className, blur, open = true, onClose, onClick, ...props }, ref) => {
    const handleClick = React.useCallback(
      (event: React.MouseEvent<HTMLDivElement>) => {
        onClick?.(event)
        if (!event.defaultPrevented) {
          onClose?.()
        }
      },
      [onClick, onClose]
    )

    if (!open) return null

    return (
      <div
        ref={ref}
        data-state={open ? 'open' : 'closed'}
        className={cn(overlayVariants({ blur }), className)}
        onClick={handleClick}
        aria-hidden="true"
        {...props}
      />
    )
  }
)
AnnouncementOverlay.displayName = 'AnnouncementOverlay'
