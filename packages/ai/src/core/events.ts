import type { AiChatEvent, AiChatEventType } from '../types/events'

/**
 * Fire-and-forget event emitter. Catches and logs handler errors
 * so they never break chat functionality. Handles both sync and async onEvent.
 */
export function emitEvent(
  onEvent: ((event: AiChatEvent) => void | Promise<void>) | undefined,
  type: AiChatEventType,
  data: Record<string, unknown> = {}
): void {
  if (!onEvent) return
  try {
    const result = onEvent({ type, data, timestamp: new Date() })
    // If onEvent returns a promise, catch async errors too
    if (result && typeof result.catch === 'function') {
      result.catch((error: unknown) => {
        console.warn(`[@tour-kit/ai] Async event handler error for '${type}':`, error)
      })
    }
  } catch (error) {
    console.warn(`[@tour-kit/ai] Event handler error for '${type}':`, error)
  }
}
