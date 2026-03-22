'use client'

import { useCallback, useMemo } from 'react'
import { useAiChat, type UseAiChatReturn } from './use-ai-chat'
import { useAiChatContext } from '../context/ai-chat-context'

// ── Types ──

export interface TourAssistantContext {
  activeTour: {
    id: string
    name: string
    currentStep: number
    totalSteps: number
  } | null
  activeStep: {
    id: string
    title: string
    content: string
  } | null
  completedTours: string[]
  checklistProgress: { completed: number; total: number } | null
}

export interface UseTourAssistantReturn extends UseAiChatReturn {
  /** Whether the assistant is currently loading */
  isLoading: boolean
  /** Contextual suggestions based on current tour/step */
  suggestions: string[]
  /** Ask the AI about the current step — no-op if no active step */
  askAboutStep(): void
  /** Ask the AI for help on a topic — uses tour context if available */
  askForHelp(topic?: string): void
  /** Current tour context snapshot */
  tourContext: TourAssistantContext
}

// ── Tour context value shape (mirrors @tour-kit/core's TourContextValue) ──

interface TourContextLike {
  tourId?: string | null
  isActive?: boolean
  currentStepIndex?: number
  totalSteps?: number
  currentStep?: {
    id: string
    title?: string
    content?: unknown
  } | null
  tour?: { id: string; name: string; steps: unknown[] } | null
  completedTours?: string[]
}

// ── Assembly function ──

export function assembleTourContext(
  tourState: TourContextLike | null | undefined
): TourAssistantContext {
  if (!tourState || !tourState.isActive) {
    return {
      activeTour: null,
      activeStep: null,
      completedTours: tourState?.completedTours ?? [],
      checklistProgress: null,
    }
  }

  const tourId = tourState.tourId ?? 'unknown'

  return {
    activeTour: {
      id: tourId,
      name: tourState.tour?.name || tourId,
      currentStep: tourState.currentStepIndex ?? 0,
      totalSteps: tourState.totalSteps ?? 0,
    },
    activeStep: tourState.currentStep
      ? {
          id: tourState.currentStep.id,
          title: tourState.currentStep.title ?? '',
          content:
            typeof tourState.currentStep.content === 'string'
              ? tourState.currentStep.content
              : '',
        }
      : null,
    completedTours: tourState.completedTours ?? [],
    checklistProgress: null,
  }
}

// ── Hook ──

export function useTourAssistant(): UseTourAssistantReturn {
  const chat = useAiChat()
  const ctx = useAiChatContext()
  const tourState = ctx.tourContextValue ?? null
  const { sendMessage } = chat

  const tourContext = useMemo(
    () => assembleTourContext(tourState as TourContextLike | null),
    [tourState]
  )

  const suggestions = useMemo(() => {
    if (!tourContext.activeStep) return []
    return [
      `What does "${tourContext.activeStep.title}" do?`,
      'Can you explain this step?',
      'What should I do next?',
    ]
  }, [tourContext.activeStep])

  const askAboutStep = useCallback(() => {
    if (!tourContext.activeTour || !tourContext.activeStep) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          '[tour-kit/ai] askAboutStep() called with no active step. Message not sent.'
        )
      }
      return
    }
    const { activeTour, activeStep } = tourContext
    sendMessage({
      text: `Can you help me with the current step? I'm on step ${activeTour.currentStep + 1} of ${activeTour.totalSteps} in the "${activeTour.name}" tour: "${activeStep.title}"`,
    })
  }, [tourContext, sendMessage])

  const askForHelp = useCallback(
    (topic?: string) => {
      const base = tourContext.activeTour
        ? `I'm currently in the "${tourContext.activeTour.name}" tour (step ${tourContext.activeTour.currentStep + 1}/${tourContext.activeTour.totalSteps}).`
        : ''
      const question = topic
        ? `${base} Can you help me with: ${topic}`
        : `${base} I need help with this step.`
      sendMessage({ text: question.trim() })
    },
    [tourContext, sendMessage]
  )

  const isLoading = chat.status === 'submitted' || chat.status === 'streaming'

  return {
    ...chat,
    isLoading,
    suggestions,
    askAboutStep,
    askForHelp,
    tourContext,
  }
}
