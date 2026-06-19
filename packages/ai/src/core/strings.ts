import type { AiChatStrings } from '../types'

// Single source of truth for the chat UI's English copy. Every key maps to a
// label the shipped components actually render; values mirror the inline
// literals from before Slice 4 wired this in, so an unset `config.strings`
// renders exactly today's text.
export const DEFAULT_STRINGS: AiChatStrings = {
  placeholder: 'Type a message...',
  send: 'Send message',
  errorMessage: 'Something went wrong. Please try again.',
  emptyState: 'Ask me anything!',
  stopGenerating: 'Stop generating',
  title: 'AI Assistant',
  closeLabel: 'Close chat',
}

/**
 * Merge partial string overrides with defaults.
 * Returns a complete AiChatStrings object.
 */
export function resolveStrings(partial?: Partial<AiChatStrings>): AiChatStrings {
  if (!partial) return { ...DEFAULT_STRINGS }
  return { ...DEFAULT_STRINGS, ...partial }
}
