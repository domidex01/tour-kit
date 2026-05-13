import { act, render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { twoStepTour } from '../../__tests__/_fixtures'
import { TourProvider } from '../tour-provider'

beforeEach(() => {
  // Belt-and-suspenders: previous tests' provider cleanup should already have
  // removed the global, but a missed unmount would leak across this suite.
  // biome-ignore lint/performance/noDelete: must fully remove the property — `= undefined` leaves it as an own property and would mask leaks
  delete (window as { __tourKit__?: unknown }).__tourKit__
  // Mount the targets referenced by the fixture so any diagnose path resolves.
  document.body.innerHTML = '<div id="a"></div><div id="b"></div>'
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
  document.body.innerHTML = ''
})

describe('TestBridge — surface & lifecycle', () => {
  it('window.__tourKit__ is undefined when enableTestBridge is unset', () => {
    render(
      <TourProvider tours={[twoStepTour]}>
        <div />
      </TourProvider>
    )
    expect(window.__tourKit__).toBeUndefined()
  })

  it('exposes all 7 methods when enableTestBridge is true', () => {
    render(
      <TourProvider tours={[twoStepTour]} enableTestBridge>
        <div />
      </TourProvider>
    )
    const bridge = window.__tourKit__
    expect(bridge).toBeDefined()
    expect(typeof bridge?.start).toBe('function')
    expect(typeof bridge?.next).toBe('function')
    expect(typeof bridge?.previous).toBe('function')
    expect(typeof bridge?.goToStep).toBe('function')
    expect(typeof bridge?.complete).toBe('function')
    expect(typeof bridge?.skip).toBe('function')
    expect(typeof bridge?.getDiagnostic).toBe('function')
  })

  it('cleans up window.__tourKit__ on unmount', () => {
    const { unmount } = render(
      <TourProvider tours={[twoStepTour]} enableTestBridge>
        <div />
      </TourProvider>
    )
    expect(window.__tourKit__).toBeDefined()
    unmount()
    expect(window.__tourKit__).toBeUndefined()
  })

  it('cleanup does NOT delete a foreign value reassigned after mount', () => {
    const { unmount } = render(
      <TourProvider tours={[twoStepTour]} enableTestBridge>
        <div />
      </TourProvider>
    )
    // Simulate a foreign library (or a second provider) overwriting the global
    // after our mount. The cleanup must only remove its OWN bridge — proving
    // it identity-checks before deleting.
    const sentinel = { foreign: true } as unknown as Window['__tourKit__']
    ;(window as Window).__tourKit__ = sentinel
    unmount()
    expect(window.__tourKit__).toBe(sentinel)
    // Reset for the next test.
    // biome-ignore lint/performance/noDelete: full removal — keeps test isolation symmetrical with provider cleanup
    delete (window as { __tourKit__?: unknown }).__tourKit__
  })

  it('logs dev warning once even across an enableTestBridge toggle cycle', () => {
    // The warn-once guard is only meaningful when the effect actually re-runs.
    // Toggling `enableTestBridge` forces cleanup → re-mount of the effect; the
    // `testBridgeWarnedRef` must suppress the second warn. A bare rerender with
    // identical props wouldn't exercise the guard at all (effect deps stable).
    vi.stubEnv('NODE_ENV', 'development')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    function Harness({ enabled }: { enabled: boolean }) {
      return (
        <TourProvider tours={[twoStepTour]} enableTestBridge={enabled}>
          <div />
        </TourProvider>
      )
    }
    const { rerender } = render(<Harness enabled={true} />)
    rerender(<Harness enabled={false} />) // cleanup; bridge gone
    rerender(<Harness enabled={true} />) // effect runs again; guard must skip warn
    const bridgeCalls = warn.mock.calls.filter((args) =>
      String(args[0] ?? '').includes('Test bridge')
    )
    expect(bridgeCalls).toHaveLength(1)
    expect(String(bridgeCalls[0]?.[0])).toMatch(/Tour Kit/i)
  })

  it('does NOT warn in production but still publishes the bridge when opted in', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    render(
      <TourProvider tours={[twoStepTour]} enableTestBridge>
        <div />
      </TourProvider>
    )
    const bridgeCalls = warn.mock.calls.filter((args) =>
      String(args[0] ?? '').includes('Test bridge')
    )
    expect(bridgeCalls).toHaveLength(0)
    // Explicit opt-in MUST work in any NODE_ENV — guards a regression where the
    // prod check short-circuits the whole effect instead of just the warning.
    expect(window.__tourKit__).toBeDefined()
    expect(typeof window.__tourKit__?.next).toBe('function')
  })

  it('getDiagnostic returns a populated EligibilityReport when diagnose is on', async () => {
    render(
      <TourProvider tours={[twoStepTour]} enableTestBridge diagnose>
        <div />
      </TourProvider>
    )
    // Phase 3 populates `diagnostics` asynchronously after explainTour resolves.
    await act(async () => {
      await Promise.resolve()
    })
    const report = window.__tourKit__?.getDiagnostic('demo')
    expect(report).not.toBeNull()
    expect(report?.tourId).toBe('demo')
    expect(Array.isArray(report?.reasons)).toBe(true)
  })

  it('getDiagnostic returns null without diagnose', () => {
    render(
      <TourProvider tours={[twoStepTour]} enableTestBridge>
        <div />
      </TourProvider>
    )
    expect(window.__tourKit__?.getDiagnostic('demo')).toBeNull()
  })

  it('getDiagnostic returns null for an unknown tour id even with diagnose on', async () => {
    render(
      <TourProvider tours={[twoStepTour]} enableTestBridge diagnose>
        <div />
      </TourProvider>
    )
    await act(async () => {
      await Promise.resolve()
    })
    expect(window.__tourKit__?.getDiagnostic('does-not-exist')).toBeNull()
  })
})
