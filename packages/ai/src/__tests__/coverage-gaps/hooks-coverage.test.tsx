// @vitest-environment jsdom
import { renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock AI SDK
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

describe('useAiChat — coverage gaps', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('throws outside provider', () => {
    it('useAiChat throws when used outside AiChatProvider', async () => {
      const { useAiChat } = await import('../../hooks/use-ai-chat')

      expect(() => {
        renderHook(() => useAiChat())
      }).toThrow('useAiChat must be used within an <AiChatProvider>')
    })
  })

  describe('useTourAssistant — coverage gaps', () => {
    it('useTourAssistant throws when used outside AiChatProvider', async () => {
      const { useTourAssistant } = await import('../../hooks/use-tour-assistant')

      expect(() => {
        renderHook(() => useTourAssistant())
      }).toThrow()
    })
  })
})

describe('assembleTourContext — coverage gaps', () => {
  it('returns empty context when tourState is null', async () => {
    const { assembleTourContext } = await import('../../hooks/use-tour-assistant')
    const result = assembleTourContext(null)
    expect(result.activeTour).toBeNull()
    expect(result.activeStep).toBeNull()
    expect(result.completedTours).toEqual([])
  })

  it('returns empty context when tourState is undefined', async () => {
    const { assembleTourContext } = await import('../../hooks/use-tour-assistant')
    const result = assembleTourContext(undefined)
    expect(result.activeTour).toBeNull()
    expect(result.activeStep).toBeNull()
  })

  it('returns empty context when tour is not active', async () => {
    const { assembleTourContext } = await import('../../hooks/use-tour-assistant')
    const result = assembleTourContext({ isActive: false, completedTours: ['tour-1'] })
    expect(result.activeTour).toBeNull()
    expect(result.completedTours).toEqual(['tour-1'])
  })

  it('handles active tour without currentStep', async () => {
    const { assembleTourContext } = await import('../../hooks/use-tour-assistant')
    const result = assembleTourContext({
      isActive: true,
      tourId: 'test-tour',
      tour: { id: 'test-tour', name: 'Test Tour', steps: [] },
      currentStepIndex: 2,
      totalSteps: 5,
      currentStep: null,
      completedTours: [],
    })
    expect(result.activeTour).toEqual({
      id: 'test-tour',
      name: 'Test Tour',
      currentStep: 2,
      totalSteps: 5,
    })
    expect(result.activeStep).toBeNull()
  })

  it('handles active tour with currentStep', async () => {
    const { assembleTourContext } = await import('../../hooks/use-tour-assistant')
    const result = assembleTourContext({
      isActive: true,
      tourId: 'test-tour',
      tour: { id: 'test-tour', name: 'Test Tour', steps: [] },
      currentStepIndex: 0,
      totalSteps: 3,
      currentStep: { id: 'step-1', title: 'Welcome', content: 'Hello' },
      completedTours: [],
    })
    expect(result.activeStep).toEqual({
      id: 'step-1',
      title: 'Welcome',
      content: 'Hello',
    })
  })

  it('falls back to tourId as name when tour.name is missing', async () => {
    const { assembleTourContext } = await import('../../hooks/use-tour-assistant')
    const result = assembleTourContext({
      isActive: true,
      tourId: 'fallback-id',
      currentStepIndex: 0,
      totalSteps: 1,
      completedTours: [],
    })
    expect(result.activeTour?.name).toBe('fallback-id')
  })

  it('handles non-string content in currentStep', async () => {
    const { assembleTourContext } = await import('../../hooks/use-tour-assistant')
    const result = assembleTourContext({
      isActive: true,
      tourId: 'tour',
      currentStep: { id: 's1', title: 'Step', content: { jsx: true } },
      completedTours: [],
    })
    expect(result.activeStep?.content).toBe('')
  })
})
