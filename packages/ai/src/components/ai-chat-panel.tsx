'use client'

import { cn } from '@tour-kit/core'
import type { UIMessage } from 'ai'
import type { ReactNode } from 'react'
import { useCallback, useEffect } from 'react'
import { useAiChat } from '../hooks/use-ai-chat'
import { AiChatHeader } from './ai-chat-header'
import { AiChatInput } from './ai-chat-input'
import { AiChatMessageList } from './ai-chat-message-list'
import { AiChatSuggestions } from './ai-chat-suggestions'
import { AiChatPortal } from './primitives/ai-chat-portal'
import { aiChatPanelVariants } from './ui/chat-variants'

export interface AiChatPanelProps {
  size?: 'default' | 'sm' | 'lg'
  position?: 'bottom-right' | 'bottom-left'
  title?: ReactNode
  emptyState?: ReactNode
  showSuggestions?: boolean
  className?: string
  children?: ReactNode
  renderMessage?: (message: UIMessage, index: number) => ReactNode
}

export function AiChatPanel({
  size = 'default',
  position = 'bottom-right',
  title,
  emptyState,
  showSuggestions = true,
  className,
  children,
  renderMessage,
}: AiChatPanelProps) {
  const { isOpen, close, strings } = useAiChat()
  // Explicit prop wins; otherwise fall back to the resolved config string.
  const resolvedEmptyState = emptyState ?? strings.emptyState

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    },
    [close]
  )

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  const positionStyle =
    position === 'bottom-left'
      ? { position: 'fixed' as const, bottom: '5rem', left: '1rem', zIndex: 50 }
      : { position: 'fixed' as const, bottom: '5rem', right: '1rem', zIndex: 50 }

  return (
    <AiChatPortal>
      <div
        style={positionStyle}
        className={cn(aiChatPanelVariants({ size }), 'p-4', className)}
        // biome-ignore lint/a11y/useSemanticElements: dialog role is intentional for a non-modal floating panel
        role="dialog"
        aria-modal="false"
        aria-label="AI Chat"
      >
        {children ?? (
          <>
            <AiChatHeader title={title} />
            <div className="py-3">
              <AiChatMessageList emptyState={resolvedEmptyState} renderMessage={renderMessage} />
            </div>
            {showSuggestions && <AiChatSuggestions className="px-0 pb-2" />}
            <div className="border-t pt-3">
              <AiChatInput />
            </div>
          </>
        )}
      </div>
    </AiChatPortal>
  )
}
