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

function makeConfig(id: string): SurveyConfig {
  return { id, type: 'csat', displayMode: 'modal', questions: [] }
}

const configs: SurveyConfig[] = [makeConfig('a'), makeConfig('b'), makeConfig('c')]

function wrapper({ children }: { children: React.ReactNode }) {
  return <SurveysProvider surveys={configs}>{children}</SurveysProvider>
}

describe('Queue drain', () => {
  it('dismissing the active survey auto-shows the next queued survey', () => {
    const { result } = renderHook(() => useSurveys(), { wrapper })

    act(() => {
      result.current.show('a')
    })
    expect(result.current.activeSurvey).toBe('a')

    act(() => {
      result.current.show('b')
    })
    expect(result.current.activeSurvey).toBe('a')
    expect(result.current.queue).toEqual(['b'])

    act(() => {
      result.current.dismiss('a')
    })
    expect(result.current.activeSurvey).toBe('b')
    expect(result.current.queue).toEqual([])
  })

  it('completing the active survey auto-shows the next queued survey', () => {
    const { result } = renderHook(() => useSurveys(), { wrapper })

    act(() => {
      result.current.show('a')
      result.current.show('b')
      result.current.show('c')
    })
    expect(result.current.activeSurvey).toBe('a')
    expect(result.current.queue).toEqual(['b', 'c'])

    act(() => {
      result.current.complete('a')
    })
    expect(result.current.activeSurvey).toBe('b')
    expect(result.current.queue).toEqual(['c'])

    act(() => {
      result.current.dismiss('b')
    })
    expect(result.current.activeSurvey).toBe('c')
    expect(result.current.queue).toEqual([])
  })

  it('hiding without drain option is still drain-true via the public hide() handler', () => {
    const { result } = renderHook(() => useSurveys(), { wrapper })

    act(() => {
      result.current.show('a')
      result.current.show('b')
    })

    act(() => {
      result.current.hide('a')
    })

    expect(result.current.activeSurvey).toBe('b')
    expect(result.current.queue).toEqual([])
  })

  it('unregistering a queued survey removes it from the queue', () => {
    const { result } = renderHook(() => useSurveys(), { wrapper })

    act(() => {
      result.current.show('a')
      result.current.show('b')
      result.current.show('c')
    })

    act(() => {
      result.current.unregister('b')
    })

    expect(result.current.queue).toEqual(['c'])
  })
})
