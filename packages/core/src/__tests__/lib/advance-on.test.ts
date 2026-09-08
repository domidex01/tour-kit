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
import { type TourEngine, createTourEngine } from '../../lib/tour-engine/create-tour-engine'
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

/**
 * Resolve on the first notify that satisfies `pred`, WITHOUT yielding a macrotask.
 *
 * `vi.waitFor` polls on a real interval, so awaiting it runs the macrotask queue
 * and fires the very `setTimeout(bind, 0)` these cases exist to observe (measured:
 * 2 polls, timer fired). The engine calls its listeners synchronously inside
 * `notify()`, and a click-advance settles in microtasks (measured: the target step
 * lands between the 3rd and 7th drain), so this resolves in the same microtask
 * checkpoint the transition completes in.
 */
function settled(engine: TourEngine, pred: () => boolean): Promise<void> {
  return new Promise((resolve) => {
    if (pred()) return resolve()
    const off = engine.subscribe(() => {
      if (pred()) {
        off()
        resolve()
      }
    })
  })
}

/** One macrotask — the deferred bind's own clock. Real timers only. */
const tick = () => new Promise((resolve) => setTimeout(resolve, 0))

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

  function engineWithThreeTargets() {
    const a = target('a')
    const b = target('b')
    const c = target('c')
    const engine = createTourEngine({
      storage: createMemoryStorage(),
      tours: [
        {
          id: 't3',
          steps: [
            { id: 'a', target: '#a', content: 'a', advanceOn: { event: 'click', selector: '#a' } },
            { id: 'b', target: '#b', content: 'b', advanceOn: { event: 'click', selector: '#b' } },
            { id: 'c', target: '#c', content: 'c', advanceOn: { event: 'click', selector: '#c' } },
          ],
        },
      ],
    })
    return { engine, a, b, c }
  }

  it('detaches the outgoing listener synchronously and binds the incoming one a macrotask later', async () => {
    const { engine, a, b } = engineWithTwoTargets()
    const detach = attachAdvanceOn(engine)

    await engine.start('t')
    // The FIRST bind is deferred too — one code path, no special case at attach.
    // Without this the click below lands on nothing and the test times out.
    await tick()

    a.click()
    // NOT vi.waitFor: it polls on a real interval, so awaiting it would run the
    // very macrotask the deferred bind is queued on and destroy both assertions
    // below.
    await settled(engine, () => engine.getState().currentStep?.id === 'b')

    // Half 1 — eager detach. The click that caused the transition can no longer
    // reach step a's listener. (Already true before the fix; asserted so a
    // regression shows.)
    a.click()
    expect(engine.getState().currentStep?.id).toBe('b')

    // Half 2 — late bind. Against the unfixed file, step b's listener was
    // attached synchronously inside notify(), so this click advances again and,
    // b being the last step, completes the tour: `currentStep` is undefined.
    b.click()
    expect(engine.getState().currentStep?.id).toBe('b')

    // One macrotask on, the incoming listener is live.
    await tick()
    b.click()
    await settled(engine, () => engine.getState().isActive === false)
    expect(engine.getState().isActive).toBe(false)

    detach()
    engine.destroy()
  })

  it('a detach before the deferred bind fires leaves no timer and no listener', async () => {
    // Fake timers for the whole case: vi.getTimerCount() throws with real ones,
    // and `tick()` would never resolve, so the macrotask is advanced explicitly.
    vi.useFakeTimers()
    const { engine, b } = engineWithTwoTargets()

    await engine.start('t')
    const detach = attachAdvanceOn(engine)

    // The "1 before" half stops this going vacuously green if `bind` is never
    // scheduled at all.
    expect(vi.getTimerCount()).toBe(1)
    detach()
    expect(vi.getTimerCount()).toBe(0)

    await vi.advanceTimersByTimeAsync(1)
    b.click()
    expect(engine.getState().currentStep?.id).toBe('a')

    engine.destroy()
    vi.useRealTimers()
  })

  it('two transitions inside one macrotask bind only the last step', async () => {
    const { engine, a, b, c } = engineWithThreeTargets()
    const detach = attachAdvanceOn(engine)

    await engine.start('t3')
    await tick()
    await engine.next()
    await engine.goTo(2) // both land before any tick
    await tick()

    a.click()
    b.click()
    expect(engine.getState().currentStep?.id).toBe('c') // neither stale listener survived

    c.click()
    await settled(engine, () => engine.getState().isActive === false)
    expect(engine.getState().isActive).toBe(false)

    detach()
    engine.destroy()
  })

  it('rebinds as the current step changes', async () => {
    // No fake engine: Decision 1's claim is that the REAL TourEngine satisfies
    // Pick<TourEngine, 'subscribe' | 'getState' | 'next'> structurally.
    const { engine, a, b } = engineWithTwoTargets()
    const detach = attachAdvanceOn(engine)
    await engine.start('t')
    // The first bind is deferred by one macrotask now, so the click below needs
    // it to have fired. `vi.waitFor` below already runs the macrotask queue, so
    // step b's listener is live when it resolves — no second wait needed.
    await tick()

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
