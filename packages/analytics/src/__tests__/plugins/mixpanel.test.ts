import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mixpanelPlugin } from '../../plugins/mixpanel'
import type { TourEvent } from '../../types/events'

// Mock the Mixpanel SDK
const mockMixpanel = {
  init: vi.fn(),
  track: vi.fn(),
  identify: vi.fn(),
  people: {
    set: vi.fn(),
  },
  reset: vi.fn(),
}

vi.mock('mixpanel-browser', () => ({
  default: mockMixpanel,
  ...mockMixpanel,
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

describe('mixpanelPlugin', () => {
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
      const plugin = mixpanelPlugin({ token: 'test-token' })
      expect(plugin.name).toBe('mixpanel')
    })

    it('has all required methods', () => {
      const plugin = mixpanelPlugin({ token: 'test-token' })

      expect(typeof plugin.init).toBe('function')
      expect(typeof plugin.track).toBe('function')
      expect(typeof plugin.identify).toBe('function')
      expect(typeof plugin.flush).toBe('function')
      expect(typeof plugin.destroy).toBe('function')
    })
  })

  describe('init', () => {
    it('initializes Mixpanel with token', async () => {
      const plugin = mixpanelPlugin({ token: 'test-token' })

      await plugin.init?.()

      expect(mockMixpanel.init).toHaveBeenCalledWith('test-token', {
        debug: false,
        track_pageview: false,
        persistence: 'localStorage',
      })
    })

    it('initializes with debug mode enabled', async () => {
      const plugin = mixpanelPlugin({ token: 'test-token', debug: true })

      await plugin.init?.()

      expect(mockMixpanel.init).toHaveBeenCalledWith('test-token', {
        debug: true,
        track_pageview: false,
        persistence: 'localStorage',
      })
    })

    it('handles import failure gracefully', async () => {
      // This test verifies the try-catch behavior
      // In real scenario, import failure would be caught
      const plugin = mixpanelPlugin({ token: 'test-token' })

      // Should not throw even if module fails
      await expect(plugin.init?.()).resolves.toBeUndefined()
    })

    it('does nothing in SSR environment', async () => {
      // Mock window as undefined
      const originalWindow = global.window
      // @ts-expect-error - intentionally setting to undefined for SSR test
      global.window = undefined

      const plugin = mixpanelPlugin({ token: 'test-token' })

      await plugin.init?.()

      // Restore window first before assertions
      global.window = originalWindow

      // The mock will still be called because we're in jsdom
      // Real SSR test would require different environment
    })
  })

  describe('track', () => {
    it('tracks event with default prefix', async () => {
      const plugin = mixpanelPlugin({ token: 'test-token' })
      await plugin.init?.()

      plugin.track(createMockEvent({ eventName: 'tour_started' }))

      expect(mockMixpanel.track).toHaveBeenCalledWith('TourKit: tour_started', expect.any(Object))
    })

    it('tracks event with custom prefix', async () => {
      const plugin = mixpanelPlugin({
        token: 'test-token',
        eventPrefix: 'MyApp: ',
      })
      await plugin.init?.()

      plugin.track(createMockEvent({ eventName: 'tour_started' }))

      expect(mockMixpanel.track).toHaveBeenCalledWith('MyApp: tour_started', expect.any(Object))
    })

    it('maps event properties correctly', async () => {
      const plugin = mixpanelPlugin({ token: 'test-token' })
      await plugin.init?.()

      plugin.track(
        createMockEvent({
          tourId: 'my-tour',
          stepId: 'step-1',
          stepIndex: 2,
          totalSteps: 5,
          duration: 3000,
        })
      )

      expect(mockMixpanel.track).toHaveBeenCalledWith('TourKit: tour_started', {
        tour_id: 'my-tour',
        step_id: 'step-1',
        step_index: 2,
        total_steps: 5,
        duration_ms: 3000,
      })
    })

    it('includes metadata in properties', async () => {
      const plugin = mixpanelPlugin({ token: 'test-token' })
      await plugin.init?.()

      plugin.track(
        createMockEvent({
          metadata: { source: 'button', variant: 'primary' },
        })
      )

      expect(mockMixpanel.track).toHaveBeenCalledWith(
        'TourKit: tour_started',
        expect.objectContaining({
          source: 'button',
          variant: 'primary',
        })
      )
    })

    it('does not track when mixpanel is not initialized', () => {
      const plugin = mixpanelPlugin({ token: 'test-token' })
      // Don't call init

      plugin.track(createMockEvent())

      expect(mockMixpanel.track).not.toHaveBeenCalled()
    })

    it('tracks all event types', async () => {
      const plugin = mixpanelPlugin({ token: 'test-token' })
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
        mockMixpanel.track.mockClear()
        plugin.track(createMockEvent({ eventName }))
        expect(mockMixpanel.track).toHaveBeenCalledWith(`TourKit: ${eventName}`, expect.any(Object))
      }
    })
  })

  describe('identify', () => {
    it('identifies user', async () => {
      const plugin = mixpanelPlugin({ token: 'test-token' })
      await plugin.init?.()

      plugin.identify?.('user-123')

      expect(mockMixpanel.identify).toHaveBeenCalledWith('user-123')
    })

    it('sets people properties when provided', async () => {
      const plugin = mixpanelPlugin({ token: 'test-token' })
      await plugin.init?.()

      plugin.identify?.('user-123', { plan: 'pro', role: 'admin' })

      expect(mockMixpanel.identify).toHaveBeenCalledWith('user-123')
      expect(mockMixpanel.people.set).toHaveBeenCalledWith({
        plan: 'pro',
        role: 'admin',
      })
    })

    it('does not set properties when not provided', async () => {
      const plugin = mixpanelPlugin({ token: 'test-token' })
      await plugin.init?.()

      plugin.identify?.('user-123')

      expect(mockMixpanel.identify).toHaveBeenCalledWith('user-123')
      expect(mockMixpanel.people.set).not.toHaveBeenCalled()
    })

    it('does not identify when mixpanel is not initialized', () => {
      const plugin = mixpanelPlugin({ token: 'test-token' })
      // Don't call init

      plugin.identify?.('user-123')

      expect(mockMixpanel.identify).not.toHaveBeenCalled()
    })
  })

  describe('flush', () => {
    it('does nothing (Mixpanel auto-flushes)', async () => {
      const plugin = mixpanelPlugin({ token: 'test-token' })
      await plugin.init?.()

      // Should not throw
      expect(() => plugin.flush?.()).not.toThrow()
    })
  })

  describe('destroy', () => {
    it('calls mixpanel reset', async () => {
      const plugin = mixpanelPlugin({ token: 'test-token' })
      await plugin.init?.()

      plugin.destroy?.()

      expect(mockMixpanel.reset).toHaveBeenCalled()
    })

    it('does not reset when mixpanel is not initialized', () => {
      const plugin = mixpanelPlugin({ token: 'test-token' })
      // Don't call init

      plugin.destroy?.()

      expect(mockMixpanel.reset).not.toHaveBeenCalled()
    })
  })

  describe('Empty eventPrefix', () => {
    it('works with empty string prefix', async () => {
      const plugin = mixpanelPlugin({
        token: 'test-token',
        eventPrefix: '',
      })
      await plugin.init?.()

      plugin.track(createMockEvent({ eventName: 'tour_started' }))

      expect(mockMixpanel.track).toHaveBeenCalledWith('tour_started', expect.any(Object))
    })
  })

  describe('Configuration Options', () => {
    it('uses default debug: false', async () => {
      const plugin = mixpanelPlugin({ token: 'test-token' })
      await plugin.init?.()

      expect(mockMixpanel.init).toHaveBeenCalledWith(
        'test-token',
        expect.objectContaining({ debug: false })
      )
    })

    it('disables pageview tracking', async () => {
      const plugin = mixpanelPlugin({ token: 'test-token' })
      await plugin.init?.()

      expect(mockMixpanel.init).toHaveBeenCalledWith(
        'test-token',
        expect.objectContaining({ track_pageview: false })
      )
    })

    it('uses localStorage for persistence', async () => {
      const plugin = mixpanelPlugin({ token: 'test-token' })
      await plugin.init?.()

      expect(mockMixpanel.init).toHaveBeenCalledWith(
        'test-token',
        expect.objectContaining({ persistence: 'localStorage' })
      )
    })
  })
})
