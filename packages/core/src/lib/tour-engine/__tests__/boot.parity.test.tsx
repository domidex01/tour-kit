/**
 * v2 §1.3c — boot parity: the mounted provider is the oracle.
 *
 * This file must be GREEN before any of the three boot effects
 * (`tour-provider.tsx:524`, `:620`, `:642`) is touched. It stages each row of
 * the truth table into real jsdom storage, mounts the *current* `<TourProvider>`
 * and asserts the settled tour matches what `resolveBootStart` claims the rule
 * is. A disagreeing row is the React-timing coupling the handoff warned about,
 * and is a finding to report — not a row to edit.
 *
 * It is allowed to be slower and uglier than `boot.test.ts`. Its only job is to
 * make a row-by-row disagreement impossible to miss.
 */
import { render, waitFor } from '@testing-library/react'
import type * as React from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { useTourContext } from '../../../context/tour-context'
import { TourProvider } from '../../../context/tour-provider'
import type { Tour } from '../../../types'
import { type AutoKind, BOOT_ROWS, type FlowKind, toursForRow } from './_helpers/boot-rows'
import { stageFlow, stageRoute } from './_helpers/stage-storage'

let seen: { tourId: string | null; currentStepIndex: number; isActive: boolean } = {
  tourId: null,
  currentStepIndex: 0,
  isActive: false,
}

function Probe() {
  const ctx = useTourContext()
  seen = {
    tourId: ctx.tourId,
    currentStepIndex: ctx.currentStepIndex,
    isActive: ctx.isActive,
  }
  return null
}

function Mounted({ tours }: { tours: Tour[] }): React.ReactElement {
  return (
    <TourProvider
      tours={tours}
      routePersistence={{
        enabled: true,
        storage: 'localStorage',
        flowSession: { storage: 'sessionStorage' },
      }}
    >
      <Probe />
    </TourProvider>
  )
}

/** Write the row's premises into the same keys the provider reads. */
function stageRow(flow: FlowKind, route: boolean, auto: AutoKind) {
  if (flow !== 'none') {
    stageFlow(
      sessionStorage,
      { tourId: flow === 'unknown' ? 'ghost' : 'f', stepIndex: 1 },
      { stale: flow === 'stale' }
    )
  }
  if (route) stageRoute(localStorage, 'r')
  // `persistTerminalTours` defaults to true, so the provider reads this key
  // through usePersistence even with no <TourKitProvider> above it.
  if (auto === 'completed') localStorage.setItem('tourkit:completed', JSON.stringify(['auto']))
}

describe('boot parity — the mounted provider agrees with the truth table', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    seen = { tourId: null, currentStepIndex: 0, isActive: false }
  })

  it.each(BOOT_ROWS)(
    'row %i: flow=%s route=%s auto=%s',
    async (_n, flow, route, auto, expected, extra) => {
      stageRow(flow, route, auto)
      render(<Mounted tours={toursForRow(auto, extra)} />)

      if (expected === null) {
        // A negative is only meaningful once the async restore chain has had a
        // chance to run — settle the effects, then assert nothing started.
        await waitFor(() => expect(seen.isActive).toBe(false))
        expect(seen.tourId).toBeNull()
        return
      }

      await waitFor(() => expect(seen.tourId).toBe(expected.tourId))
      expect(seen.isActive).toBe(true)
    }
  )

  it('row 5 restores at the flow blob stepIndex, not at step 0', async () => {
    stageRow('fresh', false, 'none')
    render(<Mounted tours={toursForRow('none')} />)

    await waitFor(() => expect(seen.tourId).toBe('f'))
    expect(seen.currentStepIndex).toBe(1)
  })

  it('row 12 does not latch — a later tours change still starts the flow tour', async () => {
    // The declarative `<Tour>` path mounts children AFTER the parent's first
    // effect tick, so the provider must retry rather than latch on an empty
    // list. This is the caller rule the pure resolver deliberately omits.
    stageRow('fresh', true, 'present')
    const { rerender } = render(<Mounted tours={[]} />)

    await waitFor(() => expect(seen.isActive).toBe(false))

    rerender(<Mounted tours={toursForRow('present')} />)
    await waitFor(() => expect(seen.tourId).toBe('f'))
  })

  it('row 13 keeps route restore and autostart suppressed, not merely deferred', async () => {
    // Pinning current behaviour: an unregistered flow tour blocks everything.
    // If this ever starts 'r' or 'auto', that is the §1.4 fix landing — update
    // the row deliberately, do not let it drift.
    stageRow('unknown', true, 'present')
    render(<Mounted tours={toursForRow('present')} />)

    await waitFor(() => expect(seen.isActive).toBe(false))
    await new Promise((r) => setTimeout(r, 20))
    expect(seen.tourId).toBeNull()
  })
})
