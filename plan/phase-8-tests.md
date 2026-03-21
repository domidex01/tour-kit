# Phase 8 Test Plan — Tour-Kit Integration

**Package:** `@tour-kit/ai`
**Phase Type:** Integration — mock `@tour-kit/core` context, mock `useAiChat`
**Test Framework:** Vitest + `@testing-library/react`
**Coverage Target:** > 80% for all Phase 8 files
**Date:** 2026-03-21

---

## 1. User Stories Mapped to Tests

| ID | Story | Acceptance Criteria | Test Coverage |
|----|-------|---------------------|---------------|
| US-1 | As a developer, I want `useTourAssistant()` to enrich chat with tour context, so that the AI knows what step the user is on | `tourContext.activeTour` reflects current tour state; `tourContext.activeStep` has title/content | `use-tour-assistant.test.tsx` > Tour context assembly |
| US-2 | As a developer, I want the package to work when `@tour-kit/core` is NOT installed, so that it's truly optional | Hook returns all-null context, no import errors, no crashes | `use-tour-assistant.test.tsx` > Graceful fallback without provider |
| US-3 | As a user, I want `askAboutStep()` to send a contextual question, so that I get step-specific help | `sendMessage` called with step title + tour name; no-op with console.warn if no active step | `use-tour-assistant.test.tsx` > askAboutStep tests |
| US-4 | As a developer, I want tour context in the system prompt, so that the LLM has full user context | `createSystemPrompt()` with `tourContext` appends "Current User Context" section | `system-prompt-tour.test.ts` > Tour context injection |

---

## 2. Component Mock Strategy

| Component | Strategy | Rationale |
|-----------|----------|-----------|
| `useAiChat` | `vi.mock('../../hooks/use-ai-chat')` returning a mock object with `sendMessage: vi.fn()` and other required fields | We are testing the tour integration layer, not the chat mechanics. Mocking isolates the hook composition. |
| `@tour-kit/core` TourContext | Create a real React context (`React.createContext`) as a mock TourContext, wrap with `.Provider` in tests | Simulates the real context pattern without importing the actual `@tour-kit/core` package. |
| `AiChatProvider` internal context | Mock the internal `useAiChatContext` to return a controllable `tourContextValue` | Avoids needing the full provider tree; tests focus on the `useTourAssistant` hook logic. |
| `console.warn` | `vi.spyOn(console, 'warn')` | Verify dev-mode warnings for no-op convenience methods. |
| `createSystemPrompt` | Direct import (real function) | The system prompt modification is pure logic — no mocking needed. |
| `route-handler` request body | Construct mock `Request` objects with `tourContext` in JSON body | Verify the server-side parsing without a running server. |

---

## 3. Test Tier Table

| Test File | Tier | US | External Deps | Skip Condition |
|-----------|------|----|---------------|----------------|
| `use-tour-assistant.test.tsx` | Unit | US-1, US-2, US-3 | None (all mocked) | None — always runs |
| `assemble-tour-context.test.ts` | Unit | US-1, US-2 | None (pure function) | None — always runs |
| `system-prompt-tour.test.ts` | Unit | US-4 | None (pure function) | None — always runs |
| `route-handler-tour-context.test.ts` | Unit | US-4 | None (mock Request) | None — always runs |
| `provider-tour-bridge.test.tsx` | Integration | US-1, US-2 | None (mock contexts) | None — always runs |

---

## 4. Fake/Mock Implementations

### 4.1 Mock `useAiChat` Return Value

```typescript
// packages/ai/src/__tests__/helpers/mock-use-ai-chat.ts
import { vi } from 'vitest'
import type { UseAiChatReturn } from '../../types'

export function createMockUseAiChatReturn(
  overrides: Partial<UseAiChatReturn> = {}
): UseAiChatReturn {
  return {
    messages: [],
    sendMessage: vi.fn(),
    stop: vi.fn(),
    reload: vi.fn(),
    setMessages: vi.fn(),
    isLoading: false,
    error: null,
    status: 'idle',
    input: '',
    setInput: vi.fn(),
    handleSubmit: vi.fn(),
    ...overrides,
  }
}
```

### 4.2 Mock Tour Context Value

```typescript
// packages/ai/src/__tests__/helpers/mock-tour-context.ts
import { createContext } from 'react'

/**
 * Simulates @tour-kit/core's TourContextValue without importing it.
 * Shape mirrors the real TourContextValue from packages/core/src/types/state.ts.
 */
export interface MockTourContextValue {
  tourId: string | null
  isActive: boolean
  currentStepIndex: number
  totalSteps: number
  currentStep: {
    id: string
    title?: string
    content?: string
    target: string
  } | null
  tour: { id: string; name: string; steps: unknown[] } | null
  completedTours: string[]
  skippedTours: string[]
  visitedSteps: string[]
  stepVisitCount: Map<string, number>
  previousStepId: string | null
  isLoading: boolean
  isTransitioning: boolean
  data: Record<string, unknown>
  start: () => void
  next: () => void
  prev: () => void
  goTo: () => void
  complete: () => void
  skip: () => void
}

/** A React context that mimics @tour-kit/core's TourContext */
export const MockTourContext = createContext<MockTourContextValue | null>(null)

/** Active tour state fixture */
export function createActiveTourState(
  overrides: Partial<MockTourContextValue> = {}
): MockTourContextValue {
  return {
    tourId: 'onboarding',
    isActive: true,
    currentStepIndex: 2,
    totalSteps: 5,
    currentStep: {
      id: 'step-connect',
      title: 'Connect your data source',
      content: 'Click the Add Connection button to connect your first data source.',
      target: '#connect-btn',
    },
    tour: { id: 'onboarding', name: 'Onboarding Tour', steps: [] },
    completedTours: ['getting-started'],
    skippedTours: [],
    visitedSteps: ['step-welcome', 'step-profile', 'step-connect'],
    stepVisitCount: new Map(),
    previousStepId: 'step-profile',
    isLoading: false,
    isTransitioning: false,
    data: {},
    start: vi.fn(),
    next: vi.fn(),
    prev: vi.fn(),
    goTo: vi.fn(),
    complete: vi.fn(),
    skip: vi.fn(),
    ...overrides,
  }
}

/** Inactive tour state fixture */
export function createInactiveTourState(
  overrides: Partial<MockTourContextValue> = {}
): MockTourContextValue {
  return {
    tourId: null,
    isActive: false,
    currentStepIndex: 0,
    totalSteps: 0,
    currentStep: null,
    tour: null,
    completedTours: ['getting-started', 'workspace-setup'],
    skippedTours: [],
    visitedSteps: [],
    stepVisitCount: new Map(),
    previousStepId: null,
    isLoading: false,
    isTransitioning: false,
    data: {},
    start: vi.fn(),
    next: vi.fn(),
    prev: vi.fn(),
    goTo: vi.fn(),
    complete: vi.fn(),
    skip: vi.fn(),
    ...overrides,
  }
}
```

### 4.3 Mock Internal Context for Provider Bridge

```typescript
// packages/ai/src/__tests__/helpers/mock-ai-chat-context.ts
import { vi } from 'vitest'
import type { MockTourContextValue } from './mock-tour-context'

/**
 * Creates a mock return value for useAiChatContext() that includes
 * the tourContextValue field used by useTourAssistant.
 */
export function createMockAiChatContextValue(
  tourContextValue: MockTourContextValue | null = null
) {
  return {
    tourContextValue,
    config: {
      endpoint: '/api/chat',
      tourContext: tourContextValue !== null,
    },
  }
}
```

---

## 5. Test File List

### 5.1 `packages/ai/src/__tests__/hooks/use-tour-assistant.test.tsx`

```typescript
import { renderHook, act } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  createActiveTourState,
  createInactiveTourState,
} from '../helpers/mock-tour-context'
import { createMockUseAiChatReturn } from '../helpers/mock-use-ai-chat'

// Mock useAiChat — isolate tour integration logic
const mockSendMessage = vi.fn()
const mockUseAiChat = vi.fn(() =>
  createMockUseAiChatReturn({ sendMessage: mockSendMessage })
)
vi.mock('../../hooks/use-ai-chat', () => ({
  useAiChat: () => mockUseAiChat(),
}))

// Mock internal context to supply tour context value
const mockUseAiChatContext = vi.fn()
vi.mock('../../context/ai-chat-context', () => ({
  useAiChatContext: () => mockUseAiChatContext(),
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
        content:
          'Click the Add Connection button to connect your first data source.',
      })
    })

    it('includes completedTours from tour state', () => {
      const tourState = createActiveTourState()
      mockUseAiChatContext.mockReturnValue({ tourContextValue: tourState })

      const { result } = renderHook(() => useTourAssistant())

      expect(result.current.tourContext.completedTours).toEqual([
        'getting-started',
      ])
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

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('askAboutStep')
      )
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
      expect(result.current.suggestions[0]).toContain(
        'Connect your data source'
      )
      expect(result.current.suggestions).toContain(
        'Can you explain this step?'
      )
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
```

### 5.2 `packages/ai/src/__tests__/utils/assemble-tour-context.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { assembleTourContext } from '../../hooks/use-tour-assistant'
import {
  createActiveTourState,
  createInactiveTourState,
} from '../helpers/mock-tour-context'

describe('assembleTourContext', () => {
  // -------------------------------------------------------
  // Active tour mapping
  // -------------------------------------------------------
  describe('active tour', () => {
    it('maps tourId and tour.name to activeTour', () => {
      const state = createActiveTourState()
      const result = assembleTourContext(state)

      expect(result.activeTour).toEqual({
        id: 'onboarding',
        name: 'Onboarding Tour',
        currentStep: 2,
        totalSteps: 5,
      })
    })

    it('uses tourId as name when tour.name is missing', () => {
      const state = createActiveTourState({ tour: { id: 'onboarding', name: '', steps: [] } })
      const result = assembleTourContext(state)

      expect(result.activeTour!.name).toBe('onboarding')
    })

    it('maps currentStep fields to activeStep', () => {
      const state = createActiveTourState()
      const result = assembleTourContext(state)

      expect(result.activeStep).toEqual({
        id: 'step-connect',
        title: 'Connect your data source',
        content:
          'Click the Add Connection button to connect your first data source.',
      })
    })

    it('returns empty string for title when step has no title', () => {
      const state = createActiveTourState({
        currentStep: {
          id: 'step-no-title',
          target: '#btn',
          content: 'Some content',
        },
      })
      const result = assembleTourContext(state)

      expect(result.activeStep!.title).toBe('')
    })

    it('returns empty string for content when step content is non-string', () => {
      const state = createActiveTourState({
        currentStep: {
          id: 'step-jsx',
          title: 'JSX Step',
          content: undefined,
          target: '#btn',
        },
      })
      const result = assembleTourContext(state as unknown as Parameters<typeof assembleTourContext>[0])

      expect(result.activeStep!.content).toBe('')
    })

    it('sets activeStep to null when currentStep is null', () => {
      const state = createActiveTourState({ currentStep: null })
      const result = assembleTourContext(state)

      expect(result.activeStep).toBeNull()
    })
  })

  // -------------------------------------------------------
  // Inactive tour
  // -------------------------------------------------------
  describe('inactive tour', () => {
    it('returns null activeTour when isActive is false', () => {
      const state = createInactiveTourState()
      const result = assembleTourContext(state)

      expect(result.activeTour).toBeNull()
    })

    it('returns null activeStep when isActive is false', () => {
      const state = createInactiveTourState()
      const result = assembleTourContext(state)

      expect(result.activeStep).toBeNull()
    })

    it('preserves completedTours from inactive state', () => {
      const state = createInactiveTourState()
      const result = assembleTourContext(state)

      expect(result.completedTours).toEqual([
        'getting-started',
        'workspace-setup',
      ])
    })
  })

  // -------------------------------------------------------
  // Null / missing input
  // -------------------------------------------------------
  describe('null input', () => {
    it('returns all-null context when input is null', () => {
      const result = assembleTourContext(null)

      expect(result.activeTour).toBeNull()
      expect(result.activeStep).toBeNull()
      expect(result.completedTours).toEqual([])
      expect(result.checklistProgress).toBeNull()
    })

    it('returns all-null context when input is undefined', () => {
      const result = assembleTourContext(undefined as unknown as null)

      expect(result.activeTour).toBeNull()
      expect(result.activeStep).toBeNull()
      expect(result.completedTours).toEqual([])
      expect(result.checklistProgress).toBeNull()
    })
  })

  // -------------------------------------------------------
  // Defensive access
  // -------------------------------------------------------
  describe('defensive access', () => {
    it('handles missing tour object gracefully', () => {
      const state = createActiveTourState({ tour: null })
      const result = assembleTourContext(state)

      // Should fallback tourId as name
      expect(result.activeTour!.name).toBe('onboarding')
    })

    it('handles empty completedTours array', () => {
      const state = createActiveTourState({ completedTours: [] })
      const result = assembleTourContext(state)

      expect(result.completedTours).toEqual([])
    })

    it('always sets checklistProgress to null', () => {
      const state = createActiveTourState()
      const result = assembleTourContext(state)

      expect(result.checklistProgress).toBeNull()
    })
  })
})
```

### 5.3 `packages/ai/src/__tests__/server/system-prompt-tour.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { createSystemPrompt } from '../../server/system-prompt'
import type { TourAssistantContext } from '../../hooks/use-tour-assistant'

/** Fixture: active tour context */
const activeTourContext: TourAssistantContext = {
  activeTour: {
    id: 'onboarding',
    name: 'Onboarding Tour',
    currentStep: 2,
    totalSteps: 5,
  },
  activeStep: {
    id: 'step-connect',
    title: 'Connect your data source',
    content:
      'Click the Add Connection button to connect your first data source.',
  },
  completedTours: ['getting-started'],
  checklistProgress: null,
}

/** Fixture: no active tour context */
const inactiveTourContext: TourAssistantContext = {
  activeTour: null,
  activeStep: null,
  completedTours: ['getting-started', 'workspace-setup'],
  checklistProgress: null,
}

describe('createSystemPrompt — tour context injection', () => {
  // -------------------------------------------------------
  // With active tour context
  // -------------------------------------------------------
  describe('with active tour context', () => {
    it('appends "Current User Context" section', () => {
      const prompt = createSystemPrompt({ tourContext: activeTourContext })

      expect(prompt).toContain('## Current User Context')
    })

    it('includes tour name in context section', () => {
      const prompt = createSystemPrompt({ tourContext: activeTourContext })

      expect(prompt).toContain('Onboarding Tour')
    })

    it('includes step number (1-indexed) and total steps', () => {
      const prompt = createSystemPrompt({ tourContext: activeTourContext })

      expect(prompt).toContain('step 3 of 5')
    })

    it('includes active step title', () => {
      const prompt = createSystemPrompt({ tourContext: activeTourContext })

      expect(prompt).toContain('Connect your data source')
    })

    it('includes active step content', () => {
      const prompt = createSystemPrompt({ tourContext: activeTourContext })

      expect(prompt).toContain(
        'Click the Add Connection button to connect your first data source.'
      )
    })

    it('includes completed tours list', () => {
      const prompt = createSystemPrompt({ tourContext: activeTourContext })

      expect(prompt).toContain('getting-started')
    })

    it('combines tour context with other prompt layers', () => {
      const prompt = createSystemPrompt({
        productName: 'Acme',
        tone: 'friendly',
        tourContext: activeTourContext,
      })

      // Layer 1
      expect(prompt).toContain('Grounding')
      // Layer 2
      expect(prompt).toContain('Acme')
      // Tour context
      expect(prompt).toContain('Current User Context')
      expect(prompt).toContain('Onboarding Tour')
    })

    it('tour context section appears after other layers', () => {
      const prompt = createSystemPrompt({
        productName: 'Acme',
        tourContext: activeTourContext,
      })

      const groundingIndex = prompt.indexOf('Grounding')
      const tourContextIndex = prompt.indexOf('Current User Context')
      expect(tourContextIndex).toBeGreaterThan(groundingIndex)
    })
  })

  // -------------------------------------------------------
  // With active tour but no active step
  // -------------------------------------------------------
  describe('with active tour but no active step', () => {
    it('includes tour info but omits step details', () => {
      const contextNoStep: TourAssistantContext = {
        ...activeTourContext,
        activeStep: null,
      }
      const prompt = createSystemPrompt({ tourContext: contextNoStep })

      expect(prompt).toContain('Current User Context')
      expect(prompt).toContain('Onboarding Tour')
      expect(prompt).not.toContain('Step title')
    })
  })

  // -------------------------------------------------------
  // Without tour context
  // -------------------------------------------------------
  describe('without tour context', () => {
    it('does not include "Current User Context" when tourContext is undefined', () => {
      const prompt = createSystemPrompt({ productName: 'Acme' })

      expect(prompt).not.toContain('Current User Context')
    })

    it('does not include "Current User Context" when activeTour is null', () => {
      const prompt = createSystemPrompt({
        tourContext: inactiveTourContext,
      })

      expect(prompt).not.toContain('Current User Context')
    })
  })

  // -------------------------------------------------------
  // Completed tours formatting
  // -------------------------------------------------------
  describe('completed tours formatting', () => {
    it('shows "No tours completed yet." when completedTours is empty', () => {
      const context: TourAssistantContext = {
        ...activeTourContext,
        completedTours: [],
      }
      const prompt = createSystemPrompt({ tourContext: context })

      expect(prompt).toContain('No tours completed yet.')
    })

    it('joins multiple completed tours with commas', () => {
      const context: TourAssistantContext = {
        ...activeTourContext,
        completedTours: ['tour-a', 'tour-b', 'tour-c'],
      }
      const prompt = createSystemPrompt({ tourContext: context })

      expect(prompt).toContain('tour-a, tour-b, tour-c')
    })
  })
})
```

### 5.4 `packages/ai/src/__tests__/server/route-handler-tour-context.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { TourAssistantContext } from '../../hooks/use-tour-assistant'

// Mock AI SDK
vi.mock('ai', () => ({
  streamText: vi.fn().mockReturnValue({
    toUIMessageStreamResponse: vi.fn().mockReturnValue(new Response('ok')),
  }),
  convertToModelMessages: vi.fn().mockReturnValue([]),
}))

import { createChatRouteHandler } from '../../server/route-handler'
import { createSystemPrompt } from '../../server/system-prompt'

/** Fixture: tour context in request body */
const tourContextPayload: TourAssistantContext = {
  activeTour: {
    id: 'onboarding',
    name: 'Onboarding Tour',
    currentStep: 2,
    totalSteps: 5,
  },
  activeStep: {
    id: 'step-connect',
    title: 'Connect your data source',
    content: 'Click the Add Connection button.',
  },
  completedTours: ['getting-started'],
  checklistProgress: null,
}

describe('Route handler — tourContext parsing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('parses tourContext from request body JSON', async () => {
    const handler = createChatRouteHandler({
      model: {} as any, // mock model
      context: { strategy: 'context-stuffing', documents: [] },
    })

    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [],
        tourContext: tourContextPayload,
      }),
    })

    const response = await handler(request)
    expect(response).toBeInstanceOf(Response)
  })

  it('handles request without tourContext field', async () => {
    const handler = createChatRouteHandler({
      model: {} as any,
      context: { strategy: 'context-stuffing', documents: [] },
    })

    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
    })

    const response = await handler(request)
    expect(response).toBeInstanceOf(Response)
  })

  it('system prompt includes tour context when tourContext is in body', () => {
    const prompt = createSystemPrompt({
      productName: 'TestApp',
      tourContext: tourContextPayload,
    })

    expect(prompt).toContain('Current User Context')
    expect(prompt).toContain('Onboarding Tour')
    expect(prompt).toContain('Connect your data source')
  })

  it('system prompt excludes tour context when not in body', () => {
    const prompt = createSystemPrompt({
      productName: 'TestApp',
    })

    expect(prompt).not.toContain('Current User Context')
  })
})
```

### 5.5 `packages/ai/src/__tests__/context/provider-tour-bridge.test.tsx`

```typescript
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  MockTourContext,
  createActiveTourState,
} from '../helpers/mock-tour-context'

// Mock the require('@tour-kit/core') call inside useTourContextSafe
vi.mock('@tour-kit/core', () => {
  // Return a module that has a TourContext with the mock
  return {
    TourContext: MockTourContext,
  }
})

// We need to test the provider bridge behavior
// Import after mocking
import { AiChatProvider, useAiChatContext } from '../../context/ai-chat-provider'

function createWrapper(
  config: Record<string, unknown>,
  tourState: ReturnType<typeof createActiveTourState> | null = null
) {
  return function Wrapper({ children }: { children: ReactNode }) {
    if (tourState) {
      return (
        <MockTourContext.Provider value={tourState}>
          <AiChatProvider config={{ endpoint: '/api/chat', tourContext: true, ...config }}>
            {children}
          </AiChatProvider>
        </MockTourContext.Provider>
      )
    }
    return (
      <AiChatProvider config={{ endpoint: '/api/chat', ...config }}>
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

    const { result } = renderHook(() => useAiChatContext(), { wrapper })

    expect(result.current.tourContextValue).not.toBeNull()
  })

  it('returns null tourContextValue when no TourContext provider exists', () => {
    const wrapper = createWrapper({ tourContext: true })

    const { result } = renderHook(() => useAiChatContext(), { wrapper })

    expect(result.current.tourContextValue).toBeNull()
  })

  it('returns null tourContextValue when tourContext config is false', () => {
    const wrapper = createWrapper({ tourContext: false })

    const { result } = renderHook(() => useAiChatContext(), { wrapper })

    expect(result.current.tourContextValue).toBeNull()
  })

  it('does not attempt to read tour context when config.tourContext is not set', () => {
    const wrapper = createWrapper({})

    const { result } = renderHook(() => useAiChatContext(), { wrapper })

    expect(result.current.tourContextValue).toBeNull()
  })
})
```

---

## 6. Helpers Structure

```
packages/ai/src/__tests__/
  helpers/
    mock-use-ai-chat.ts          # Factory for UseAiChatReturn mock
    mock-tour-context.ts          # MockTourContext, active/inactive fixtures
    mock-ai-chat-context.ts       # Factory for useAiChatContext mock return
    prompt-fixtures.ts            # (existing from Phase 2)
  hooks/
    use-tour-assistant.test.tsx   # Hook tests (15 cases)
  utils/
    assemble-tour-context.test.ts # Pure function tests (12 cases)
  server/
    system-prompt-tour.test.ts    # System prompt tour section (12 cases)
    route-handler-tour-context.test.ts # Route handler body parsing (4 cases)
  context/
    provider-tour-bridge.test.tsx  # Provider bridge tests (4 cases)
```

---

## 7. Key Testing Decisions

1. **Mock `useAiChat` via `vi.mock`** rather than rendering the full `AiChatProvider` tree. This isolates the tour integration logic from chat mechanics and avoids needing to mock `useChat` from `@ai-sdk/react`.

2. **Create a standalone `MockTourContext`** rather than importing `TourContext` from `@tour-kit/core`. This ensures the test suite itself does not depend on `@tour-kit/core` being installed, which mirrors the optional peer dep constraint.

3. **Test `assembleTourContext` as a pure function** in a separate test file. This gives high coverage of the mapping logic without needing React rendering.

4. **System prompt tour context tested separately** from the existing Phase 2 system prompt tests. The tour context section is a new layer (Layer 4) and has its own test file to keep concerns isolated.

5. **Console.warn assertions** use `vi.spyOn(console, 'warn')` to verify dev-mode warnings without polluting test output.

6. **No `@testing-library/react` `render`** for the hook tests — use `renderHook` exclusively since `useTourAssistant` is a hook, not a component.

---

## 8. Example Test Case

```typescript
// From use-tour-assistant.test.tsx — askAboutStep with active tour
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
```

---

## 9. Execution Prompt

You are writing tests for Phase 8 of `@tour-kit/ai`: **Tour-Kit Integration**. The implementation adds `useTourAssistant`, `assembleTourContext`, tour context in the system prompt, and a provider bridge for optional `@tour-kit/core` integration.

Create all test files listed in Section 5, plus the helpers in Section 6. Use the mock strategy from Section 2. Each test should be self-contained and follow the Vitest + `@testing-library/react` patterns established in the codebase.

Key constraints:
- Never hard-import `@tour-kit/core` in tests — use `MockTourContext` from helpers
- Mock `useAiChat` via `vi.mock` to isolate tour logic
- Use `vi.spyOn(console, 'warn')` for dev-mode warning assertions
- All test files use `.test.ts` or `.test.tsx` extension
- Use `describe/it/expect` from `vitest`, `renderHook/act` from `@testing-library/react`

---

## 10. Run Commands

```bash
# Run all Phase 8 tests
pnpm --filter @tour-kit/ai test -- --run src/__tests__/hooks/use-tour-assistant.test.tsx src/__tests__/utils/assemble-tour-context.test.ts src/__tests__/server/system-prompt-tour.test.ts src/__tests__/server/route-handler-tour-context.test.ts src/__tests__/context/provider-tour-bridge.test.tsx

# Run only the hook tests
pnpm --filter @tour-kit/ai test -- --run use-tour-assistant

# Run only the pure function tests
pnpm --filter @tour-kit/ai test -- --run assemble-tour-context

# Run with coverage
pnpm --filter @tour-kit/ai test -- --coverage --run

# Run in watch mode during development
pnpm --filter @tour-kit/ai test -- --watch
```

---

## 11. Coverage Requirements

| File | Minimum Coverage |
|------|-----------------|
| `src/hooks/use-tour-assistant.ts` | 85% lines, 85% branches |
| `src/server/system-prompt.ts` (tour section) | 90% lines, 90% branches |
| `src/server/route-handler.ts` (tourContext parsing) | 80% lines |
| `src/context/ai-chat-provider.tsx` (tour bridge) | 80% lines |

---

## 12. Exit Criteria

- [ ] All 47+ test cases pass across 5 test files
- [ ] `assembleTourContext` has >90% coverage (pure function, all branches)
- [ ] `useTourAssistant` has >85% coverage including no-op paths
- [ ] System prompt tour section has >90% coverage
- [ ] Console.warn verified in dev mode for no-op `askAboutStep()`
- [ ] No imports of `@tour-kit/core` in test files (only `MockTourContext`)
- [ ] `pnpm --filter @tour-kit/ai test` passes with zero failures
- [ ] No `any` types in test files (except mock model in route handler test)
