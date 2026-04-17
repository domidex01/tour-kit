'use client'

import * as React from 'react'
import { useAdoptionStats } from '../../hooks/use-adoption-stats'
import { cn } from '../../lib/utils'
import {
  type AdoptionChartVariants,
  adoptionChartBarContainerVariants,
  adoptionChartBarFillVariants,
  adoptionChartHeadingVariants,
  adoptionChartVariants,
} from '../ui/chart-variants'

export interface AdoptionCategoryChartProps
  extends React.ComponentPropsWithoutRef<'div'>,
    AdoptionChartVariants {
  /** Show adoption rate or count */
  mode?: 'rate' | 'count'
}

/**
 * Simple bar chart showing adoption by category
 *
 * @example
 * ```tsx
 * <AdoptionCategoryChart />
 * <AdoptionCategoryChart mode="count" />
 * ```
 */
export const AdoptionCategoryChart = React.forwardRef<HTMLDivElement, AdoptionCategoryChartProps>(
  ({ className, mode = 'rate', spacing, ...props }, ref) => {
    const stats = useAdoptionStats()

    const categories = Object.entries(stats.byCategory).map(([name, data]) => ({
      name,
      ...data,
    }))

    const maxValue = Math.max(...categories.map((c) => (mode === 'rate' ? c.rate : c.adopted)), 1)

    return (
      <div ref={ref} className={cn(adoptionChartVariants({ spacing }), className)} {...props}>
        <h3 className={cn(adoptionChartHeadingVariants())}>Adoption by Category</h3>
        <div className="space-y-3">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">No categories available</p>
          ) : (
            categories.map((category) => {
              const value = mode === 'rate' ? category.rate : category.adopted
              const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0

              return (
                <div key={category.name} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{category.name}</span>
                    <span className="text-muted-foreground">
                      {mode === 'rate'
                        ? `${value.toFixed(1)}%`
                        : `${category.adopted}/${category.total}`}
                    </span>
                  </div>
                  <div className={cn(adoptionChartBarContainerVariants())}>
                    <div
                      className={cn(adoptionChartBarFillVariants())}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }
)
AdoptionCategoryChart.displayName = 'AdoptionCategoryChart'
