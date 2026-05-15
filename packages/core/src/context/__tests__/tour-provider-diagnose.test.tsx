import { act, render, renderHook } from '@testing-library/react'
import * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { twoStepTour } from '../../__tests__/_fixtures'
import { useTour } from '../../hooks/use-tour'
import { useTourDiagnostic } from '../../hooks/use-tour-diagnostic'
import type { DiagnosticGate } from '../../types/diagnostic'
import type { RouterAdapter } from '../../types/router'
import { TourProvider } from '../tour-provider'

beforeEach(() => {
  window.localStorage.clear()
  window.sessionStorage.clear()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  window.localStorage.clear()
  window.sessionStorage.clear()
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

describe('<TourProvider diagnose> — persistence integration', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="a"></div><div id="b"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('reports ALREADY_COMPLETED after the active tour completes', async () => {
    // Drive a real complete() through the reducer and verify the diagnostic
    // report flips from willFire:true → firstFailingGate.code = 'ALREADY_COMPLETED'.
    // `complete()` early-returns when state.isActive is false, so start() must
    // flush before complete() reads the post-start closure.
    const { result } = renderHook(
      () => ({
        diag: useTourDiagnostic('demo'),
        tour: useTour(),
      }),
      {
        wrapper: ({ children }) => (
          <TourProvider tours={[twoStepTour]} diagnose>
            {children}
          </TourProvider>
        ),
      }
    )

    await act(async () => {
      await Promise.resolve()
    })
    expect(result.current.diag?.willFire).toBe(true)

    await act(async () => {
      result.current.tour.start('demo')
    })
    await act(async () => {
      result.current.tour.complete()
    })
    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.diag?.willFire).toBe(false)
    expect(result.current.diag?.firstFailingGate?.code).toBe('ALREADY_COMPLETED')
  })
})

describe('<TourProvider diagnose> — route gate plumbing', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="a"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  function makeRouter(current: string): RouterAdapter {
    return {
      getCurrentRoute: () => current,
      navigate: vi.fn(),
      onRouteChange: () => () => undefined,
      matchRoute: (matcher, mode = 'exact') => {
        if (mode === 'exact') return current === matcher
        if (mode === 'startsWith') return current.startsWith(matcher)
        return current.includes(matcher)
      },
    }
  }

  it('surfaces ROUTE_MISMATCH when the router is on a different path than the first visible step', async () => {
    const tour = {
      id: 'route-tour',
      steps: [{ id: 's1', target: '#a', content: '', route: '/pricing' }],
    }
    const router = makeRouter('/dashboard')
    const { result } = renderHook(() => useTourDiagnostic('route-tour'), {
      wrapper: ({ children }) => (
        <TourProvider tours={[tour]} diagnose router={router}>
          {children}
        </TourProvider>
      ),
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(result.current?.willFire).toBe(false)
    expect(result.current?.firstFailingGate?.code).toBe('ROUTE_MISMATCH')
    expect(result.current?.firstFailingGate?.detail).toMatchObject({
      expected: '/pricing',
      actual: '/dashboard',
      mode: 'exact',
    })
  })

  it('passes the route gate when current matches the first visible step', async () => {
    const tour = {
      id: 'route-tour',
      steps: [{ id: 's1', target: '#a', content: '', route: '/pricing' }],
    }
    const router = makeRouter('/pricing')
    const { result } = renderHook(() => useTourDiagnostic('route-tour'), {
      wrapper: ({ children }) => (
        <TourProvider tours={[tour]} diagnose router={router}>
          {children}
        </TourProvider>
      ),
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(result.current?.willFire).toBe(true)
  })
})

describe('<TourProvider diagnose> — extension gate prop changes', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="a"></div><div id="b"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('re-runs diagnostics when a new gate is added to diagnosticGates after mount', async () => {
    // Realistic scenario: a license gate registers after auth resolves. The
    // gate-id set changes, so the diagnose effect must re-run with the new
    // gate appended. Keying by gate id (not by array identity) is intentional:
    // ids are required-stable per the DiagnosticGate contract, so two gates
    // with the same id are considered the same registration slot.
    function Wrapper({ gates }: { gates: DiagnosticGate[] }) {
      return (
        <TourProvider tours={[twoStepTour]} diagnose diagnosticGates={gates}>
          <Reader />
        </TourProvider>
      )
    }
    const reports: Array<ReturnType<typeof useTourDiagnostic>> = []
    function Reader() {
      const report = useTourDiagnostic('demo')
      React.useEffect(() => {
        reports.push(report)
      }, [report])
      return null
    }

    const blockingLicense: DiagnosticGate = {
      id: 'license',
      evaluate: () => ({
        ok: false,
        gate: 'license',
        code: 'LICENSE_INVALID',
        message: 'no key',
      }),
    }

    const { rerender } = render(<Wrapper gates={[]} />)
    await act(async () => {
      await Promise.resolve()
    })
    expect(reports[reports.length - 1]?.willFire).toBe(true)

    rerender(<Wrapper gates={[blockingLicense]} />)
    await act(async () => {
      await Promise.resolve()
    })
    expect(reports[reports.length - 1]?.willFire).toBe(false)
    expect(reports[reports.length - 1]?.firstFailingGate?.code).toBe('LICENSE_INVALID')
  })
})

describe('<TourProvider diagnose> — userContext stability', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="a"></div><div id="b"></div>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('does not re-run the diagnostic effect when a deep-equal inline userContext object is passed on re-render', async () => {
    let effectRuns = 0
    const trackingGate: DiagnosticGate = {
      id: 'tracker',
      evaluate: () => {
        effectRuns += 1
        return { ok: true, gate: 'tracker' }
      },
    }

    function Harness({ tick }: { tick: number }) {
      // New object literal every render — must NOT trigger the diagnose effect
      // unless its contents change.
      return (
        <TourProvider
          tours={[twoStepTour]}
          diagnose
          userContext={{ plan: 'pro' }}
          diagnosticGates={[trackingGate]}
        >
          <span>tick {tick}</span>
        </TourProvider>
      )
    }

    const { rerender } = render(<Harness tick={1} />)
    await act(async () => {
      await Promise.resolve()
    })
    const baseline = effectRuns

    rerender(<Harness tick={2} />)
    rerender(<Harness tick={3} />)
    await act(async () => {
      await Promise.resolve()
    })

    // Allow at most the baseline (one run per tour). Anything beyond proves
    // userContext identity is leaking into the effect deps.
    expect(effectRuns).toBe(baseline)
  })

  it('re-runs the diagnostic effect when userContext content actually changes', async () => {
    // Complement to the deep-equal test above: prove the stability key
    // refreshes on content change, so a future refactor that hardcoded the
    // key to `''` would fail HERE instead of slipping through.
    let effectRuns = 0
    const trackingGate: DiagnosticGate = {
      id: 'tracker',
      evaluate: () => {
        effectRuns += 1
        return { ok: true, gate: 'tracker' }
      },
    }
    function Harness({ ctx }: { ctx: Record<string, unknown> }) {
      return (
        <TourProvider
          tours={[twoStepTour]}
          diagnose
          userContext={ctx}
          diagnosticGates={[trackingGate]}
        >
          <span />
        </TourProvider>
      )
    }
    const { rerender } = render(<Harness ctx={{ plan: 'pro' }} />)
    await act(async () => {
      await Promise.resolve()
    })
    const baseline = effectRuns

    rerender(<Harness ctx={{ plan: 'enterprise' }} />)
    await act(async () => {
      await Promise.resolve()
    })
    expect(effectRuns).toBeGreaterThan(baseline)
  })

  it('does not crash the host tree when userContext contains circular references', async () => {
    // `JSON.stringify` throws on circular refs — the stability key must
    // catch the throw and degrade gracefully so a user object with back-
    // references never takes down the consumer's render.
    type Circular = Record<string, unknown> & { self?: unknown }
    const circular: Circular = { plan: 'pro' }
    circular.self = circular

    const { result } = renderHook(() => useTourDiagnostic('demo'), {
      wrapper: ({ children }) => (
        <TourProvider tours={[twoStepTour]} diagnose userContext={circular}>
          {children}
        </TourProvider>
      ),
    })
    await act(async () => {
      await Promise.resolve()
    })
    expect(result.current?.tourId).toBe('demo')
  })
})
