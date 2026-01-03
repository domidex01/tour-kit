import type { TourEvent } from '../types/events'
import type { AnalyticsPlugin } from '../types/plugin'

interface ConsolePluginOptions {
  /** Prefix for log messages */
  prefix?: string
  /** Use collapsed console groups */
  collapsed?: boolean
  /** Custom colors for different event types */
  colors?: {
    tour?: string
    step?: string
    hint?: string
  }
}

/**
 * Console plugin for debugging tour analytics
 */
export function consolePlugin(options: ConsolePluginOptions = {}): AnalyticsPlugin {
  const prefix = options.prefix ?? '🎯 TourKit'
  const collapsed = options.collapsed ?? false
  const colors = {
    tour: options.colors?.tour ?? '#6366f1',
    step: options.colors?.step ?? '#10b981',
    hint: options.colors?.hint ?? '#f59e0b',
  }

  const getColor = (eventName: string): string => {
    if (eventName.startsWith('tour_')) return colors.tour
    if (eventName.startsWith('step_')) return colors.step
    if (eventName.startsWith('hint_')) return colors.hint
    return colors.tour
  }

  return {
    name: 'console',

    track(event: TourEvent) {
      const color = getColor(event.eventName)
      const method = collapsed ? console.groupCollapsed : console.group

      method(
        `%c${prefix}%c ${event.eventName}`,
        `background: ${color}; color: white; padding: 2px 6px; border-radius: 3px;`,
        'color: inherit; font-weight: bold;'
      )

      console.log('Tour:', event.tourId)
      if (event.stepId)
        console.log('Step:', event.stepId, `(${event.stepIndex}/${event.totalSteps})`)
      if (event.duration) console.log('Duration:', `${event.duration}ms`)
      if (event.metadata && Object.keys(event.metadata).length > 0) {
        console.log('Metadata:', event.metadata)
      }
      console.log('Timestamp:', new Date(event.timestamp).toISOString())

      console.groupEnd()
    },

    identify(userId: string, properties?: Record<string, unknown>) {
      console.log(
        `%c${prefix}%c User Identified: ${userId}`,
        'background: #6366f1; color: white; padding: 2px 6px; border-radius: 3px;',
        'color: inherit;',
        properties
      )
    },
  }
}
