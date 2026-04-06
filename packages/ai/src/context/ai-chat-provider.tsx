'use client'

import { useChat } from '@ai-sdk/react'
import { ProGate } from '@tour-kit/license'
import { DefaultChatTransport } from 'ai'
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePersistence } from '../hooks/use-persistence'
import type { AiChatConfig, ChatStatus } from '../types'
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

  const chatHelpers = useChat({
    transport,
    onFinish: ({ message }) => {
      try {
        config.onEvent?.({
          type: 'response_received',
          data: { messageId: message.id },
          timestamp: new Date(),
        })
      } catch {
        // onEvent errors must never break chat
      }
    },
    onError: (error) => {
      try {
        config.onEvent?.({
          type: 'error',
          data: { message: error.message },
          timestamp: new Date(),
        })
      } catch {
        // swallow
      }
    },
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

  // Resolve tour context: only use the explicit prop when tourContext config is enabled
  const resolvedTourContext = config.tourContext === true ? (tourContextValue ?? null) : null

  // Stable callbacks that always read the latest chatHelpers via ref
  const sendMessage = useCallback(
    (input: { text: string }) => {
      try {
        config.onEvent?.({
          type: 'message_sent',
          data: { text: input.text },
          timestamp: new Date(),
        })
      } catch {
        // onEvent errors must never break chat
      }
      helpersRef.current.sendMessage({ text: input.text })
    },
    [config]
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
    try {
      config.onEvent?.({
        type: 'chat_opened',
        data: {},
        timestamp: new Date(),
      })
    } catch {
      // swallow
    }
  }, [config])

  const close = useCallback(() => {
    setIsOpen(false)
    try {
      config.onEvent?.({
        type: 'chat_closed',
        data: {},
        timestamp: new Date(),
      })
    } catch {
      // swallow
    }
  }, [config])

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
      resolvedTourContext,
    ]
  )

  return (
    <ProGate package="@tour-kit/ai">
      <AiChatContext.Provider value={value}>{children}</AiChatContext.Provider>
    </ProGate>
  )
}
