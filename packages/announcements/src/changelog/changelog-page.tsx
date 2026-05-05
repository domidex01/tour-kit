'use client'

import { cn, useLocale, useT } from '@tour-kit/core'
import * as React from 'react'

import { ChangelogEntry } from './changelog-entry'
import { ChangelogFilter } from './changelog-filter'
import type { ChangelogEntry as ChangelogEntryType } from './feed'
import { tFallback } from './i18n'
import type { Reaction } from './reactions'

export interface ChangelogPageProps {
  entries: ChangelogEntryType[]
  /** Controlled selected category. `null` = "All". Omit to use uncontrolled internal state. */
  category?: string | null
  /** Required to switch the component into controlled mode. */
  onCategoryChange?: (next: string | null) => void
  /** Forwarded to every entry's `<Reactions>` row. Fire-and-forget. */
  onReact?: (id: string, emoji: Reaction) => void
  className?: string
}

/**
 * Drop-in changelog page: category-filter sidebar + entry list. Router-agnostic
 * — consumers wire `category`/`onCategoryChange` for URL-sync. Without those
 * props, the component manages an internal `useState` (uncontrolled).
 */
export function ChangelogPage({
  entries,
  category: controlledCategory,
  onCategoryChange,
  onReact,
  className,
}: ChangelogPageProps) {
  const t = useT()
  const { direction } = useLocale()
  const [internalCategory, setInternalCategory] = React.useState<string | null>(null)
  const isControlled = controlledCategory !== undefined
  const selected = isControlled ? controlledCategory : internalCategory

  const handleSelect = React.useCallback(
    (next: string | null) => {
      if (!isControlled) setInternalCategory(next)
      onCategoryChange?.(next)
    },
    [isControlled, onCategoryChange]
  )

  const categories = React.useMemo(
    () => Array.from(new Set(entries.flatMap((e) => (e.category ? [e.category] : [])))),
    [entries]
  )

  const filtered = React.useMemo(
    () => (selected ? entries.filter((e) => e.category === selected) : entries),
    [entries, selected]
  )

  const emptyText = tFallback(t, 'changelog.empty', 'No changelog entries yet')

  return (
    <div dir={direction ?? 'ltr'} className={cn('tk-changelog-page', className)}>
      <ChangelogFilter categories={categories} selected={selected} onSelect={handleSelect} />
      {filtered.length === 0 ? (
        <p className="tk-changelog-page__empty">{emptyText}</p>
      ) : (
        <ul className="tk-changelog-page__list">
          {filtered.map((entry) => (
            <li key={entry.id}>
              <ChangelogEntry entry={entry} onReact={onReact} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
