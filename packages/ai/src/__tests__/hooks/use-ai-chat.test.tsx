import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { useAiChat } from '../../hooks/use-ai-chat'
import { createTestWrapper } from '../helpers/test-wrapper'
import { createMockUseChatReturn } from '../helpers/mock-use-chat'

const mockUseChatReturn = createMockUseChatReturn()

vi.mock('@ai-sdk/react', () => ({
  useChat: vi.fn(() => mockUseChatReturn),
}))

vi.mock('ai', () => ({
  DefaultChatTransport: vi.fn(),
}))

describe('useAiChat — US-1, US-3', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseChatReturn.messages = []
    mockUseChatReturn.status = 'ready'
    mockUseChatReturn.error = undefined
  })

  describe('Status transitions — US-3', () => {
    it.each([
      ['ready', 'ready'],
      ['submitted', 'submitted'],
      ['streaming', 'streaming'],
      ['error', 'error'],
    ] as const)('maps useChat status "%s" to ChatStatus "%s"', (useChatStatus, expected) => {
      mockUseChatReturn.status = useChatStatus
      const wrapper = createTestWrapper()
      const { result } = renderHook(() => useAiChat(), { wrapper })

      expect(result.current.status).toBe(expected)
    })

    it('exposes error when status is "error"', () => {
      const testError = new Error('LLM failed')
      mockUseChatReturn.status = 'error'
      mockUseChatReturn.error = testError
      const wrapper = createTestWrapper()
      const { result } = renderHook(() => useAiChat(), { wrapper })

      expect(result.current.status).toBe('error')
      expect(result.current.error).toBe(testError)
    })
  })

  describe('Actions — US-1', () => {
    it('sendMessage calls useChat.sendMessage with text', () => {
      const wrapper = createTestWrapper()
      const { result } = renderHook(() => useAiChat(), { wrapper })

      result.current.sendMessage({ text: 'How do I install?' })

      expect(mockUseChatReturn.sendMessage).toHaveBeenCalledTimes(1)
      expect(mockUseChatReturn.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({ text: 'How do I install?' })
      )
    })

    it('stop calls useChat.stop', () => {
      const wrapper = createTestWrapper()
      const { result } = renderHook(() => useAiChat(), { wrapper })

      result.current.stop()

      expect(mockUseChatReturn.stop).toHaveBeenCalledTimes(1)
    })

    it('reload calls useChat.regenerate', () => {
      const wrapper = createTestWrapper()
      const { result } = renderHook(() => useAiChat(), { wrapper })

      result.current.reload()

      expect(mockUseChatReturn.regenerate).toHaveBeenCalledTimes(1)
    })
  })
})
