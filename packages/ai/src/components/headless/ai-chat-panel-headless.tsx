'use client'

import type { UIMessage } from 'ai'
import type { CSSProperties, ReactNode } from 'react'
import { useAiChat } from '../../hooks/use-ai-chat'
import type { ChatStatus } from '../../types'

export interface AiChatPanelRenderProps {
  messages: UIMessage[]
  status: ChatStatus
  isOpen: boolean
  sendMessage: (input: { text: string }) => void
  stop: () => void
  close: () => void
  toggle: () => void
}

export interface AiChatPanelHeadlessProps {
  render?: (props: AiChatPanelRenderProps) => ReactNode
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

export function AiChatPanelHeadless({
  render,
  children,
  className,
  style,
}: AiChatPanelHeadlessProps) {
  const chat = useAiChat()

  const renderProps: AiChatPanelRenderProps = {
    messages: chat.messages,
    status: chat.status,
    isOpen: chat.isOpen,
    sendMessage: chat.sendMessage,
    stop: chat.stop,
    close: chat.close,
    toggle: chat.toggle,
  }

  if (render) {
    return <>{render(renderProps)}</>
  }

  return (
    <div className={className} style={style}>
      {children}
    </div>
  )
}
