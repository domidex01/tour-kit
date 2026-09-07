/**
 * v2 §1.3b-5 — `attachTestBridge`, the provider's `window.__tourKit__` effect
 * as a plain function.
 *
 * `context/__tests__/test-bridge.test.tsx` stays the read-only oracle for the
 * provider's once-per-mount warning guard. What this file pins is the shape
 * `@tour-kit/playwright` and `@tour-kit/testing-library` drive out of process:
 *
 *  - the installed verb is `previous`, while the structural target names it
 *    `prev`. That mapping is easy to lose in a "verbatim move".
 *  - detach `delete`s the property outright, because consumers use
 *    `'__tourKit__' in window` and `= undefined` would leave an own property.
 *  - detach after a foreign reassignment leaves the foreign value alone.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { type TestBridgeTarget, attachTestBridge } from '../../lib/test-bridge'

function makeTarget(extras: Partial<TestBridgeTarget> = {}): TestBridgeTarget & {
  calls: Record<string, unknown[]>
} {
  const calls: Record<string, unknown[]> = {}
  const record =
    (name: string) =>
    (...args: unknown[]) => {
      const bucket = calls[name] ?? []
      bucket.push(args)
      calls[name] = bucket
    }
  return {
    calls,
    start: record('start'),
    next: record('next'),
    prev: record('prev'),
    goToStep: record('goToStep'),
    complete: record('complete'),
    skip: record('skip'),
    ...extras,
  }
}

let warnSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
  Reflect.deleteProperty(window, '__tourKit__')
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('the installed global', () => {
  it('exposes every verb and routes them to the target', () => {
    const target = makeTarget()

    const detach = attachTestBridge(target)

    const bridge = window.__tourKit__
    expect(bridge).toBeDefined()
    bridge?.start('t')
    bridge?.next()
    // `previous` on the bridge maps to `prev` on the target.
    bridge?.previous()
    bridge?.goToStep('s')
    bridge?.complete()
    bridge?.skip()

    expect(target.calls.start).toEqual([['t']])
    expect(target.calls.next).toHaveLength(1)
    expect(target.calls.prev).toHaveLength(1)
    expect(target.calls.goToStep).toEqual([['s']])
    expect(target.calls.complete).toHaveLength(1)
    expect(target.calls.skip).toHaveLength(1)
    detach()
  })

  it('delegates getDiagnostic when the target has one', () => {
    const report = { tourId: 't' } as never
    const detach = attachTestBridge(makeTarget({ getDiagnostic: () => report }))

    expect(window.__tourKit__?.getDiagnostic('t')).toBe(report)
    detach()
  })

  it('returns null from getDiagnostic when the target has none', () => {
    const detach = attachTestBridge(makeTarget())

    expect(window.__tourKit__?.getDiagnostic('t')).toBeNull()
    detach()
  })
})

describe('detach', () => {
  it('removes the property outright, not just its value', () => {
    const detach = attachTestBridge(makeTarget())

    detach()

    // Consumers use `in`. Assigning undefined would leave an own property.
    expect('__tourKit__' in window).toBe(false)
  })

  it('leaves a foreign global alone', () => {
    const detach = attachTestBridge(makeTarget())
    const foreign = { next: () => {} } as never
    window.__tourKit__ = foreign

    detach()

    expect(window.__tourKit__).toBe(foreign)
  })

  it('is idempotent', () => {
    const detach = attachTestBridge(makeTarget())

    expect(() => {
      detach()
      detach()
    }).not.toThrow()
  })
})

describe('the non-production warning', () => {
  it('warns by default', () => {
    const detach = attachTestBridge(makeTarget())

    expect(warnSpy).toHaveBeenCalledWith('[Tour Kit] Test bridge enabled. Disable for production.')
    detach()
  })

  it('is suppressed by warn: false', () => {
    // The once-guard stays in the provider (`testBridgeWarnedRef`); a
    // module-level flag here would leak across tests in test-bridge.test.tsx
    // and make that file order-dependent.
    const detach = attachTestBridge(makeTarget(), { warn: false })

    expect(warnSpy).not.toHaveBeenCalled()
    detach()
  })

  it('still warns when `process` is absent', () => {
    // The provider's condition is `typeof process === 'undefined' ||
    // NODE_ENV !== 'production'` — a browser bundle has no `process`.
    vi.stubGlobal('process', undefined)

    const detach = attachTestBridge(makeTarget())

    expect(warnSpy).toHaveBeenCalled()
    detach()
  })

  it('stays silent in production', () => {
    vi.stubGlobal('process', { env: { NODE_ENV: 'production' } })

    const detach = attachTestBridge(makeTarget())

    expect(warnSpy).not.toHaveBeenCalled()
    detach()
  })
})
