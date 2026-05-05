'use client'

import { cn, useT } from '@tour-kit/core'

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
      aria-label={resolve(t, 'changelog.reactions.label', 'Reactions')}
    >
      {REACTIONS.map(({ emoji, key, fallback }) => (
        <button
          key={emoji}
          type="button"
          aria-label={resolve(t, key, fallback)}
          onClick={() => onReact?.(entryId, emoji)}
          className={cn(
            'tk-reactions__button',
            'focus-visible:ring-2 focus-visible:ring-offset-2'
          )}
        >
          <span aria-hidden="true">{emoji}</span>
        </button>
      ))}
    </div>
  )
}

/**
 * `useT()` returns the key itself (dev) or `''` (prod) when a message is
 * missing. Fall back to the supplied English string in either case so the
 * UI is meaningful without a `LocaleProvider`.
 */
function resolve(
  t: (key: string, vars?: Record<string, unknown>) => string,
  key: string,
  fallback: string
): string {
  const value = t(key)
  return value === '' || value === key ? fallback : value
}
