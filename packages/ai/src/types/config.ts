import type { LanguageModel, UIMessage } from 'ai'
import type { Document, RetrievedDocument } from './document'
import type { VectorStoreAdapter, EmbeddingAdapter, RateLimitStore } from './adapter'
import type { AiChatEvent } from './events'

// ── Client Config ──

export interface AiChatConfig {
  /** API endpoint for chat completions (e.g., '/api/chat') */
  endpoint: string
  /** Enable optional tour-kit context injection (requires @tour-kit/core) */
  tourContext?: boolean
  /** Suggestions config — static strings and/or dynamic AI-generated */
  suggestions?: SuggestionsConfig
  /** Chat persistence — 'local' for localStorage, or custom adapter */
  persistence?: PersistenceConfig
  /** Client-side rate limiting (UX protection) */
  rateLimit?: ClientRateLimitConfig
  /** Event callback for analytics/tracking */
  onEvent?(event: AiChatEvent): void
  /** Configurable UI strings (all have English defaults) */
  strings?: Partial<AiChatStrings>
  /** Error message shown to user on failure */
  errorMessage?: string
}

export interface SuggestionsConfig {
  /** Static suggestion strings shown immediately */
  static?: string[]
  /** Enable dynamic AI-generated suggestions after each response */
  dynamic?: boolean
  /** Cache TTL for dynamic suggestions in ms (default: 60000) */
  cacheTtl?: number
}

export type PersistenceConfig =
  | 'local'
  | { adapter: PersistenceAdapter }

export interface PersistenceAdapter {
  save(chatId: string, messages: UIMessage[]): Promise<void>
  load(chatId: string): Promise<UIMessage[] | null>
  clear(chatId: string): Promise<void>
}

export interface ClientRateLimitConfig {
  /** Max messages per window (default: 10) */
  maxMessages?: number
  /** Window duration in ms (default: 60000) */
  windowMs?: number
}

export interface AiChatStrings {
  /** Input placeholder text */
  placeholder: string
  /** Send button label */
  send: string
  /** Error message shown to user */
  errorMessage: string
  /** Empty state message */
  emptyState: string
  /** Stop generating button label */
  stopGenerating: string
  /** Retry button label */
  retry: string
  /** Chat panel title */
  title: string
  /** Close button aria-label */
  closeLabel: string
  /** Rating positive aria-label */
  ratePositiveLabel: string
  /** Rating negative aria-label */
  rateNegativeLabel: string
}

// ── Chat State ──

/**
 * Aligned with AI SDK 6's useChat status values.
 * 'ready' = idle, 'submitted' = request sent, 'streaming' = tokens arriving, 'error' = failed.
 */
export type ChatStatus = 'ready' | 'submitted' | 'streaming' | 'error'

export interface AiChatState {
  messages: UIMessage[]
  status: ChatStatus
  error: Error | null
  isOpen: boolean
}

// ── Server Config ──

export interface ChatRouteHandlerOptions {
  /** AI SDK model — string ID (e.g., 'openai/gpt-4o-mini') or model instance. RAG strategy requires a model instance. */
  model: LanguageModel
  /** Context strategy — how documents are provided to the LLM */
  context: ContextConfig
  /** Layered system prompt configuration */
  instructions?: InstructionsConfig
  /** Server-side rate limiting (cost protection) */
  rateLimit?: ServerRateLimitConfig
  /** Hook: runs before message is processed. Return null to block. */
  beforeSend?(message: UIMessage): Promise<UIMessage | null> | UIMessage | null
  /** Hook: runs before response is returned (output filtering) */
  beforeResponse?(response: string): Promise<string> | string
  /** Max request duration in seconds (default: 30) */
  maxDuration?: number
  /** Server-side event callback */
  onEvent?(event: AiChatEvent): void | Promise<void>
}

export type ContextConfig = ContextStuffingConfig | RAGConfig

export interface ContextStuffingConfig {
  strategy: 'context-stuffing'
  documents: Document[]
}

export interface RAGConfig {
  strategy: 'rag'
  documents: Document[]
  embedding: EmbeddingAdapter
  vectorStore?: VectorStoreAdapter
  topK?: number
  minScore?: number
  chunkSize?: number
  chunkOverlap?: number
  rerank?: { model: string; topN?: number }
}

export interface InstructionsConfig {
  productName?: string
  productDescription?: string
  tone?: 'professional' | 'friendly' | 'concise'
  boundaries?: string[]
  custom?: string
  override?: boolean
}

export interface ServerRateLimitConfig {
  maxMessages?: number
  windowMs?: number
  identifier: (req: Request) => string | Promise<string>
  store?: RateLimitStore
}

// ── RAG Pipeline Types ──

export interface RetrieverOptions {
  documents: Document[]
  embedding: EmbeddingAdapter
  vectorStore?: VectorStoreAdapter
  chunkSize?: number
  chunkOverlap?: number
}

export interface Retriever {
  index(): Promise<void>
  search(query: string, topK?: number, minScore?: number): Promise<RetrievedDocument[]>
}

export interface RAGMiddlewareOptions {
  retriever: Retriever
  topK?: number
  rerank?: { model: string; topN?: number }
  formatContext?(docs: RetrievedDocument[]): string
}
