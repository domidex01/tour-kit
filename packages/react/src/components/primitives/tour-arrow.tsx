'use client'

import { FloatingArrow } from '@floating-ui/react'
import type { FloatingContext } from '@floating-ui/react'
import * as React from 'react'

interface TourArrowProps {
  context: FloatingContext
  className?: string
}

export const TourArrow = React.forwardRef<SVGSVGElement, TourArrowProps>(
  ({ context, className }, ref) => {
    return (
      <FloatingArrow
        ref={ref}
        context={context}
        className={className}
        fill="var(--color-popover)"
        stroke="var(--color-border)"
        strokeWidth={1}
      />
    )
  }
)

TourArrow.displayName = 'TourArrow'
