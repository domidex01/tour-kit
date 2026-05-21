/**
 * Phase 5 — backwards-compat parity for the widened `TourTarget` union.
 *
 * Mounts the same single-step tour three times: once with a legacy string
 * selector, once with a `RefObject<HTMLElement | null>`, once with a getter
 * thunk. Each variant must:
 *
 *   - render the active dialog without throwing
 *   - resolve the target node — verified via a probe that captures
 *     `resolveTarget(currentStep.target)` at step-enter time
 *   - never emit a target-related `console.warn` (Phase 0 §3 sign-off:
 *     string form is fallback, not deprecation)
 *
 * jsdom does not compute layout, so we don't assert geometry overlap. The
 * resolver branch matrix is covered by `target.test.ts` — here we prove the
 * *React-tree integration* lights up identically for all three shapes.
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type Tour, TourProvider, resolveTarget, useTour } from '@tour-kit/core'
import * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TourCard } from '../../../components/card/tour-card'
import { TourOverlay } from '../../../components/overlay/tour-overlay'

function Starter() {
  const { start } = useTour()
  return (
    <button type="button" onClick={() => start()}>
      Start
    </button>
  )
}

// Captures `resolveTarget(currentStep.target)` whenever the active step
// changes, so the test can assert "the resolver actually returned the right
// node" rather than just "the dialog rendered." Without this, a regression
// that made `resolveTarget` always return null would still pass — `<TourCard>`
// mounts the dialog whenever `isActive`, independent of target resolution.
function ResolvedTargetProbe({ onResolve }: { onResolve: (el: HTMLElement | null) => void }) {
  const { currentStep, isActive } = useTour()
  React.useEffect(() => {
    if (!isActive || !currentStep) return
    onResolve(resolveTarget(currentStep.target))
  }, [isActive, currentStep, onResolve])
  return null
}

// Mounts the target node + captures its ref so a single React subtree can hand
// the same node to TourProvider as either a selector, a ref, or a thunk.
function TargetMount({
  id,
  refOut,
}: { id: string; refOut?: { current: HTMLElement | null } }) {
  return (
    <div
      id={id}
      ref={(node) => {
        if (refOut) refOut.current = node
      }}
    >
      Target
    </div>
  )
}

// Phase 0 §3 sign-off: legacy string form is fallback, not deprecated — no
// `target`-related dev warning may fire. Unrelated dev tips (e.g. the
// `diagnose` hint) are allowed; we filter rather than assert zero calls.
function expectNoTargetWarns(spy: ReturnType<typeof vi.spyOn>) {
  const offenders = spy.mock.calls.filter((args: unknown[]) =>
    args.some(
      (a: unknown) => typeof a === 'string' && (a.includes('target') || a.includes('deprecat'))
    )
  )
  expect(offenders).toEqual([])
}

describe('TourCard backwards-compat across target shapes', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    document.body.innerHTML = ''
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
  })

  it('renders the active dialog when target is a legacy string selector', async () => {
    const user = userEvent.setup()
    const resolved: Array<HTMLElement | null> = []
    const tour: Tour = {
      id: 'bc-string',
      steps: [{ id: 's1', target: '#a', title: 'Hello', content: 'There' }],
    }

    render(
      <TourProvider tours={[tour]}>
        <TargetMount id="a" />
        <TourOverlay />
        <TourCard />
        <ResolvedTargetProbe onResolve={(el) => resolved.push(el)} />
        <Starter />
      </TourProvider>
    )

    await user.click(screen.getByText('Start'))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toBeTruthy()
    expect(resolved[0]).toBe(document.getElementById('a'))
    expectNoTargetWarns(warnSpy)
  })

  it('renders the active dialog when target is a RefObject', async () => {
    const user = userEvent.setup()
    const resolved: Array<HTMLElement | null> = []

    function App() {
      const ref = React.useRef<HTMLElement | null>(null)
      const tour = React.useMemo<Tour>(
        () => ({
          id: 'bc-ref',
          steps: [{ id: 's1', target: ref, title: 'Hello', content: 'There' }],
        }),
        []
      )
      return (
        <TourProvider tours={[tour]}>
          <TargetMount id="a" refOut={ref} />
          <TourOverlay />
          <TourCard />
          <ResolvedTargetProbe onResolve={(el) => resolved.push(el)} />
          <Starter />
        </TourProvider>
      )
    }

    render(<App />)
    await user.click(screen.getByText('Start'))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toBeTruthy()
    expect(resolved[0]).toBe(document.getElementById('a'))
    expectNoTargetWarns(warnSpy)
  })

  it('renders the active dialog when target is a getter thunk', async () => {
    const user = userEvent.setup()
    const resolved: Array<HTMLElement | null> = []
    const tour: Tour = {
      id: 'bc-thunk',
      steps: [
        {
          id: 's1',
          target: () => document.getElementById('a'),
          title: 'Hello',
          content: 'There',
        },
      ],
    }

    render(
      <TourProvider tours={[tour]}>
        <TargetMount id="a" />
        <TourOverlay />
        <TourCard />
        <ResolvedTargetProbe onResolve={(el) => resolved.push(el)} />
        <Starter />
      </TourProvider>
    )

    await user.click(screen.getByText('Start'))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toBeTruthy()
    expect(resolved[0]).toBe(document.getElementById('a'))
    expectNoTargetWarns(warnSpy)
  })
})
