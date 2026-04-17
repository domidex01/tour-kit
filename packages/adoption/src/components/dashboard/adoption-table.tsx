'use client'

import * as React from 'react'
import { useAdoptionStats } from '../../hooks/use-adoption-stats'
import { cn } from '../../lib/utils'
import { adoptionPremiumBadgeVariants } from '../ui/badge-variants'
import {
  type AdoptionTableVariants,
  adoptionTableCellVariants,
  adoptionTableEmptyVariants,
  adoptionTableHeaderCellVariants,
  adoptionTableRowVariants,
  adoptionTableVariants,
} from '../ui/table-variants'
import { AdoptionFilters, type AdoptionFiltersState } from './adoption-filters'
import { AdoptionStatusBadge } from './adoption-status-badge'

export interface AdoptionTableProps
  extends React.ComponentPropsWithoutRef<'div'>,
    AdoptionTableVariants {
  /** Custom filters */
  filters?: AdoptionFiltersState
  /** Show filters */
  showFilters?: boolean
  /** Columns to display */
  columns?: ('name' | 'status' | 'category' | 'uses' | 'lastUsed' | 'premium')[]
}

/**
 * Table component for displaying adoption data
 *
 * @example
 * ```tsx
 * <AdoptionTable />
 * <AdoptionTable showFilters columns={['name', 'status', 'uses']} />
 * ```
 */
export const AdoptionTable = React.forwardRef<HTMLDivElement, AdoptionTableProps>(
  (
    {
      className,
      filters: externalFilters,
      showFilters = false,
      columns = ['name', 'status', 'category', 'uses', 'lastUsed'],
      size,
      ...props
    },
    ref
  ) => {
    const stats = useAdoptionStats()
    const [internalFilters, setInternalFilters] = React.useState<AdoptionFiltersState>({})
    const filters = externalFilters ?? internalFilters
    const setFilters = externalFilters ? () => {} : setInternalFilters

    // Get unique categories
    const categories = React.useMemo(
      () => Array.from(new Set(stats.features.map((f) => f.category).filter(Boolean))) as string[],
      [stats.features]
    )

    // Filter features
    const filteredFeatures = React.useMemo(() => {
      let result = stats.features

      // Status filter
      if (filters.status && filters.status.length > 0) {
        result = result.filter((f) => filters.status?.includes(f.usage.status))
      }

      // Category filter
      if (filters.category && filters.category.length > 0) {
        result = result.filter((f) => f.category && filters.category?.includes(f.category))
      }

      // Premium filter
      if (filters.premium !== null && filters.premium !== undefined) {
        result = result.filter((f) => (f.premium ?? false) === filters.premium)
      }

      // Search filter
      if (filters.search) {
        const search = filters.search.toLowerCase()
        result = result.filter(
          (f) =>
            f.name.toLowerCase().includes(search) || f.description?.toLowerCase().includes(search)
        )
      }

      return result
    }, [stats.features, filters])

    const formatDate = (dateString: string | null) => {
      if (!dateString) return 'Never'
      const date = new Date(dateString)
      return date.toLocaleDateString()
    }

    return (
      <div ref={ref} className={cn('space-y-4', className)} {...props}>
        {showFilters && (
          <AdoptionFilters filters={filters} onFiltersChange={setFilters} categories={categories} />
        )}

        <div className={cn(adoptionTableVariants({ size }))}>
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                {columns.includes('name') && (
                  <th className={cn(adoptionTableHeaderCellVariants())}>Feature</th>
                )}
                {columns.includes('status') && (
                  <th className={cn(adoptionTableHeaderCellVariants())}>Status</th>
                )}
                {columns.includes('category') && (
                  <th className={cn(adoptionTableHeaderCellVariants())}>Category</th>
                )}
                {columns.includes('uses') && (
                  <th className={cn(adoptionTableHeaderCellVariants())}>Uses</th>
                )}
                {columns.includes('lastUsed') && (
                  <th className={cn(adoptionTableHeaderCellVariants())}>Last Used</th>
                )}
                {columns.includes('premium') && (
                  <th className={cn(adoptionTableHeaderCellVariants())}>Premium</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredFeatures.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className={cn(adoptionTableEmptyVariants())}>
                    No features found
                  </td>
                </tr>
              ) : (
                filteredFeatures.map((feature) => (
                  <tr key={feature.id} className={cn(adoptionTableRowVariants())}>
                    {columns.includes('name') && (
                      <td className={cn(adoptionTableCellVariants())}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{feature.name}</span>
                          {feature.premium && (
                            <span className={cn(adoptionPremiumBadgeVariants())}>Premium</span>
                          )}
                        </div>
                        {feature.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {feature.description}
                          </p>
                        )}
                      </td>
                    )}
                    {columns.includes('status') && (
                      <td className={cn(adoptionTableCellVariants())}>
                        <AdoptionStatusBadge status={feature.usage.status} />
                      </td>
                    )}
                    {columns.includes('category') && (
                      <td className={cn(adoptionTableCellVariants({ variant: 'muted' }))}>
                        {feature.category || 'Uncategorized'}
                      </td>
                    )}
                    {columns.includes('uses') && (
                      <td className={cn(adoptionTableCellVariants())}>
                        <span className="text-sm">{feature.usage.useCount}</span>
                      </td>
                    )}
                    {columns.includes('lastUsed') && (
                      <td className={cn(adoptionTableCellVariants({ variant: 'muted' }))}>
                        {formatDate(feature.usage.lastUsed)}
                      </td>
                    )}
                    {columns.includes('premium') && (
                      <td className={cn(adoptionTableCellVariants())}>
                        <span className="text-sm">{feature.premium ? 'Yes' : 'No'}</span>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }
)
AdoptionTable.displayName = 'AdoptionTable'
