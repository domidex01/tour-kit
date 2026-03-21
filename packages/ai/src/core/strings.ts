import type { AiChatStrings } from '../types'

export const DEFAULT_STRINGS: AiChatStrings = {
  placeholder: 'Ask a question...',
  send: 'Send',
  errorMessage: 'Something went wrong. Please try again.',
  emptyState: 'How can I help you?',
  stopGenerating: 'Stop generating',
  retry: 'Retry',
  title: 'Chat',
  closeLabel: 'Close chat',
  ratePositiveLabel: 'Helpful',
  rateNegativeLabel: 'Not helpful',
}

/**
 * Merge partial string overrides with defaults.
 * Returns a complete AiChatStrings object.
 */
export function resolveStrings(
  partial?: Partial<AiChatStrings>
): AiChatStrings {
  if (!partial) return { ...DEFAULT_STRINGS }
  return { ...DEFAULT_STRINGS, ...partial }
}
