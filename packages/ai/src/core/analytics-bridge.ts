import type { AnalyticsBridgeConfig } from '../types/config'
import type { AiChatEvent } from '../types/events'

/**
 * Creates an onEvent callback that forwards AiChatEvent to @tour-kit/analytics.
 *
 * @example
 * ```tsx
 * import { useAnalytics } from '@tour-kit/analytics'
 *
 * function App() {
 *   const { track } = useAnalytics()
 *   const onEvent = createAnalyticsBridge({ track })
 *
 *   return (
 *     <AiChatProvider config={{ onEvent, ... }}>
 *       {children}
 *     </AiChatProvider>
 *   )
 * }
 * ```
 */
export function createAnalyticsBridge(config: AnalyticsBridgeConfig): (event: AiChatEvent) => void {
  const prefix = config.prefix ?? 'ai_chat'
  return (event: AiChatEvent) => {
    config.track(`${prefix}.${event.type}`, {
      ...event.data,
      timestamp: event.timestamp.toISOString(),
    })
  }
}
