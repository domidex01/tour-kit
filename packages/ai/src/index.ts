// ============================================
// CONTEXT & PROVIDERS
// ============================================
export { AiChatProvider } from './context/ai-chat-provider'
export { AiChatContext, useAiChatContext, type AiChatContextValue } from './context/ai-chat-context'

// ============================================
// HOOKS
// ============================================
export { useAiChat, type UseAiChatReturn } from './hooks/use-ai-chat'
export {
  useTourAssistant,
  assembleTourContext,
  type UseTourAssistantReturn,
  type TourAssistantContext,
} from './hooks/use-tour-assistant'
export {
  useSuggestions,
  useOptionalSuggestions,
  type UseSuggestionsReturn,
} from './hooks/use-suggestions'

// ============================================
// COMPONENTS
// ============================================
export { AiChatPanel, type AiChatPanelProps } from './components/ai-chat-panel'
export { AiChatToggle, type AiChatToggleProps } from './components/ai-chat-toggle'
export { AiChatHeader, type AiChatHeaderProps } from './components/ai-chat-header'
export {
  AiChatMessageList,
  type AiChatMessageListProps,
} from './components/ai-chat-message-list'
export { AiChatMessage, type AiChatMessageProps } from './components/ai-chat-message'
export { AiChatInput, type AiChatInputProps } from './components/ai-chat-input'
export { AiChatSuggestions, type AiChatSuggestionsProps } from './components/ai-chat-suggestions'
export { AiChatPortal, type AiChatPortalProps } from './components/primitives/ai-chat-portal'

// ============================================
// VARIANTS
// ============================================
export {
  aiChatPanelVariants,
  aiChatHeaderVariants,
  aiChatMessageVariants,
  aiChatSuggestionChipVariants,
  aiChatToggleVariants,
} from './components/ui'

// ============================================
// CORE UTILITIES
// ============================================
export { SlidingWindowRateLimiter, createRateLimiter } from './core/rate-limiter'
export { createAnalyticsBridge } from './core/analytics-bridge'

// ============================================
// TYPES
// ============================================
export type {
  AiChatConfig,
  SuggestionsConfig,
  PersistenceConfig,
  PersistenceAdapter,
  ClientRateLimitConfig,
  AiChatStrings,
  ChatStatus,
  AiChatState,
  ChatRouteHandlerOptions,
  ContextConfig,
  ContextStuffingConfig,
  RAGConfig,
  InstructionsConfig,
  ServerRateLimitConfig,
  ServerRateLimitResult,
  RateLimitStatus,
  AnalyticsBridgeConfig,
  Document,
  DocumentMetadata,
  RetrievedDocument,
  VectorStoreAdapter,
  EmbeddingAdapter,
  RateLimitStore,
  AiChatEvent,
  AiChatEventType,
} from './types'
