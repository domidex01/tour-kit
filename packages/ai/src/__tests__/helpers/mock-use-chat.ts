import { vi } from 'vitest'
import type { UIMessage } from 'ai'

export interface MockUseChatReturn {
  messages: UIMessage[]
  status: 'ready' | 'submitted' | 'streaming' | 'error'
  error: Error | undefined
  input: string
  setInput: ReturnType<typeof vi.fn>
  sendMessage: ReturnType<typeof vi.fn>
  regenerate: ReturnType<typeof vi.fn>
  stop: ReturnType<typeof vi.fn>
  setMessages: ReturnType<typeof vi.fn>
  id: string
  clearError: ReturnType<typeof vi.fn>
  resumeStream: ReturnType<typeof vi.fn>
  addToolResult: ReturnType<typeof vi.fn>
  addToolOutput: ReturnType<typeof vi.fn>
}

export function createMockUseChatReturn(
  overrides: Partial<MockUseChatReturn> = {}
): MockUseChatReturn {
  return {
    messages: [],
    status: 'ready',
    error: undefined,
    input: '',
    setInput: vi.fn(),
    sendMessage: vi.fn(),
    regenerate: vi.fn(),
    stop: vi.fn(),
    setMessages: vi.fn(),
    id: 'test-chat-id',
    clearError: vi.fn(),
    resumeStream: vi.fn(),
    addToolResult: vi.fn(),
    addToolOutput: vi.fn(),
    ...overrides,
  }
}
