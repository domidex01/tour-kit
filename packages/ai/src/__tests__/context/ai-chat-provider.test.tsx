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

describe('AiChatProvider — US-1, US-3', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseChatReturn.messages = []
    mockUseChatReturn.status = 'ready'
    mockUseChatReturn.error = undefined
  })

  it('provides chat state to children via useAiChat', () => {
    const wrapper = createTestWrapper({ endpoint: '/api/chat' })
    const { result } = renderHook(() => useAiChat(), { wrapper })

    expect(result.current.messages).toEqual([])
    expect(result.current.status).toBe('ready')
    expect(result.current.error).toBeNull()
  })

  it('throws when useAiChat is used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useAiChat())
    }).toThrow('useAiChat must be used within an <AiChatProvider>')

    consoleSpy.mockRestore()
  })

  it('exposes sendMessage that calls useChat.sendMessage', () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(() => useAiChat(), { wrapper })

    result.current.sendMessage({ text: 'Hello' })

    expect(mockUseChatReturn.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'Hello' })
    )
  })
})
