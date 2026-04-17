'use client'

import * as React from 'react'
import { useAdoptionStats } from '../../hooks/use-adoption-stats'
import { cn } from '../../lib/utils'
import { type AdoptionStatsGridVariants, adoptionStatsGridVariants } from '../ui/stat-card-variants'
import { AdoptionStatCard, type AdoptionStatCardProps } from './adoption-stat-card'

export interface AdoptionStatsGridProps
  extends React.ComponentPropsWithoutRef<'div'>,
    AdoptionStatsGridVariants {
  /** Custom stat cards to include */
  customStats?: AdoptionStatCardProps[]
  /** Hide default stats */
  hideDefaults?: boolean
}

/**
 * Grid of adoption statistics cards
 *
 * @example
 * ```tsx
 * <AdoptionStatsGrid />
 * <AdoptionStatsGrid customStats={[{ value: "42", label: "Custom" }]} />
 * ```
 */
export const AdoptionStatsGrid = React.forwardRef<HTMLDivElement, AdoptionStatsGridProps>(
  ({ className, customStats = [], hideDefaults = false, columns, ...props }, ref) => {
    const stats = useAdoptionStats()

    const defaultStats: AdoptionStatCardProps[] = [
      {
        value: `${stats.adoptionRate.toFixed(1)}%`,
        label: 'Adoption Rate',
        description: 'Overall feature adoption',
      },
      {
        value: stats.adoptedCount,
        label: 'Adopted',
        description: 'Features fully adopted',
      },
      {
        value: stats.byStatus.exploring.length,
        label: 'Exploring',
        description: 'Features being explored',
      },
      {
        value: stats.byStatus.not_started.length,
        label: 'Not Started',
        description: 'Features not yet tried',
      },
      {
        value: stats.byStatus.churned.length,
        label: 'Churned',
        description: 'Previously adopted, now unused',
      },
    ]

    const allStats = hideDefaults ? customStats : [...defaultStats, ...customStats]

    return (
      <div ref={ref} className={cn(adoptionStatsGridVariants({ columns }), className)} {...props}>
        {allStats.map((stat) => (
          <AdoptionStatCard key={`stat-${stat.label}`} {...stat} />
        ))}
      </div>
    )
  }
)

AdoptionStatsGrid.displayName = 'AdoptionStatsGrid'
