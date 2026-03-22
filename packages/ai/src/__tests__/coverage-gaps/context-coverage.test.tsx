// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock AI SDK's useChat
vi.mock('@ai-sdk/react', () => ({
  useChat: vi.fn(() => ({
    messages: [],
    append: vi.fn(),
    reload: vi.fn(),
    stop: vi.fn(),
    setMessages: vi.fn(),
    sendMessage: vi.fn(),
    regenerate: vi.fn(),
    status: 'ready',
    error: null,
    input: '',
    setInput: vi.fn(),
    handleSubmit: vi.fn(),
  })),
}))

vi.mock('ai', () => ({
  DefaultChatTransport: vi.fn(),
}))

describe('AiChatProvider — coverage gaps', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('useAiChatContext outside provider', () => {
    it('throws when used outside AiChatProvider', async () => {
      const { useAiChatContext } = await import('../../context/ai-chat-context')

      expect(() => {
        renderHook(() => useAiChatContext())
      }).toThrow('useAiChatContext must be used within an <AiChatProvider>')
    })
  })

  describe('AiChatContext display name', () => {
    it('has displayName set', async () => {
      const { AiChatContext } = await import('../../context/ai-chat-context')
      expect(AiChatContext.displayName).toBe('AiChatContext')
    })
  })

  describe('AiChatProvider basic rendering', () => {
    it('renders children without crashing', async () => {
      const { AiChatProvider } = await import('../../context/ai-chat-provider')

      function Wrapper({ children }: { children: ReactNode }) {
        return <AiChatProvider config={{ endpoint: '/api/chat' }}>{children}</AiChatProvider>
      }

      const { useAiChatContext } = await import('../../context/ai-chat-context')
      const { result } = renderHook(() => useAiChatContext(), { wrapper: Wrapper })

      expect(result.current).toBeDefined()
      expect(result.current.config.endpoint).toBe('/api/chat')
    })

    it('provides sendMessage function', async () => {
      const { AiChatProvider } = await import('../../context/ai-chat-provider')

      function Wrapper({ children }: { children: ReactNode }) {
        return <AiChatProvider config={{ endpoint: '/api/chat' }}>{children}</AiChatProvider>
      }

      const { useAiChatContext } = await import('../../context/ai-chat-context')
      const { result } = renderHook(() => useAiChatContext(), { wrapper: Wrapper })

      expect(typeof result.current.sendMessage).toBe('function')
    })

    it('provides open/close/toggle functions', async () => {
      const { AiChatProvider } = await import('../../context/ai-chat-provider')

      function Wrapper({ children }: { children: ReactNode }) {
        return <AiChatProvider config={{ endpoint: '/api/chat' }}>{children}</AiChatProvider>
      }

      const { useAiChatContext } = await import('../../context/ai-chat-context')
      const { result } = renderHook(() => useAiChatContext(), { wrapper: Wrapper })

      expect(typeof result.current.open).toBe('function')
      expect(typeof result.current.close).toBe('function')
      expect(typeof result.current.toggle).toBe('function')
      expect(result.current.isOpen).toBe(false)
    })
  })
})
