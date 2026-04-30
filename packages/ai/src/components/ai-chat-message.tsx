'use client'

import { cn } from '@tour-kit/core'
import type { ReactNode } from 'react'
import { aiChatMessageVariants } from './ui/chat-variants'

export interface AiChatMessageProps {
  role: 'user' | 'assistant'
  children: ReactNode
  className?: string
}

export function AiChatMessage({ role, children, className }: AiChatMessageProps) {
  return (
    <div
      className={cn(aiChatMessageVariants({ role }), className)}
      aria-label={`${role === 'user' ? 'You' : 'Assistant'} said`}
    >
      {children}
    </div>
  )
}
