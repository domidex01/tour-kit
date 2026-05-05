'use client'

import { cn, useT } from '@tour-kit/core'

import { tFallback } from './i18n'

export type Reaction = '👍' | '😐' | '👎'

interface ReactionDef {
  emoji: Reaction
  key: string
  fallback: string
}

const REACTIONS: ReadonlyArray<ReactionDef> = [
  { emoji: '👍', key: 'changelog.reaction.thumbs_up', fallback: 'Thumbs up' },
  { emoji: '😐', key: 'changelog.reaction.neutral', fallback: 'Neutral' },
  { emoji: '👎', key: 'changelog.reaction.thumbs_down', fallback: 'Thumbs down' },
]

export interface ReactionsProps {
  /** Stable id of the entry these reactions belong to. Forwarded as the first arg of `onReact`. */
  entryId: string
  /** Fire-and-forget callback. The component holds no reaction state. */
  onReact?: (id: string, emoji: Reaction) => void
  className?: string
}

/**
 * Three-button reaction row (👍 😐 👎). Stateless: clicks bubble up via
 * `onReact`. Aria-labels resolve through `useT()` with English fallbacks
 * when no `LocaleProvider` (or matching message) is present.
 */
export function Reactions({ entryId, onReact, className }: ReactionsProps) {
  const t = useT()

  return (
    <div
      className={cn('tk-reactions', className)}
      role="group"
      aria-label={tFallback(t, 'changelog.reactions.label', 'Reactions')}
    >
      {REACTIONS.map(({ emoji, key, fallback }) => (
        <button
          key={emoji}
          type="button"
          aria-label={tFallback(t, key, fallback)}
          onClick={() => onReact?.(entryId, emoji)}
          className={cn('tk-reactions__button', 'focus-visible:ring-2 focus-visible:ring-offset-2')}
        >
          <span aria-hidden="true">{emoji}</span>
        </button>
      ))}
    </div>
  )
}
