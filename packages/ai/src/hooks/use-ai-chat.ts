'use client'

import type { UIMessage } from 'ai'
import { useContext } from 'react'
import { AiChatContext } from '../context/ai-chat-context'
import type { ChatStatus } from '../types'

export interface UseAiChatReturn {
  messages: UIMessage[]
  status: ChatStatus
  error: Error | null
  sendMessage(input: { text: string }): void
  stop(): void
  reload(): void
  setMessages(messages: UIMessage[]): void
  isOpen: boolean
  open(): void
  close(): void
  toggle(): void
}

export function useAiChat(): UseAiChatReturn {
  const context = useContext(AiChatContext)

  if (!context) {
    throw new Error(
      'useAiChat must be used within an <AiChatProvider>. ' +
        'Wrap your component tree with <AiChatProvider config={...}>.'
    )
  }

  return {
    messages: context.messages,
    status: context.status,
    error: context.error,
    sendMessage: context.sendMessage,
    stop: context.stop,
    reload: context.reload,
    setMessages: context.setMessages,
    isOpen: context.isOpen,
    open: context.open,
    close: context.close,
    toggle: context.toggle,
  }
}
