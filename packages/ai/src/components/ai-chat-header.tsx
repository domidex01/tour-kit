'use client'

import { cn } from '@tour-kit/core'
import type { ReactNode } from 'react'
import { useAiChat } from '../hooks/use-ai-chat'
import { aiChatHeaderVariants } from './ui/chat-variants'

export interface AiChatHeaderProps {
  title?: ReactNode
  showClose?: boolean
  onClose?: () => void
  className?: string
  children?: ReactNode
}

export function AiChatHeader({
  title,
  showClose = true,
  onClose,
  className,
  children,
}: AiChatHeaderProps) {
  const { close, strings } = useAiChat()
  const handleClose = onClose ?? close
  // Explicit prop wins; otherwise fall back to the resolved config string.
  const resolvedTitle = title ?? strings.title

  return (
    <div className={cn(aiChatHeaderVariants(), className)}>
      <h3 className="text-sm font-semibold">{resolvedTitle}</h3>
      <div className="flex items-center gap-1">
        {children}
        {showClose && (
          <button
            type="button"
            onClick={handleClose}
            className="rounded-sm p-0.5 opacity-70 transition-opacity hover:opacity-100"
            aria-label={strings.closeLabel}
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 14 14"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="M1 1l12 12M13 1L1 13" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
