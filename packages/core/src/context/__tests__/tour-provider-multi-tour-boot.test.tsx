/**
 * v2 §1.4c — a tour registered after the parent's first effect still starts.
 *
 * This is Decision 4 row 2 seen through React, and the only core-level pin of
 * the declarative registration path. `@tour-kit/react`'s `tour.test.tsx`
 * renders `<Tour>` standalone, which creates its own provider with the tour
 * already in `tours`; only `multi-tour-kit-compose.test.tsx` exercises
 * children registering after the parent has already booted, and that lives in
 * another package.
 *
 * The provider has always returned from its boot effect WITHOUT latching on an
 * empty `tours` list and retried on the next change. The engine used to latch
 * `ready` in its `finally`, so the late tour never autostarted.
 */
import { act, render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { tourRegistry } from '../../registry/tour-registry'
import type { Tour, TourContextValue } from '../../types'
import { useTourContext } from '../tour-context'
import { TourProvider } from '../tour-provider'

const AUTO: Tour = {
  id: 'auto',
  autoStart: true,
  steps: [
    { id: 'a', target: '#x', content: 'A' },
    { id: 'b', target: '#x', content: 'B' },
  ],
}

const MANUAL: Tour = { ...AUTO, id: 'manual', autoStart: false }

let ctx: TourContextValue | null = null
function Probe() {
  ctx = useTourContext()
  return null
}

const Tree = ({ tours }: { tours: Tour[] }) => (
  <TourProvider tours={tours}>
    <Probe />
  </TourProvider>
)

beforeEach(() => {
  ctx = null
  tourRegistry.__reset__?.()
  window.localStorage.clear()
  window.sessionStorage.clear()
  document.body.innerHTML = '<div id="x"></div>'
})

describe('tours that arrive after the first boot', () => {
  it('autostarts a tour supplied by a later render', async () => {
    const { rerender } = render(<Tree tours={[]} />)
    await waitFor(() => expect(ctx).not.toBeNull())
    expect(ctx?.isActive).toBe(false)

    await act(async () => {
      rerender(<Tree tours={[AUTO]} />)
    })

    await waitFor(() => expect(ctx?.isActive).toBe(true))
    expect(ctx?.tourId).toBe('auto')
  })

  it('autostarts when the tour was there all along — the control', async () => {
    render(<Tree tours={[AUTO]} />)

    await waitFor(() => expect(ctx?.isActive).toBe(true))
    expect(ctx?.tourId).toBe('auto')
  })

  it('leaves a late non-autostart tour alone', async () => {
    // The re-arm must be a deferred boot, not "start whatever shows up".
    const { rerender } = render(<Tree tours={[]} />)
    await waitFor(() => expect(ctx).not.toBeNull())

    await act(async () => {
      rerender(<Tree tours={[MANUAL]} />)
    })
    await waitFor(() => expect(tourRegistry.get('manual')).not.toBeNull())

    expect(ctx?.isActive).toBe(false)
  })
})
