import { act, renderHook } from '@testing-library/react'
import type * as React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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
  useTourContextOptional: () => {
    if (!mockTourProviderExists) return null
    return { isActive: mockTourActive }
  },
  createStorageAdapter: () => ({
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  }),
}))

function createCallbackSpies() {
  return {
    onSurveyShow: vi.fn(),
    onSurveyDismiss: vi.fn(),
    onSurveySnooze: vi.fn(),
    onSurveyComplete: vi.fn(),
    onQuestionAnswered: vi.fn(),
    onScoreCalculated: vi.fn(),
  }
}

function createTestSurveyConfig(overrides?: Partial<SurveyConfig>): SurveyConfig {
  return {
    id: 'test-survey-1',
    type: 'nps',
    displayMode: 'modal',
    questions: [
      {
        id: 'q1',
        type: 'rating',
        text: 'How likely are you to recommend us?',
        ratingScale: { min: 0, max: 10 },
        required: true,
      },
    ],
    frequency: 'always',
    ...overrides,
  }
}

function createWrapper(surveys: SurveyConfig[], callbacks: ReturnType<typeof createCallbackSpies>) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <SurveysProvider surveys={surveys} {...callbacks}>
        {children}
      </SurveysProvider>
    )
  }
}

beforeEach(() => {
  mockTourActive = false
  mockTourProviderExists = true
})

describe('Analytics callbacks', () => {
  it('fires onSurveyShow with survey id after SHOW action', () => {
    const spies = createCallbackSpies()
    const surveys = [createTestSurveyConfig()]
    const { result } = renderHook(() => useSurveys(), {
      wrapper: createWrapper(surveys, spies),
    })

    act(() => {
      result.current.show('test-survey-1')
    })

    expect(spies.onSurveyShow).toHaveBeenCalledTimes(1)
    expect(spies.onSurveyShow).toHaveBeenCalledWith('test-survey-1')
  })

  it('fires onSurveyDismiss with id and reason after DISMISS action', () => {
    const spies = createCallbackSpies()
    const surveys = [createTestSurveyConfig()]
    const { result } = renderHook(() => useSurveys(), {
      wrapper: createWrapper(surveys, spies),
    })

    act(() => {
      result.current.show('test-survey-1')
    })

    act(() => {
      result.current.dismiss('test-survey-1', 'close_button')
    })

    expect(spies.onSurveyDismiss).toHaveBeenCalledTimes(1)
    expect(spies.onSurveyDismiss).toHaveBeenCalledWith('test-survey-1', 'close_button')
  })

  it('fires onSurveySnooze with id after SNOOZE action', () => {
    const spies = createCallbackSpies()
    const surveys = [createTestSurveyConfig()]
    const { result } = renderHook(() => useSurveys(), {
      wrapper: createWrapper(surveys, spies),
    })

    act(() => {
      result.current.show('test-survey-1')
    })

    act(() => {
      result.current.snooze('test-survey-1')
    })

    expect(spies.onSurveySnooze).toHaveBeenCalledTimes(1)
    expect(spies.onSurveySnooze).toHaveBeenCalledWith('test-survey-1')
  })

  it('fires onSurveyComplete with id and responses after COMPLETE action', () => {
    const spies = createCallbackSpies()
    const surveys = [createTestSurveyConfig()]
    const { result } = renderHook(() => useSurveys(), {
      wrapper: createWrapper(surveys, spies),
    })

    act(() => {
      result.current.show('test-survey-1')
    })

    act(() => {
      result.current.answer('test-survey-1', 'q1', 9)
    })

    act(() => {
      result.current.complete('test-survey-1')
    })

    expect(spies.onSurveyComplete).toHaveBeenCalledTimes(1)
    expect(spies.onSurveyComplete).toHaveBeenCalledWith('test-survey-1', expect.any(Map))
    const responses = spies.onSurveyComplete.mock.calls[0][1] as Map<string, unknown>
    expect(responses.get('q1')).toBe(9)
  })

  it('fires onQuestionAnswered with surveyId, questionId, and value after ANSWER action', () => {
    const spies = createCallbackSpies()
    const surveys = [createTestSurveyConfig()]
    const { result } = renderHook(() => useSurveys(), {
      wrapper: createWrapper(surveys, spies),
    })

    act(() => {
      result.current.show('test-survey-1')
    })

    act(() => {
      result.current.answer('test-survey-1', 'q1', 8)
    })

    expect(spies.onQuestionAnswered).toHaveBeenCalledTimes(1)
    expect(spies.onQuestionAnswered).toHaveBeenCalledWith('test-survey-1', 'q1', 8)
  })

  it('fires onScoreCalculated with id, scoreType, and result after COMPLETE when survey has scoreType', () => {
    const spies = createCallbackSpies()
    const surveys = [createTestSurveyConfig({ id: 'nps-survey', type: 'nps' })]
    const { result } = renderHook(() => useSurveys(), {
      wrapper: createWrapper(surveys, spies),
    })

    act(() => {
      result.current.show('nps-survey')
    })

    act(() => {
      result.current.answer('nps-survey', 'q1', 9)
    })

    act(() => {
      result.current.complete('nps-survey')
    })

    expect(spies.onScoreCalculated).toHaveBeenCalledTimes(1)
    expect(spies.onScoreCalculated).toHaveBeenCalledWith(
      'nps-survey',
      'nps',
      expect.objectContaining({
        promoters: expect.any(Number),
        passives: expect.any(Number),
        detractors: expect.any(Number),
      })
    )
  })

  it('does NOT fire onScoreCalculated when survey has no scoreType (custom)', () => {
    const spies = createCallbackSpies()
    const surveys = [createTestSurveyConfig({ type: 'custom' })]
    const { result } = renderHook(() => useSurveys(), {
      wrapper: createWrapper(surveys, spies),
    })

    act(() => {
      result.current.show('test-survey-1')
    })

    act(() => {
      result.current.answer('test-survey-1', 'q1', 7)
    })

    act(() => {
      result.current.complete('test-survey-1')
    })

    expect(spies.onSurveyComplete).toHaveBeenCalledTimes(1)
    expect(spies.onScoreCalculated).not.toHaveBeenCalled()
  })

  it('does not throw when callbacks are undefined (all optional)', () => {
    const surveys = [createTestSurveyConfig()]
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <SurveysProvider surveys={surveys}>{children}</SurveysProvider>
    )

    const { result } = renderHook(() => useSurveys(), { wrapper })

    expect(() => {
      act(() => {
        result.current.show('test-survey-1')
      })
      act(() => {
        result.current.answer('test-survey-1', 'q1', 5)
      })
      act(() => {
        result.current.complete('test-survey-1')
      })
    }).not.toThrow()
  })
})
