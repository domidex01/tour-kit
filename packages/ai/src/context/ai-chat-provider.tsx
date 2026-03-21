'use client'

import { useState, useCallback, useMemo, type ReactNode } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import type { AiChatConfig, ChatStatus } from '../types'
import { AiChatContext, type AiChatContextValue } from './ai-chat-context'

interface AiChatProviderProps {
  config: AiChatConfig
  children: ReactNode
}

export function AiChatProvider({ config, children }: AiChatProviderProps) {
  const [isOpen, setIsOpen] = useState(false)

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
    },
    [chatHelpers]
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
    [chatHelpers.messages, status, error, sendMessage, stop, reload, setMessages, isOpen, open, close, toggle, config]
  )

  return (
    <AiChatContext.Provider value={value}>
      {children}
    </AiChatContext.Provider>
  )
}
