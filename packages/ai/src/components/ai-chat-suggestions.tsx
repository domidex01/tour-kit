'use client'

import type { ReactNode } from 'react'
import { useContext } from 'react'
import { AiChatContext } from '../context/ai-chat-context'
import { cn } from '../lib/utils'
import { aiChatSuggestionChipVariants } from './ui/chat-variants'

export interface AiChatSuggestionsProps {
  suggestions?: string[]
  onSelect?: (suggestion: string) => void
  renderSuggestion?: (suggestion: string, onSelect: () => void) => ReactNode
  className?: string
}

export function AiChatSuggestions(props: AiChatSuggestionsProps) {
  // Read context directly — same pattern as AiChatInput which works
  const context = useContext(AiChatContext)

  const status = context?.status ?? 'ready'
  const messages = context?.messages ?? []
  const config = context?.config
  const contextSendMessage = context?.sendMessage

  // Build suggestions list
  const sentTexts = new Set(
    messages
      .filter((m) => m.role === 'user')
      .map((m) =>
        (m.parts ?? [])
          .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
          .map((p) => p.text)
          .join(' ')
      )
  )

  const staticSuggestions = (
    props.suggestions ?? config?.suggestions?.static ?? []
  ).filter((s) => !sentTexts.has(s))

  // Hide when busy or empty
  if (status !== 'ready' || staticSuggestions.length === 0) {
    return null
  }

  return (
    <div
      className={cn('flex flex-wrap gap-2 px-4 py-2', props.className)}
      role="group"
      aria-label="Suggested questions"
    >
      {staticSuggestions.map((suggestion) => {
        const handleClick = () => {
          if (props.onSelect) {
            props.onSelect(suggestion)
            return
          }
          // Call sendMessage directly — no ref, no hook, no wrapper
          contextSendMessage?.({ text: suggestion })
        }

        if (props.renderSuggestion) {
          return props.renderSuggestion(suggestion, handleClick)
        }

        return (
          <button
            key={suggestion}
            type="button"
            onClick={handleClick}
            className={cn(aiChatSuggestionChipVariants())}
          >
            {suggestion}
          </button>
        )
      })}
    </div>
  )
}
