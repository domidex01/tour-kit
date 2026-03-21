// ============================================
// CONTEXT & PROVIDERS
// ============================================
export { AiChatProvider } from './context/ai-chat-provider'
export { AiChatContext, type AiChatContextValue } from './context/ai-chat-context'

// ============================================
// HOOKS
// ============================================
export { useAiChat, type UseAiChatReturn } from './hooks/use-ai-chat'

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
  Document,
  DocumentMetadata,
  RetrievedDocument,
  VectorStoreAdapter,
  EmbeddingAdapter,
  RateLimitStore,
  AiChatEvent,
  AiChatEventType,
} from './types'
