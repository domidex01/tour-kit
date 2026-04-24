import { act, renderHook } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { SurveysProvider } from '../context'
import { useSurveys } from '../hooks'
import type { SurveyConfig } from '../types'

vi.mock('@tour-kit/license', () => ({
  ProGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@tour-kit/core', () => ({
  useTourContext: () => ({ isActive: false }),
  useTourContextOptional: () => ({ isActive: false }),
  createStorageAdapter: () => ({
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
  }),
}))

const configs: SurveyConfig[] = [{ id: 'a', type: 'csat', displayMode: 'modal', questions: [] }]

function wrapper({ children }: { children: React.ReactNode }) {
  return <SurveysProvider surveys={configs}>{children}</SurveysProvider>
}

describe('SHOW guards', () => {
  it('does not increment viewCount when showing an already-active survey', () => {
    const { result } = renderHook(() => useSurveys(), { wrapper })

    act(() => {
      result.current.show('a')
    })
    const firstCount = result.current.getState('a')?.viewCount ?? 0
    expect(firstCount).toBe(1)

    act(() => {
      result.current.show('a')
    })
    expect(result.current.getState('a')?.viewCount).toBe(firstCount)
  })

  it('show() is a no-op when the survey is completed', () => {
    const { result } = renderHook(() => useSurveys(), { wrapper })

    act(() => {
      result.current.show('a')
      result.current.complete('a')
    })
    const completedCount = result.current.getState('a')?.viewCount ?? 0

    act(() => {
      result.current.show('a')
    })
    expect(result.current.getState('a')?.viewCount).toBe(completedCount)
    expect(result.current.activeSurvey).toBeNull()
  })

  it('show() is a no-op when the survey is dismissed', () => {
    const { result } = renderHook(() => useSurveys(), { wrapper })

    act(() => {
      result.current.show('a')
      result.current.dismiss('a')
    })
    const dismissedCount = result.current.getState('a')?.viewCount ?? 0

    act(() => {
      result.current.show('a')
    })
    expect(result.current.getState('a')?.viewCount).toBe(dismissedCount)
    expect(result.current.activeSurvey).toBeNull()
  })
})

describe('Provider-level gates', () => {
  function wrapWithCooldown({ children }: { children: React.ReactNode }) {
    return (
      <SurveysProvider
        surveys={[
          { id: 'x', type: 'csat', displayMode: 'modal', questions: [] },
          { id: 'y', type: 'csat', displayMode: 'modal', questions: [] },
        ]}
        globalCooldownDays={30}
      >
        {children}
      </SurveysProvider>
    )
  }

  it('globalCooldownDays blocks a second survey when inside cooldown', () => {
    const { result } = renderHook(() => useSurveys(), { wrapper: wrapWithCooldown })

    act(() => {
      result.current.show('x')
    })
    expect(result.current.activeSurvey).toBe('x')

    act(() => {
      result.current.dismiss('x')
    })

    act(() => {
      result.current.show('y')
    })
    // y is blocked by global cooldown → no-op
    expect(result.current.activeSurvey).toBeNull()
  })

  function wrapWithMaxPerSession({ children }: { children: React.ReactNode }) {
    return (
      <SurveysProvider
        surveys={[
          { id: 'p', type: 'csat', displayMode: 'modal', questions: [] },
          { id: 'q', type: 'csat', displayMode: 'modal', questions: [] },
        ]}
        maxPerSession={1}
      >
        {children}
      </SurveysProvider>
    )
  }

  it('maxPerSession=1 blocks second show after first dismissed', () => {
    const { result } = renderHook(() => useSurveys(), { wrapper: wrapWithMaxPerSession })

    act(() => {
      result.current.show('p')
    })
    act(() => {
      result.current.dismiss('p')
    })
    act(() => {
      result.current.show('q')
    })
    expect(result.current.activeSurvey).toBeNull()
  })
})
