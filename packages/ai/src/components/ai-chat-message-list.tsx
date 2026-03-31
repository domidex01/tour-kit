'use client'

import type { UIMessage } from 'ai'
import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { useAiChat } from '../hooks/use-ai-chat'
import { cn } from '../lib/utils'
import { AiChatMessage } from './ai-chat-message'

export interface AiChatMessageListProps {
  className?: string
  emptyState?: ReactNode
  renderMessage?: (message: UIMessage, index: number) => ReactNode
}

function getTextContent(message: UIMessage): string {
  if (!message.parts) return ''
  return message.parts
    .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
    .map((part) => part.text)
    .join('')
}

function StreamingDots() {
  return (
    <div className="flex items-center gap-1 py-1" aria-label="Assistant is typing">
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
      <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
    </div>
  )
}

export function AiChatMessageList({
  className,
  emptyState,
  renderMessage,
}: AiChatMessageListProps) {
  const { messages, status } = useAiChat()
  const bottomRef = useRef<HTMLDivElement>(null)

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message count or status change, not on ref
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, status])

  const isStreaming = status === 'streaming'
  const hasMessages = messages.length > 0

  if (!hasMessages && !isStreaming) {
    if (!emptyState) return null
    return <div className={cn('text-sm text-muted-foreground', className)}>{emptyState}</div>
  }

  return (
    <div className={cn('max-h-60 overflow-y-auto space-y-2', className)} role="log">
      {messages.map((message, index) => {
        if (renderMessage) return renderMessage(message, index)
        const text = getTextContent(message)
        if (!text) return null
        return (
          <AiChatMessage key={message.id} role={message.role as 'user' | 'assistant'}>
            {text}
          </AiChatMessage>
        )
      })}
      {isStreaming && messages[messages.length - 1]?.role === 'user' && <StreamingDots />}
      <div ref={bottomRef} />
    </div>
  )
}
