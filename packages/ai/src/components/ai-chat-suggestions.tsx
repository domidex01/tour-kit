'use client'

import type { ReactNode } from 'react'
import { useOptionalSuggestions } from '../hooks/use-suggestions'
import { cn } from '../lib/utils'
import { aiChatSuggestionChipVariants } from './ui/chat-variants'

export interface AiChatSuggestionsProps {
  /** Explicit suggestions list (overrides hook data when provided) */
  suggestions?: string[]
  /** Callback when a suggestion is selected (overrides hook select when provided) */
  onSelect?: (suggestion: string) => void
  /** Custom render function for each suggestion chip */
  renderSuggestion?: (suggestion: string, onSelect: () => void) => ReactNode
  /** CSS class name for the container */
  className?: string
}

export function AiChatSuggestions(props: AiChatSuggestionsProps) {
  const hookData = useOptionalSuggestions()

  const suggestions = props.suggestions ?? hookData?.suggestions ?? []
  const onSelect = props.onSelect ?? hookData?.select

  if (suggestions.length === 0) {
    return null
  }

  return (
    <fieldset
      className={cn('flex flex-wrap gap-2 border-0 px-4 py-2', props.className)}
      aria-label="Suggested questions"
    >
      {suggestions.map((suggestion) => {
        const handleSelect = () => onSelect?.(suggestion)

        if (props.renderSuggestion) {
          return props.renderSuggestion(suggestion, handleSelect)
        }

        return (
          <button
            key={suggestion}
            type="button"
            onClick={handleSelect}
            className={cn(aiChatSuggestionChipVariants())}
          >
            {suggestion}
          </button>
        )
      })}
    </fieldset>
  )
}
