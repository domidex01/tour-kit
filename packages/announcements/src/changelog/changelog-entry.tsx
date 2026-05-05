'use client'

import { cn, useLocale } from '@tour-kit/core'
import { MediaSlot } from '@tour-kit/media'
import * as React from 'react'

import { toMediaSlotProps } from '../lib/media-slot-adapter'
import { useResolvedText } from '../lib/use-resolved-text'
import type { ChangelogEntry as ChangelogEntryType } from './feed'
import { Reactions, type Reaction } from './reactions'

export interface ChangelogEntryProps {
  /** A serialized changelog entry. Inherits `AnnouncementConfig` so the same payload can drive a feed and an in-app modal. */
  entry: ChangelogEntryType
  /** Forwarded to the inner `<Reactions>` row. Fire-and-forget. */
  onReact?: (id: string, emoji: Reaction) => void
  className?: string
}

/**
 * Single-entry renderer. Title and description resolve through
 * `useResolvedText` so consumers may pass plain strings, i18n keys, or rich
 * `ReactNode` bodies. Date formatting is locale-aware via
 * `Intl.DateTimeFormat`. The card is animated via the `motion-safe:`
 * Tailwind utilities — CSS gates the motion under
 * `prefers-reduced-motion: reduce`.
 */
export const ChangelogEntry = React.forwardRef<HTMLElement, ChangelogEntryProps>(
  function ChangelogEntry({ entry, onReact, className }, ref) {
    const { locale } = useLocale()
    const resolvedTitle = useResolvedText(entry.title)
    const resolvedDescription = useResolvedText(entry.description)

    const formattedDate = React.useMemo(() => {
      const d = new Date(entry.publishedAt)
      if (Number.isNaN(d.getTime())) return ''
      return new Intl.DateTimeFormat(locale || 'en', { dateStyle: 'medium' }).format(d)
    }, [entry.publishedAt, locale])

    const isoDate = React.useMemo(() => {
      const d = new Date(entry.publishedAt)
      return Number.isNaN(d.getTime()) ? undefined : d.toISOString()
    }, [entry.publishedAt])

    return (
      <article
        ref={ref}
        id={entry.id}
        className={cn(
          'tk-changelog-entry',
          'motion-safe:animate-in motion-safe:fade-in motion-safe:duration-200',
          className
        )}
      >
        {entry.media && <MediaSlot {...toMediaSlotProps(entry.media)} />}
        <header className="tk-changelog-entry__header">
          <h2 className="tk-changelog-entry__title">{resolvedTitle}</h2>
          <div className="tk-changelog-entry__meta">
            {isoDate && (
              <time className="tk-changelog-entry__date" dateTime={isoDate}>
                {formattedDate}
              </time>
            )}
            {entry.category && (
              <span className="tk-changelog-entry__badge">{entry.category}</span>
            )}
          </div>
        </header>
        {resolvedDescription !== undefined && resolvedDescription !== null && (
          <div className="tk-changelog-entry__body">{resolvedDescription}</div>
        )}
        <Reactions entryId={entry.id} onReact={onReact} />
      </article>
    )
  }
)
