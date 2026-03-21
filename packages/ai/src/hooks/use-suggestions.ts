'use client'

import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AiChatContext } from '../context/ai-chat-context'
import type { ChatStatus } from '../types'
import { useAiChat } from './use-ai-chat'

interface SuggestionCache {
  suggestions: string[]
  messageId: string
  timestamp: number
}

export interface UseSuggestionsReturn {
  /** Combined static + dynamic suggestions, filtered for relevance */
  suggestions: string[]
  /** True while dynamic suggestions are being fetched */
  isLoading: boolean
  /** Clear cache and regenerate dynamic suggestions */
  refresh(): void
  /** Send a suggestion as a chat message */
  select(suggestion: string): void
}

export function useSuggestions(): UseSuggestionsReturn {
  const context = useContext(AiChatContext)
  if (!context) {
    throw new Error(
      'useSuggestions must be used within an <AiChatProvider>. ' +
        'Wrap your component tree with <AiChatProvider config={...}>.'
    )
  }
  const { config } = context
  const { messages, status, sendMessage } = useAiChat()
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const cacheRef = useRef<SuggestionCache | null>(null)
  const prevStatusRef = useRef<ChatStatus>(status)

  const suggestionsConfig = config.suggestions
  const cacheTtl = suggestionsConfig?.cacheTtl ?? 60_000

  // Get last assistant message ID for cache key
  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant')
  const lastMessageId = lastAssistantMessage?.id ?? ''

  // Get sent user messages for filtering static suggestions
  const sentMessages = new Set(
    messages
      .filter((m) => m.role === 'user')
      .map((m) => {
        const textParts = (m.parts ?? []).filter(
          (p): p is { type: 'text'; text: string } => p.type === 'text'
        )
        return textParts.map((p) => p.text).join(' ')
      })
  )

  // Filter static suggestions: remove ones already sent
  const staticSuggestions = (suggestionsConfig?.static ?? []).filter((s) => !sentMessages.has(s))

  // Fetch dynamic suggestions
  const fetchDynamic = useCallback(async () => {
    if (!suggestionsConfig?.dynamic || messages.length === 0) return

    // Check cache
    const cached = cacheRef.current
    if (cached && cached.messageId === lastMessageId && Date.now() - cached.timestamp < cacheTtl) {
      setDynamicSuggestions(cached.suggestions)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${config.endpoint}?suggestions=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      })
      const data = await response.json()
      const suggestions: string[] = data.suggestions ?? []

      // Filter out duplicates of static suggestions
      const staticSet = new Set(suggestionsConfig?.static ?? [])
      const filtered = suggestions.filter((s) => !staticSet.has(s))

      cacheRef.current = {
        suggestions: filtered,
        messageId: lastMessageId,
        timestamp: Date.now(),
      }
      setDynamicSuggestions(filtered)
    } catch {
      setDynamicSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }, [config.endpoint, messages, lastMessageId, cacheTtl, suggestionsConfig])

  // Trigger on status transition: streaming → ready
  useEffect(() => {
    const prevStatus = prevStatusRef.current
    prevStatusRef.current = status

    if (prevStatus === 'streaming' && status === 'ready') {
      fetchDynamic()
    }
  }, [status, fetchDynamic])

  const refresh = useCallback(() => {
    cacheRef.current = null
    fetchDynamic()
  }, [fetchDynamic])

  const select = useCallback(
    (suggestion: string) => {
      sendMessage({ text: suggestion })
      config.onEvent?.({
        type: 'suggestion_clicked',
        data: { suggestion },
        timestamp: new Date(),
      })
    },
    [sendMessage, config]
  )

  return {
    suggestions: [...staticSuggestions, ...dynamicSuggestions],
    isLoading,
    refresh,
    select,
  }
}

/**
 * Optional version of useSuggestions that returns null when outside AiChatProvider.
 * Used by AiChatSuggestions component for auto-connect mode.
 */
export function useOptionalSuggestions(): UseSuggestionsReturn | null {
  try {
    return useSuggestions()
  } catch {
    return null
  }
}
