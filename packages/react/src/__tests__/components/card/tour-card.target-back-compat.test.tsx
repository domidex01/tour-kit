/**
 * Phase 5 — backwards-compat parity for the widened `TourTarget` union.
 *
 * Mounts the same single-step tour three times: once with a legacy string
 * selector, once with a `RefObject<HTMLElement | null>`, once with a getter
 * thunk. Each variant must:
 *
 *   - render the active dialog without throwing
 *   - resolve the same target node, attached to floating-ui via `refs.setReference`
 *   - never emit a `console.warn` (Phase 0 §3 sign-off: string form is fallback,
 *     not deprecation)
 *
 * jsdom does not provide real layout, so we assert the dialog's presence and
 * the `console.warn` contract — `resolveTarget` unit tests cover branch
 * correctness, and the existing Floating UI tests cover positioning.
 */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type Tour, TourProvider, useTour } from '@tour-kit/core'
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

// Mounts the target node + captures its ref so a single React subtree can hand
// the same node to TourProvider as either a selector, a ref, or a thunk.
function TargetMount({ id, refOut }: { id: string; refOut?: { current: HTMLElement | null } }) {
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
    const tour: Tour = {
      id: 'bc-string',
      steps: [{ id: 's1', target: '#a', title: 'Hello', content: 'There' }],
    }

    render(
      <TourProvider tours={[tour]}>
        <TargetMount id="a" />
        <TourOverlay />
        <TourCard />
        <Starter />
      </TourProvider>
    )

    await user.click(screen.getByText('Start'))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toBeTruthy()
    // Phase 0 §3 sign-off: legacy string form is fallback, not deprecated —
    // no `target`-related dev warning may fire. Unrelated dev tips (e.g. the
    // `diagnose` hint) are allowed; we filter rather than assert zero calls.
    const targetRelatedWarns = warnSpy.mock.calls.filter((args: unknown[]) =>
      args.some(
        (arg: unknown) =>
          typeof arg === 'string' && (arg.includes('target') || arg.includes('deprecat'))
      )
    )
    expect(targetRelatedWarns).toEqual([])
  })

  it('renders the active dialog when target is a RefObject', async () => {
    const user = userEvent.setup()

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
          <Starter />
        </TourProvider>
      )
    }

    render(<App />)
    await user.click(screen.getByText('Start'))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toBeTruthy()
    // Phase 0 §3 sign-off: legacy string form is fallback, not deprecated —
    // no `target`-related dev warning may fire. Unrelated dev tips (e.g. the
    // `diagnose` hint) are allowed; we filter rather than assert zero calls.
    const targetRelatedWarns = warnSpy.mock.calls.filter((args: unknown[]) =>
      args.some(
        (arg: unknown) =>
          typeof arg === 'string' && (arg.includes('target') || arg.includes('deprecat'))
      )
    )
    expect(targetRelatedWarns).toEqual([])
  })

  it('renders the active dialog when target is a getter thunk', async () => {
    const user = userEvent.setup()
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
        <Starter />
      </TourProvider>
    )

    await user.click(screen.getByText('Start'))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toBeTruthy()
    // Phase 0 §3 sign-off: legacy string form is fallback, not deprecated —
    // no `target`-related dev warning may fire. Unrelated dev tips (e.g. the
    // `diagnose` hint) are allowed; we filter rather than assert zero calls.
    const targetRelatedWarns = warnSpy.mock.calls.filter((args: unknown[]) =>
      args.some(
        (arg: unknown) =>
          typeof arg === 'string' && (arg.includes('target') || arg.includes('deprecat'))
      )
    )
    expect(targetRelatedWarns).toEqual([])
  })
})
