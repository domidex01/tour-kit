import type { AiChatConfig } from '../../types/config'

export function createTestConfig(overrides: Partial<AiChatConfig> = {}): AiChatConfig {
  return {
    endpoint: '/api/chat',
    ...overrides,
  }
}
