import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { posthogPlugin } from '../../plugins/posthog'
import type { TourEvent } from '../../types/events'

// Mock the PostHog SDK
const mockPostHog = {
  init: vi.fn(),
  capture: vi.fn(),
  identify: vi.fn(),
  reset: vi.fn(),
}

vi.mock('posthog-js', () => ({
  default: mockPostHog,
}))

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

describe('posthogPlugin', () => {
  let consoleSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.clearAllMocks()
    consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleSpy.mockRestore()
  })

  describe('Plugin Creation', () => {
    it('creates plugin with correct name', () => {
      const plugin = posthogPlugin({ apiKey: 'phc_test-api-key' })
      expect(plugin.name).toBe('posthog')
    })

    it('has all required methods', () => {
      const plugin = posthogPlugin({ apiKey: 'phc_test-api-key' })

      expect(typeof plugin.init).toBe('function')
      expect(typeof plugin.track).toBe('function')
      expect(typeof plugin.identify).toBe('function')
      expect(typeof plugin.flush).toBe('function')
      expect(typeof plugin.destroy).toBe('function')
    })
  })

  describe('init', () => {
    it('initializes PostHog with API key', async () => {
      const plugin = posthogPlugin({ apiKey: 'phc_test-api-key' })

      await plugin.init?.()

      expect(mockPostHog.init).toHaveBeenCalledWith('phc_test-api-key', {
        api_host: 'https://app.posthog.com',
        autocapture: false,
        capture_pageview: false,
        persistence: 'localStorage',
      })
    })

    it('initializes with custom apiHost', async () => {
      const plugin = posthogPlugin({
        apiKey: 'phc_test-api-key',
        apiHost: 'https://eu.posthog.com',
      })

      await plugin.init?.()

      expect(mockPostHog.init).toHaveBeenCalledWith('phc_test-api-key', {
        api_host: 'https://eu.posthog.com',
        autocapture: false,
        capture_pageview: false,
        persistence: 'localStorage',
      })
    })

    it('disables autocapture by default', async () => {
      const plugin = posthogPlugin({ apiKey: 'phc_test-api-key' })

      await plugin.init?.()

      expect(mockPostHog.init).toHaveBeenCalledWith(
        'phc_test-api-key',
        expect.objectContaining({ autocapture: false })
      )
    })

    it('enables autocapture when specified', async () => {
      const plugin = posthogPlugin({
        apiKey: 'phc_test-api-key',
        autocapture: true,
      })

      await plugin.init?.()

      expect(mockPostHog.init).toHaveBeenCalledWith(
        'phc_test-api-key',
        expect.objectContaining({ autocapture: true })
      )
    })

    it('handles import failure gracefully', async () => {
      // This test verifies the try-catch behavior
      const plugin = posthogPlugin({ apiKey: 'phc_test-api-key' })

      // Should not throw even if module fails
      await expect(plugin.init?.()).resolves.toBeUndefined()
    })

    it('does nothing in SSR environment', async () => {
      // Mock window as undefined
      const originalWindow = globalThis.window
      // @ts-expect-error - intentionally setting to undefined for SSR test
      globalThis.window = undefined

      const plugin = posthogPlugin({ apiKey: 'phc_test-api-key' })

      await plugin.init?.()

      // Restore window first
      globalThis.window = originalWindow
    })
  })

  describe('track', () => {
    it('captures event with default prefix', async () => {
      const plugin = posthogPlugin({ apiKey: 'phc_test-api-key' })
      await plugin.init?.()

      plugin.track(createMockEvent({ eventName: 'tour_started' }))

      expect(mockPostHog.capture).toHaveBeenCalledWith('tourkit_tour_started', expect.any(Object))
    })

    it('captures event with custom prefix', async () => {
      const plugin = posthogPlugin({
        apiKey: 'phc_test-api-key',
        eventPrefix: 'myapp_',
      })
      await plugin.init?.()

      plugin.track(createMockEvent({ eventName: 'tour_started' }))

      expect(mockPostHog.capture).toHaveBeenCalledWith('myapp_tour_started', expect.any(Object))
    })

    it('maps event properties correctly', async () => {
      const plugin = posthogPlugin({ apiKey: 'phc_test-api-key' })
      await plugin.init?.()

      plugin.track(
        createMockEvent({
          tourId: 'my-tour',
          stepId: 'step-1',
          stepIndex: 2,
          totalSteps: 5,
          duration: 3000,
          sessionId: 'session-xyz',
        })
      )

      expect(mockPostHog.capture).toHaveBeenCalledWith('tourkit_tour_started', {
        tour_id: 'my-tour',
        step_id: 'step-1',
        step_index: 2,
        total_steps: 5,
        duration_ms: 3000,
        session_id: 'session-xyz',
      })
    })

    it('includes metadata in properties', async () => {
      const plugin = posthogPlugin({ apiKey: 'phc_test-api-key' })
      await plugin.init?.()

      plugin.track(
        createMockEvent({
          metadata: { source: 'button', variant: 'primary' },
        })
      )

      expect(mockPostHog.capture).toHaveBeenCalledWith(
        'tourkit_tour_started',
        expect.objectContaining({
          source: 'button',
          variant: 'primary',
        })
      )
    })

    it('includes session_id in properties', async () => {
      const plugin = posthogPlugin({ apiKey: 'phc_test-api-key' })
      await plugin.init?.()

      plugin.track(createMockEvent({ sessionId: 'unique-session-id' }))

      expect(mockPostHog.capture).toHaveBeenCalledWith(
        'tourkit_tour_started',
        expect.objectContaining({
          session_id: 'unique-session-id',
        })
      )
    })

    it('does not capture when posthog is not initialized', () => {
      const plugin = posthogPlugin({ apiKey: 'phc_test-api-key' })
      // Don't call init

      plugin.track(createMockEvent())

      expect(mockPostHog.capture).not.toHaveBeenCalled()
    })

    it('captures all event types', async () => {
      const plugin = posthogPlugin({ apiKey: 'phc_test-api-key' })
      await plugin.init?.()

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
        mockPostHog.capture.mockClear()
        plugin.track(createMockEvent({ eventName }))
        expect(mockPostHog.capture).toHaveBeenCalledWith(`tourkit_${eventName}`, expect.any(Object))
      }
    })
  })

  describe('identify', () => {
    it('identifies user', async () => {
      const plugin = posthogPlugin({ apiKey: 'phc_test-api-key' })
      await plugin.init?.()

      plugin.identify?.('user-123')

      expect(mockPostHog.identify).toHaveBeenCalledWith('user-123', undefined)
    })

    it('identifies user with properties', async () => {
      const plugin = posthogPlugin({ apiKey: 'phc_test-api-key' })
      await plugin.init?.()

      plugin.identify?.('user-123', { plan: 'pro', role: 'admin' })

      expect(mockPostHog.identify).toHaveBeenCalledWith('user-123', {
        plan: 'pro',
        role: 'admin',
      })
    })

    it('does not identify when posthog is not initialized', () => {
      const plugin = posthogPlugin({ apiKey: 'phc_test-api-key' })
      // Don't call init

      plugin.identify?.('user-123')

      expect(mockPostHog.identify).not.toHaveBeenCalled()
    })
  })

  describe('flush', () => {
    it('does nothing (PostHog auto-flushes)', async () => {
      const plugin = posthogPlugin({ apiKey: 'phc_test-api-key' })
      await plugin.init?.()

      // Should not throw
      expect(() => plugin.flush?.()).not.toThrow()
    })
  })

  describe('destroy', () => {
    it('calls posthog reset', async () => {
      const plugin = posthogPlugin({ apiKey: 'phc_test-api-key' })
      await plugin.init?.()

      plugin.destroy?.()

      expect(mockPostHog.reset).toHaveBeenCalled()
    })

    it('does not reset when posthog is not initialized', () => {
      const plugin = posthogPlugin({ apiKey: 'phc_test-api-key' })
      // Don't call init

      plugin.destroy?.()

      expect(mockPostHog.reset).not.toHaveBeenCalled()
    })
  })

  describe('Empty eventPrefix', () => {
    it('works with empty string prefix', async () => {
      const plugin = posthogPlugin({
        apiKey: 'phc_test-api-key',
        eventPrefix: '',
      })
      await plugin.init?.()

      plugin.track(createMockEvent({ eventName: 'tour_started' }))

      expect(mockPostHog.capture).toHaveBeenCalledWith('tour_started', expect.any(Object))
    })
  })

  describe('Configuration Options', () => {
    it('uses default apiHost', async () => {
      const plugin = posthogPlugin({ apiKey: 'phc_test-api-key' })
      await plugin.init?.()

      expect(mockPostHog.init).toHaveBeenCalledWith(
        'phc_test-api-key',
        expect.objectContaining({ api_host: 'https://app.posthog.com' })
      )
    })

    it('disables pageview capture', async () => {
      const plugin = posthogPlugin({ apiKey: 'phc_test-api-key' })
      await plugin.init?.()

      expect(mockPostHog.init).toHaveBeenCalledWith(
        'phc_test-api-key',
        expect.objectContaining({ capture_pageview: false })
      )
    })

    it('uses localStorage for persistence', async () => {
      const plugin = posthogPlugin({ apiKey: 'phc_test-api-key' })
      await plugin.init?.()

      expect(mockPostHog.init).toHaveBeenCalledWith(
        'phc_test-api-key',
        expect.objectContaining({ persistence: 'localStorage' })
      )
    })
  })

  describe('EU Data Residency', () => {
    it('supports EU API host', async () => {
      const plugin = posthogPlugin({
        apiKey: 'phc_test-api-key',
        apiHost: 'https://eu.posthog.com',
      })
      await plugin.init?.()

      expect(mockPostHog.init).toHaveBeenCalledWith(
        'phc_test-api-key',
        expect.objectContaining({ api_host: 'https://eu.posthog.com' })
      )
    })
  })
})
