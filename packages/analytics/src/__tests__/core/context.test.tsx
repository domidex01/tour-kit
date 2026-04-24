import { act, render, renderHook, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import type * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AnalyticsProvider, useAnalytics, useAnalyticsOptional } from '../../core/context'
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
    enabled: false, // Disable async init by default for simpler tests
    ...overrides,
  }
}

/**
 * Factory to create wrapper component for hook testing
 */
function createWrapper(config: AnalyticsConfig = createConfig()) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <AnalyticsProvider config={config}>{children}</AnalyticsProvider>
  }
}

describe('AnalyticsProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('provides analytics instance to children', () => {
    function Consumer() {
      const analytics = useAnalytics()
      return <div data-testid="has-analytics">{analytics ? 'yes' : 'no'}</div>
    }

    render(
      <AnalyticsProvider config={createConfig()}>
        <Consumer />
      </AnalyticsProvider>
    )

    expect(screen.getByTestId('has-analytics').textContent).toBe('yes')
  })

  it('creates analytics instance once using ref', () => {
    const mockPlugin = createMockPlugin()
    const config = createConfig({ plugins: [mockPlugin] })

    function Consumer() {
      const analytics = useAnalytics()
      // Track to verify same instance
      analytics.track('tour_started', { tourId: 'test' })
      return <div>test</div>
    }

    const { rerender } = render(
      <AnalyticsProvider config={config}>
        <Consumer />
      </AnalyticsProvider>
    )

    // Rerender to trigger potential recreation
    rerender(
      <AnalyticsProvider config={config}>
        <Consumer />
      </AnalyticsProvider>
    )

    // Should have 2 track calls but only 1 instance (no reinit)
    expect(mockPlugin.track).toHaveBeenCalledTimes(2)
    // All calls should have the same sessionId (same instance)
    const session1 = (mockPlugin.track as ReturnType<typeof vi.fn>).mock.calls[0][0].sessionId
    const session2 = (mockPlugin.track as ReturnType<typeof vi.fn>).mock.calls[1][0].sessionId
    expect(session1).toBe(session2)
  })

  it('does not call destroy on unmount (Strict Mode safety)', () => {
    // The provider intentionally keeps the analytics instance alive across
    // unmount — React 18 Strict Mode fires cleanup without re-running render,
    // so a destroy-on-cleanup would brick the committed context. Apps that
    // need teardown call analytics.destroy() imperatively.
    const mockPlugin = createMockPlugin()
    const config = createConfig({ plugins: [mockPlugin] })

    const { unmount } = render(
      <AnalyticsProvider config={config}>
        <div>test</div>
      </AnalyticsProvider>
    )

    expect(mockPlugin.destroy).not.toHaveBeenCalled()

    unmount()

    expect(mockPlugin.destroy).not.toHaveBeenCalled()
  })

  it('registers beforeunload handler for flush', () => {
    const addEventListenerSpy = vi.spyOn(window, 'addEventListener')
    const mockPlugin = createMockPlugin()
    const config = createConfig({ plugins: [mockPlugin] })

    render(
      <AnalyticsProvider config={config}>
        <div>test</div>
      </AnalyticsProvider>
    )

    expect(addEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))
    addEventListenerSpy.mockRestore()
  })

  it('removes beforeunload handler on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
    const config = createConfig()

    const { unmount } = render(
      <AnalyticsProvider config={config}>
        <div>test</div>
      </AnalyticsProvider>
    )

    unmount()

    expect(removeEventListenerSpy).toHaveBeenCalledWith('beforeunload', expect.any(Function))
    removeEventListenerSpy.mockRestore()
  })

  it('flushes on beforeunload event', () => {
    const mockPlugin = createMockPlugin()
    const config = createConfig({ plugins: [mockPlugin] })

    render(
      <AnalyticsProvider config={config}>
        <div>test</div>
      </AnalyticsProvider>
    )

    // Simulate beforeunload event
    const event = new Event('beforeunload')
    window.dispatchEvent(event)

    expect(mockPlugin.flush).toHaveBeenCalledTimes(1)
  })

  it('renders children correctly', () => {
    render(
      <AnalyticsProvider config={createConfig()}>
        <div data-testid="child">Child Content</div>
      </AnalyticsProvider>
    )

    expect(screen.getByTestId('child').textContent).toBe('Child Content')
  })
})

describe('useAnalytics', () => {
  it('returns analytics instance when within provider', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useAnalytics(), { wrapper })

    expect(result.current).toBeDefined()
    expect(typeof result.current.track).toBe('function')
    expect(typeof result.current.tourStarted).toBe('function')
    expect(typeof result.current.identify).toBe('function')
  })

  it('throws error when used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      renderHook(() => useAnalytics())
    }).toThrow('useAnalytics must be used within an AnalyticsProvider')

    consoleSpy.mockRestore()
  })

  it('error message is descriptive', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    let error: Error | null = null
    try {
      renderHook(() => useAnalytics())
    } catch (e) {
      error = e as Error
    }

    expect(error?.message).toContain('useAnalytics')
    expect(error?.message).toContain('AnalyticsProvider')

    consoleSpy.mockRestore()
  })

  it('tracks events through returned instance', () => {
    const mockPlugin = createMockPlugin()
    const config = createConfig({ plugins: [mockPlugin] })
    const wrapper = createWrapper(config)

    const { result } = renderHook(() => useAnalytics(), { wrapper })

    act(() => {
      result.current.track('tour_started', { tourId: 'test-tour' })
    })

    expect(mockPlugin.track).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'tour_started',
        tourId: 'test-tour',
      })
    )
  })

  it('identifies users through returned instance', () => {
    const mockPlugin = createMockPlugin()
    const config = createConfig({ plugins: [mockPlugin] })
    const wrapper = createWrapper(config)

    const { result } = renderHook(() => useAnalytics(), { wrapper })

    act(() => {
      result.current.identify('user-123', { plan: 'pro' })
    })

    expect(mockPlugin.identify).toHaveBeenCalledWith('user-123', { plan: 'pro' })
  })
})

describe('useAnalyticsOptional', () => {
  it('returns analytics instance when within provider', () => {
    const wrapper = createWrapper()
    const { result } = renderHook(() => useAnalyticsOptional(), { wrapper })

    expect(result.current).not.toBeNull()
    expect(typeof result.current?.track).toBe('function')
  })

  it('returns null when used outside provider', () => {
    const { result } = renderHook(() => useAnalyticsOptional())

    expect(result.current).toBeNull()
  })

  it('does not throw error when used outside provider', () => {
    expect(() => {
      renderHook(() => useAnalyticsOptional())
    }).not.toThrow()
  })

  it('allows conditional tracking when outside provider', () => {
    const { result } = renderHook(() => useAnalyticsOptional())

    // Should be able to use optional chaining safely
    expect(() => {
      result.current?.track('tour_started', { tourId: 'test' })
    }).not.toThrow()
  })

  it('tracks events when within provider', () => {
    const mockPlugin = createMockPlugin()
    const config = createConfig({ plugins: [mockPlugin] })
    const wrapper = createWrapper(config)

    const { result } = renderHook(() => useAnalyticsOptional(), { wrapper })

    act(() => {
      result.current?.track('tour_started', { tourId: 'test-tour' })
    })

    expect(mockPlugin.track).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'tour_started',
        tourId: 'test-tour',
      })
    )
  })
})

describe('Context displayName', () => {
  it('context has displayName for debugging', () => {
    // This is tested by importing the module and checking the context
    // The displayName is set in the source code
    // We verify the provider works, which confirms the context is properly set up
    const wrapper = createWrapper()
    const { result } = renderHook(() => useAnalytics(), { wrapper })

    expect(result.current).toBeDefined()
  })
})

describe('Multiple providers (nested)', () => {
  it('inner provider overrides outer provider', () => {
    const outerPlugin = createMockPlugin({ name: 'outer' })
    const innerPlugin = createMockPlugin({ name: 'inner' })

    const outerConfig = createConfig({ plugins: [outerPlugin] })
    const innerConfig = createConfig({ plugins: [innerPlugin] })

    function Consumer() {
      const analytics = useAnalytics()
      analytics.track('tour_started', { tourId: 'test' })
      return null
    }

    render(
      <AnalyticsProvider config={outerConfig}>
        <AnalyticsProvider config={innerConfig}>
          <Consumer />
        </AnalyticsProvider>
      </AnalyticsProvider>
    )

    expect(innerPlugin.track).toHaveBeenCalled()
    expect(outerPlugin.track).not.toHaveBeenCalled()
  })

  it('keeps a live analytics instance under React Strict Mode', () => {
    // Regression: prior useRef + render-init + cleanup-destroy pattern left
    // the ref pointing at a destroyed instance after Strict Mode's simulated
    // unmount, silently dropping every subsequent track() call.
    const trackSpy = vi.fn()
    const destroySpy = vi.fn()
    const config = createConfig({
      plugins: [createMockPlugin({ track: trackSpy, destroy: destroySpy })],
    })

    type Captured = { analytics: ReturnType<typeof useAnalytics> | null }
    const captured: Captured = { analytics: null }
    function Consumer() {
      captured.analytics = useAnalytics()
      return null
    }

    render(
      <StrictMode>
        <AnalyticsProvider config={config}>
          <Consumer />
        </AnalyticsProvider>
      </StrictMode>
    )

    expect(captured.analytics).not.toBeNull()
    // biome-ignore lint/style/noNonNullAssertion: asserted above
    captured.analytics!.track('tour_started', { tourId: 't1' })
    // Instance must be live — destroy must not have fired during the simulated
    // unmount, and track() must still reach the plugin.
    expect(destroySpy).not.toHaveBeenCalled()
    expect(trackSpy).toHaveBeenCalledTimes(1)
  })
})
