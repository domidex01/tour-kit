import * as React from 'react'
import { cn } from '../../lib/utils'
import {
  type AdoptionDashboardVariants,
  adoptionDashboardGridVariants,
  adoptionDashboardVariants,
} from '../ui/dashboard-variants'
import { AdoptionCategoryChart } from './adoption-category-chart'
import { AdoptionStatsGrid } from './adoption-stats-grid'
import { AdoptionTable } from './adoption-table'

export interface AdoptionDashboardProps
  extends React.ComponentPropsWithoutRef<'div'>,
    AdoptionDashboardVariants {
  /** Show stats grid */
  showStats?: boolean
  /** Show table */
  showTable?: boolean
  /** Show category chart */
  showChart?: boolean
  /** Show filters in table */
  showFilters?: boolean
  /** Custom table columns */
  tableColumns?: ('name' | 'status' | 'category' | 'uses' | 'lastUsed' | 'premium')[]
}

/**
 * Complete adoption dashboard component
 *
 * @example
 * ```tsx
 * <AdoptionDashboard />
 * <AdoptionDashboard showChart={false} showFilters={true} />
 * ```
 */
export const AdoptionDashboard = React.forwardRef<HTMLDivElement, AdoptionDashboardProps>(
  (
    {
      className,
      showStats = true,
      showTable = true,
      showChart = true,
      showFilters = true,
      tableColumns,
      spacing,
      ...props
    },
    ref
  ) => {
    return (
      <div ref={ref} className={cn(adoptionDashboardVariants({ spacing }), className)} {...props}>
        {showStats && <AdoptionStatsGrid />}

        <div className={cn(adoptionDashboardGridVariants())}>
          {showTable && (
            <div className={cn(showChart && 'lg:col-span-2')}>
              <AdoptionTable showFilters={showFilters} columns={tableColumns} />
            </div>
          )}
          {showChart && (
            <div>
              <AdoptionCategoryChart />
            </div>
          )}
        </div>
      </div>
    )
  }
)
AdoptionDashboard.displayName = 'AdoptionDashboard'
