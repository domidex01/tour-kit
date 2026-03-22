import {
  type LanguageModel,
  type UIMessage,
  convertToModelMessages,
  streamText,
  wrapLanguageModel,
} from 'ai'
import { emitEvent } from '../core/events'
import { generateSuggestions } from '../core/suggestion-engine'
import type { ChatRouteHandlerOptions, ContextStuffingConfig, RAGConfig } from '../types'
import { createRAGMiddleware } from './rag-middleware'
import { createServerRateLimiter } from './rate-limiter'
import { createRetriever } from './retriever'
import { createSystemPrompt } from './system-prompt'
import type { TourAssistantContext } from '../hooks/use-tour-assistant'

/** Validate and sanitize tourContext from untrusted request body */
function parseTourContext(raw: unknown): TourAssistantContext | undefined {
  if (!raw || typeof raw !== 'object') return undefined

  const obj = raw as Record<string, unknown>
  const activeTour = obj.activeTour
  const activeStep = obj.activeStep
  const completedTours = obj.completedTours

  // Validate activeTour shape
  if (activeTour != null) {
    if (typeof activeTour !== 'object') return undefined
    const t = activeTour as Record<string, unknown>
    if (typeof t.id !== 'string' || typeof t.name !== 'string') return undefined
    if (typeof t.currentStep !== 'number' || typeof t.totalSteps !== 'number') return undefined
  }

  // Validate activeStep shape
  if (activeStep != null) {
    if (typeof activeStep !== 'object') return undefined
    const s = activeStep as Record<string, unknown>
    if (typeof s.id !== 'string') return undefined
    // Truncate title/content to prevent prompt bloat from malicious input
    if (typeof s.title !== 'string' || typeof s.content !== 'string') return undefined
    if (s.title.length > 500 || s.content.length > 2000) return undefined
  }

  // Validate completedTours
  if (completedTours != null) {
    if (!Array.isArray(completedTours)) return undefined
    if (!completedTours.every((t): t is string => typeof t === 'string')) return undefined
    if (completedTours.length > 100) return undefined
  }

  return {
    activeTour: activeTour as TourAssistantContext['activeTour'],
    activeStep: activeStep as TourAssistantContext['activeStep'],
    completedTours: (completedTours as string[]) ?? [],
    checklistProgress: null,
  }
}

export function createChatRouteHandler(options: ChatRouteHandlerOptions): {
  POST: (req: Request) => Promise<Response>
} {
  const { model, context } = options

  // Build base system prompt config (shared by both strategies)
  const basePromptConfig = {
    ...options.instructions,
    documents:
      context.strategy === 'context-stuffing' ? (context as ContextStuffingConfig).documents : [],
  }

  // Set up RAG pipeline if needed (memoized across requests)
  let resolvedModel: LanguageModel = model
  if (context.strategy === 'rag') {
    const ragConfig = context as RAGConfig
    if (typeof model === 'string') {
      throw new Error(
        'RAG strategy requires a LanguageModel instance, not a string model ID. ' +
          'Use a model provider (e.g., openai("gpt-4o-mini")) instead.'
      )
    }

    const retriever = createRetriever({
      documents: ragConfig.documents,
      embedding: ragConfig.embedding,
      vectorStore: ragConfig.vectorStore,
      chunkSize: ragConfig.chunkSize,
      chunkOverlap: ragConfig.chunkOverlap,
    })

    const ragMiddleware = createRAGMiddleware({
      retriever,
      topK: ragConfig.topK,
      rerank: ragConfig.rerank,
    })

    resolvedModel = wrapLanguageModel({
      model,
      middleware: ragMiddleware,
    })
  }

  // Create server rate limiter if configured
  const serverRateLimiter = options.rateLimit
    ? createServerRateLimiter(options.rateLimit)
    : null

  async function handleSuggestions(req: Request): Promise<Response> {
    const body = await req.json()
    const messages: UIMessage[] = body.messages ?? []
    const simplifiedMessages = messages.map((m: UIMessage) => ({
      role: m.role,
      content: (m.parts ?? [])
        .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
        .map((p) => p.text)
        .join(' '),
    }))
    const suggestions = await generateSuggestions({
      messages: simplifiedMessages,
      model,
      productName: options.instructions?.productName,
    })
    return new Response(JSON.stringify({ suggestions }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  async function POST(req: Request): Promise<Response> {
    try {
      const url = new URL(req.url)

      if (url.searchParams.get('suggestions') === 'true') {
        return handleSuggestions(req)
      }

      const body = await req.json()
      const messages: UIMessage[] = body.messages
      const tourContext = parseTourContext(body.tourContext)

      if (!messages || !Array.isArray(messages)) {
        return new Response(JSON.stringify({ error: 'Invalid request: messages array required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      // ── Step 1: Server-side rate limiting ──
      if (serverRateLimiter) {
        const rateLimitResult = await serverRateLimiter.check(req)
        if (!rateLimitResult.allowed) {
          const retryAfterSeconds = Math.ceil(
            (rateLimitResult.resetAt - Date.now()) / 1000
          )
          emitEvent(options.onEvent, 'error', {
            error: 'Rate limit exceeded',
            source: 'server',
            reason: 'rate_limited',
          })
          return new Response(
            JSON.stringify({
              error: 'Too many requests',
              retryAfter: retryAfterSeconds,
            }),
            {
              status: 429,
              headers: {
                'Content-Type': 'application/json',
                'Retry-After': String(retryAfterSeconds),
                'X-RateLimit-Limit': String(rateLimitResult.limit),
                'X-RateLimit-Remaining': String(rateLimitResult.remaining),
                'X-RateLimit-Reset': String(rateLimitResult.resetAt),
              },
            }
          )
        }
      }

      // ── Step 2: beforeSend hook ──
      const lastMessage = messages[messages.length - 1]
      let processedMessages = messages

      if (options.beforeSend && lastMessage) {
        try {
          const hookResult = await options.beforeSend(lastMessage)
          if (hookResult === null) {
            emitEvent(options.onEvent, 'message_sent', {
              messageLength: 0,
              blocked: true,
            })
            return new Response(JSON.stringify({ blocked: true }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            })
          }
          // Replace last message with hook result
          processedMessages = [...messages.slice(0, -1), hookResult]
        } catch (error) {
          console.warn('[@tour-kit/ai] beforeSend hook error:', error)
          emitEvent(options.onEvent, 'error', {
            error: 'beforeSend hook failed',
            source: 'server',
            hookError: true,
          })
          // Continue with original messages
        }
      }

      // Emit message_sent event
      emitEvent(options.onEvent, 'message_sent', {
        messageId: lastMessage?.id,
        role: lastMessage?.role,
      })

      // ── Step 3: Convert and stream ──
      const modelMessages = convertToModelMessages(processedMessages)

      // Build system prompt per-request (includes optional tour context)
      const systemPrompt = createSystemPrompt({
        ...basePromptConfig,
        tourContext,
      })

      const result = streamText({
        model: resolvedModel,
        system: systemPrompt,
        messages: modelMessages,
        onFinish: async ({ text }) => {
          // ── Step 4: beforeResponse hook ──
          let finalText = text
          if (options.beforeResponse) {
            try {
              finalText = await options.beforeResponse(text)
            } catch (error) {
              console.warn('[@tour-kit/ai] beforeResponse hook error:', error)
              // Use original text on error
            }
          }

          emitEvent(options.onEvent, 'response_received', {
            responseLength: finalText.length,
            modified: finalText !== text,
          })
        },
      })

      return result.toUIMessageStreamResponse()
    } catch (err) {
      emitEvent(options.onEvent, 'error', {
        message: err instanceof Error ? err.message : 'Unknown error',
        source: 'server',
      })

      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  return { POST }
}
