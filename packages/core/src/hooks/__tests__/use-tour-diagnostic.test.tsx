import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { twoStepTour } from '../../__tests__/_fixtures'
import { TourProvider } from '../../context/tour-provider'
import { useTourDiagnostic } from '../use-tour-diagnostic'

describe('useTourDiagnostic', () => {
  it('returns null when diagnose is off', () => {
    const { result } = renderHook(() => useTourDiagnostic('demo'), {
      wrapper: ({ children }) => <TourProvider tours={[twoStepTour]}>{children}</TourProvider>,
    })
    expect(result.current).toBeNull()
  })

  it('returns the report when diagnose is on', async () => {
    const { result } = renderHook(() => useTourDiagnostic('demo'), {
      wrapper: ({ children }) => (
        <TourProvider tours={[twoStepTour]} diagnose>
          {children}
        </TourProvider>
      ),
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(result.current?.tourId).toBe('demo')
  })

  it('returns null for unknown tour ids', async () => {
    const { result } = renderHook(() => useTourDiagnostic('unknown'), {
      wrapper: ({ children }) => (
        <TourProvider tours={[twoStepTour]} diagnose>
          {children}
        </TourProvider>
      ),
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(result.current).toBeNull()
  })

  it('throws when used outside <TourProvider>', () => {
    expect(() => renderHook(() => useTourDiagnostic('demo'))).toThrow(
      /must be used inside <TourProvider>/i
    )
  })
})
