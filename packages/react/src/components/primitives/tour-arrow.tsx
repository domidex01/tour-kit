'use client'

import { FloatingArrow } from '@floating-ui/react'
import type { FloatingContext } from '@floating-ui/react'
import * as React from 'react'

interface TourArrowProps {
  context: FloatingContext
  className?: string
  /** Arrow height in pixels. Width = 2 × size per FloatingArrow convention. Default 8. */
  size?: number
}

export const TourArrow = React.forwardRef<SVGSVGElement, TourArrowProps>(
  ({ context, className, size = 8 }, ref) => {
    return (
      <FloatingArrow
        ref={ref}
        context={context}
        height={size}
        width={size * 2}
        className={className}
        fill="var(--color-popover)"
        stroke="var(--color-border)"
        strokeWidth={1}
        aria-hidden="true"
      />
    )
  }
)

TourArrow.displayName = 'TourArrow'
