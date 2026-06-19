'use client'

import { useChat } from '@ai-sdk/react'
import { LicenseGate } from '@tour-kit/license'
import { DefaultChatTransport } from 'ai'
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { type SlidingWindowRateLimiter, createRateLimiter } from '../core/rate-limiter'
import { resolveStrings } from '../core/strings'
import { usePersistence } from '../hooks/use-persistence'
import type { AiChatConfig, AiChatEvent, AiChatStrings, ChatStatus } from '../types'
import { AiChatContext, type AiChatContextValue } from './ai-chat-context'

interface AiChatProviderProps {
  config: AiChatConfig
  children: ReactNode
  /**
   * Tour context value from @tour-kit/core's useTourContext().
   * Pass this explicitly when config.tourContext is true.
   * The AI package never imports @tour-kit/core directly — the consumer bridges the two.
   */
  tourContextValue?: unknown
}

export function AiChatProvider({ config, children, tourContextValue }: AiChatProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const chatId = config.chatId ?? 'default'

  const { loadMessages, saveMessages, clearMessages, isEnabled } = usePersistence({
    chatId,
    persistence: config.persistence,
  })

  const [isPersistenceLoading, setIsPersistenceLoading] = useState(isEnabled)
  const hasHydratedRef = useRef(false)

  // Memoize transport to prevent re-creating on every render
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const transport = useMemo(
    () => new DefaultChatTransport({ api: config.endpoint }),
    [config.endpoint]
  )

  // Single funnel for every analytics event: stamp the timestamp and swallow any
  // onEvent error so a misbehaving callback can never break the chat.
  const emit = useCallback(
    (type: AiChatEvent['type'], data: Record<string, unknown>) => {
      try {
        config.onEvent?.({ type, data, timestamp: new Date() })
      } catch {
        // onEvent errors must never break chat
      }
    },
    [config]
  )

  const chatHelpers = useChat({
    transport,
    onFinish: ({ message }) => emit('response_received', { messageId: message.id }),
    onError: (error) => emit('error', { message: error.message }),
  })

  // Keep a ref to chatHelpers so callbacks always use the latest version.
  // useChat returns a new object each render — without this ref, useCallback
  // closures capture stale sendMessage/stop/setMessages references.
  const helpersRef = useRef(chatHelpers)
  helpersRef.current = chatHelpers

  // Load persisted messages on mount via setMessages
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional mount-only effect
  useEffect(() => {
    if (!isEnabled) return
    loadMessages().then((messages) => {
      if (messages) helpersRef.current.setMessages(messages)
      setIsPersistenceLoading(false)
      hasHydratedRef.current = true
    })
  }, [])

  // Auto-save on message change (skip initial hydration)
  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-run when messages change
  useEffect(() => {
    if (!isEnabled || isPersistenceLoading) return
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true
      return
    }
    saveMessages(chatHelpers.messages)
  }, [chatHelpers.messages])

  const status: ChatStatus = chatHelpers.status as ChatStatus
  const error: Error | null = chatHelpers.error ?? null

  // Client-side rate limiter (UX/cost protection). Built once from config.rateLimit;
  // null means unlimited. Lazy-init keeps it stable across renders.
  const limiterRef = useRef<SlidingWindowRateLimiter | null>(null)
  if (limiterRef.current === null && config.rateLimit) {
    limiterRef.current = createRateLimiter(config.rateLimit)
  }

  // Resolve UI strings once. config.errorMessage is the shorthand for the single
  // error-string source (strings.errorMessage), so fold it in when strings doesn't
  // already set it. Unset config yields DEFAULT_STRINGS = today's rendered text.
  const strings = useMemo<AiChatStrings>(() => {
    const partial: Partial<AiChatStrings> = { ...config.strings }
    if (config.errorMessage && partial.errorMessage === undefined) {
      partial.errorMessage = config.errorMessage
    }
    return resolveStrings(partial)
  }, [config.strings, config.errorMessage])

  // Resolve tour context: only use the explicit prop when tourContext config is enabled
  const resolvedTourContext = config.tourContext === true ? (tourContextValue ?? null) : null

  // Stable callbacks that always read the latest chatHelpers via ref
  const sendMessage = useCallback(
    (input: { text: string }) => {
      // Client rate limit: when at cap, surface a rate-limited error and do not
      // forward to the transport (protects the user's API spend / UX).
      if (limiterRef.current && !limiterRef.current.recordMessage()) {
        emit('error', { reason: 'rate_limited', message: strings.errorMessage })
        return
      }
      emit('message_sent', { text: input.text })
      helpersRef.current.sendMessage({ text: input.text })
    },
    [emit, strings]
  )

  const stop = useCallback(() => {
    helpersRef.current.stop()
  }, [])

  const reload = useCallback(() => {
    helpersRef.current.regenerate()
  }, [])

  const setMessages = useCallback(
    (messages: Parameters<typeof chatHelpers.setMessages>[0]) => {
      helpersRef.current.setMessages(messages)
      if (Array.isArray(messages) && messages.length === 0) {
        clearMessages()
      }
    },
    [clearMessages]
  )

  const open = useCallback(() => {
    setIsOpen(true)
    emit('chat_opened', {})
  }, [emit])

  const close = useCallback(() => {
    setIsOpen(false)
    emit('chat_closed', {})
  }, [emit])

  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

  const value: AiChatContextValue = useMemo(
    () => ({
      messages: chatHelpers.messages,
      status,
      error,
      sendMessage,
      stop,
      reload,
      setMessages,
      isOpen,
      open,
      close,
      toggle,
      config,
      strings,
      tourContextValue: resolvedTourContext,
    }),
    [
      chatHelpers.messages,
      status,
      error,
      sendMessage,
      stop,
      reload,
      setMessages,
      isOpen,
      open,
      close,
      toggle,
      config,
      strings,
      resolvedTourContext,
    ]
  )

  return (
    <LicenseGate require="pro">
      <AiChatContext.Provider value={value}>{children}</AiChatContext.Provider>
    </LicenseGate>
  )
}
