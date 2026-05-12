/**
 * Phase 1 parity fix: `useTour()` must surface `goToStep` and `startTour` at
 * the top level (no `.actions.` prefix). The imperative ref has had these
 * methods all along; spec §4.2 calls out the hook gap.
 */
import { renderHook } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it } from 'vitest'
import { TourProvider } from '../../context/tour-provider'
import { useTour } from '../../hooks/use-tour'
import { twoStepTour } from '../_fixtures'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <TourProvider tours={[twoStepTour]}>{children}</TourProvider>
)

describe('useTour() surface — Phase 1 parity fix', () => {
  it('exposes goToStep at the top level (no .actions prefix)', () => {
    const { result } = renderHook(() => useTour(), { wrapper })
    expect(typeof result.current.goToStep).toBe('function')
  })

  it('exposes startTour at the top level', () => {
    const { result } = renderHook(() => useTour(), { wrapper })
    expect(typeof result.current.startTour).toBe('function')
  })

  it('calling goToStep with a known id does not throw', () => {
    const { result } = renderHook(() => useTour(), { wrapper })
    expect(() => result.current.goToStep('welcome')).not.toThrow()
  })

  it('calling startTour with a known tour id does not throw', () => {
    const { result } = renderHook(() => useTour(), { wrapper })
    expect(() => result.current.startTour('demo')).not.toThrow()
  })
})
