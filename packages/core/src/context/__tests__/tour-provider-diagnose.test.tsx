import { act, render, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { twoStepTour } from '../../__tests__/_fixtures'
import { useTourDiagnostic } from '../../hooks/use-tour-diagnostic'
import { TourProvider } from '../tour-provider'

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

describe('<TourProvider diagnose>', () => {
  beforeEach(() => {
    // Mount the targets referenced by the fixture so the `target` gate passes.
    document.body.innerHTML = '<div id="a"></div><div id="b"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('populates the diagnostics map for every registered tour after one microtask', async () => {
    const { result } = renderHook(() => useTourDiagnostic('demo'), {
      wrapper: ({ children }) => (
        <TourProvider tours={[twoStepTour]} diagnose>
          {children}
        </TourProvider>
      ),
    })
    // Initial state: effect hasn't resolved yet
    expect(result.current).toBeNull()
    await act(async () => {
      await Promise.resolve()
    })
    expect(result.current?.tourId).toBe('demo')
    expect(result.current?.willFire).toBe(true)
  })

  it('keeps diagnostics map undefined when diagnose is off', () => {
    const { result } = renderHook(() => useTourDiagnostic('demo'), {
      wrapper: ({ children }) => <TourProvider tours={[twoStepTour]}>{children}</TourProvider>,
    })
    expect(result.current).toBeNull()
  })
})

describe('<TourProvider> dev-mode warning', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'development')
  })

  it('fires console.warn exactly once across re-renders in dev mode', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const { rerender } = render(
      <TourProvider tours={[twoStepTour]}>
        <span>x</span>
      </TourProvider>
    )
    rerender(
      <TourProvider tours={[twoStepTour]}>
        <span>x</span>
      </TourProvider>
    )
    rerender(
      <TourProvider tours={[twoStepTour]}>
        <span>x</span>
      </TourProvider>
    )
    const diagnoseCalls = warn.mock.calls.filter((args) =>
      String(args[0] ?? '').includes('diagnose')
    )
    expect(diagnoseCalls).toHaveLength(1)
  })

  it('does NOT warn when diagnose is on', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    render(
      <TourProvider tours={[twoStepTour]} diagnose>
        <span>x</span>
      </TourProvider>
    )
    const diagnoseCalls = warn.mock.calls.filter((args) =>
      String(args[0] ?? '').includes('diagnose')
    )
    expect(diagnoseCalls).toHaveLength(0)
  })
})

describe('<TourProvider> production-mode silence', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production')
  })

  it('never warns in production builds', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    render(
      <TourProvider tours={[twoStepTour]}>
        <span>x</span>
      </TourProvider>
    )
    const diagnoseCalls = warn.mock.calls.filter((args) =>
      String(args[0] ?? '').includes('diagnose')
    )
    expect(diagnoseCalls).toHaveLength(0)
  })
})
