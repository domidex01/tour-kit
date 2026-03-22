// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  createActiveTourState,
} from '../helpers/mock-tour-context'
import { createMockUseChatReturn } from '../helpers/mock-use-chat'

// Mock @ai-sdk/react useChat
vi.mock('@ai-sdk/react', () => ({
  useChat: () => createMockUseChatReturn(),
}))

// Mock ai module
vi.mock('ai', () => ({
  DefaultChatTransport: vi.fn(),
}))

// Mock persistence hook
vi.mock('../../hooks/use-persistence', () => ({
  usePersistence: () => ({
    loadMessages: vi.fn().mockResolvedValue(null),
    saveMessages: vi.fn(),
    clearMessages: vi.fn(),
    isEnabled: false,
  }),
}))

import { AiChatProvider } from '../../context/ai-chat-provider'
import { useAiChatContext } from '../../context/ai-chat-context'

// Helper to read tour context from the provider's internal context
function useProviderTourContext() {
  const ctx = useAiChatContext()
  return ctx
}

function createWrapper(
  config: Record<string, unknown>,
  tourState: ReturnType<typeof createActiveTourState> | null = null
) {
  return function Wrapper({ children }: { children: ReactNode }) {
    // Use the explicit tourContextValue prop when tourState is provided
    return (
      <AiChatProvider
        config={{ endpoint: '/api/chat', ...config }}
        tourContextValue={tourState ?? undefined}
      >
        {children}
      </AiChatProvider>
    )
  }
}

describe('AiChatProvider — tour context bridge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reads tour context when tourContext config is true and provider exists', () => {
    const tourState = createActiveTourState()
    const wrapper = createWrapper({ tourContext: true }, tourState)

    const { result } = renderHook(() => useProviderTourContext(), { wrapper })

    expect(result.current.tourContextValue).not.toBeNull()
  })

  it('returns null tourContextValue when no TourContext provider exists', () => {
    const wrapper = createWrapper({ tourContext: true })

    const { result } = renderHook(() => useProviderTourContext(), { wrapper })

    expect(result.current.tourContextValue).toBeNull()
  })

  it('returns null tourContextValue when tourContext config is false', () => {
    const wrapper = createWrapper({ tourContext: false })

    const { result } = renderHook(() => useProviderTourContext(), { wrapper })

    expect(result.current.tourContextValue).toBeNull()
  })

  it('does not attempt to read tour context when config.tourContext is not set', () => {
    const wrapper = createWrapper({})

    const { result } = renderHook(() => useProviderTourContext(), { wrapper })

    expect(result.current.tourContextValue).toBeNull()
  })

  it('ignores tourContextValue prop when config.tourContext is false', () => {
    const tourState = createActiveTourState()
    const wrapper = createWrapper({ tourContext: false }, tourState)

    const { result } = renderHook(() => useProviderTourContext(), { wrapper })

    expect(result.current.tourContextValue).toBeNull()
  })
})
