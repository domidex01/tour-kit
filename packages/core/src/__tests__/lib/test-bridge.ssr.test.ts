// @vitest-environment node
/**
 * v2 §1.3b-5 — `attachTestBridge` on the server. The provider's effect body is
 * where this is called, and an effect setup path must not throw during a
 * server render. The pragma is file-scoped, hence the separate file.
 */
import { describe, expect, it } from 'vitest'
import { attachTestBridge } from '../../lib/test-bridge'

describe('attachTestBridge with no window', () => {
  it('installs nothing and returns a callable detach', () => {
    expect(typeof window).toBe('undefined')

    const detach = attachTestBridge({
      start: () => {},
      next: () => {},
      prev: () => {},
      goToStep: () => {},
      complete: () => {},
      skip: () => {},
    })

    expect(typeof detach).toBe('function')
    expect(() => detach()).not.toThrow()
  })
})
