import { describe, expect, it, vi } from 'vitest'
import type { TourEvent } from '../../types/events'

const sdk = vi.hoisted(() => {
  return {
    init: vi.fn((_apiKey: string, _options?: Record<string, unknown>) => ({
      promise: Promise.resolve(),
    })),
    track: vi.fn((_eventName: string, _properties?: Record<string, unknown>) => ({
      promise: Promise.resolve(),
    })),
    identify: vi.fn(),
    setUserId: vi.fn(),
    Identify: vi.fn(() => ({ set: vi.fn().mockReturnThis() })),
    reset: vi.fn(),
    flush: vi.fn(() => ({ promise: Promise.resolve() })),
  }
})

vi.mock('@amplitude/analytics-browser', () => sdk)

function mockTourEvent(overrides: Partial<TourEvent> = {}): TourEvent {
  return {
    eventName: 'tour_started',
    timestamp: 1_700_000_000_000,
    sessionId: 'session-1',
    tourId: 'demo',
    ...overrides,
  }
}

describe('amplitudePlugin externalization (B-2)', () => {
  describe('with peer installed (mocked SDK)', () => {
    it('initializes the SDK exactly once with the configured api key (US-5/US-6)', async () => {
      const { amplitudePlugin } = await import('../../plugins/amplitude')

      const plugin = amplitudePlugin({ apiKey: 'test-key-123' })
      await plugin.init?.()

      expect(sdk.init).toHaveBeenCalledTimes(1)
      expect(sdk.init).toHaveBeenCalledWith(
        'test-key-123',
        expect.objectContaining({ defaultTracking: false })
      )
    })

    it('forwards track() to amplitude.track() with prefixed name + properties (US-6)', async () => {
      const { amplitudePlugin } = await import('../../plugins/amplitude')

      const plugin = amplitudePlugin({ apiKey: 'k' })
      await plugin.init?.()

      plugin.track?.(
        mockTourEvent({
          eventName: 'tour_started',
          tourId: 'demo',
          stepId: 'intro',
          stepIndex: 0,
          totalSteps: 4,
        })
      )

      expect(sdk.track).toHaveBeenCalledWith(
        'tourkit_tour_started',
        expect.objectContaining({
          tour_id: 'demo',
          step_id: 'intro',
          step_index: 0,
          total_steps: 4,
        })
      )
    })
  })

  describe('with peer missing (US-5)', () => {
    it('returns a no-op tracker and does not throw on init or track', async () => {
      vi.resetModules()
      vi.doMock('@amplitude/analytics-browser', () => {
        throw new Error("Cannot find module '@amplitude/analytics-browser'")
      })
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

      try {
        const { amplitudePlugin } = await import('../../plugins/amplitude')
        const plugin = amplitudePlugin({ apiKey: 'k' })

        await expect(plugin.init?.()).resolves.toBeUndefined()
        expect(() => plugin.track?.(mockTourEvent())).not.toThrow()
        // Documented graceful degradation: at least one warning fired.
        expect(warn).toHaveBeenCalled()
      } finally {
        warn.mockRestore()
        vi.doUnmock('@amplitude/analytics-browser')
      }
    })
  })
})
