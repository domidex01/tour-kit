'use client'

import * as React from 'react'
import { cn } from '../../lib/utils'
import type { AdoptionStatus } from '../../types'
import {
  type AdoptionFiltersVariants,
  adoptionFilterButtonVariants,
  adoptionFilterInputVariants,
  adoptionFiltersVariants,
} from '../ui/filter-variants'

export interface AdoptionFiltersState {
  status?: AdoptionStatus[]
  category?: string[]
  premium?: boolean | null
  search?: string
}

export interface AdoptionFiltersProps
  extends React.ComponentPropsWithoutRef<'div'>,
    AdoptionFiltersVariants {
  /** Current filter values */
  filters: AdoptionFiltersState
  /** Callback when filters change */
  onFiltersChange: (filters: AdoptionFiltersState) => void
  /** Available categories */
  categories?: string[]
}

/**
 * Filter component for adoption dashboard
 *
 * @example
 * ```tsx
 * <AdoptionFilters
 *   filters={filters}
 *   onFiltersChange={setFilters}
 *   categories={['data', 'settings', 'productivity']}
 * />
 * ```
 */
export const AdoptionFilters = React.forwardRef<HTMLDivElement, AdoptionFiltersProps>(
  ({ className, filters, onFiltersChange, categories = [], spacing, ...props }, ref) => {
    const statusOptions: AdoptionStatus[] = ['adopted', 'exploring', 'churned', 'not_started']

    const handleStatusToggle = (status: AdoptionStatus) => {
      const current = filters.status || []
      const newStatus = current.includes(status)
        ? current.filter((s) => s !== status)
        : [...current, status]
      onFiltersChange({ ...filters, status: newStatus })
    }

    const handleCategoryToggle = (category: string) => {
      const current = filters.category || []
      const newCategory = current.includes(category)
        ? current.filter((c) => c !== category)
        : [...current, category]
      onFiltersChange({ ...filters, category: newCategory })
    }

    const handlePremiumChange = (value: boolean | null) => {
      onFiltersChange({ ...filters, premium: value })
    }

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onFiltersChange({ ...filters, search: e.target.value })
    }

    return (
      <div ref={ref} className={cn(adoptionFiltersVariants({ spacing }), className)} {...props}>
        {/* Search */}
        <div>
          <input
            type="text"
            placeholder="Search features..."
            value={filters.search || ''}
            onChange={handleSearchChange}
            className={cn(adoptionFilterInputVariants())}
          />
        </div>

        {/* Status Filters */}
        <fieldset>
          <legend className="text-sm font-medium mb-2 block">Status</legend>
          <div className="flex flex-wrap gap-2">
            {statusOptions.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => handleStatusToggle(status)}
                className={cn(
                  adoptionFilterButtonVariants({
                    active: filters.status?.includes(status) ?? false,
                  })
                )}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Category Filters */}
        {categories.length > 0 && (
          <fieldset>
            <legend className="text-sm font-medium mb-2 block">Category</legend>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleCategoryToggle(category)}
                  className={cn(
                    adoptionFilterButtonVariants({
                      active: filters.category?.includes(category) ?? false,
                    })
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {/* Premium Filter */}
        <fieldset>
          <legend className="text-sm font-medium mb-2 block">Premium</legend>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handlePremiumChange(null)}
              className={cn(adoptionFilterButtonVariants({ active: filters.premium === null }))}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => handlePremiumChange(true)}
              className={cn(adoptionFilterButtonVariants({ active: filters.premium === true }))}
            >
              Premium Only
            </button>
            <button
              type="button"
              onClick={() => handlePremiumChange(false)}
              className={cn(adoptionFilterButtonVariants({ active: filters.premium === false }))}
            >
              Free Only
            </button>
          </div>
        </fieldset>
      </div>
    )
  }
)
AdoptionFilters.displayName = 'AdoptionFilters'
