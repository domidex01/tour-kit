'use client'

import * as React from 'react'
import { cn } from '../lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const overlayVariants = cva(
  'fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
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
