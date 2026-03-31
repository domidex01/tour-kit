'use client'

import type { ReactNode } from 'react'
import { useAiChat } from '../hooks/use-ai-chat'
import { cn } from '../lib/utils'
import { aiChatToggleVariants } from './ui/chat-variants'

export interface AiChatToggleProps {
  size?: 'default' | 'sm' | 'lg'
  position?: 'bottom-right' | 'bottom-left'
  icon?: ReactNode
  className?: string
}

function ChatIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 3h14a2 2 0 012 2v8a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2z" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 18 18"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M2 2l14 14M16 2L2 16" />
    </svg>
  )
}

export function AiChatToggle({
  size = 'default',
  position = 'bottom-right',
  icon,
  className,
}: AiChatToggleProps) {
  const { isOpen, toggle } = useAiChat()

  const positionStyle =
    position === 'bottom-left'
      ? { position: 'fixed' as const, bottom: '1rem', left: '1rem', zIndex: 50 }
      : { position: 'fixed' as const, bottom: '1rem', right: '1rem', zIndex: 50 }

  return (
    <button
      type="button"
      onClick={toggle}
      style={positionStyle}
      className={cn(aiChatToggleVariants({ size }), className)}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
    >
      {icon ?? (isOpen ? <CloseIcon /> : <ChatIcon />)}
    </button>
  )
}
