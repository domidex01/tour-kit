import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import type * as React from 'react'
import { SurveysProvider } from '../context'
import { useSurveys } from '../hooks'
import type { SurveyConfig } from '../types'

let mockTourActive = false
let mockTourProviderExists = true

vi.mock('@tour-kit/core', () => ({
  useTourContext: () => {
    if (!mockTourProviderExists) {
      throw new Error('useTourContext must be used within a TourProvider')
    }
    return { isActive: mockTourActive }
  },
}))

function createTestSurveyConfig(): SurveyConfig {
  return {
    id: 'ctx-survey',
    type: 'csat',
    displayMode: 'popover',
    questions: [
      {
        id: 'q1',
        type: 'rating',
        text: 'How satisfied are you?',
        ratingScale: { min: 1, max: 5 },
        required: true,
      },
    ],
    frequency: 'always',
  }
}

function createWrapper(surveys: SurveyConfig[]) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <SurveysProvider surveys={surveys}>{children}</SurveysProvider>
  }
}

beforeEach(() => {
  mockTourActive = false
  mockTourProviderExists = true
})

describe('Context awareness — tour suppression', () => {
  it('blocks new surveys from showing when tour is active', () => {
    mockTourActive = true
    const surveys = [createTestSurveyConfig()]
    const { result } = renderHook(() => useSurveys(), {
      wrapper: createWrapper(surveys),
    })

    act(() => {
      result.current.show('ctx-survey')
    })

    expect(result.current.activeSurvey).toBeNull()
  })

  it('hides an active survey when tour becomes active', () => {
    const surveys = [createTestSurveyConfig()]
    const { result, rerender } = renderHook(() => useSurveys(), {
      wrapper: createWrapper(surveys),
    })

    act(() => {
      result.current.show('ctx-survey')
    })
    expect(result.current.activeSurvey).toBe('ctx-survey')

    // Simulate tour becoming active
    mockTourActive = true
    rerender()

    expect(result.current.activeSurvey).toBeNull()
  })

  it('allows surveys to show after tour ends', () => {
    mockTourActive = true
    const surveys = [createTestSurveyConfig()]
    const { result, rerender } = renderHook(() => useSurveys(), {
      wrapper: createWrapper(surveys),
    })

    // Tour ends
    mockTourActive = false
    rerender()

    act(() => {
      result.current.show('ctx-survey')
    })

    expect(result.current.activeSurvey).toBe('ctx-survey')
  })
})

describe('Context awareness — standalone operation (no TourProvider)', () => {
  it('works normally when no TourProvider exists in the tree', () => {
    mockTourProviderExists = false
    const surveys = [createTestSurveyConfig()]
    const { result } = renderHook(() => useSurveys(), {
      wrapper: createWrapper(surveys),
    })

    act(() => {
      result.current.show('ctx-survey')
    })

    expect(result.current.activeSurvey).toBe('ctx-survey')

    act(() => {
      result.current.dismiss('ctx-survey', 'close_button')
    })

    expect(result.current.activeSurvey).toBeNull()
  })
})
