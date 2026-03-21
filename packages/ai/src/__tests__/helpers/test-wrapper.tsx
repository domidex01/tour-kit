import type * as React from 'react'
import { AiChatProvider } from '../../context/ai-chat-provider'
import type { AiChatConfig } from '../../types/config'
import { createTestConfig } from './test-config'

export function createTestWrapper(configOverrides: Partial<AiChatConfig> = {}) {
  const config = createTestConfig(configOverrides)
  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return <AiChatProvider config={config}>{children}</AiChatProvider>
  }
}
