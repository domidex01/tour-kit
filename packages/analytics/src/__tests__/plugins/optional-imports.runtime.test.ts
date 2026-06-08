import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TourEvent } from '../../types/events'

/**
 * Runtime half of the optional-peer contract (the build half lives in
 * `../build/optional-imports.*`). The `/* webpackIgnore *​/` fix moves
 * resolution from build time to runtime, so the runtime guard must hold:
 *
 *  1. The optional SDK is only touched once the plugin's `init()` runs —
 *     `track`/`identify`/`destroy` before `init()` never reach the SDK and
 *     never throw (so an unconfigured/never-initialised plugin is inert).
 *  2. When the peer is genuinely absent, the dynamic `import()` rejects and the
 *     plugin degrades gracefully: `init()` resolves, later calls are no-ops,
 *     and a single warning is logged — the host app must not crash.
 *
 * Case (2) was previously only covered for amplitude
 * (`amplitude-externalization.test.ts`); this adds posthog + mixpanel.
 */

function mockTourEvent(overrides: Partial<TourEvent> = {}): TourEvent {
  return {
    eventName: 'tour_started',
    timestamp: 1_700_000_000_000,
    sessionId: 'session-1',
    tourId: 'demo',
    ...overrides,
  }
}

describe('optional analytics plugins — runtime optionality', () => {
  let warn: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warn.mockRestore()
    vi.resetModules()
  })

  describe('inert before init() — no SDK contact, no throw', () => {
    it('posthog: track/identify/destroy before init() do nothing and do not throw', async () => {
      const sdk = { init: vi.fn(), capture: vi.fn(), identify: vi.fn(), reset: vi.fn() }
      vi.doMock('posthog-js', () => ({ default: sdk }))
      const { posthogPlugin } = await import('../../plugins/posthog')

      const plugin = posthogPlugin({ apiKey: 'phc_x' })
      expect(() => plugin.track?.(mockTourEvent())).not.toThrow()
      expect(() => plugin.identify?.('u1')).not.toThrow()
      expect(() => plugin.destroy?.()).not.toThrow()

      expect(sdk.init).not.toHaveBeenCalled()
      expect(sdk.capture).not.toHaveBeenCalled()
      expect(sdk.identify).not.toHaveBeenCalled()
      expect(sdk.reset).not.toHaveBeenCalled()
      vi.doUnmock('posthog-js')
    })

    it('mixpanel: track/identify before init() do nothing and do not throw', async () => {
      const sdk = {
        init: vi.fn(),
        track: vi.fn(),
        identify: vi.fn(),
        people: { set: vi.fn() },
        reset: vi.fn(),
      }
      vi.doMock('mixpanel-browser', () => ({ default: sdk }))
      const { mixpanelPlugin } = await import('../../plugins/mixpanel')

      const plugin = mixpanelPlugin({ token: 't' })
      expect(() => plugin.track?.(mockTourEvent())).not.toThrow()
      expect(() => plugin.identify?.('u1')).not.toThrow()

      expect(sdk.init).not.toHaveBeenCalled()
      expect(sdk.track).not.toHaveBeenCalled()
      expect(sdk.identify).not.toHaveBeenCalled()
      vi.doUnmock('mixpanel-browser')
    })

    it('amplitude: track before init() does nothing and does not throw', async () => {
      const sdk = {
        init: vi.fn(),
        track: vi.fn(),
        setUserId: vi.fn(),
        Identify: vi.fn(),
        identify: vi.fn(),
        flush: vi.fn(),
      }
      vi.doMock('@amplitude/analytics-browser', () => sdk)
      const { amplitudePlugin } = await import('../../plugins/amplitude')

      const plugin = amplitudePlugin({ apiKey: 'k' })
      expect(() => plugin.track?.(mockTourEvent())).not.toThrow()

      expect(sdk.init).not.toHaveBeenCalled()
      expect(sdk.track).not.toHaveBeenCalled()
      vi.doUnmock('@amplitude/analytics-browser')
    })
  })

  describe('peer absent — graceful degradation (import rejects)', () => {
    it('posthog: init resolves, track is a no-op, a warning is logged', async () => {
      vi.doMock('posthog-js', () => {
        throw new Error("Cannot find module 'posthog-js'")
      })
      const { posthogPlugin } = await import('../../plugins/posthog')
      const plugin = posthogPlugin({ apiKey: 'phc_x' })

      await expect(plugin.init?.()).resolves.toBeUndefined()
      expect(() => plugin.track?.(mockTourEvent())).not.toThrow()
      expect(warn).toHaveBeenCalled()
      vi.doUnmock('posthog-js')
    })

    it('mixpanel: init resolves, track is a no-op, a warning is logged', async () => {
      vi.doMock('mixpanel-browser', () => {
        throw new Error("Cannot find module 'mixpanel-browser'")
      })
      const { mixpanelPlugin } = await import('../../plugins/mixpanel')
      const plugin = mixpanelPlugin({ token: 't' })

      await expect(plugin.init?.()).resolves.toBeUndefined()
      expect(() => plugin.track?.(mockTourEvent())).not.toThrow()
      expect(warn).toHaveBeenCalled()
      vi.doUnmock('mixpanel-browser')
    })

    it('amplitude: init resolves, track is a no-op, a warning is logged', async () => {
      vi.doMock('@amplitude/analytics-browser', () => {
        throw new Error("Cannot find module '@amplitude/analytics-browser'")
      })
      const { amplitudePlugin } = await import('../../plugins/amplitude')
      const plugin = amplitudePlugin({ apiKey: 'k' })

      await expect(plugin.init?.()).resolves.toBeUndefined()
      expect(() => plugin.track?.(mockTourEvent())).not.toThrow()
      expect(warn).toHaveBeenCalled()
      vi.doUnmock('@amplitude/analytics-browser')
    })
  })
})
