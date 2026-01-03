import { act, render, renderHook } from '@testing-library/react'
import type * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AnalyticsProvider, useAnalytics } from '../../core/context'
import { consolePlugin } from '../../plugins/console'
import type { AnalyticsConfig, AnalyticsPlugin } from '../../types/plugin'

/**
 * Factory to create mock plugins with controllable behavior
 */
function createMockPlugin(name: string, overrides: Partial<AnalyticsPlugin> = {}): AnalyticsPlugin {
  return {
    name,
    init: vi.fn(),
    track: vi.fn(),
    identify: vi.fn(),
    flush: vi.fn(),
    destroy: vi.fn(),
    ...overrides,
  }
}

/**
 * Factory to create wrapper component for hook testing
 */
function createWrapper(config: AnalyticsConfig) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <AnalyticsProvider config={config}>{children}</AnalyticsProvider>
  }
}

describe('Multi-Plugin Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Multiple plugins receive same events', () => {
    it('all plugins receive track events', () => {
      const plugin1 = createMockPlugin('plugin-1')
      const plugin2 = createMockPlugin('plugin-2')
      const plugin3 = createMockPlugin('plugin-3')

      const config: AnalyticsConfig = {
        plugins: [plugin1, plugin2, plugin3],
        enabled: false,
      }

      const wrapper = createWrapper(config)
      const { result } = renderHook(() => useAnalytics(), { wrapper })

      act(() => {
        result.current.track('tour_started', { tourId: 'test-tour' })
      })

      expect(plugin1.track).toHaveBeenCalledTimes(1)
      expect(plugin2.track).toHaveBeenCalledTimes(1)
      expect(plugin3.track).toHaveBeenCalledTimes(1)

      // All receive the same event
      const expectedEvent = expect.objectContaining({
        eventName: 'tour_started',
        tourId: 'test-tour',
      })
      expect(plugin1.track).toHaveBeenCalledWith(expectedEvent)
      expect(plugin2.track).toHaveBeenCalledWith(expectedEvent)
      expect(plugin3.track).toHaveBeenCalledWith(expectedEvent)
    })

    it('all plugins receive identify calls', () => {
      const plugin1 = createMockPlugin('plugin-1')
      const plugin2 = createMockPlugin('plugin-2')

      const config: AnalyticsConfig = {
        plugins: [plugin1, plugin2],
        enabled: false,
      }

      const wrapper = createWrapper(config)
      const { result } = renderHook(() => useAnalytics(), { wrapper })

      act(() => {
        result.current.identify('user-123', { plan: 'pro' })
      })

      expect(plugin1.identify).toHaveBeenCalledWith('user-123', { plan: 'pro' })
      expect(plugin2.identify).toHaveBeenCalledWith('user-123', { plan: 'pro' })
    })
  })

  describe('Plugin errors do not affect other plugins', () => {
    it('error in one plugin does not prevent others from tracking', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const failingPlugin = createMockPlugin('failing', {
        track: vi.fn().mockImplementation(() => {
          throw new Error('Plugin failed')
        }),
      })
      const workingPlugin = createMockPlugin('working')

      const config: AnalyticsConfig = {
        plugins: [failingPlugin, workingPlugin],
        enabled: false,
        debug: true,
      }

      const wrapper = createWrapper(config)
      const { result } = renderHook(() => useAnalytics(), { wrapper })

      act(() => {
        result.current.track('tour_started', { tourId: 'test-tour' })
      })

      // Failing plugin was called and threw
      expect(failingPlugin.track).toHaveBeenCalledTimes(1)

      // Working plugin still received the event
      expect(workingPlugin.track).toHaveBeenCalledTimes(1)

      consoleSpy.mockRestore()
    })

    it('error in one plugin does not prevent others from identifying', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const failingPlugin = createMockPlugin('failing', {
        identify: vi.fn().mockImplementation(() => {
          throw new Error('Identify failed')
        }),
      })
      const workingPlugin = createMockPlugin('working')

      const config: AnalyticsConfig = {
        plugins: [failingPlugin, workingPlugin],
        enabled: false,
        debug: true,
      }

      const wrapper = createWrapper(config)
      const { result } = renderHook(() => useAnalytics(), { wrapper })

      act(() => {
        result.current.identify('user-123')
      })

      expect(workingPlugin.identify).toHaveBeenCalledWith('user-123', undefined)

      consoleSpy.mockRestore()
    })
  })

  describe('Full tour lifecycle tracking', () => {
    it('tracks complete tour flow across all plugins', () => {
      const plugin1 = createMockPlugin('plugin-1')
      const plugin2 = createMockPlugin('plugin-2')

      const config: AnalyticsConfig = {
        plugins: [plugin1, plugin2],
        enabled: false,
      }

      const wrapper = createWrapper(config)
      const { result } = renderHook(() => useAnalytics(), { wrapper })

      // Start tour
      act(() => {
        result.current.tourStarted('onboarding', 3)
      })

      // View first step
      act(() => {
        result.current.stepViewed('onboarding', 'step-1', 0, 3)
      })

      vi.advanceTimersByTime(5000)

      // Complete first step
      act(() => {
        result.current.stepCompleted('onboarding', 'step-1', 0)
      })

      // View second step
      act(() => {
        result.current.stepViewed('onboarding', 'step-2', 1, 3)
      })

      vi.advanceTimersByTime(3000)

      // Skip second step
      act(() => {
        result.current.stepSkipped('onboarding', 'step-2', 1)
      })

      // View third step
      act(() => {
        result.current.stepViewed('onboarding', 'step-3', 2, 3)
      })

      vi.advanceTimersByTime(2000)

      // Complete third step
      act(() => {
        result.current.stepCompleted('onboarding', 'step-3', 2)
      })

      // Complete tour
      act(() => {
        result.current.tourCompleted('onboarding')
      })

      // Verify all events were tracked to both plugins
      const plugin1Calls = (plugin1.track as ReturnType<typeof vi.fn>).mock.calls
      const plugin2Calls = (plugin2.track as ReturnType<typeof vi.fn>).mock.calls

      expect(plugin1Calls).toHaveLength(8)
      expect(plugin2Calls).toHaveLength(8)

      // Verify event sequence
      const eventSequence = plugin1Calls.map((call) => call[0].eventName)
      expect(eventSequence).toEqual([
        'tour_started',
        'step_viewed',
        'step_completed',
        'step_viewed',
        'step_skipped',
        'step_viewed',
        'step_completed',
        'tour_completed',
      ])

      // Verify duration tracking
      const stepCompletedEvent = plugin1Calls.find(
        (call) => call[0].eventName === 'step_completed' && call[0].stepId === 'step-1'
      )
      expect(stepCompletedEvent).toBeDefined()
      expect(stepCompletedEvent?.[0].duration).toBe(5000)

      const stepSkippedEvent = plugin1Calls.find((call) => call[0].eventName === 'step_skipped')
      expect(stepSkippedEvent).toBeDefined()
      expect(stepSkippedEvent?.[0].duration).toBe(3000)
    })

    it('tracks tour abandonment correctly', () => {
      const plugin = createMockPlugin('plugin')

      const config: AnalyticsConfig = {
        plugins: [plugin],
        enabled: false,
      }

      const wrapper = createWrapper(config)
      const { result } = renderHook(() => useAnalytics(), { wrapper })

      act(() => {
        result.current.tourStarted('onboarding', 5)
      })

      act(() => {
        result.current.stepViewed('onboarding', 'step-1', 0, 5)
      })

      vi.advanceTimersByTime(7500)

      act(() => {
        result.current.tourAbandoned('onboarding', 0, 'step-1')
      })

      const abandonEvent = (plugin.track as ReturnType<typeof vi.fn>).mock.calls.find(
        (call) => call[0].eventName === 'tour_abandoned'
      )

      expect(abandonEvent).toBeDefined()
      expect(abandonEvent?.[0].duration).toBe(7500)
      expect(abandonEvent?.[0].stepIndex).toBe(0)
      expect(abandonEvent?.[0].stepId).toBe('step-1')
    })
  })

  describe('Provider cleanup flushes all plugins', () => {
    it('flushes all plugins on beforeunload', async () => {
      const plugin1 = createMockPlugin('plugin-1')
      const plugin2 = createMockPlugin('plugin-2')

      const config: AnalyticsConfig = {
        plugins: [plugin1, plugin2],
        enabled: false,
      }

      render(
        <AnalyticsProvider config={config}>
          <div>test</div>
        </AnalyticsProvider>
      )

      // Trigger beforeunload within act to ensure effects have run
      await act(async () => {
        const event = new Event('beforeunload')
        window.dispatchEvent(event)
      })

      expect(plugin1.flush).toHaveBeenCalledTimes(1)
      expect(plugin2.flush).toHaveBeenCalledTimes(1)
    })

    it('destroys all plugins on unmount', () => {
      const plugin1 = createMockPlugin('plugin-1')
      const plugin2 = createMockPlugin('plugin-2')

      const config: AnalyticsConfig = {
        plugins: [plugin1, plugin2],
        enabled: false,
      }

      const { unmount } = render(
        <AnalyticsProvider config={config}>
          <div>test</div>
        </AnalyticsProvider>
      )

      unmount()

      expect(plugin1.destroy).toHaveBeenCalledTimes(1)
      expect(plugin2.destroy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Console plugin with other plugins', () => {
    it('console plugin works alongside other plugins', () => {
      const consoleSpy = vi.spyOn(console, 'group').mockImplementation(() => {})
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {})

      const mockPlugin = createMockPlugin('mock')
      const debugPlugin = consolePlugin()

      const config: AnalyticsConfig = {
        plugins: [mockPlugin, debugPlugin],
        enabled: false,
      }

      const wrapper = createWrapper(config)
      const { result } = renderHook(() => useAnalytics(), { wrapper })

      act(() => {
        result.current.tourStarted('test-tour', 3)
      })

      // Mock plugin received the event
      expect(mockPlugin.track).toHaveBeenCalledTimes(1)

      // Console plugin logged the event
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
      consoleLogSpy.mockRestore()
      consoleGroupEndSpy.mockRestore()
    })
  })

  describe('Global properties across plugins', () => {
    it('all plugins receive global properties', () => {
      const plugin1 = createMockPlugin('plugin-1')
      const plugin2 = createMockPlugin('plugin-2')

      const config: AnalyticsConfig = {
        plugins: [plugin1, plugin2],
        enabled: false,
        globalProperties: {
          appVersion: '1.0.0',
          environment: 'test',
        },
      }

      const wrapper = createWrapper(config)
      const { result } = renderHook(() => useAnalytics(), { wrapper })

      act(() => {
        result.current.track('tour_started', { tourId: 'test-tour' })
      })

      const expectedEvent = expect.objectContaining({
        appVersion: '1.0.0',
        environment: 'test',
      })

      expect(plugin1.track).toHaveBeenCalledWith(expectedEvent)
      expect(plugin2.track).toHaveBeenCalledWith(expectedEvent)
    })
  })

  describe('Hint tracking across plugins', () => {
    it('all plugins receive hint events', () => {
      const plugin1 = createMockPlugin('plugin-1')
      const plugin2 = createMockPlugin('plugin-2')

      const config: AnalyticsConfig = {
        plugins: [plugin1, plugin2],
        enabled: false,
      }

      const wrapper = createWrapper(config)
      const { result } = renderHook(() => useAnalytics(), { wrapper })

      act(() => {
        result.current.hintShown('feature-hint', { feature: 'new-button' })
      })

      act(() => {
        result.current.hintClicked('feature-hint')
      })

      act(() => {
        result.current.hintDismissed('feature-hint')
      })

      expect(plugin1.track).toHaveBeenCalledTimes(3)
      expect(plugin2.track).toHaveBeenCalledTimes(3)

      const plugin1Events = (plugin1.track as ReturnType<typeof vi.fn>).mock.calls.map(
        (call) => call[0].eventName
      )
      expect(plugin1Events).toEqual(['hint_shown', 'hint_clicked', 'hint_dismissed'])
    })
  })

  describe('Step interactions', () => {
    it('tracks step interactions to all plugins', () => {
      const plugin1 = createMockPlugin('plugin-1')
      const plugin2 = createMockPlugin('plugin-2')

      const config: AnalyticsConfig = {
        plugins: [plugin1, plugin2],
        enabled: false,
      }

      const wrapper = createWrapper(config)
      const { result } = renderHook(() => useAnalytics(), { wrapper })

      act(() => {
        result.current.stepInteraction('tour-1', 'step-1', 'button_click', {
          buttonId: 'next',
        })
      })

      const expectedEvent = expect.objectContaining({
        eventName: 'step_interaction',
        tourId: 'tour-1',
        stepId: 'step-1',
        metadata: expect.objectContaining({
          interactionType: 'button_click',
          buttonId: 'next',
        }),
      })

      expect(plugin1.track).toHaveBeenCalledWith(expectedEvent)
      expect(plugin2.track).toHaveBeenCalledWith(expectedEvent)
    })
  })
})

describe('Plugin with async init', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('waits for async plugin init', async () => {
    const initOrder: string[] = []

    const asyncPlugin = createMockPlugin('async', {
      init: vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100))
        initOrder.push('async')
      }),
    })

    const syncPlugin = createMockPlugin('sync', {
      init: vi.fn().mockImplementation(() => {
        initOrder.push('sync')
      }),
    })

    const config: AnalyticsConfig = {
      plugins: [asyncPlugin, syncPlugin],
      enabled: true,
    }

    render(
      <AnalyticsProvider config={config}>
        <div>test</div>
      </AnalyticsProvider>
    )

    await vi.runAllTimersAsync()

    expect(asyncPlugin.init).toHaveBeenCalled()
    expect(syncPlugin.init).toHaveBeenCalled()
  })
})
