import { act, renderHook } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { SurveysProvider } from '../context'
import { useSurvey } from '../hooks'
import type { SurveyConfig } from '../types'

vi.mock('@tour-kit/license', () => ({
  LicenseGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ProGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useLicenseGate: () => ({ isAllowed: true, isLoading: false }),
}))

vi.mock('@tour-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tour-kit/core')>()
  return {
    ...actual,
    useTourContext: () => ({ isActive: false }),
    useTourContextOptional: () => ({ isActive: false }),
  }
})

const configs: SurveyConfig[] = [
  {
    id: 's',
    type: 'csat',
    displayMode: 'modal',
    frequency: 'always',
    questions: [
      { id: 'q1', type: 'text', text: 'One' },
      { id: 'q2', type: 'text', text: 'Two' },
    ],
  },
]

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <SurveysProvider surveys={configs} storage={null}>
      {children}
    </SurveysProvider>
  )
}

// Each of these drives one of the previously-uncovered useSurvey passthroughs
// (hide, snooze, prevQuestion, complete, reset) and asserts the observable
// state transition it produces, not just that the call doesn't throw.

describe('useSurvey passthroughs', () => {
  it('show then hide toggles visibility', () => {
    const { result } = renderHook(() => useSurvey('s'), { wrapper })
    act(() => result.current.show())
    expect(result.current.state?.isVisible).toBe(true)
    act(() => result.current.hide())
    expect(result.current.state?.isVisible).toBe(false)
  })

  it('snooze marks the survey snoozed and increments the count', () => {
    const { result } = renderHook(() => useSurvey('s'), { wrapper })
    act(() => result.current.show())
    act(() => result.current.snooze())
    expect(result.current.state?.isSnoozed).toBe(true)
    expect(result.current.state?.snoozeCount).toBe(1)
  })

  it('prevQuestion steps back after advancing', () => {
    const { result } = renderHook(() => useSurvey('s'), { wrapper })
    act(() => result.current.show())
    act(() => {
      result.current.nextQuestion()
    })
    expect(result.current.state?.currentStep).toBe(1)
    act(() => result.current.prevQuestion())
    expect(result.current.state?.currentStep).toBe(0)
  })

  it('complete marks the survey completed', () => {
    const { result } = renderHook(() => useSurvey('s'), { wrapper })
    act(() => result.current.show())
    act(() => result.current.complete())
    expect(result.current.state?.isCompleted).toBe(true)
  })

  it('reset returns a completed survey to a fresh state', () => {
    const { result } = renderHook(() => useSurvey('s'), { wrapper })
    act(() => result.current.show())
    act(() => result.current.answer('q1', 'hi'))
    act(() => result.current.complete())
    expect(result.current.state?.isCompleted).toBe(true)

    act(() => result.current.reset())
    expect(result.current.state?.isCompleted).toBe(false)
    expect(result.current.state?.currentStep).toBe(0)
    expect(result.current.state?.responses.get('q1')).toBeUndefined()
  })

  it('dismiss records the dismissal reason', () => {
    const { result } = renderHook(() => useSurvey('s'), { wrapper })
    act(() => result.current.show())
    act(() => result.current.dismiss('close_button'))
    expect(result.current.state?.isDismissed).toBe(true)
    expect(result.current.state?.dismissalReason).toBe('close_button')
  })
})
