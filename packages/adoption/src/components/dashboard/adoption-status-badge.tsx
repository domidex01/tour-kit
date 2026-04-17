'use client'

import type { VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { cn } from '../../lib/utils'
import type { AdoptionStatus } from '../../types'
import { adoptionStatusBadgeVariants } from '../ui/badge-variants'

export interface AdoptionStatusBadgeProps
  extends React.ComponentPropsWithoutRef<'span'>,
    VariantProps<typeof adoptionStatusBadgeVariants> {
  status: AdoptionStatus
  /** Custom label (defaults to status) */
  label?: string
}

/**
 * Badge component for displaying adoption status
 *
 * @example
 * ```tsx
 * <AdoptionStatusBadge status="adopted" />
 * <AdoptionStatusBadge status="exploring" label="In Progress" />
 * ```
 */
export const AdoptionStatusBadge = React.forwardRef<HTMLSpanElement, AdoptionStatusBadgeProps>(
  ({ className, status, label, ...props }, ref) => {
    const displayLabel = label ?? status.replace('_', ' ')

    return (
      <span ref={ref} className={cn(adoptionStatusBadgeVariants({ status }), className)} {...props}>
        {displayLabel}
      </span>
    )
  }
)

AdoptionStatusBadge.displayName = 'AdoptionStatusBadge'
