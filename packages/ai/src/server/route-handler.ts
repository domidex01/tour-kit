import {
  type LanguageModel,
  type UIMessage,
  convertToModelMessages,
  streamText,
  wrapLanguageModel,
} from 'ai'
import { generateSuggestions } from '../core/suggestion-engine'
import type { ChatRouteHandlerOptions, ContextStuffingConfig, RAGConfig } from '../types'
import { createRAGMiddleware } from './rag-middleware'
import { createRetriever } from './retriever'
import { createSystemPrompt } from './system-prompt'

export function createChatRouteHandler(options: ChatRouteHandlerOptions): {
  POST: (req: Request) => Promise<Response>
} {
  const { model, context } = options

  // Build system prompt (shared by both strategies)
  const systemPrompt = createSystemPrompt({
    ...options.instructions,
    documents:
      context.strategy === 'context-stuffing' ? (context as ContextStuffingConfig).documents : [], // RAG injects docs via middleware, not system prompt
  })

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

      const { messages }: { messages: UIMessage[] } = await req.json()

      if (!messages || !Array.isArray(messages)) {
        return new Response(JSON.stringify({ error: 'Invalid request: messages array required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const lastMessage = messages[messages.length - 1]
      if (options.onEvent && lastMessage) {
        try {
          await options.onEvent({
            type: 'message_sent',
            data: { messageId: lastMessage.id, role: lastMessage.role },
            timestamp: new Date(),
          })
        } catch {
          // onEvent errors must never break the request
        }
      }

      if (options.beforeSend && lastMessage) {
        const result = await options.beforeSend(lastMessage)
        if (result === null) {
          return new Response(JSON.stringify({ error: 'Message blocked by beforeSend hook' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      }

      const modelMessages = convertToModelMessages(messages)

      const result = streamText({
        model: resolvedModel,
        system: systemPrompt,
        messages: modelMessages,
      })

      return result.toUIMessageStreamResponse()
    } catch (err) {
      if (options.onEvent) {
        try {
          await options.onEvent({
            type: 'error',
            data: { message: err instanceof Error ? err.message : 'Unknown error' },
            timestamp: new Date(),
          })
        } catch {
          // swallow
        }
      }

      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }
  }

  return { POST }
}
