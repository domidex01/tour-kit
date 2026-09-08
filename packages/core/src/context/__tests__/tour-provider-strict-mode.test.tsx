/**
 * v2 §1.4c — `<TourProvider>` under `<React.StrictMode>`.
 *
 * No core or `@tour-kit/react` test mounted the provider under StrictMode
 * before this file, and StrictMode is the Next 15 App Router default, what
 * `apps/smoke` sets, and what both QA example apps wrap. Dev mode is not a
 * second product.
 *
 * What StrictMode actually does here: it double-invokes `useState`
 * initialisers (discarding one result) and runs every effect
 * mount -> cleanup -> mount. Both are hostile to holding an engine, because
 * `createTourEngine` registers its tours with `tourRegistry` at construction
 * and consumers hold action identities in dependency arrays. The registry is
 * the witness for the first; a ref of captured identities is the witness for
 * the second.
 *
 * ONE STRUCTURAL RULE, and it is load-bearing: `<React.StrictMode>` must be
 * the ROOT of the `render()` call. Measured here on React 19.2.4 — when it is
 * nested inside another component (an RTL `renderHook` wrapper, or any
 * `<Tree>` that returns it), the effect cleanup never runs and this whole file
 * silently stops testing the remount. Found by mutating the handle so
 * `release()` was terminal: with StrictMode nested, every case passed against
 * the bug; with it at the root, they fail. Do not refactor these into a shared
 * wrapper component.
 */
import { act, render, waitFor } from '@testing-library/react'
import * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { tourRegistry } from '../../registry/tour-registry'
import { useTourActions } from '../../registry/use-tour-actions'
import type { Tour, TourContextValue } from '../../types'
import { useTourContext } from '../tour-context'
import { TourProvider } from '../tour-provider'
import { IdentityProbe, StartOnMount } from './_helpers/strict-harness'

const TOUR: Tour = {
  id: 't',
  steps: [
    { id: 'a', target: '#x', content: 'A' },
    { id: 'b', target: '#x', content: 'B' },
  ],
}

const AUTO: Tour = { ...TOUR, id: 'auto', autoStart: true }

let errorSpy: ReturnType<typeof vi.spyOn>
let ctx: TourContextValue | null = null

function Probe() {
  ctx = useTourContext()
  return null
}

beforeEach(() => {
  ctx = null
  tourRegistry.__reset__?.()
  window.localStorage.clear()
  window.sessionStorage.clear()
  document.body.innerHTML = '<div id="x"></div>'
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

/** Assert on the CALLS, not a joined string: the registry interpolates the id. */
function registeredTwiceCalls() {
  return errorSpy.mock.calls.filter((call: unknown[]) =>
    call.some((arg) => /registered twice/i.test(String(arg)))
  )
}

describe('autostart is exactly once', () => {
  it("activates the tour once and runs the first step's onEnter once", async () => {
    // NOT `tour.onStart`: `runBootStart` dispatches START_TOUR directly rather
    // than through `commitStart`, so an autostarted tour has never fired it.
    // That asymmetry is pre-existing behaviour and out of scope for a swap —
    // `onEnter` is what a restore does run, and therefore what a doubled boot
    // would double.
    const onEnter = vi.fn()
    const tours = [{ ...AUTO, steps: [{ ...AUTO.steps[0], onEnter }, AUTO.steps[1]] } as Tour]

    render(
      <React.StrictMode>
        <TourProvider tours={tours}>
          <Probe />
        </TourProvider>
      </React.StrictMode>
    )

    await waitFor(() => expect(ctx?.isActive).toBe(true))
    // Let a second boot, if the remount armed one, land before counting.
    await act(async () => {
      await Promise.resolve()
    })

    expect(ctx?.tourId).toBe('auto')
    expect(ctx?.currentStepIndex).toBe(0)
    expect(onEnter).toHaveBeenCalledTimes(1)
  })

  it('fires onStart once per child start() — twice, exactly as adapter A did', async () => {
    // The path that DOES reach `commitStart`, and the number is 2 on purpose.
    // Under StrictMode the child's mount effect runs twice, `startImpl` has no
    // "already running this tour" guard, so `onStart` fires for each call.
    // MEASURED against the pre-§1.4 provider on this exact tree: it fires
    // twice there too. Pinning the parity number is the point of a swap phase
    // — a third firing, or a second start silently lost, both fail here. The
    // duplicate itself is a pre-existing quirk on the post-1.4 list, not
    // something a refactor gets to change.
    const onStart = vi.fn()

    render(
      <React.StrictMode>
        <TourProvider tours={[{ ...TOUR, onStart }]}>
          <StartOnMount tourId="t" />
          <Probe />
        </TourProvider>
      </React.StrictMode>
    )

    await waitFor(() => expect(ctx?.isActive).toBe(true))
    await act(async () => {
      await Promise.resolve()
    })

    expect(onStart).toHaveBeenCalledTimes(2)
  })

  it('never logs "registered twice"', async () => {
    // The signature of an engine constructed during render: React 18/19
    // double-invoke the initialiser and discard one result, and the discarded
    // engine has already registered.
    render(
      <React.StrictMode>
        <TourProvider tours={[AUTO]}>
          <Probe />
        </TourProvider>
      </React.StrictMode>
    )
    await waitFor(() => expect(ctx?.isActive).toBe(true))

    expect(registeredTwiceCalls()).toHaveLength(0)
  })

  it('fires onComplete exactly once', async () => {
    const onComplete = vi.fn()

    render(
      <React.StrictMode>
        <TourProvider tours={[{ ...AUTO, onComplete }]}>
          <Probe />
        </TourProvider>
      </React.StrictMode>
    )
    await waitFor(() => expect(ctx?.isActive).toBe(true))

    await act(async () => {
      ctx?.complete()
    })

    expect(onComplete).toHaveBeenCalledTimes(1)
  })
})

describe("a child's mount effect survives the remount", () => {
  it('leaves the tour active after StrictMode has torn down and rebuilt', async () => {
    // React runs child effects BEFORE the parent's, so this `start()` lands
    // before the provider's boot effect on both passes. The second pass runs
    // after the provider's cleanup released engine 1 — if the handle did not
    // rebuild on demand, this is where the tour silently disappears.
    render(
      <React.StrictMode>
        <TourProvider tours={[TOUR]}>
          <StartOnMount tourId="t" />
          <Probe />
        </TourProvider>
      </React.StrictMode>
    )

    await waitFor(() => expect(ctx?.isActive).toBe(true))
    expect(ctx?.tourId).toBe('t')
    expect(registeredTwiceCalls()).toHaveLength(0)
  })

  it('leaves a LIVE engine behind, not a frozen snapshot of a dead one', async () => {
    // `isActive: true` alone is not proof, and this is not hypothetical: a
    // handle whose `release()` were terminal leaves the destroyed engine in
    // place, `getState()` keeps replaying its last snapshot, and the tour
    // reads as running while every verb is a silent no-op. Driving it is the
    // only way to tell the two apart.
    render(
      <React.StrictMode>
        <TourProvider tours={[TOUR]}>
          <StartOnMount tourId="t" />
          <Probe />
        </TourProvider>
      </React.StrictMode>
    )
    await waitFor(() => expect(ctx?.isActive).toBe(true))

    await act(async () => {
      ctx?.next()
    })

    await waitFor(() => expect(ctx?.currentStep?.id).toBe('b'))
  })
})

describe('the registry is left clean', () => {
  it('holds nothing after unmount', async () => {
    const { unmount } = render(
      <React.StrictMode>
        <TourProvider tours={[AUTO]}>
          <Probe />
        </TourProvider>
      </React.StrictMode>
    )
    await waitFor(() => expect(ctx?.isActive).toBe(true))

    unmount()
    // The handle defers its destroy by one microtask so a StrictMode remount
    // can take it back; a real unmount has nothing to take it back.
    await act(async () => {
      await Promise.resolve()
    })

    expect(tourRegistry.snapshot().size).toBe(0)
  })

  it('still serves useTourActions to a sibling after the remount', async () => {
    // The sibling is OUTSIDE the provider — the registry is a module-level
    // singleton, which is the point. If the remount left the registry pointing
    // at the released engine, `start()` here drives a dead one.
    function Sibling() {
      const actions = useTourActions('t')
      return (
        <button type="button" onClick={actions.start}>
          go
        </button>
      )
    }

    const { getByText } = render(
      <React.StrictMode>
        <Sibling />
        <TourProvider tours={[TOUR]}>
          <Probe />
        </TourProvider>
      </React.StrictMode>
    )
    await waitFor(() => expect(tourRegistry.get('t')).not.toBeNull())

    await act(async () => {
      getByText('go').click()
    })

    await waitFor(() => expect(ctx?.isActive).toBe(true))
    // And it is a live engine, not a stale snapshot.
    await act(async () => {
      ctx?.next()
    })
    await waitFor(() => expect(ctx?.currentStep?.id).toBe('b'))
  })
})

describe('action identity is stable', () => {
  it('is === across a parent re-render AND across the StrictMode remount', async () => {
    // Consumers put these in dependency arrays and the registry entry closes
    // over them. A remount that swapped in a fresh engine would change all
    // thirteen and re-fire every effect that depends on one.
    const seen: React.RefObject<unknown[]> = { current: [] }

    const { rerender } = render(
      <React.StrictMode>
        <TourProvider tours={[TOUR]}>
          <IdentityProbe seen={seen} />
          <span>1</span>
        </TourProvider>
      </React.StrictMode>
    )
    await waitFor(() => expect(tourRegistry.get('t')).not.toBeNull())
    const afterMount = seen.current.length

    rerender(
      <React.StrictMode>
        <TourProvider tours={[TOUR]}>
          <IdentityProbe seen={seen} />
          <span>2</span>
        </TourProvider>
      </React.StrictMode>
    )
    await waitFor(() => expect(seen.current.length).toBeGreaterThan(afterMount))

    // Every capture, from the very first render through the remount and the
    // parent re-render, must be the same three functions.
    const first = seen.current.slice(0, 3)
    for (let i = 0; i < seen.current.length; i += 3) {
      expect(seen.current[i]).toBe(first[0])
      expect(seen.current[i + 1]).toBe(first[1])
      expect(seen.current[i + 2]).toBe(first[2])
    }
  })
})
