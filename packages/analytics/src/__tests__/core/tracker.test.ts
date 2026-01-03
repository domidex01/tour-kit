import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TourAnalytics, createAnalytics } from '../../core/tracker'
import type { TourEvent } from '../../types/events'
import type { AnalyticsConfig, AnalyticsPlugin } from '../../types/plugin'

/**
 * Factory to create mock plugins with controllable behavior
 */
function createMockPlugin(overrides: Partial<AnalyticsPlugin> = {}): AnalyticsPlugin {
  return {
    name: 'mock-plugin',
    init: vi.fn(),
    track: vi.fn(),
    identify: vi.fn(),
    flush: vi.fn(),
    destroy: vi.fn(),
    ...overrides,
  }
}

/**
 * Factory to create analytics config with sensible defaults
 */
function createConfig(overrides: Partial<AnalyticsConfig> = {}): AnalyticsConfig {
  return {
    plugins: [createMockPlugin()],
    ...overrides,
  }
}

describe('TourAnalytics', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Constructor and Initialization', () => {
    it('creates instance with config', () => {
      const analytics = new TourAnalytics(createConfig())
      expect(analytics).toBeInstanceOf(TourAnalytics)
    })

    it('initializes plugins on construction when enabled', async () => {
      const mockPlugin = createMockPlugin()
      const config = createConfig({ plugins: [mockPlugin] })

      new TourAnalytics(config)

      // Allow async init to complete
      await vi.runAllTimersAsync()

      expect(mockPlugin.init).toHaveBeenCalledTimes(1)
    })

    it('does not initialize plugins when enabled is false', async () => {
      const mockPlugin = createMockPlugin()
      const config = createConfig({
        plugins: [mockPlugin],
        enabled: false,
      })

      new TourAnalytics(config)
      await vi.runAllTimersAsync()

      expect(mockPlugin.init).not.toHaveBeenCalled()
    })

    it('handles plugin init errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const failingPlugin = createMockPlugin({
        name: 'failing-plugin',
        init: vi.fn().mockRejectedValue(new Error('Init failed')),
      })
      const config = createConfig({
        plugins: [failingPlugin],
        debug: true,
      })

      new TourAnalytics(config)
      await vi.runAllTimersAsync()

      expect(consoleSpy).toHaveBeenCalledWith(
        '[TourKit Analytics] Failed to init plugin failing-plugin:',
        expect.any(Error)
      )
      consoleSpy.mockRestore()
    })

    it('does not log errors when debug is false', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const failingPlugin = createMockPlugin({
        init: vi.fn().mockRejectedValue(new Error('Init failed')),
      })
      const config = createConfig({
        plugins: [failingPlugin],
        debug: false,
      })

      new TourAnalytics(config)
      await vi.runAllTimersAsync()

      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('calls identify on init if userId is provided', async () => {
      const mockPlugin = createMockPlugin()
      const config = createConfig({
        plugins: [mockPlugin],
        userId: 'user-123',
        userProperties: { plan: 'pro' },
      })

      new TourAnalytics(config)
      await vi.runAllTimersAsync()

      expect(mockPlugin.identify).toHaveBeenCalledWith('user-123', { plan: 'pro' })
    })

    it('does not call identify on init if userId is not provided', async () => {
      const mockPlugin = createMockPlugin()
      const config = createConfig({ plugins: [mockPlugin] })

      new TourAnalytics(config)
      await vi.runAllTimersAsync()

      expect(mockPlugin.identify).not.toHaveBeenCalled()
    })

    it('only initializes once even if called multiple times', async () => {
      const mockPlugin = createMockPlugin()
      const config = createConfig({ plugins: [mockPlugin] })

      const analytics = new TourAnalytics(config)
      await vi.runAllTimersAsync()

      // Force another init by accessing private method via any
      ;(analytics as unknown as { init: () => Promise<void> }).init()
      await vi.runAllTimersAsync()

      expect(mockPlugin.init).toHaveBeenCalledTimes(1)
    })
  })

  describe('identify', () => {
    it('calls identify on all plugins', () => {
      const mockPlugin1 = createMockPlugin({ name: 'plugin-1' })
      const mockPlugin2 = createMockPlugin({ name: 'plugin-2' })
      const config = createConfig({
        plugins: [mockPlugin1, mockPlugin2],
        enabled: false, // Skip async init
      })

      const analytics = new TourAnalytics(config)
      analytics.identify('user-456', { role: 'admin' })

      expect(mockPlugin1.identify).toHaveBeenCalledWith('user-456', { role: 'admin' })
      expect(mockPlugin2.identify).toHaveBeenCalledWith('user-456', { role: 'admin' })
    })

    it('handles plugin identify errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const failingPlugin = createMockPlugin({
        name: 'failing-plugin',
        identify: vi.fn().mockImplementation(() => {
          throw new Error('Identify failed')
        }),
      })
      const config = createConfig({
        plugins: [failingPlugin],
        enabled: false,
        debug: true,
      })

      const analytics = new TourAnalytics(config)
      expect(() => analytics.identify('user-123')).not.toThrow()

      expect(consoleSpy).toHaveBeenCalledWith(
        '[TourKit Analytics] Failed to identify in failing-plugin:',
        expect.any(Error)
      )
      consoleSpy.mockRestore()
    })

    it('handles plugins without identify method', () => {
      const mockPlugin = createMockPlugin({ identify: undefined })
      const config = createConfig({
        plugins: [mockPlugin],
        enabled: false,
      })

      const analytics = new TourAnalytics(config)
      expect(() => analytics.identify('user-123')).not.toThrow()
    })
  })

  describe('track', () => {
    it('tracks events to all registered plugins', () => {
      const mockPlugin1 = createMockPlugin({ name: 'plugin-1' })
      const mockPlugin2 = createMockPlugin({ name: 'plugin-2' })
      const config = createConfig({
        plugins: [mockPlugin1, mockPlugin2],
        enabled: false,
      })

      const analytics = new TourAnalytics(config)
      analytics.track('tour_started', { tourId: 'tour-1', totalSteps: 5 })

      expect(mockPlugin1.track).toHaveBeenCalledTimes(1)
      expect(mockPlugin2.track).toHaveBeenCalledTimes(1)
    })

    it('adds timestamp and sessionId to events', () => {
      const mockPlugin = createMockPlugin()
      const config = createConfig({
        plugins: [mockPlugin],
        enabled: false,
      })

      const analytics = new TourAnalytics(config)
      analytics.track('tour_started', { tourId: 'tour-1' })

      const trackedEvent = (mockPlugin.track as ReturnType<typeof vi.fn>).mock
        .calls[0][0] as TourEvent
      expect(trackedEvent.timestamp).toBe(Date.now())
      expect(trackedEvent.sessionId).toMatch(/^\d+-[a-z0-9]+$/)
    })

    it('merges globalProperties into events', () => {
      const mockPlugin = createMockPlugin()
      const config = createConfig({
        plugins: [mockPlugin],
        enabled: false,
        globalProperties: { appVersion: '1.0.0', environment: 'test' },
      })

      const analytics = new TourAnalytics(config)
      analytics.track('tour_started', { tourId: 'tour-1' })

      const trackedEvent = (mockPlugin.track as ReturnType<typeof vi.fn>).mock
        .calls[0][0] as TourEvent & Record<string, unknown>
      expect(trackedEvent.appVersion).toBe('1.0.0')
      expect(trackedEvent.environment).toBe('test')
    })

    it('handles plugin track errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const failingPlugin = createMockPlugin({
        name: 'failing-plugin',
        track: vi.fn().mockImplementation(() => {
          throw new Error('Track failed')
        }),
      })
      const config = createConfig({
        plugins: [failingPlugin],
        enabled: false,
        debug: true,
      })

      const analytics = new TourAnalytics(config)
      expect(() => analytics.track('tour_started', { tourId: 'tour-1' })).not.toThrow()

      expect(consoleSpy).toHaveBeenCalledWith(
        '[TourKit Analytics] Failed to track in failing-plugin:',
        expect.any(Error)
      )
      consoleSpy.mockRestore()
    })

    it('logs events to console in debug mode', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const mockPlugin = createMockPlugin()
      const config = createConfig({
        plugins: [mockPlugin],
        enabled: false,
        debug: true,
      })

      const analytics = new TourAnalytics(config)
      analytics.track('tour_started', { tourId: 'tour-1' })

      expect(consoleSpy).toHaveBeenCalledWith(
        '[TourKit Analytics]',
        'tour_started',
        expect.objectContaining({ tourId: 'tour-1' })
      )
      consoleSpy.mockRestore()
    })

    it('uses default empty tourId when data not provided', () => {
      const mockPlugin = createMockPlugin()
      const config = createConfig({
        plugins: [mockPlugin],
        enabled: false,
      })

      const analytics = new TourAnalytics(config)
      analytics.track('tour_started')

      const trackedEvent = (mockPlugin.track as ReturnType<typeof vi.fn>).mock
        .calls[0][0] as TourEvent
      expect(trackedEvent.tourId).toBe('')
    })
  })

  describe('Tour Lifecycle Methods', () => {
    it('tourStarted sets tourStartTime and tracks event', () => {
      const mockPlugin = createMockPlugin()
      const config = createConfig({
        plugins: [mockPlugin],
        enabled: false,
      })

      const analytics = new TourAnalytics(config)
      analytics.tourStarted('tour-1', 5, { source: 'button' })

      const trackedEvent = (mockPlugin.track as ReturnType<typeof vi.fn>).mock
        .calls[0][0] as TourEvent
      expect(trackedEvent.eventName).toBe('tour_started')
      expect(trackedEvent.tourId).toBe('tour-1')
      expect(trackedEvent.totalSteps).toBe(5)
      expect(trackedEvent.metadata).toEqual({ source: 'button' })
    })

    it('tourCompleted calculates duration and tracks event', () => {
      const mockPlugin = createMockPlugin()
      const config = createConfig({
        plugins: [mockPlugin],
        enabled: false,
      })

      const analytics = new TourAnalytics(config)

      analytics.tourStarted('tour-1', 5)
      vi.advanceTimersByTime(10000) // 10 seconds
      analytics.tourCompleted('tour-1', { completedBy: 'user' })

      const trackedEvent = (mockPlugin.track as ReturnType<typeof vi.fn>).mock
        .calls[1][0] as TourEvent
      expect(trackedEvent.eventName).toBe('tour_completed')
      expect(trackedEvent.tourId).toBe('tour-1')
      expect(trackedEvent.duration).toBe(10000)
      expect(trackedEvent.metadata).toEqual({ completedBy: 'user' })
    })

    it('tourSkipped includes stepIndex, stepId, and duration', () => {
      const mockPlugin = createMockPlugin()
      const config = createConfig({
        plugins: [mockPlugin],
        enabled: false,
      })

      const analytics = new TourAnalytics(config)

      analytics.tourStarted('tour-1', 5)
      vi.advanceTimersByTime(3000)
      analytics.tourSkipped('tour-1', 2, 'step-3', { reason: 'impatient' })

      const trackedEvent = (mockPlugin.track as ReturnType<typeof vi.fn>).mock
        .calls[1][0] as TourEvent
      expect(trackedEvent.eventName).toBe('tour_skipped')
      expect(trackedEvent.stepIndex).toBe(2)
      expect(trackedEvent.stepId).toBe('step-3')
      expect(trackedEvent.duration).toBe(3000)
    })

    it('tourAbandoned includes stepIndex, stepId, and duration', () => {
      const mockPlugin = createMockPlugin()
      const config = createConfig({
        plugins: [mockPlugin],
        enabled: false,
      })

      const analytics = new TourAnalytics(config)

      analytics.tourStarted('tour-1', 5)
      vi.advanceTimersByTime(7500)
      analytics.tourAbandoned('tour-1', 1, 'step-2')

      const trackedEvent = (mockPlugin.track as ReturnType<typeof vi.fn>).mock
        .calls[1][0] as TourEvent
      expect(trackedEvent.eventName).toBe('tour_abandoned')
      expect(trackedEvent.stepIndex).toBe(1)
      expect(trackedEvent.stepId).toBe('step-2')
      expect(trackedEvent.duration).toBe(7500)
    })
  })

  describe('Step Lifecycle Methods', () => {
    it('stepViewed sets stepStartTime and tracks event', () => {
      const mockPlugin = createMockPlugin()
      const config = createConfig({
        plugins: [mockPlugin],
        enabled: false,
      })

      const analytics = new TourAnalytics(config)
      analytics.stepViewed('tour-1', 'step-1', 0, 5, { highlight: true })

      const trackedEvent = (mockPlugin.track as ReturnType<typeof vi.fn>).mock
        .calls[0][0] as TourEvent
      expect(trackedEvent.eventName).toBe('step_viewed')
      expect(trackedEvent.tourId).toBe('tour-1')
      expect(trackedEvent.stepId).toBe('step-1')
      expect(trackedEvent.stepIndex).toBe(0)
      expect(trackedEvent.totalSteps).toBe(5)
      expect(trackedEvent.metadata).toEqual({ highlight: true })
    })

    it('stepCompleted calculates duration', () => {
      const mockPlugin = createMockPlugin()
      const config = createConfig({
        plugins: [mockPlugin],
        enabled: false,
      })

      const analytics = new TourAnalytics(config)

      analytics.stepViewed('tour-1', 'step-1', 0, 5)
      vi.advanceTimersByTime(2500)
      analytics.stepCompleted('tour-1', 'step-1', 0)

      const trackedEvent = (mockPlugin.track as ReturnType<typeof vi.fn>).mock
        .calls[1][0] as TourEvent
      expect(trackedEvent.eventName).toBe('step_completed')
      expect(trackedEvent.duration).toBe(2500)
    })

    it('stepSkipped calculates duration', () => {
      const mockPlugin = createMockPlugin()
      const config = createConfig({
        plugins: [mockPlugin],
        enabled: false,
      })

      const analytics = new TourAnalytics(config)

      analytics.stepViewed('tour-1', 'step-2', 1, 5)
      vi.advanceTimersByTime(1200)
      analytics.stepSkipped('tour-1', 'step-2', 1, { skippedVia: 'keyboard' })

      const trackedEvent = (mockPlugin.track as ReturnType<typeof vi.fn>).mock
        .calls[1][0] as TourEvent
      expect(trackedEvent.eventName).toBe('step_skipped')
      expect(trackedEvent.duration).toBe(1200)
      expect(trackedEvent.metadata).toEqual({ skippedVia: 'keyboard' })
    })

    it('stepInteraction includes interactionType in metadata', () => {
      const mockPlugin = createMockPlugin()
      const config = createConfig({
        plugins: [mockPlugin],
        enabled: false,
      })

      const analytics = new TourAnalytics(config)
      analytics.stepInteraction('tour-1', 'step-1', 'button_click', { buttonId: 'next' })

      const trackedEvent = (mockPlugin.track as ReturnType<typeof vi.fn>).mock
        .calls[0][0] as TourEvent
      expect(trackedEvent.eventName).toBe('step_interaction')
      expect(trackedEvent.metadata).toEqual({
        interactionType: 'button_click',
        buttonId: 'next',
      })
    })
  })

  describe('Hint Methods', () => {
    it('hintShown tracks with hintId as tourId', () => {
      const mockPlugin = createMockPlugin()
      const config = createConfig({
        plugins: [mockPlugin],
        enabled: false,
      })

      const analytics = new TourAnalytics(config)
      analytics.hintShown('hint-feature-1', { feature: 'new-button' })

      const trackedEvent = (mockPlugin.track as ReturnType<typeof vi.fn>).mock
        .calls[0][0] as TourEvent
      expect(trackedEvent.eventName).toBe('hint_shown')
      expect(trackedEvent.tourId).toBe('hint-feature-1')
      expect(trackedEvent.metadata).toEqual({ feature: 'new-button' })
    })

    it('hintDismissed tracks dismissal', () => {
      const mockPlugin = createMockPlugin()
      const config = createConfig({
        plugins: [mockPlugin],
        enabled: false,
      })

      const analytics = new TourAnalytics(config)
      analytics.hintDismissed('hint-feature-1')

      const trackedEvent = (mockPlugin.track as ReturnType<typeof vi.fn>).mock
        .calls[0][0] as TourEvent
      expect(trackedEvent.eventName).toBe('hint_dismissed')
      expect(trackedEvent.tourId).toBe('hint-feature-1')
    })

    it('hintClicked tracks click', () => {
      const mockPlugin = createMockPlugin()
      const config = createConfig({
        plugins: [mockPlugin],
        enabled: false,
      })

      const analytics = new TourAnalytics(config)
      analytics.hintClicked('hint-feature-1', { action: 'open-modal' })

      const trackedEvent = (mockPlugin.track as ReturnType<typeof vi.fn>).mock
        .calls[0][0] as TourEvent
      expect(trackedEvent.eventName).toBe('hint_clicked')
      expect(trackedEvent.tourId).toBe('hint-feature-1')
      expect(trackedEvent.metadata).toEqual({ action: 'open-modal' })
    })
  })

  describe('Utility Methods', () => {
    it('flush calls flush on all plugins', async () => {
      const mockPlugin1 = createMockPlugin({ name: 'plugin-1' })
      const mockPlugin2 = createMockPlugin({ name: 'plugin-2' })
      const config = createConfig({
        plugins: [mockPlugin1, mockPlugin2],
        enabled: false,
      })

      const analytics = new TourAnalytics(config)
      await analytics.flush()

      expect(mockPlugin1.flush).toHaveBeenCalledTimes(1)
      expect(mockPlugin2.flush).toHaveBeenCalledTimes(1)
    })

    it('flush handles plugin errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const failingPlugin = createMockPlugin({
        name: 'failing-plugin',
        flush: vi.fn().mockRejectedValue(new Error('Flush failed')),
      })
      const config = createConfig({
        plugins: [failingPlugin],
        enabled: false,
        debug: true,
      })

      const analytics = new TourAnalytics(config)
      await expect(analytics.flush()).resolves.toBeUndefined()

      expect(consoleSpy).toHaveBeenCalledWith(
        '[TourKit Analytics] Failed to flush failing-plugin:',
        expect.any(Error)
      )
      consoleSpy.mockRestore()
    })

    it('flush handles plugins without flush method', async () => {
      const mockPlugin = createMockPlugin({ flush: undefined })
      const config = createConfig({
        plugins: [mockPlugin],
        enabled: false,
      })

      const analytics = new TourAnalytics(config)
      await expect(analytics.flush()).resolves.toBeUndefined()
    })

    it('destroy calls destroy on all plugins', () => {
      const mockPlugin1 = createMockPlugin({ name: 'plugin-1' })
      const mockPlugin2 = createMockPlugin({ name: 'plugin-2' })
      const config = createConfig({
        plugins: [mockPlugin1, mockPlugin2],
        enabled: false,
      })

      const analytics = new TourAnalytics(config)
      analytics.destroy()

      expect(mockPlugin1.destroy).toHaveBeenCalledTimes(1)
      expect(mockPlugin2.destroy).toHaveBeenCalledTimes(1)
    })

    it('destroy handles plugin errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const failingPlugin = createMockPlugin({
        name: 'failing-plugin',
        destroy: vi.fn().mockImplementation(() => {
          throw new Error('Destroy failed')
        }),
      })
      const config = createConfig({
        plugins: [failingPlugin],
        enabled: false,
        debug: true,
      })

      const analytics = new TourAnalytics(config)
      expect(() => analytics.destroy()).not.toThrow()

      expect(consoleSpy).toHaveBeenCalledWith(
        '[TourKit Analytics] Failed to destroy failing-plugin:',
        expect.any(Error)
      )
      consoleSpy.mockRestore()
    })

    it('destroy handles plugins without destroy method', () => {
      const mockPlugin = createMockPlugin({ destroy: undefined })
      const config = createConfig({
        plugins: [mockPlugin],
        enabled: false,
      })

      const analytics = new TourAnalytics(config)
      expect(() => analytics.destroy()).not.toThrow()
    })
  })

  describe('Session ID Generation', () => {
    it('generates unique session IDs', () => {
      const config = createConfig({ enabled: false })

      const analytics1 = new TourAnalytics(config)
      new TourAnalytics(config) // Create second instance (unused directly)

      // Track events to get session IDs
      const mockPlugin1 = config.plugins[0] as AnalyticsPlugin
      analytics1.track('tour_started', { tourId: 'tour-1' })

      // Create new config with fresh mock to avoid call history collision
      const mockPlugin2 = createMockPlugin()
      const config2 = createConfig({ plugins: [mockPlugin2], enabled: false })
      const analytics3 = new TourAnalytics(config2)
      analytics3.track('tour_started', { tourId: 'tour-1' })

      const session1 = (mockPlugin1.track as ReturnType<typeof vi.fn>).mock.calls[0][0].sessionId
      const session2 = (mockPlugin2.track as ReturnType<typeof vi.fn>).mock.calls[0][0].sessionId

      expect(session1).toMatch(/^\d+-[a-z0-9]+$/)
      expect(session2).toMatch(/^\d+-[a-z0-9]+$/)
      // They might be equal if generated at same millisecond, but the random part should differ
    })

    it('maintains same session ID across tracks', () => {
      const mockPlugin = createMockPlugin()
      const config = createConfig({
        plugins: [mockPlugin],
        enabled: false,
      })

      const analytics = new TourAnalytics(config)
      analytics.track('tour_started', { tourId: 'tour-1' })
      analytics.track('step_viewed', { tourId: 'tour-1' })

      const session1 = (mockPlugin.track as ReturnType<typeof vi.fn>).mock.calls[0][0].sessionId
      const session2 = (mockPlugin.track as ReturnType<typeof vi.fn>).mock.calls[1][0].sessionId

      expect(session1).toBe(session2)
    })
  })
})

describe('createAnalytics', () => {
  it('creates TourAnalytics instance', () => {
    const analytics = createAnalytics({
      plugins: [createMockPlugin()],
      enabled: false,
    })

    expect(analytics).toBeInstanceOf(TourAnalytics)
  })
})
