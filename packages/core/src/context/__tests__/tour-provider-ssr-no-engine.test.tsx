// @vitest-environment node
/**
 * v2 §1.4c — a server render constructs nothing.
 *
 * The pragma is file-scoped, so this cannot live inside `ssr-hydration.test.tsx`
 * (which is a jsdom test that calls `renderToString` and then `hydrateRoot`).
 * This is the first node-environment test in the package that mounts the
 * provider, and it imports no `@testing-library/react` by design.
 *
 * The witness is `tourRegistry`, not a module mock: `createTourEngine` calls
 * `syncRegistry(options.tours)` at construction, so an empty registry after
 * `renderToString` IS the proof that nothing was built. That survives
 * minification, mock-hoisting order and any future rename — a `vi.mock` on the
 * factory does not. And spying on `createEngineHandle` would be a false red:
 * the `useState` initialiser DOES run during `renderToString`, building the
 * handle; it is the factory closure inside it that is never invoked.
 */
import { renderToString } from 'react-dom/server'
import { beforeEach, describe, expect, it } from 'vitest'
import { tourRegistry } from '../../registry/tour-registry'
import type { Tour } from '../../types'
import { useTourContext } from '../tour-context'
import { TourProvider } from '../tour-provider'

const TOUR: Tour = {
  id: 't',
  autoStart: true,
  steps: [{ id: 'a', target: '#x', content: 'A' }],
}

function Probe() {
  const { isActive, tourId } = useTourContext()
  return <span>{`${isActive}:${tourId}`}</span>
}

beforeEach(() => {
  tourRegistry.__reset__?.()
})

describe('renderToString(<TourProvider>)', () => {
  it('constructs no engine', () => {
    renderToString(
      <TourProvider tours={[TOUR]}>
        <Probe />
      </TourProvider>
    )

    expect(tourRegistry.get('t')).toBeNull()
    expect(tourRegistry.snapshot().size).toBe(0)
  })

  it('renders the inactive snapshot', () => {
    // The server snapshot is the module constant. No effect ever runs on the
    // server, so this is also the only snapshot the server ever reads.
    const html = renderToString(
      <TourProvider tours={[TOUR]}>
        <Probe />
      </TourProvider>
    )

    expect(html).toContain('false:null')
  })

  it('does not throw with every storage-touching feature configured', () => {
    // Storage, a BroadcastChannel and a route blob are all things a careless
    // constructor would reach for. None exists in Node.
    expect(() =>
      renderToString(
        <TourProvider
          tours={[TOUR]}
          routePersistence={{
            enabled: true,
            storage: 'localStorage',
            key: 'k',
            syncTabs: true,
            flowSession: { storage: 'localStorage' },
            crossTab: { enabled: true },
          }}
        >
          <Probe />
        </TourProvider>
      )
    ).not.toThrow()

    expect(tourRegistry.snapshot().size).toBe(0)
  })
})
