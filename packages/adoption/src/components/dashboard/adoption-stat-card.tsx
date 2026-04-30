'use client'

import { cn } from '@tour-kit/core'
import * as React from 'react'
import {
  type AdoptionStatCardVariants,
  adoptionStatCardVariants,
  adoptionStatTrendVariants,
} from '../ui/stat-card-variants'

export interface AdoptionStatCardProps
  extends React.ComponentPropsWithoutRef<'div'>,
    AdoptionStatCardVariants {
  /** Main value to display */
  value: string | number
  /** Label for the stat */
  label: string
  /** Optional description */
  description?: string
  /** Optional icon */
  icon?: React.ReactNode
  /** Trend indicator (positive/negative/neutral) */
  trend?: {
    value: number
    label: string
    direction: 'up' | 'down' | 'neutral'
  }
}

/**
 * Stat card component for displaying adoption metrics
 *
 * @example
 * ```tsx
 * <AdoptionStatCard
 *   value="75%"
 *   label="Adoption Rate"
 *   description="Features adopted by users"
 *   trend={{ value: 5, label: "+5% this month", direction: "up" }}
 * />
 * ```
 */
export const AdoptionStatCard = React.forwardRef<HTMLDivElement, AdoptionStatCardProps>(
  ({ className, value, label, description, icon, trend, size, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(adoptionStatCardVariants({ size }), className)} {...props}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
          </div>
          {icon && <div className="ml-4">{icon}</div>}
        </div>
        {trend && (
          <div className={cn(adoptionStatTrendVariants({ direction: trend.direction }))}>
            {trend.direction === 'up' && (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 10l7-7m0 0l7 7m-7-7v18"
                />
              </svg>
            )}
            {trend.direction === 'down' && (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            )}
            <span>{trend.label}</span>
          </div>
        )}
      </div>
    )
  }
)

AdoptionStatCard.displayName = 'AdoptionStatCard'
