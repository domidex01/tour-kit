import type { AiChatEvent, AiChatEventType } from '../types/events'

/**
 * Fire-and-forget event emitter. Catches and logs handler errors
 * so they never break chat functionality.
 */
export function emitEvent(
  onEvent: ((event: AiChatEvent) => void) | undefined,
  type: AiChatEventType,
  data: Record<string, unknown> = {}
): void {
  if (!onEvent) return
  try {
    onEvent({ type, data, timestamp: new Date() })
  } catch (error) {
    console.warn(`[@tour-kit/ai] Event handler error for '${type}':`, error)
  }
}
