import { act, renderHook, waitFor } from '@testing-library/react'
// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSuggestions } from '../../hooks/use-suggestions'

// Mock useAiChat to control chat state
const mockSendMessage = vi.fn()
let mockStatus = 'ready'
let mockMessages: Array<{
  id: string
  role: string
  parts: Array<{ type: string; text: string }>
}> = []

vi.mock('../../hooks/use-ai-chat', () => ({
  useAiChat: () => ({
    messages: mockMessages,
    status: mockStatus,
    sendMessage: mockSendMessage,
  }),
}))

let mockOnEvent: ReturnType<typeof vi.fn>

vi.mock('../../context/ai-chat-context', () => {
  const { createContext } = require('react')
  const mockContext = createContext(null)
  mockContext.displayName = 'AiChatContext'

  return {
    AiChatContext: mockContext,
  }
})

import type * as React from 'react'
import { AiChatContext } from '../../context/ai-chat-context'

function createWrapper(configOverrides: Record<string, unknown> = {}) {
  mockOnEvent = vi.fn()
  const config = {
    endpoint: '/api/chat',
    suggestions: {
      static: ['How do I get started?', 'What features are available?'],
      dynamic: true,
      cacheTtl: 60_000,
    },
    onEvent: mockOnEvent,
    ...configOverrides,
  }

  return function TestWrapper({ children }: { children: React.ReactNode }) {
    return (
      <AiChatContext.Provider
        value={
          {
            messages: mockMessages as never,
            status: mockStatus as never,
            error: null,
            sendMessage: mockSendMessage,
            stop: vi.fn(),
            reload: vi.fn(),
            setMessages: vi.fn(),
            isOpen: true,
            open: vi.fn(),
            close: vi.fn(),
            toggle: vi.fn(),
            config,
          } as never
        }
      >
        {children}
      </AiChatContext.Provider>
    )
  }
}

describe('useSuggestions', () => {
  let mockFetch: ReturnType<typeof vi.fn>
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.clearAllMocks()
    mockStatus = 'ready'
    mockMessages = []
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          suggestions: ['Follow-up 1', 'Follow-up 2', 'Follow-up 3'],
        }),
    })
    global.fetch = mockFetch as typeof global.fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  describe('Static Suggestions', () => {
    it('returns static suggestions immediately on mount', () => {
      const { result } = renderHook(() => useSuggestions(), {
        wrapper: createWrapper(),
      })

      expect(result.current.suggestions).toEqual([
        'How do I get started?',
        'What features are available?',
      ])
      expect(result.current.isLoading).toBe(false)
    })

    it('filters out static suggestions that match sent user messages', () => {
      mockMessages = [
        {
          id: 'msg-1',
          role: 'user',
          parts: [{ type: 'text', text: 'How do I get started?' }],
        },
      ]

      const { result } = renderHook(() => useSuggestions(), {
        wrapper: createWrapper(),
      })

      expect(result.current.suggestions).toEqual(['What features are available?'])
    })

    it('returns empty array when suggestions config is undefined', () => {
      const { result } = renderHook(() => useSuggestions(), {
        wrapper: createWrapper({ suggestions: undefined }),
      })

      expect(result.current.suggestions).toEqual([])
    })

    it('returns empty array when suggestions.static is undefined', () => {
      const { result } = renderHook(() => useSuggestions(), {
        wrapper: createWrapper({
          suggestions: { dynamic: true },
        }),
      })

      expect(result.current.suggestions).toEqual([])
    })
  })

  describe('Dynamic Suggestions', () => {
    it('fetches dynamic suggestions after status transitions streaming → ready', async () => {
      mockMessages = [
        {
          id: 'msg-1',
          role: 'user',
          parts: [{ type: 'text', text: 'Hello' }],
        },
        {
          id: 'msg-2',
          role: 'assistant',
          parts: [{ type: 'text', text: 'Hi there!' }],
        },
      ]
      mockStatus = 'streaming'

      const wrapper = createWrapper()
      const { result, rerender } = renderHook(() => useSuggestions(), {
        wrapper,
      })

      // Transition to ready
      mockStatus = 'ready'
      rerender()

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/chat?suggestions=true',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        )
      })

      await waitFor(() => {
        expect(result.current.suggestions).toContain('Follow-up 1')
      })
    })

    it('does not fetch when dynamic is false', () => {
      mockMessages = [
        {
          id: 'msg-1',
          role: 'user',
          parts: [{ type: 'text', text: 'Hello' }],
        },
        {
          id: 'msg-2',
          role: 'assistant',
          parts: [{ type: 'text', text: 'Hi!' }],
        },
      ]
      mockStatus = 'streaming'

      const wrapper = createWrapper({
        suggestions: {
          static: ['How do I get started?'],
          dynamic: false,
        },
      })
      const { rerender } = renderHook(() => useSuggestions(), { wrapper })

      mockStatus = 'ready'
      rerender()

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('does not fetch when there are no messages', () => {
      mockMessages = []
      mockStatus = 'streaming'

      const wrapper = createWrapper()
      const { rerender } = renderHook(() => useSuggestions(), { wrapper })

      mockStatus = 'ready'
      rerender()

      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('appends dynamic suggestions after static suggestions', async () => {
      mockMessages = [
        {
          id: 'msg-1',
          role: 'user',
          parts: [{ type: 'text', text: 'Hello' }],
        },
        {
          id: 'msg-2',
          role: 'assistant',
          parts: [{ type: 'text', text: 'Hi!' }],
        },
      ]
      mockStatus = 'streaming'

      const wrapper = createWrapper()
      const { result, rerender } = renderHook(() => useSuggestions(), {
        wrapper,
      })

      mockStatus = 'ready'
      rerender()

      await waitFor(() => {
        expect(result.current.suggestions).toEqual([
          'How do I get started?',
          'What features are available?',
          'Follow-up 1',
          'Follow-up 2',
          'Follow-up 3',
        ])
      })
    })

    it('filters out dynamic suggestions that duplicate static ones', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            suggestions: [
              'How do I get started?', // duplicate of static
              'Follow-up 2',
              'Follow-up 3',
            ],
          }),
      })

      mockMessages = [
        {
          id: 'msg-1',
          role: 'user',
          parts: [{ type: 'text', text: 'Hello' }],
        },
        {
          id: 'msg-2',
          role: 'assistant',
          parts: [{ type: 'text', text: 'Hi!' }],
        },
      ]
      mockStatus = 'streaming'

      const wrapper = createWrapper()
      const { result, rerender } = renderHook(() => useSuggestions(), {
        wrapper,
      })

      mockStatus = 'ready'
      rerender()

      await waitFor(() => {
        // Static still has it, but dynamic duplicate is filtered out
        // So it should appear exactly once (from static), not twice
        const matches = result.current.suggestions.filter((s) => s === 'How do I get started?')
        expect(matches).toHaveLength(1)
        // Should still have the non-duplicate dynamic suggestions
        expect(result.current.suggestions).toContain('Follow-up 2')
        expect(result.current.suggestions).toContain('Follow-up 3')
      })
    })

    it('sets isLoading to true during fetch, false after', async () => {
      let resolveFetch: (value: unknown) => void
      mockFetch.mockReturnValue(
        new Promise((resolve) => {
          resolveFetch = resolve
        })
      )

      mockMessages = [
        {
          id: 'msg-1',
          role: 'user',
          parts: [{ type: 'text', text: 'Hello' }],
        },
        {
          id: 'msg-2',
          role: 'assistant',
          parts: [{ type: 'text', text: 'Hi!' }],
        },
      ]
      mockStatus = 'streaming'

      const wrapper = createWrapper()
      const { result, rerender } = renderHook(() => useSuggestions(), {
        wrapper,
      })

      mockStatus = 'ready'
      rerender()

      await waitFor(() => {
        expect(result.current.isLoading).toBe(true)
      })

      // Resolve the fetch
      await act(async () => {
        resolveFetch?.({
          ok: true,
          json: () => Promise.resolve({ suggestions: ['Q1'] }),
        })
      })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
    })

    it('returns empty dynamic suggestions on fetch error', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      mockMessages = [
        {
          id: 'msg-1',
          role: 'user',
          parts: [{ type: 'text', text: 'Hello' }],
        },
        {
          id: 'msg-2',
          role: 'assistant',
          parts: [{ type: 'text', text: 'Hi!' }],
        },
      ]
      mockStatus = 'streaming'

      const wrapper = createWrapper()
      const { result, rerender } = renderHook(() => useSuggestions(), {
        wrapper,
      })

      mockStatus = 'ready'
      rerender()

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Only static suggestions should be present
      expect(result.current.suggestions).toEqual([
        'How do I get started?',
        'What features are available?',
      ])
    })
  })

  describe('Caching', () => {
    it('does not re-fetch within cacheTtl for the same messageId', async () => {
      mockMessages = [
        {
          id: 'msg-1',
          role: 'user',
          parts: [{ type: 'text', text: 'Hello' }],
        },
        {
          id: 'msg-2',
          role: 'assistant',
          parts: [{ type: 'text', text: 'Hi!' }],
        },
      ]
      mockStatus = 'streaming'

      const wrapper = createWrapper()
      const { result, rerender } = renderHook(() => useSuggestions(), {
        wrapper,
      })

      // First transition: streaming → ready
      mockStatus = 'ready'
      rerender()

      await waitFor(() => {
        expect(result.current.suggestions).toContain('Follow-up 1')
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)

      // Second transition: simulate going back to streaming and ready again
      // with same messageId
      mockStatus = 'streaming'
      rerender()
      mockStatus = 'ready'
      rerender()

      // Wait a tick for the effect to fire
      await waitFor(() => {
        // Should still be 1 call (cached)
        expect(mockFetch).toHaveBeenCalledTimes(1)
      })
    })

    it('re-fetches when a new assistant message arrives (different messageId)', async () => {
      mockMessages = [
        {
          id: 'msg-1',
          role: 'user',
          parts: [{ type: 'text', text: 'Hello' }],
        },
        {
          id: 'msg-2',
          role: 'assistant',
          parts: [{ type: 'text', text: 'Hi!' }],
        },
      ]
      mockStatus = 'streaming'

      const wrapper = createWrapper()
      const { result, rerender } = renderHook(() => useSuggestions(), {
        wrapper,
      })

      // First transition
      mockStatus = 'ready'
      rerender()

      await waitFor(() => {
        expect(result.current.suggestions).toContain('Follow-up 1')
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)

      // New conversation turn with new assistant message
      mockMessages = [
        ...mockMessages,
        {
          id: 'msg-3',
          role: 'user',
          parts: [{ type: 'text', text: 'Tell me more' }],
        },
        {
          id: 'msg-4',
          role: 'assistant',
          parts: [{ type: 'text', text: 'Sure, here is more info...' }],
        },
      ]
      mockStatus = 'streaming'
      rerender()
      mockStatus = 'ready'
      rerender()

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2)
      })
    })

    it('re-fetches after cacheTtl expires', async () => {
      const dateNowSpy = vi.spyOn(Date, 'now')
      const baseTime = 1000000

      mockMessages = [
        {
          id: 'msg-1',
          role: 'user',
          parts: [{ type: 'text', text: 'Hello' }],
        },
        {
          id: 'msg-2',
          role: 'assistant',
          parts: [{ type: 'text', text: 'Hi!' }],
        },
      ]
      mockStatus = 'streaming'

      // Use a short TTL for this test
      const wrapper = createWrapper({
        suggestions: {
          static: ['How do I get started?'],
          dynamic: true,
          cacheTtl: 5_000,
        },
      })

      dateNowSpy.mockReturnValue(baseTime)

      const { result, rerender } = renderHook(() => useSuggestions(), {
        wrapper,
      })

      // First transition
      mockStatus = 'ready'
      rerender()

      await waitFor(() => {
        expect(result.current.suggestions).toContain('Follow-up 1')
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)

      // Advance time past TTL
      dateNowSpy.mockReturnValue(baseTime + 6_000)

      // Same message, but TTL expired
      mockStatus = 'streaming'
      rerender()
      mockStatus = 'ready'
      rerender()

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2)
      })

      dateNowSpy.mockRestore()
    })
  })

  describe('Actions', () => {
    it('calls sendMessage when select() is invoked', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useSuggestions(), { wrapper })

      act(() => {
        result.current.select('How do I get started?')
      })

      expect(mockSendMessage).toHaveBeenCalledWith({
        text: 'How do I get started?',
      })
    })

    it('emits suggestion_clicked event via onEvent when select() is invoked', () => {
      const wrapper = createWrapper()
      const { result } = renderHook(() => useSuggestions(), { wrapper })

      act(() => {
        result.current.select('How do I get started?')
      })

      expect(mockOnEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'suggestion_clicked',
          data: { suggestion: 'How do I get started?' },
        })
      )
    })

    it('clears cache and re-fetches when refresh() is called', async () => {
      mockMessages = [
        {
          id: 'msg-1',
          role: 'user',
          parts: [{ type: 'text', text: 'Hello' }],
        },
        {
          id: 'msg-2',
          role: 'assistant',
          parts: [{ type: 'text', text: 'Hi!' }],
        },
      ]
      mockStatus = 'streaming'

      const wrapper = createWrapper()
      const { result, rerender } = renderHook(() => useSuggestions(), {
        wrapper,
      })

      // First fetch
      mockStatus = 'ready'
      rerender()

      await waitFor(() => {
        expect(result.current.suggestions).toContain('Follow-up 1')
      })

      expect(mockFetch).toHaveBeenCalledTimes(1)

      // Call refresh
      await act(async () => {
        result.current.refresh()
      })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2)
      })
    })
  })
})
