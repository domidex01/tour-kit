import type { MockTourContextValue } from './mock-tour-context'

/**
 * Creates a mock return value for useAiChatContext() that includes
 * the tourContextValue field used by useTourAssistant.
 */
export function createMockAiChatContextValue(
  tourContextValue: MockTourContextValue | null = null
) {
  return {
    tourContextValue,
    config: {
      endpoint: '/api/chat',
      tourContext: tourContextValue !== null,
    },
  }
}
