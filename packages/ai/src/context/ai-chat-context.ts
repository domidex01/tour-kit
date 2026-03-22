import type { UIMessage } from 'ai'
import { createContext, useContext } from 'react'
import type { AiChatConfig, ChatStatus } from '../types'

export interface AiChatContextValue {
  messages: UIMessage[]
  status: ChatStatus
  error: Error | null

  sendMessage(input: { text: string }): void
  stop(): void
  reload(): void
  setMessages(messages: UIMessage[] | ((messages: UIMessage[]) => UIMessage[])): void

  isOpen: boolean
  open(): void
  close(): void
  toggle(): void

  config: AiChatConfig

  /** Tour context value from @tour-kit/core (null when not available) */
  tourContextValue: unknown
}

export const AiChatContext = createContext<AiChatContextValue | null>(null)
AiChatContext.displayName = 'AiChatContext'

export function useAiChatContext(): AiChatContextValue {
  const context = useContext(AiChatContext)
  if (!context) {
    throw new Error(
      'useAiChatContext must be used within an <AiChatProvider>.'
    )
  }
  return context
}
