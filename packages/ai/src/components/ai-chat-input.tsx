'use client'

import { type FormEvent, useState } from 'react'
import { useAiChat } from '../hooks/use-ai-chat'
import { cn } from '../lib/utils'

export interface AiChatInputProps {
  className?: string
  placeholder?: string
  disabled?: boolean
}

export function AiChatInput({
  className,
  placeholder = 'Type a message...',
  disabled,
}: AiChatInputProps) {
  const { sendMessage, stop, status } = useAiChat()
  const [value, setValue] = useState('')

  const isStreaming = status === 'streaming'
  const isDisabled = disabled || status === 'submitted'

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = value.trim()
    if (!text) return
    sendMessage({ text })
    setValue('')
  }

  return (
    <form onSubmit={handleSubmit} className={cn('flex items-center gap-2', className)}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        disabled={isDisabled}
        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:opacity-50"
        aria-label="Chat message"
      />
      {isStreaming ? (
        <button
          type="button"
          onClick={stop}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Stop generating"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
            <rect x="2" y="2" width="10" height="10" rx="1" />
          </svg>
        </button>
      ) : (
        <button
          type="submit"
          disabled={isDisabled || !value.trim()}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
          aria-label="Send message"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 14 14"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M13 1L1 8l4 2 2 4 6-13z" />
          </svg>
        </button>
      )}
    </form>
  )
}
