/**
 * v2 §1.3b-4 — `bindStepAdvance` / `attachAdvanceOn`, the body of
 * `use-advance-on.ts` as plain functions.
 *
 * The 15 oracle cases in `__tests__/hooks/use-advance-on.test.tsx` never touch
 * the 100 ms debounce — the hook's only timing behaviour has been shipping
 * untested. Two cases here are therefore first coverage, not a port:
 *
 *  - the debounce window itself, and
 *  - that a FALSY handler does not consume it. `use-advance-on.ts:58` returns
 *    before `isAdvancing = true`; hoisting the flag above the handler call
 *    would pass every oracle case and every naive debounce test while
 *    swallowing the first real advance after a rejection.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { attachAdvanceOn, bindStepAdvance, dispatchAdvanceEvent } from '../../lib/advance-on'
import { createTourEngine } from '../../lib/tour-engine/create-tour-engine'
import type { TourStep, VisibleTourStep } from '../../types/step'
import { logger } from '../../utils/logger'
import { createMemoryStorage } from '../../utils/storage'

const step = (extras: Partial<VisibleTourStep> = {}): TourStep =>
  ({ id: 's', target: '#target', content: 'hi', ...extras }) as TourStep

function target(id = 'target'): HTMLButtonElement {
  const el = document.createElement('button')
  el.type = 'button'
  el.id = id
  document.body.appendChild(el)
  return el
}

afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
  vi.useRealTimers()
})

describe('bindStepAdvance', () => {
  it('advances on a click on the resolved target', () => {
    const el = target()
    const next = vi.fn()
    const cleanup = bindStepAdvance(
      step({ advanceOn: { event: 'click', selector: '#target' } }),
      next
    )

    el.click()

    expect(next).toHaveBeenCalledTimes(1)
    cleanup()
  })

  it('returns a no-op cleanup for a step with no advanceOn', () => {
    const next = vi.fn()

    const cleanup = bindStepAdvance(step(), next)

    expect(() => cleanup()).not.toThrow()
    expect(next).not.toHaveBeenCalled()
  })

  it('removes the listener on cleanup', () => {
    const el = target()
    const next = vi.fn()
    const cleanup = bindStepAdvance(
      step({ advanceOn: { event: 'click', selector: '#target' } }),
      next
    )

    cleanup()
    el.click()

    expect(next).not.toHaveBeenCalled()
  })

  it('warns and falls back to document when the selector resolves nothing', () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    const next = vi.fn()
    const cleanup = bindStepAdvance(
      step({ advanceOn: { event: 'click', selector: '#nope' } }),
      next
    )

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('#nope'))

    document.dispatchEvent(new Event('click'))
    expect(next).toHaveBeenCalledTimes(1)
    cleanup()
  })

  it('binds tourkit:advance for the custom event, which dispatchAdvanceEvent fires', () => {
    const el = target()
    const next = vi.fn()
    const cleanup = bindStepAdvance(
      step({ advanceOn: { event: 'custom', selector: '#target' } }),
      next
    )

    dispatchAdvanceEvent('#target')

    expect(next).toHaveBeenCalledTimes(1)
    expect(el.isConnected).toBe(true)
    cleanup()
  })

  it('dispatchAdvanceEvent with no selector targets document', () => {
    const next = vi.fn()
    const cleanup = bindStepAdvance(step({ advanceOn: { event: 'custom' } }), next)

    dispatchAdvanceEvent()

    expect(next).toHaveBeenCalledTimes(1)
    cleanup()
  })

  it('passes an unmapped event name straight through', () => {
    const el = target()
    const next = vi.fn()
    const cleanup = bindStepAdvance(
      // `event` is a string-literal union today; a wider authored value must
      // still reach addEventListener unchanged rather than silently binding
      // nothing.
      step({ advanceOn: { event: 'input', selector: '#target' } }),
      next
    )

    el.dispatchEvent(new Event('input'))

    expect(next).toHaveBeenCalledTimes(1)
    cleanup()
  })
})

describe('the handler contract', () => {
  it('does not advance when the handler returns falsy', () => {
    const el = target()
    const next = vi.fn()
    const cleanup = bindStepAdvance(
      step({ advanceOn: { event: 'click', selector: '#target', handler: () => false } }),
      next
    )

    el.click()

    expect(next).not.toHaveBeenCalled()
    cleanup()
  })

  it('warns and does not advance when the handler throws', () => {
    const warn = vi.spyOn(logger, 'warn').mockImplementation(() => {})
    const el = target()
    const next = vi.fn()
    const cleanup = bindStepAdvance(
      step({
        advanceOn: {
          event: 'click',
          selector: '#target',
          handler: () => {
            throw new Error('boom')
          },
        },
      }),
      next
    )

    el.click()

    expect(next).not.toHaveBeenCalled()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('handler error'), expect.any(Error))
    cleanup()
  })
})

describe('the 100 ms debounce — no oracle case covers this', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('collapses two rapid clicks into one advance, then re-arms', () => {
    const el = target()
    const next = vi.fn()
    const cleanup = bindStepAdvance(
      step({ advanceOn: { event: 'click', selector: '#target' } }),
      next
    )

    el.click()
    el.click()
    expect(next).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(100)
    el.click()

    expect(next).toHaveBeenCalledTimes(2)
    cleanup()
  })

  it('a falsy handler does not consume the window', () => {
    // The guard against hoisting `isAdvancing = true` above the handler call:
    // a rejected click must leave the very next accepted one free to advance.
    const el = target()
    const next = vi.fn()
    let accept = false
    const cleanup = bindStepAdvance(
      step({ advanceOn: { event: 'click', selector: '#target', handler: () => accept } }),
      next
    )

    el.click()
    expect(next).not.toHaveBeenCalled()

    accept = true
    el.click()

    expect(next).toHaveBeenCalledTimes(1)
    cleanup()
  })

  it('cleanup clears the pending timeout', () => {
    // DELIBERATE DIVERGENCE from the hook, not pinned legacy behaviour.
    // `use-advance-on.ts:85-87` removes only the listener and lets the 100 ms
    // timer fire on a dead closure. `bindStepAdvance` clears it.
    const el = target()
    const next = vi.fn()
    const cleanup = bindStepAdvance(
      step({ advanceOn: { event: 'click', selector: '#target' } }),
      next
    )

    el.click()
    cleanup()

    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('attachAdvanceOn — the engine-level watcher', () => {
  function engineWithTwoTargets() {
    const a = target('a')
    const b = target('b')
    const engine = createTourEngine({
      storage: createMemoryStorage(),
      tours: [
        {
          id: 't',
          steps: [
            { id: 'a', target: '#a', content: 'a', advanceOn: { event: 'click', selector: '#a' } },
            { id: 'b', target: '#b', content: 'b', advanceOn: { event: 'click', selector: '#b' } },
          ],
        },
      ],
    })
    return { engine, a, b }
  }

  it('rebinds as the current step changes', async () => {
    // No fake engine: Decision 1's claim is that the REAL TourEngine satisfies
    // Pick<TourEngine, 'subscribe' | 'getState' | 'next'> structurally.
    const { engine, a, b } = engineWithTwoTargets()
    const detach = attachAdvanceOn(engine)
    await engine.start('t')

    a.click()
    await vi.waitFor(() => expect(engine.getState().currentStep?.id).toBe('b'))

    // Step a's binding is gone; only b's target advances now.
    a.click()
    expect(engine.getState().currentStep?.id).toBe('b')

    b.click()
    await vi.waitFor(() => expect(engine.getState().isActive).toBe(false))

    detach()
    engine.destroy()
  })

  it('stops advancing after detach', async () => {
    const { engine, a } = engineWithTwoTargets()
    const detach = attachAdvanceOn(engine)
    await engine.start('t')

    detach()
    a.click()

    expect(engine.getState().currentStep?.id).toBe('a')
    engine.destroy()
  })

  it('detach is idempotent', () => {
    const { engine } = engineWithTwoTargets()
    const detach = attachAdvanceOn(engine)

    expect(() => {
      detach()
      detach()
    }).not.toThrow()
    engine.destroy()
  })
})
