import { createContext } from 'react'
import type { UIMessage } from 'ai'
import type { ChatStatus, AiChatConfig } from '../types'

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
}

export const AiChatContext = createContext<AiChatContextValue | null>(null)
AiChatContext.displayName = 'AiChatContext'
