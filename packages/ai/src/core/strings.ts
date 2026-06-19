import type { AiChatStrings } from '../types'

// Single source of truth for the chat UI's English copy. Values mirror what the
// components shipped as inline literals before Slice 4 wired this in, so an
// unset `config.strings` renders exactly today's text.
export const DEFAULT_STRINGS: AiChatStrings = {
  placeholder: 'Type a message...',
  send: 'Send',
  errorMessage: 'Something went wrong. Please try again.',
  emptyState: 'How can I help you?',
  stopGenerating: 'Stop generating',
  retry: 'Retry',
  title: 'AI Assistant',
  closeLabel: 'Close chat',
  ratePositiveLabel: 'Helpful',
  rateNegativeLabel: 'Not helpful',
}

/**
 * Merge partial string overrides with defaults.
 * Returns a complete AiChatStrings object.
 */
export function resolveStrings(partial?: Partial<AiChatStrings>): AiChatStrings {
  if (!partial) return { ...DEFAULT_STRINGS }
  return { ...DEFAULT_STRINGS, ...partial }
}
