'use client'

import { useChat } from '@ai-sdk/react'
import type { UIMessage } from 'ai'
import { DefaultChatTransport } from 'ai'
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePersistence } from '../hooks/use-persistence'
import type { AiChatConfig, ChatStatus } from '../types'
import { AiChatContext, type AiChatContextValue } from './ai-chat-context'

interface AiChatProviderProps {
  config: AiChatConfig
  children: ReactNode
}

export function AiChatProvider({ config, children }: AiChatProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const chatId = config.chatId ?? 'default'

  const { loadMessages, saveMessages, clearMessages, isEnabled } = usePersistence({
    chatId,
    persistence: config.persistence,
  })

  const [initialMessages, setInitialMessages] = useState<UIMessage[] | undefined>(undefined)
  const [isPersistenceLoading, setIsPersistenceLoading] = useState(isEnabled)
  const hasHydratedRef = useRef(false)

  // Load persisted messages on mount
  useEffect(() => {
    if (!isEnabled) return
    loadMessages().then((messages) => {
      if (messages) setInitialMessages(messages)
      setIsPersistenceLoading(false)
      hasHydratedRef.current = true
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const chatHelpers = useChat({
    transport: new DefaultChatTransport({ api: config.endpoint }),
    initialMessages,
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
    ]
  )

  return <AiChatContext.Provider value={value}>{children}</AiChatContext.Provider>
}
