/**
 * v2 §1.4c — props that change identity after mount must reach the engine.
 *
 * Adapter A rebuilt its engine context every render, so `router`, the consumer
 * callbacks and the analytics fan-out were always the latest props — never
 * pinned by a test, because nothing could break it. Adapter B captures options
 * at construction, so the binding has to push them, and this file is the only
 * thing standing between that and a tour navigating through a dead router
 * after the first route change.
 *
 * Not hypothetical: every built-in adapter is a `useMemo` over the host
 * router's hook results (`createReactRouterAdapter`'s `navigate` depends on
 * `useNavigate()`, which React Router re-creates on every location change),
 * and `TourKitProvider`'s value re-memoises whenever a consumer passes an
 * inline `onTourStart={…}`.
 *
 * Every `rerender` below builds a FRESH object literal. A memoised prop would
 * prove nothing.
 */
import { act, render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { tourRegistry } from '../../registry/tour-registry'
import type { RouterAdapter, Tour, TourContextValue } from '../../types'
import { useTourContext } from '../tour-context'
import { TourProvider } from '../tour-provider'
import { TourKitProvider } from '../tourkit-provider'

const ROUTED: Tour = {
  id: 't',
  steps: [
    { id: 'a', target: '#x', content: 'A' },
    { id: 'b', target: '#x', content: 'B', route: '/b' },
  ],
}

const PLAIN: Tour = {
  id: 't',
  steps: [
    { id: 'a', target: '#x', content: 'A' },
    { id: 'b', target: '#x', content: 'B' },
  ],
}

function makeRouter(current: string): RouterAdapter & { navigate: ReturnType<typeof vi.fn> } {
  return {
    getCurrentRoute: () => current,
    navigate: vi.fn(() => undefined),
    matchRoute: (pattern: string) => pattern === current,
    onRouteChange: () => () => {},
  }
}

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
  // A `route` step always awaits its target after the hop.
  document.body.innerHTML = '<div id="x"></div>'
})

describe('the router', () => {
  it('the cross-route hop goes through the router passed on the LAST render', async () => {
    const router1 = makeRouter('/a')
    const router2 = makeRouter('/a')
    const Tree = ({ router }: { router: RouterAdapter }) => (
      <TourProvider tours={[ROUTED]} router={router}>
        <Probe />
      </TourProvider>
    )

    const { rerender } = render(<Tree router={router1} />)
    await act(async () => {
      ctx?.start('t')
    })
    await waitFor(() => expect(ctx?.isActive).toBe(true))

    rerender(<Tree router={router2} />)
    await act(async () => {
      ctx?.next()
    })

    await waitFor(() => expect(router2.navigate).toHaveBeenCalledWith('/b'))
    expect(router1.navigate).not.toHaveBeenCalled()
  })
})

describe('consumer callbacks', () => {
  it('calls the onNavigationRequired passed on the LAST render', async () => {
    const first = vi.fn()
    const second = vi.fn()
    const router = makeRouter('/a')
    const Tree = ({ cb }: { cb: (route: string, stepId: string) => void }) => (
      <TourProvider
        tours={[ROUTED]}
        router={router}
        autoNavigate={false}
        // A fresh inline closure per render is the realistic shape.
        onNavigationRequired={(route, stepId) => cb(route, stepId)}
      >
        <Probe />
      </TourProvider>
    )

    const { rerender } = render(<Tree cb={first} />)
    await act(async () => {
      ctx?.start('t')
    })
    await waitFor(() => expect(ctx?.isActive).toBe(true))

    rerender(<Tree cb={second} />)
    await act(async () => {
      ctx?.next()
    })

    await waitFor(() => expect(second).toHaveBeenCalledWith('/b', 'b'))
    expect(first).not.toHaveBeenCalled()
    expect(router.navigate).not.toHaveBeenCalled()
  })
})

describe('the analytics fan-out', () => {
  it('fires the onStepView from the LAST TourKitProvider value', async () => {
    const first = vi.fn()
    const second = vi.fn()
    const Tree = ({ spy }: { spy: (t: string, s: string, i: number) => void }) => (
      // An inline callback means a new context value object every render,
      // which is exactly why the six live fields cannot be frozen at
      // construction.
      <TourKitProvider onStepView={(t, s, i) => spy(t, s, i)}>
        <TourProvider tours={[PLAIN]}>
          <Probe />
        </TourProvider>
      </TourKitProvider>
    )

    const { rerender } = render(<Tree spy={first} />)
    await act(async () => {
      ctx?.start('t')
    })
    await waitFor(() => expect(ctx?.isActive).toBe(true))
    first.mockClear()

    rerender(<Tree spy={second} />)
    await act(async () => {
      ctx?.next()
    })

    await waitFor(() => expect(second).toHaveBeenCalledWith('t', 'b', 1))
    expect(first).not.toHaveBeenCalled()
  })
})
