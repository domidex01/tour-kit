'use client'

import { AiChatPanel } from '@tour-kit/ai'

export function AiChatHost() {
  return (
    <AiChatPanel
      position="bottom-right"
      title="Ask AI"
      emptyState="Ask me about projects, kanban, exports, or onboarding."
      showSuggestions
    />
  )
}
