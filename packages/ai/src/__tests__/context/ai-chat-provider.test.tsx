// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAiChat } from '../../hooks/use-ai-chat'
import { createMockUseChatReturn } from '../helpers/mock-use-chat'
import { createTestWrapper } from '../helpers/test-wrapper'

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

// US-4 (WIRE path): the client trio config.strings / config.errorMessage /
// config.rateLimit are now CONSUMED by the provider — not inert type-surface.
// These tests would be false on the DEPRECATE path (the behavior wouldn't exist).
describe('AiChatProvider — client trio WIRE (US-4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseChatReturn.messages = []
    mockUseChatReturn.status = 'ready'
    mockUseChatReturn.error = undefined
  })

  it('resolves config.strings and exposes them via useAiChat', () => {
    const wrapper = createTestWrapper({
      strings: { title: 'Helpdesk', placeholder: 'Ask away' },
    })
    const { result } = renderHook(() => useAiChat(), { wrapper })

    // configured keys win…
    expect(result.current.strings.title).toBe('Helpdesk')
    expect(result.current.strings.placeholder).toBe('Ask away')
    // …unset keys fall back to DEFAULT_STRINGS (today's shipped text)
    expect(result.current.strings.send).toBe('Send')
    expect(result.current.strings.closeLabel).toBe('Close chat')
  })

  it('folds config.errorMessage into strings.errorMessage (single source)', () => {
    const wrapper = createTestWrapper({ errorMessage: 'Our bots are napping.' })
    const { result } = renderHook(() => useAiChat(), { wrapper })

    expect(result.current.strings.errorMessage).toBe('Our bots are napping.')
  })

  it('blocks sendMessage when the rate limiter is at cap', () => {
    const onEvent = vi.fn()
    const wrapper = createTestWrapper({ rateLimit: { maxMessages: 1 }, onEvent })
    const { result } = renderHook(() => useAiChat(), { wrapper })

    result.current.sendMessage({ text: 'first' }) // allowed (records 1/1)
    result.current.sendMessage({ text: 'second' }) // at cap → blocked

    // Only the first reached the transport.
    expect(mockUseChatReturn.sendMessage).toHaveBeenCalledTimes(1)
    expect(mockUseChatReturn.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ text: 'first' })
    )
    // The blocked send emitted a rate-limited error event instead.
    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'error',
        data: expect.objectContaining({ reason: 'rate_limited' }),
      })
    )
  })

  it('does not construct a limiter when config.rateLimit is unset (no blocking)', () => {
    const wrapper = createTestWrapper()
    const { result } = renderHook(() => useAiChat(), { wrapper })

    for (let i = 0; i < 25; i++) result.current.sendMessage({ text: `m${i}` })

    expect(mockUseChatReturn.sendMessage).toHaveBeenCalledTimes(25)
  })
})
