import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { consolePlugin } from '../../plugins/console'
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

describe('consolePlugin', () => {
  let consoleSpy: {
    log: ReturnType<typeof vi.spyOn>
    group: ReturnType<typeof vi.spyOn>
    groupCollapsed: ReturnType<typeof vi.spyOn>
    groupEnd: ReturnType<typeof vi.spyOn>
  }

  beforeEach(() => {
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      group: vi.spyOn(console, 'group').mockImplementation(() => {}),
      groupCollapsed: vi.spyOn(console, 'groupCollapsed').mockImplementation(() => {}),
      groupEnd: vi.spyOn(console, 'groupEnd').mockImplementation(() => {}),
    }
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T12:00:00.000Z'))
  })

  afterEach(() => {
    consoleSpy.log.mockRestore()
    consoleSpy.group.mockRestore()
    consoleSpy.groupCollapsed.mockRestore()
    consoleSpy.groupEnd.mockRestore()
    vi.useRealTimers()
  })

  describe('Plugin Creation', () => {
    it('creates plugin with correct name', () => {
      const plugin = consolePlugin()
      expect(plugin.name).toBe('console')
    })

    it('creates plugin with default options', () => {
      const plugin = consolePlugin()
      expect(plugin).toBeDefined()
      expect(typeof plugin.track).toBe('function')
      expect(typeof plugin.identify).toBe('function')
    })

    it('creates plugin with custom options', () => {
      const plugin = consolePlugin({
        prefix: 'Custom Prefix',
        collapsed: true,
        colors: {
          tour: '#ff0000',
          step: '#00ff00',
          hint: '#0000ff',
        },
      })
      expect(plugin).toBeDefined()
    })
  })

  describe('track', () => {
    it('logs events with console.group by default', () => {
      const plugin = consolePlugin()
      const event = createMockEvent()

      plugin.track(event)

      expect(consoleSpy.group).toHaveBeenCalledTimes(1)
      expect(consoleSpy.groupCollapsed).not.toHaveBeenCalled()
    })

    it('uses console.groupCollapsed when collapsed option is true', () => {
      const plugin = consolePlugin({ collapsed: true })
      const event = createMockEvent()

      plugin.track(event)

      expect(consoleSpy.groupCollapsed).toHaveBeenCalledTimes(1)
      expect(consoleSpy.group).not.toHaveBeenCalled()
    })

    it('logs event name with styled prefix', () => {
      const plugin = consolePlugin()
      const event = createMockEvent({ eventName: 'tour_started' })

      plugin.track(event)

      expect(consoleSpy.group).toHaveBeenCalledWith(
        expect.stringContaining('TourKit'),
        expect.stringContaining('background:'),
        expect.any(String)
      )
    })

    it('uses custom prefix when provided', () => {
      const plugin = consolePlugin({ prefix: 'MyApp Tours' })
      const event = createMockEvent()

      plugin.track(event)

      expect(consoleSpy.group).toHaveBeenCalledWith(
        expect.stringContaining('MyApp Tours'),
        expect.any(String),
        expect.any(String)
      )
    })

    it('logs tour ID', () => {
      const plugin = consolePlugin()
      const event = createMockEvent({ tourId: 'my-tour-123' })

      plugin.track(event)

      expect(consoleSpy.log).toHaveBeenCalledWith('Tour:', 'my-tour-123')
    })

    it('logs step information when present', () => {
      const plugin = consolePlugin()
      const event = createMockEvent({
        stepId: 'step-1',
        stepIndex: 0,
        totalSteps: 5,
      })

      plugin.track(event)

      expect(consoleSpy.log).toHaveBeenCalledWith('Step:', 'step-1', '(0/5)')
    })

    it('does not log step info when stepId is not present', () => {
      const plugin = consolePlugin()
      const event = createMockEvent({ stepId: undefined })

      plugin.track(event)

      const stepLogCalls = consoleSpy.log.mock.calls.filter(
        (call: unknown[]) => call[0] === 'Step:'
      )
      expect(stepLogCalls).toHaveLength(0)
    })

    it('logs duration when present', () => {
      const plugin = consolePlugin()
      const event = createMockEvent({ duration: 5000 })

      plugin.track(event)

      expect(consoleSpy.log).toHaveBeenCalledWith('Duration:', '5000ms')
    })

    it('does not log duration when not present', () => {
      const plugin = consolePlugin()
      const event = createMockEvent({ duration: undefined })

      plugin.track(event)

      const durationLogCalls = consoleSpy.log.mock.calls.filter(
        (call: unknown[]) => call[0] === 'Duration:'
      )
      expect(durationLogCalls).toHaveLength(0)
    })

    it('logs metadata when present and not empty', () => {
      const plugin = consolePlugin()
      const event = createMockEvent({
        metadata: { source: 'button', variant: 'primary' },
      })

      plugin.track(event)

      expect(consoleSpy.log).toHaveBeenCalledWith('Metadata:', {
        source: 'button',
        variant: 'primary',
      })
    })

    it('does not log metadata when empty', () => {
      const plugin = consolePlugin()
      const event = createMockEvent({ metadata: {} })

      plugin.track(event)

      const metadataLogCalls = consoleSpy.log.mock.calls.filter(
        (call: unknown[]) => call[0] === 'Metadata:'
      )
      expect(metadataLogCalls).toHaveLength(0)
    })

    it('does not log metadata when not present', () => {
      const plugin = consolePlugin()
      const event = createMockEvent({ metadata: undefined })

      plugin.track(event)

      const metadataLogCalls = consoleSpy.log.mock.calls.filter(
        (call: unknown[]) => call[0] === 'Metadata:'
      )
      expect(metadataLogCalls).toHaveLength(0)
    })

    it('logs timestamp as ISO string', () => {
      const plugin = consolePlugin()
      const event = createMockEvent({ timestamp: Date.now() })

      plugin.track(event)

      expect(consoleSpy.log).toHaveBeenCalledWith('Timestamp:', '2024-01-01T12:00:00.000Z')
    })

    it('closes group after logging', () => {
      const plugin = consolePlugin()
      const event = createMockEvent()

      plugin.track(event)

      expect(consoleSpy.groupEnd).toHaveBeenCalledTimes(1)
    })
  })

  describe('Event-based Color Selection', () => {
    it('uses tour color for tour_* events', () => {
      const plugin = consolePlugin({ colors: { tour: '#ff0000' } })

      plugin.track(createMockEvent({ eventName: 'tour_started' }))
      expect(consoleSpy.group).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('#ff0000'),
        expect.any(String)
      )

      consoleSpy.group.mockClear()
      plugin.track(createMockEvent({ eventName: 'tour_completed' }))
      expect(consoleSpy.group).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('#ff0000'),
        expect.any(String)
      )
    })

    it('uses step color for step_* events', () => {
      const plugin = consolePlugin({ colors: { step: '#00ff00' } })

      plugin.track(createMockEvent({ eventName: 'step_viewed' }))
      expect(consoleSpy.group).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('#00ff00'),
        expect.any(String)
      )

      consoleSpy.group.mockClear()
      plugin.track(createMockEvent({ eventName: 'step_completed' }))
      expect(consoleSpy.group).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('#00ff00'),
        expect.any(String)
      )
    })

    it('uses hint color for hint_* events', () => {
      const plugin = consolePlugin({ colors: { hint: '#0000ff' } })

      plugin.track(createMockEvent({ eventName: 'hint_shown' }))
      expect(consoleSpy.group).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('#0000ff'),
        expect.any(String)
      )

      consoleSpy.group.mockClear()
      plugin.track(createMockEvent({ eventName: 'hint_dismissed' }))
      expect(consoleSpy.group).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('#0000ff'),
        expect.any(String)
      )
    })

    it('uses default colors when not specified', () => {
      const plugin = consolePlugin()

      // Default tour color is #6366f1
      plugin.track(createMockEvent({ eventName: 'tour_started' }))
      expect(consoleSpy.group).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('#6366f1'),
        expect.any(String)
      )

      consoleSpy.group.mockClear()

      // Default step color is #10b981
      plugin.track(createMockEvent({ eventName: 'step_viewed' }))
      expect(consoleSpy.group).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('#10b981'),
        expect.any(String)
      )

      consoleSpy.group.mockClear()

      // Default hint color is #f59e0b
      plugin.track(createMockEvent({ eventName: 'hint_shown' }))
      expect(consoleSpy.group).toHaveBeenCalledWith(
        expect.any(String),
        expect.stringContaining('#f59e0b'),
        expect.any(String)
      )
    })
  })

  describe('identify', () => {
    it('logs user identification', () => {
      const plugin = consolePlugin()

      plugin.identify?.('user-123')

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('TourKit'),
        expect.stringContaining('background:'),
        expect.any(String),
        undefined
      )
    })

    it('logs user ID in message', () => {
      const plugin = consolePlugin()

      plugin.identify?.('user-456')

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('user-456'),
        expect.any(String),
        expect.any(String),
        undefined
      )
    })

    it('logs user properties when provided', () => {
      const plugin = consolePlugin()
      const properties = { plan: 'pro', role: 'admin' }

      plugin.identify?.('user-123', properties)

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.any(String),
        properties
      )
    })

    it('uses custom prefix in identify', () => {
      const plugin = consolePlugin({ prefix: 'Custom' })

      plugin.identify?.('user-123')

      expect(consoleSpy.log).toHaveBeenCalledWith(
        expect.stringContaining('Custom'),
        expect.any(String),
        expect.any(String),
        undefined
      )
    })
  })

  describe('Optional Methods', () => {
    it('does not have init method', () => {
      const plugin = consolePlugin()
      expect(plugin.init).toBeUndefined()
    })

    it('does not have flush method', () => {
      const plugin = consolePlugin()
      expect(plugin.flush).toBeUndefined()
    })

    it('does not have destroy method', () => {
      const plugin = consolePlugin()
      expect(plugin.destroy).toBeUndefined()
    })
  })
})
