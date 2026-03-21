'use client'

import type { ReactNode } from 'react'
import { useOptionalSuggestions } from '../hooks/use-suggestions'

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
  // Auto-connect to useSuggestions when inside AiChatProvider and no explicit props
  const hookData = useOptionalSuggestions()

  const suggestions = props.suggestions ?? hookData?.suggestions ?? []
  const onSelect = props.onSelect ?? hookData?.select

  if (suggestions.length === 0) {
    return null
  }

  return (
    <fieldset className={props.className} aria-label="Suggested questions">
      {suggestions.map((suggestion) => {
        const handleSelect = () => onSelect?.(suggestion)

        if (props.renderSuggestion) {
          return props.renderSuggestion(suggestion, handleSelect)
        }

        return (
          <button key={suggestion} type="button" onClick={handleSelect}>
            {suggestion}
          </button>
        )
      })}
    </fieldset>
  )
}
