'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import React, { type ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { usePersistence } from '../hooks/use-persistence'
import type { AiChatConfig, ChatStatus } from '../types'
import { AiChatContext, type AiChatContextValue } from './ai-chat-context'

interface AiChatProviderProps {
  config: AiChatConfig
  children: ReactNode
  /** Explicit tour context value — alternative to automatic detection via @tour-kit/core */
  tourContextValue?: unknown
}

/**
 * Safely reads tour context from @tour-kit/core's TourContext.
 * Returns null if @tour-kit/core is not installed or no TourProvider exists.
 */
// Lazily resolved TourContext from @tour-kit/core (cached at module level)
let resolvedTourContext: React.Context<unknown> | undefined

function getTourContext(): React.Context<unknown> | null {
  if (resolvedTourContext !== undefined) return resolvedTourContext
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const core = require('@tour-kit/core')
    resolvedTourContext = (core.TourContext as React.Context<unknown>) ?? null
    return resolvedTourContext ?? null
  } catch {
    // @tour-kit/core not installed — expected for optional peer dep
    return null
  }
}

// A dummy context used as fallback so useContext is always called (Rules of Hooks)
const DummyContext = React.createContext<unknown>(null)

function useTourContextSafe(enabled: boolean): unknown {
  const TourContext = enabled ? getTourContext() : null
  // useContext must be called unconditionally
  const value = useContext(TourContext ?? DummyContext)
  if (!enabled || !TourContext) return null
  return value
}

export function AiChatProvider({ config, children, tourContextValue: explicitTourContext }: AiChatProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const chatId = config.chatId ?? 'default'
  const detectedTourContext = useTourContextSafe(config.tourContext === true && explicitTourContext === undefined)
  const tourContextValue = explicitTourContext ?? detectedTourContext

  const { loadMessages, saveMessages, clearMessages, isEnabled } = usePersistence({
    chatId,
    persistence: config.persistence,
  })

  const [isPersistenceLoading, setIsPersistenceLoading] = useState(isEnabled)
  const hasHydratedRef = useRef(false)

  const chatHelpers = useChat({
    transport: new DefaultChatTransport({ api: config.endpoint }),
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

  // Load persisted messages on mount via setMessages
  useEffect(() => {
    if (!isEnabled) return
    loadMessages().then((messages) => {
      if (messages) chatHelpers.setMessages(messages)
      setIsPersistenceLoading(false)
      hasHydratedRef.current = true
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save on message change (skip initial hydration)
  useEffect(() => {
    if (!isEnabled || isPersistenceLoading) return
    if (!hasHydratedRef.current) {
      hasHydratedRef.current = true
      return
    }
    saveMessages(chatHelpers.messages)
  }, [chatHelpers.messages]) // eslint-disable-line react-hooks/exhaustive-deps

  const status: ChatStatus = chatHelpers.status as ChatStatus
  const error: Error | null = chatHelpers.error ?? null

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
      chatHelpers.sendMessage({ text: input.text })
    },
    [chatHelpers, config]
  )

  const stop = useCallback(() => {
    chatHelpers.stop()
  }, [chatHelpers])

  const reload = useCallback(() => {
    chatHelpers.regenerate()
  }, [chatHelpers])

  const setMessages = useCallback(
    (messages: Parameters<typeof chatHelpers.setMessages>[0]) => {
      chatHelpers.setMessages(messages)
      if (Array.isArray(messages) && messages.length === 0) {
        clearMessages()
      }
    },
    [chatHelpers, clearMessages]
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
      tourContextValue,
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
      tourContextValue,
    ]
  )

  return <AiChatContext.Provider value={value}>{children}</AiChatContext.Provider>
}
