import { act, render, waitFor } from '@testing-library/react'
/**
 * Issue #154 — the react seam, pinned.
 *
 * The filer's report: `onEnter` / `onHide` / `onBeforeShow` / `onBeforeHide`
 * were fixed in core but "still aren't invoked by the TourProvider" imported
 * from `@tour-kit/react`. The root cause was version drift, not wiring:
 * `react@2.0.0` exact-pinned a nested `@tour-kit/core@1.0.7`, so updating core
 * changed nothing for the provider react actually ran. Two things keep that
 * from recurring, and this file guards the second:
 *
 * 1. `TourProvider` is a binding over `createTourEngine()` (v2 §1.4) — one
 *    engine, no second implementation to drift. The core dep is also a caret
 *    range now, so a core hotfix flows into existing react installs.
 * 2. The react-owned provider symbol — the `LicenseGate` shim a consumer gets
 *    from `import { TourProvider } from '@tour-kit/react'` — must fire every
 *    step hook in the engine's order. A regression here is invisible to
 *    core's own provider tests, which exercise core's component directly.
 */
import { type Tour, useTour } from '@tour-kit/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TourProvider } from '../components/provider/licensed-providers'
import { Tour as DeclarativeTour } from '../components/tour/tour'
import { TourStep } from '../components/tour/tour-step'

/**
 * The veto-capable hooks (`onBeforeShow` / `onBeforeHide`) type as
 * `boolean | undefined`, so a bare push-returning arrow is not assignable.
 * Returning `undefined` explicitly means "no opinion", which is the point.
 */
function recorder(order: string[]) {
  const note = (name: string) => () => {
    order.push(name)
    return undefined
  }
  return {
    note,
    on: (id: string) => ({
      onBeforeShow: note(`onBeforeShow:${id}`),
      onEnter: note(`onEnter:${id}`),
      onShow: note(`onShow:${id}`),
      onHide: note(`onHide:${id}`),
      onBeforeHide: note(`onBeforeHide:${id}`),
    }),
  }
}

describe('step lifecycle hooks through @tour-kit/react (#154)', () => {
  it('fires all five hooks in engine order across start, next and stop', async () => {
    const order: string[] = []
    const { on } = recorder(order)
    const hooked: Tour[] = [
      {
        id: 'hooked',
        steps: [
          { id: 's1', target: '#t1', content: 'Step A', ...on('s1') },
          { id: 's2', target: '#t2', content: 'Step B', ...on('s2') },
        ],
      },
    ]

    let api: ReturnType<typeof useTour> | undefined
    function Probe() {
      api = useTour()
      return null
    }

    render(
      <TourProvider tours={hooked}>
        <Probe />
      </TourProvider>
    )
    // No `!` in this file: a throwing accessor satisfies the lint rule and
    // fails louder than a null deref if the probe ever stops mounting.
    const tour = () => {
      if (!api) throw new Error('Probe did not mount')
      return api
    }

    await act(async () => {
      await tour().start('hooked')
    })
    await waitFor(() => expect(order).toEqual(['onBeforeShow:s1', 'onEnter:s1', 'onShow:s1']))
    order.length = 0

    await act(async () => {
      await tour().next()
    })
    await waitFor(() =>
      expect(order).toEqual([
        'onBeforeHide:s1',
        'onBeforeShow:s2',
        'onEnter:s2',
        'onHide:s1',
        'onShow:s2',
      ])
    )
    order.length = 0

    act(() => {
      tour().stop()
    })
    await waitFor(() => expect(order).toEqual(['onHide:s2']))
  })

  it('forwards hook props declared on <TourStep> into the running steps', async () => {
    document.body.innerHTML = '<div id="t1">one</div><div id="t2">two</div>'
    const mockRect: DOMRect = {
      top: 100,
      left: 100,
      bottom: 150,
      right: 200,
      width: 100,
      height: 50,
      x: 100,
      y: 100,
      toJSON: () => ({}),
    }
    for (const el of document.querySelectorAll('#t1, #t2')) {
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(mockRect)
    }

    const order: string[] = []
    const { on, note } = recorder(order)
    render(
      <DeclarativeTour id="declared" autoStart onStart={note('onStart')}>
        <TourStep
          id="d1"
          target="#t1"
          content="A"
          onBeforeShow={on('d1').onBeforeShow}
          onEnter={on('d1').onEnter}
        />
        <TourStep id="d2" target="#t2" content="B" />
      </DeclarativeTour>
    )

    // `onStart` rides along: #154 found autoStart firing none of the
    // tour-level callbacks, which starved `<Tour>`'s analytics wrapper.
    await waitFor(() => expect(order).toEqual(['onBeforeShow:d1', 'onEnter:d1', 'onStart']))
  })

  beforeEach(() => {
    vi.restoreAllMocks()
  })
})
