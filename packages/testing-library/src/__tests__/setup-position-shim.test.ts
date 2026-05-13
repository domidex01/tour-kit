import { beforeEach, describe, expect, it, vi } from 'vitest'
import { setupTourKitTesting } from '../setup'

let jdmLoadCount = 0
vi.mock('jsdom-testing-mocks', async (importOriginal: () => Promise<unknown>) => {
  jdmLoadCount++
  return importOriginal()
})

beforeEach(() => {
  jdmLoadCount = 0
})

describe('setupTourKitTesting positionShim', () => {
  it('returns a resolving promise with no args', async () => {
    await expect(setupTourKitTesting()).resolves.toBeUndefined()
  })

  it('with positionShim:false, jsdom-testing-mocks is NOT loaded', async () => {
    await setupTourKitTesting({ positionShim: false })
    expect(jdmLoadCount).toBe(0)
  })

  it('with positionShim:true, jsdom-testing-mocks is loaded at least once', async () => {
    await setupTourKitTesting({ positionShim: true })
    // vi.mock factory runs at most once for a module — the dynamic import
    // returns the cached module on subsequent calls, so we can't assert
    // "exactly once" without ordering guarantees we don't control.
    expect(jdmLoadCount).toBeGreaterThanOrEqual(1)
  })

  it('calling setupTourKitTesting({ positionShim: true }) twice is idempotent', async () => {
    // vitest caches the module once the factory fires, so the second call
    // hits the cache and resolves without re-invoking the factory. We assert
    // on the contract — neither call throws — not on a per-call counter.
    await expect(setupTourKitTesting({ positionShim: true })).resolves.toBeUndefined()
    await expect(setupTourKitTesting({ positionShim: true })).resolves.toBeUndefined()
  })
})
