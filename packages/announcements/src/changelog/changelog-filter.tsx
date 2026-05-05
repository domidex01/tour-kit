'use client'

import { cn, useT } from '@tour-kit/core'
import * as React from 'react'

export interface ChangelogFilterProps {
  /** Distinct categories derived from the entry list (no "All" sentinel — the filter prepends it). */
  categories: string[]
  /** Currently selected category. `null` = "All". */
  selected: string | null
  /** Fires with the next category (or `null` for "All") on click / Enter / Space. */
  onSelect: (next: string | null) => void
  className?: string
}

/**
 * Pure presentational sidebar. Renders an "All" reset followed by one button
 * per category. Implements roving tabindex so screen-reader users can cycle
 * options with `ArrowUp` / `ArrowDown` (wrapping at both ends).
 */
export function ChangelogFilter({
  categories,
  selected,
  onSelect,
  className,
}: ChangelogFilterProps) {
  const t = useT()
  const allLabel = resolveT(t, 'changelog.filter.all', 'All')
  const navLabel = resolveT(t, 'changelog.filter.label', 'Filter by category')
  const items: Array<string | null> = React.useMemo(() => [null, ...categories], [categories])
  const itemsRef = React.useRef<Array<HTMLButtonElement | null>>([])

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
      event.preventDefault()
      const dir = event.key === 'ArrowDown' ? 1 : -1
      const next = (idx + dir + items.length) % items.length
      itemsRef.current[next]?.focus()
    },
    [items.length]
  )

  return (
    <nav className={cn('tk-changelog-filter', className)} aria-label={navLabel}>
      <ul className="tk-changelog-filter__list">
        {items.map((cat, idx) => {
          const isSelected = cat === selected
          const label = cat ?? allLabel
          return (
            <li key={cat ?? '__all__'}>
              <button
                ref={(el) => {
                  itemsRef.current[idx] = el
                }}
                type="button"
                aria-pressed={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => onSelect(cat)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className={cn(
                  'tk-changelog-filter__item',
                  'focus-visible:ring-2 focus-visible:ring-offset-2',
                  isSelected && 'tk-changelog-filter__item--selected'
                )}
              >
                {label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

function resolveT(
  t: (key: string, vars?: Record<string, unknown>) => string,
  key: string,
  fallback: string
): string {
  const value = t(key)
  return value === '' || value === key ? fallback : value
}
