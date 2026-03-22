// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createActiveTourState, createInactiveTourState } from '../helpers/mock-tour-context'
import { createMockUseAiChatReturn } from '../helpers/mock-use-ai-chat'

// Mock useAiChat — isolate tour integration logic
const mockSendMessage = vi.fn()
const mockUseAiChat = vi.fn(() => createMockUseAiChatReturn({ sendMessage: mockSendMessage }))
vi.mock('../../hooks/use-ai-chat', () => ({
  useAiChat: () => mockUseAiChat(),
}))

// Mock internal context to supply tour context value
const mockUseAiChatContext = vi.fn()
vi.mock('../../context/ai-chat-context', () => ({
  useAiChatContext: () => mockUseAiChatContext(),
  AiChatContext: { Provider: ({ children }: { children: React.ReactNode }) => children },
}))

import { useTourAssistant } from '../../hooks/use-tour-assistant'

describe('useTourAssistant', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
  })

  // -------------------------------------------------------
  // Tour Context Assembly — Active Tour
  // -------------------------------------------------------
  describe('Tour context assembly — active tour', () => {
    it('maps active tour state to TourAssistantContext', () => {
      const tourState = createActiveTourState()
      mockUseAiChatContext.mockReturnValue({ tourContextValue: tourState })

      const { result } = renderHook(() => useTourAssistant())

      expect(result.current.tourContext.activeTour).toEqual({
        id: 'onboarding',
        name: 'Onboarding Tour',
        currentStep: 2,
        totalSteps: 5,
      })
    })

    it('maps active step with title and content', () => {
      const tourState = createActiveTourState()
      mockUseAiChatContext.mockReturnValue({ tourContextValue: tourState })

      const { result } = renderHook(() => useTourAssistant())

      expect(result.current.tourContext.activeStep).toEqual({
        id: 'step-connect',
        title: 'Connect your data source',
        content: 'Click the Add Connection button to connect your first data source.',
      })
    })

    it('includes completedTours from tour state', () => {
      const tourState = createActiveTourState()
      mockUseAiChatContext.mockReturnValue({ tourContextValue: tourState })

      const { result } = renderHook(() => useTourAssistant())

      expect(result.current.tourContext.completedTours).toEqual(['getting-started'])
    })

    it('sets checklistProgress to null (no checklists integration)', () => {
      const tourState = createActiveTourState()
      mockUseAiChatContext.mockReturnValue({ tourContextValue: tourState })

      const { result } = renderHook(() => useTourAssistant())

      expect(result.current.tourContext.checklistProgress).toBeNull()
    })
  })

  // -------------------------------------------------------
  // Tour Context Assembly — No Active Tour
  // -------------------------------------------------------
  describe('Tour context assembly — no active tour', () => {
    it('returns null activeTour when tour is inactive', () => {
      const tourState = createInactiveTourState()
      mockUseAiChatContext.mockReturnValue({ tourContextValue: tourState })

      const { result } = renderHook(() => useTourAssistant())

      expect(result.current.tourContext.activeTour).toBeNull()
      expect(result.current.tourContext.activeStep).toBeNull()
    })

    it('still includes completedTours when tour is inactive', () => {
      const tourState = createInactiveTourState()
      mockUseAiChatContext.mockReturnValue({ tourContextValue: tourState })

      const { result } = renderHook(() => useTourAssistant())

      expect(result.current.tourContext.completedTours).toEqual([
        'getting-started',
        'workspace-setup',
      ])
    })
  })

  // -------------------------------------------------------
  // Tour Context Assembly — No Provider (graceful fallback)
  // -------------------------------------------------------
  describe('Tour context assembly — no provider', () => {
    it('returns all-null context when tourContextValue is null', () => {
      mockUseAiChatContext.mockReturnValue({ tourContextValue: null })

      const { result } = renderHook(() => useTourAssistant())

      expect(result.current.tourContext.activeTour).toBeNull()
      expect(result.current.tourContext.activeStep).toBeNull()
      expect(result.current.tourContext.completedTours).toEqual([])
      expect(result.current.tourContext.checklistProgress).toBeNull()
    })
  })

  // -------------------------------------------------------
  // askAboutStep()
  // -------------------------------------------------------
  describe('askAboutStep', () => {
    it('sends contextual message when active step exists', () => {
      const tourState = createActiveTourState()
      mockUseAiChatContext.mockReturnValue({ tourContextValue: tourState })

      const { result } = renderHook(() => useTourAssistant())

      act(() => {
        result.current.askAboutStep()
      })

      expect(mockSendMessage).toHaveBeenCalledTimes(1)
      const sentMessage = mockSendMessage.mock.calls[0][0]
      expect(sentMessage.text).toContain('Connect your data source')
      expect(sentMessage.text).toContain('Onboarding Tour')
      expect(sentMessage.text).toContain('step 3 of 5')
    })

    it('is a no-op when no active step exists', () => {
      const tourState = createInactiveTourState()
      mockUseAiChatContext.mockReturnValue({ tourContextValue: tourState })

      const { result } = renderHook(() => useTourAssistant())

      act(() => {
        result.current.askAboutStep()
      })

      expect(mockSendMessage).not.toHaveBeenCalled()
    })

    it('logs console.warn in dev mode when no active step', () => {
      const tourState = createInactiveTourState()
      mockUseAiChatContext.mockReturnValue({ tourContextValue: tourState })

      const { result } = renderHook(() => useTourAssistant())

      act(() => {
        result.current.askAboutStep()
      })

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('askAboutStep'))
    })

    it('is a no-op when tourContextValue is null', () => {
      mockUseAiChatContext.mockReturnValue({ tourContextValue: null })

      const { result } = renderHook(() => useTourAssistant())

      act(() => {
        result.current.askAboutStep()
      })

      expect(mockSendMessage).not.toHaveBeenCalled()
      expect(consoleWarnSpy).toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------
  // askForHelp()
  // -------------------------------------------------------
  describe('askForHelp', () => {
    it('sends message with topic and tour context prefix when tour is active', () => {
      const tourState = createActiveTourState()
      mockUseAiChatContext.mockReturnValue({ tourContextValue: tourState })

      const { result } = renderHook(() => useTourAssistant())

      act(() => {
        result.current.askForHelp('billing')
      })

      expect(mockSendMessage).toHaveBeenCalledTimes(1)
      const sentMessage = mockSendMessage.mock.calls[0][0]
      expect(sentMessage.text).toContain('billing')
      expect(sentMessage.text).toContain('Onboarding Tour')
      expect(sentMessage.text).toContain('step 3/5')
    })

    it('sends message without tour prefix when no tour is active', () => {
      mockUseAiChatContext.mockReturnValue({ tourContextValue: null })

      const { result } = renderHook(() => useTourAssistant())

      act(() => {
        result.current.askForHelp('navigation')
      })

      expect(mockSendMessage).toHaveBeenCalledTimes(1)
      const sentMessage = mockSendMessage.mock.calls[0][0]
      expect(sentMessage.text).toContain('navigation')
    })

    it('sends generic help request when no topic provided and tour is active', () => {
      const tourState = createActiveTourState()
      mockUseAiChatContext.mockReturnValue({ tourContextValue: tourState })

      const { result } = renderHook(() => useTourAssistant())

      act(() => {
        result.current.askForHelp()
      })

      expect(mockSendMessage).toHaveBeenCalledTimes(1)
      const sentMessage = mockSendMessage.mock.calls[0][0]
      expect(sentMessage.text).toContain('help')
      expect(sentMessage.text).toContain('Onboarding Tour')
    })
  })

  // -------------------------------------------------------
  // Suggestions
  // -------------------------------------------------------
  describe('suggestions', () => {
    it('returns step-relevant suggestions when active step exists', () => {
      const tourState = createActiveTourState()
      mockUseAiChatContext.mockReturnValue({ tourContextValue: tourState })

      const { result } = renderHook(() => useTourAssistant())

      expect(result.current.suggestions).toHaveLength(3)
      expect(result.current.suggestions[0]).toContain('Connect your data source')
      expect(result.current.suggestions).toContain('Can you explain this step?')
      expect(result.current.suggestions).toContain('What should I do next?')
    })

    it('returns empty array when no active step', () => {
      const tourState = createInactiveTourState()
      mockUseAiChatContext.mockReturnValue({ tourContextValue: tourState })

      const { result } = renderHook(() => useTourAssistant())

      expect(result.current.suggestions).toEqual([])
    })

    it('returns empty array when tourContextValue is null', () => {
      mockUseAiChatContext.mockReturnValue({ tourContextValue: null })

      const { result } = renderHook(() => useTourAssistant())

      expect(result.current.suggestions).toEqual([])
    })
  })

  // -------------------------------------------------------
  // Inherited useAiChat API
  // -------------------------------------------------------
  describe('inherited useAiChat API', () => {
    it('returns all fields from useAiChat plus tour-specific fields', () => {
      mockUseAiChatContext.mockReturnValue({ tourContextValue: null })

      const { result } = renderHook(() => useTourAssistant())

      // From useAiChat
      expect(result.current).toHaveProperty('messages')
      expect(result.current).toHaveProperty('sendMessage')
      expect(result.current).toHaveProperty('stop')
      expect(result.current).toHaveProperty('isLoading')
      expect(result.current).toHaveProperty('status')
      // Tour-specific
      expect(result.current).toHaveProperty('tourContext')
      expect(result.current).toHaveProperty('suggestions')
      expect(result.current).toHaveProperty('askAboutStep')
      expect(result.current).toHaveProperty('askForHelp')
    })
  })
})
