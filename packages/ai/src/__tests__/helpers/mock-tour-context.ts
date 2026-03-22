import { createContext } from 'react'
import { vi } from 'vitest'

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
