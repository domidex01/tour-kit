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
export { AiChatSuggestions, type AiChatSuggestionsProps } from './components/ai-chat-suggestions'

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
