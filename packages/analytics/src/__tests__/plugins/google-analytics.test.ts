import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { googleAnalyticsPlugin } from '../../plugins/google-analytics'
import type { TourEvent } from '../../types/events'

/**
 * Factory to create mock TourEvent
 */
function createMockEvent(overrides: Partial<TourEvent> = {}): TourEvent {
  return {
    eventName: 'tour_started',
    timestamp: Date.now(),
    sessionId: 'test-session-123',
    tourId: 'test-tour',
    ...overrides,
  }
}

describe('googleAnalyticsPlugin', () => {
  let mockGtag: ReturnType<typeof vi.fn>
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    mockGtag = vi.fn()
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

    // Set up gtag on window
    Object.defineProperty(window, 'gtag', {
      value: mockGtag,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    // Clean up gtag
    ;(window as { gtag?: unknown }).gtag = undefined
    consoleSpy.mockRestore()
  })

  describe('Plugin Creation', () => {
    it('creates plugin with correct name', () => {
      const plugin = googleAnalyticsPlugin({ measurementId: 'G-XXXXXXXX' })
      expect(plugin.name).toBe('google-analytics')
    })

    it('creates plugin with default eventPrefix', () => {
      const plugin = googleAnalyticsPlugin({ measurementId: 'G-XXXXXXXX' })

      plugin.track(createMockEvent())

      expect(mockGtag).toHaveBeenCalledWith('event', 'tourkit_tour_started', expect.any(Object))
    })

    it('creates plugin with custom eventPrefix', () => {
      const plugin = googleAnalyticsPlugin({
        measurementId: 'G-XXXXXXXX',
        eventPrefix: 'myapp_',
      })

      plugin.track(createMockEvent())

      expect(mockGtag).toHaveBeenCalledWith('event', 'myapp_tour_started', expect.any(Object))
    })
  })

  describe('init', () => {
    it('does not warn when gtag is available', () => {
      const plugin = googleAnalyticsPlugin({ measurementId: 'G-XXXXXXXX' })

      plugin.init?.()

      expect(consoleSpy).not.toHaveBeenCalled()
    })

    it('warns when gtag is not available', () => {
      ;(window as { gtag?: unknown }).gtag = undefined

      const plugin = googleAnalyticsPlugin({ measurementId: 'G-XXXXXXXX' })

      plugin.init?.()

      expect(consoleSpy).toHaveBeenCalledWith(
        '[tour-kit]',
        'Analytics: gtag not found. Make sure Google Analytics is loaded on the page.'
      )
    })
  })

  describe('track', () => {
    it('tracks event with gtag', () => {
      const plugin = googleAnalyticsPlugin({ measurementId: 'G-XXXXXXXX' })

      plugin.track(createMockEvent({ eventName: 'tour_started' }))

      expect(mockGtag).toHaveBeenCalledWith('event', 'tourkit_tour_started', expect.any(Object))
    })

    it('maps event properties to GA4 format', () => {
      const plugin = googleAnalyticsPlugin({ measurementId: 'G-XXXXXXXX' })

      plugin.track(
        createMockEvent({
          tourId: 'my-tour',
          stepId: 'step-1',
          stepIndex: 2,
          totalSteps: 5,
          duration: 3000,
        })
      )

      expect(mockGtag).toHaveBeenCalledWith('event', 'tourkit_tour_started', {
        tour_id: 'my-tour',
        step_id: 'step-1',
        step_index: 2,
        total_steps: 5,
        duration_ms: 3000,
      })
    })

    it('includes metadata in event properties', () => {
      const plugin = googleAnalyticsPlugin({ measurementId: 'G-XXXXXXXX' })

      plugin.track(
        createMockEvent({
          metadata: { source: 'button', variant: 'primary' },
        })
      )

      expect(mockGtag).toHaveBeenCalledWith(
        'event',
        'tourkit_tour_started',
        expect.objectContaining({
          source: 'button',
          variant: 'primary',
        })
      )
    })

    it('handles undefined optional properties', () => {
      const plugin = googleAnalyticsPlugin({ measurementId: 'G-XXXXXXXX' })

      plugin.track(
        createMockEvent({
          stepId: undefined,
          stepIndex: undefined,
          totalSteps: undefined,
          duration: undefined,
          metadata: undefined,
        })
      )

      expect(mockGtag).toHaveBeenCalledWith('event', 'tourkit_tour_started', {
        tour_id: 'test-tour',
        step_id: undefined,
        step_index: undefined,
        total_steps: undefined,
        duration_ms: undefined,
      })
    })

    it('does not track when gtag is not available', () => {
      ;(window as { gtag?: unknown }).gtag = undefined

      const plugin = googleAnalyticsPlugin({ measurementId: 'G-XXXXXXXX' })

      plugin.track(createMockEvent())

      expect(mockGtag).not.toHaveBeenCalled()
    })

    it('tracks all event types', () => {
      const plugin = googleAnalyticsPlugin({ measurementId: 'G-XXXXXXXX' })

      const eventTypes = [
        'tour_started',
        'tour_completed',
        'tour_skipped',
        'tour_abandoned',
        'step_viewed',
        'step_completed',
        'step_skipped',
        'step_interaction',
        'hint_shown',
        'hint_dismissed',
        'hint_clicked',
      ] as const

      for (const eventName of eventTypes) {
        mockGtag.mockClear()
        plugin.track(createMockEvent({ eventName }))
        expect(mockGtag).toHaveBeenCalledWith('event', `tourkit_${eventName}`, expect.any(Object))
      }
    })
  })

  describe('identify', () => {
    it('sets user_id via gtag set command', () => {
      const plugin = googleAnalyticsPlugin({ measurementId: 'G-XXXXXXXX' })

      plugin.identify?.('user-123')

      expect(mockGtag).toHaveBeenCalledWith('set', { user_id: 'user-123' })
    })

    it('does not pass properties to set command', () => {
      const plugin = googleAnalyticsPlugin({ measurementId: 'G-XXXXXXXX' })

      // GA4 doesn't support setting custom user properties via set in this manner
      plugin.identify?.('user-123', { plan: 'pro' })

      expect(mockGtag).toHaveBeenCalledWith('set', { user_id: 'user-123' })
    })

    it('does not identify when gtag is not available', () => {
      ;(window as { gtag?: unknown }).gtag = undefined

      const plugin = googleAnalyticsPlugin({ measurementId: 'G-XXXXXXXX' })

      plugin.identify?.('user-123')

      expect(mockGtag).not.toHaveBeenCalled()
    })
  })

  describe('flush', () => {
    it('does nothing (GA auto-flushes)', () => {
      const plugin = googleAnalyticsPlugin({ measurementId: 'G-XXXXXXXX' })

      expect(() => plugin.flush?.()).not.toThrow()
      // GA auto-flushes, so no gtag call expected
    })
  })

  describe('destroy', () => {
    it('does nothing (no cleanup needed)', () => {
      const plugin = googleAnalyticsPlugin({ measurementId: 'G-XXXXXXXX' })

      expect(() => plugin.destroy?.()).not.toThrow()
      // No cleanup needed for GA
    })
  })

  describe('SSR Safety', () => {
    it('handles undefined window gracefully', () => {
      // Save original gtag
      const originalGtag = window.gtag

      // Simulate SSR by removing gtag
      ;(window as { gtag?: unknown }).gtag = undefined

      const plugin = googleAnalyticsPlugin({ measurementId: 'G-XXXXXXXX' })

      // Should not throw
      expect(() => plugin.init?.()).not.toThrow()
      expect(() => plugin.track(createMockEvent())).not.toThrow()
      expect(() => plugin.identify?.('user-123')).not.toThrow()

      // Restore
      if (originalGtag) {
        ;(window as { gtag: unknown }).gtag = originalGtag
      }
    })
  })

  describe('Dynamic gtag availability', () => {
    it('works when gtag becomes available after plugin creation', () => {
      // Remove gtag initially
      ;(window as { gtag?: unknown }).gtag = undefined

      const plugin = googleAnalyticsPlugin({ measurementId: 'G-XXXXXXXX' })

      // Track should not throw when gtag is missing
      plugin.track(createMockEvent())
      expect(mockGtag).not.toHaveBeenCalled()

      // Now add gtag
      Object.defineProperty(window, 'gtag', {
        value: mockGtag,
        writable: true,
        configurable: true,
      })

      // Now tracking should work
      plugin.track(createMockEvent())
      expect(mockGtag).toHaveBeenCalled()
    })
  })
})
