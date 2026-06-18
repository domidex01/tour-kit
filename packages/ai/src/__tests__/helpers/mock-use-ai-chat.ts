import { vi } from 'vitest'
import { DEFAULT_STRINGS } from '../../core/strings'
import type { UseAiChatReturn } from '../../hooks/use-ai-chat'

export function createMockUseAiChatReturn(
  overrides: Partial<UseAiChatReturn> = {}
): UseAiChatReturn {
  return {
    messages: [],
    sendMessage: vi.fn(),
    stop: vi.fn(),
    reload: vi.fn(),
    setMessages: vi.fn(),
    isOpen: false,
    open: vi.fn(),
    close: vi.fn(),
    toggle: vi.fn(),
    error: null,
    status: 'ready',
    strings: DEFAULT_STRINGS,
    ...overrides,
  }
}
