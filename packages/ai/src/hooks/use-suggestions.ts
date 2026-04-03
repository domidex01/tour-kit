'use client'

import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { AiChatContext } from '../context/ai-chat-context'
import type { ChatStatus } from '../types'

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
  /** True when chat is busy (submitted/streaming) and cannot accept new messages */
  isBusy: boolean
  /** Clear cache and regenerate dynamic suggestions */
  refresh(): void
  /** Send a suggestion as a chat message. No-op when chat is busy. */
  select(suggestion: string): void
}

const EMPTY_MESSAGES: never[] = []

/**
 * Core suggestions hook. Reads from AiChatContext directly.
 * Works both inside and outside AiChatProvider — returns empty state when no context.
 */
export function useSuggestions(): UseSuggestionsReturn {
  const context = useContext(AiChatContext)

  // Read values from context (or defaults when outside provider)
  const config = context?.config
  const messages = context?.messages ?? EMPTY_MESSAGES
  const status = (context?.status ?? 'ready') as ChatStatus
  const contextSendMessage = context?.sendMessage

  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const cacheRef = useRef<SuggestionCache | null>(null)
  const prevStatusRef = useRef<ChatStatus>(status)

  const suggestionsConfig = config?.suggestions
  const cacheTtl = suggestionsConfig?.cacheTtl ?? 60_000
  const endpoint = config?.endpoint

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
    if (!suggestionsConfig?.dynamic || !endpoint || messages.length === 0) return

    // Check cache
    const cached = cacheRef.current
    if (cached && cached.messageId === lastMessageId && Date.now() - cached.timestamp < cacheTtl) {
      setDynamicSuggestions(cached.suggestions)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${endpoint}?suggestions=true`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      })
      if (!response.ok) {
        setDynamicSuggestions([])
        return
      }
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
  }, [endpoint, messages, lastMessageId, cacheTtl, suggestionsConfig])

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

  const isBusy = status === 'submitted' || status === 'streaming'

  // Use a ref so the select callback always reads the latest status
  // without needing status in the dependency array (avoids stale closures)
  const statusRef = useRef(status)
  statusRef.current = status

  const sendMessageRef = useRef(contextSendMessage)
  sendMessageRef.current = contextSendMessage

  const select = useCallback(
    (suggestion: string) => {
      const currentSend = sendMessageRef.current
      if (!currentSend) return
      // AI SDK ignores sendMessage while a response is in flight
      if (statusRef.current === 'submitted' || statusRef.current === 'streaming') return
      currentSend({ text: suggestion })
      config?.onEvent?.({
        type: 'suggestion_clicked',
        data: { suggestion },
        timestamp: new Date(),
      })
    },
    [config]
  )

  return {
    suggestions: [...staticSuggestions, ...dynamicSuggestions],
    isLoading,
    isBusy,
    refresh,
    select,
  }
}

/**
 * @deprecated Use `useSuggestions` instead. This alias exists for backward compatibility
 * and will be removed in the next major version.
 */
export const useOptionalSuggestions = useSuggestions
