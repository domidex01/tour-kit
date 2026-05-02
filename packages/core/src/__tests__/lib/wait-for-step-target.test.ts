import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TourRouteError, waitForStepTarget } from '../../lib/wait-for-step-target'
import type { TourStep } from '../../types/step'

// Minimal cast — the wrapper only reads `id` and `target`.
const makeStep = (target: TourStep['target'], id = 's'): TourStep =>
  ({ id, target, content: '' }) as TourStep

describe('waitForStepTarget', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    if (vi.isFakeTimers?.()) {
      vi.clearAllTimers()
      vi.useRealTimers()
    }
  })

  it('resolves with the element when the target appears within timeout (US-1 happy path)', async () => {
    vi.useFakeTimers()
    const promise = waitForStepTarget(makeStep('#late'), {
      route: '/billing',
      timeoutMs: 3000,
    })

    setTimeout(() => {
      const el = document.createElement('div')
      el.id = 'late'
      document.body.appendChild(el)
    }, 100)

    await vi.advanceTimersByTimeAsync(150)
    const result = await promise
    expect(result).toBeInstanceOf(HTMLElement)
    expect(result.id).toBe('late')
  })

  it('rejects with TourRouteError({code: TARGET_NOT_FOUND}) on timeout (US-2)', async () => {
    vi.useFakeTimers()
    const promise = waitForStepTarget(makeStep('#never'), {
      route: '/billing',
      timeoutMs: 3000,
    })

    // Capture rejection upfront so the timer-advance doesn't race with the
    // unhandled-rejection sweep.
    const settled = promise.catch((e: unknown) => e)
    await vi.advanceTimersByTimeAsync(3001)
    const caught = await settled

    expect(caught).toBeInstanceOf(TourRouteError)
    const err = caught as TourRouteError
    expect(err.code).toBe('TARGET_NOT_FOUND')
    expect(err.route).toBe('/billing')
    expect(err.selector).toBe('#never')
    expect(err.message).toContain('not found on route "/billing"')
  })

  it('rejects with plain Error("aborted") when signal aborts mid-wait (US-5)', async () => {
    const controller = new AbortController()
    const promise = waitForStepTarget(makeStep('#never'), {
      route: '/billing',
      timeoutMs: 3000,
      signal: controller.signal,
    })
    const settled = promise.catch((e: unknown) => e)
    controller.abort()
    const caught = await settled

    expect(caught).toBeInstanceOf(Error)
    expect((caught as Error).message).toBe('aborted')
    // Critical: distinct semantics from TARGET_NOT_FOUND.
    expect(caught).not.toBeInstanceOf(TourRouteError)
  })

  it('resolves immediately when target is a populated RefObject', async () => {
    const el = document.createElement('div')
    el.id = 'preset'
    document.body.appendChild(el)
    const ref = { current: el } as unknown as TourStep['target']

    const result = await waitForStepTarget(makeStep(ref), {
      route: '/billing',
      timeoutMs: 3000,
    })
    expect(result).toBe(el)
  })

  it('rejects with TourRouteError when target is an unpopulated RefObject', async () => {
    const ref = { current: null } as unknown as TourStep['target']

    const settled = waitForStepTarget(makeStep(ref, 'ref-step'), {
      route: '/billing',
      timeoutMs: 3000,
    }).catch((e: unknown) => e)
    const caught = await settled

    expect(caught).toBeInstanceOf(TourRouteError)
    const err = caught as TourRouteError
    expect(err.code).toBe('TARGET_NOT_FOUND')
    expect(err.route).toBe('/billing')
    expect(err.selector).toBeUndefined()
    expect(err.message).toContain('Step "ref-step"')
  })
})
