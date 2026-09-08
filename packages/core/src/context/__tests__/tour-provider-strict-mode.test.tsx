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
 */
import { act, render, renderHook, waitFor } from '@testing-library/react'
import * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTourActions } from '../../registry/use-tour-actions'
import { tourRegistry } from '../../registry/tour-registry'
import type { Tour } from '../../types'
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

let errorSpy: ReturnType<typeof vi.spyOn<Console, 'error'>>

beforeEach(() => {
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

function strictWrapper(tours: Tour[], extra?: React.ReactNode) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <React.StrictMode>
        <TourProvider tours={tours}>
          {extra}
          {children}
        </TourProvider>
      </React.StrictMode>
    )
  }
}

describe('autostart is exactly once', () => {
  it('activates the tour once and runs the first step\'s onEnter once', async () => {
    // NOT `tour.onStart`: `runBootStart` dispatches START_TOUR directly rather
    // than through `commitStart`, so an autostarted tour has never fired it.
    // That asymmetry is pre-existing behaviour, pinned elsewhere and out of
    // scope for a swap — `onEnter` is what a restore does run, and therefore
    // what a doubled boot would double.
    const onEnter = vi.fn()
    const tours = [{ ...AUTO, steps: [{ ...AUTO.steps[0], onEnter }, AUTO.steps[1]] } as Tour]
    const { result } = renderHook(() => useTourContext(), { wrapper: strictWrapper(tours) })

    await waitFor(() => expect(result.current.isActive).toBe(true))
    // Let a second boot, if the remount armed one, land before counting.
    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.tourId).toBe('auto')
    expect(result.current.currentStepIndex).toBe(0)
    expect(onEnter).toHaveBeenCalledTimes(1)
  })

  it('fires onStart exactly once for a hand-started tour', async () => {
    // The path that DOES reach `commitStart`. Under StrictMode the child's
    // mount effect runs twice, with the provider's cleanup between them.
    const onStart = vi.fn()
    const { result } = renderHook(() => useTourContext(), {
      wrapper: strictWrapper([{ ...TOUR, onStart }], <StartOnMount tourId="t" />),
    })

    await waitFor(() => expect(result.current.isActive).toBe(true))
    await act(async () => {
      await Promise.resolve()
    })

    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('never logs "registered twice"', async () => {
    // The signature of an engine constructed during render: React 18/19
    // double-invoke the initialiser and discard one result, and the discarded
    // engine has already registered.
    const { result } = renderHook(() => useTourContext(), { wrapper: strictWrapper([AUTO]) })
    await waitFor(() => expect(result.current.isActive).toBe(true))

    expect(registeredTwiceCalls()).toHaveLength(0)
  })

  it('fires onComplete exactly once', async () => {
    const onComplete = vi.fn()
    const { result } = renderHook(() => useTourContext(), {
      wrapper: strictWrapper([{ ...AUTO, onComplete }]),
    })
    await waitFor(() => expect(result.current.isActive).toBe(true))

    await act(async () => {
      result.current.complete()
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
    const { result } = renderHook(() => useTourContext(), {
      wrapper: strictWrapper([TOUR], <StartOnMount tourId="t" />),
    })

    await waitFor(() => expect(result.current.isActive).toBe(true))
    expect(result.current.tourId).toBe('t')
    expect(registeredTwiceCalls()).toHaveLength(0)
  })
})

describe('the registry is left clean', () => {
  it('holds nothing after unmount', async () => {
    const { result, unmount } = renderHook(() => useTourContext(), {
      wrapper: strictWrapper([AUTO]),
    })
    await waitFor(() => expect(result.current.isActive).toBe(true))

    unmount()

    expect(tourRegistry.snapshot().size).toBe(0)
  })

  it('still serves useTourActions to a sibling after the remount', async () => {
    // The sibling is OUTSIDE the provider — the registry is a module-level
    // singleton, which is the point. If the StrictMode remount left the
    // registry pointing at the released engine, `start()` here drives a dead
    // one.
    function Sibling() {
      const actions = useTourActions('t')
      return (
        <button type="button" onClick={actions.start}>
          go
        </button>
      )
    }
    function Tree() {
      return (
        <React.StrictMode>
          <Sibling />
          <TourProvider tours={[TOUR]}>
            <Probe />
          </TourProvider>
        </React.StrictMode>
      )
    }
    let seen: ReturnType<typeof useTourContext> | null = null
    function Probe() {
      seen = useTourContext()
      return null
    }

    const { getByText } = render(<Tree />)
    await waitFor(() => expect(tourRegistry.get('t')).not.toBeNull())

    await act(async () => {
      getByText('go').click()
    })

    await waitFor(() => expect(seen?.isActive).toBe(true))
  })
})

describe('action identity is stable', () => {
  it('is === across a parent re-render AND across the StrictMode remount', async () => {
    // Consumers put these in dependency arrays and the registry entry closes
    // over them. A remount that swapped in a fresh engine would change all
    // thirteen and re-fire every effect that depends on one.
    const seen = React.createRef<unknown[]>() as React.RefObject<unknown[]>
    seen.current = []

    function Tree({ extra }: { extra: number }) {
      return (
        <React.StrictMode>
          <TourProvider tours={[TOUR]}>
            <IdentityProbe seen={seen} />
            <span>{extra}</span>
          </TourProvider>
        </React.StrictMode>
      )
    }

    const { rerender } = render(<Tree extra={1} />)
    await waitFor(() => expect(tourRegistry.get('t')).not.toBeNull())
    const afterMount = seen.current.length

    rerender(<Tree extra={2} />)
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
