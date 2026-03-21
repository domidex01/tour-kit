import { convertToModelMessages, streamText, type UIMessage } from 'ai'
import type { ChatRouteHandlerOptions, ContextStuffingConfig } from '../types'
import { createSystemPrompt } from './system-prompt'

export function createChatRouteHandler(options: ChatRouteHandlerOptions): { POST: (req: Request) => Promise<Response> } {
  const { model, context } = options

  if (context.strategy === 'rag') {
    throw new Error(
      'RAG strategy is not yet implemented. Use "context-stuffing" strategy.'
    )
  }

  const cagContext = context as ContextStuffingConfig
  const systemPrompt = createSystemPrompt({
    ...options.instructions,
    documents: cagContext.documents,
  })

  async function POST(req: Request): Promise<Response> {
    try {
      const { messages }: { messages: UIMessage[] } = await req.json()

      if (!messages || !Array.isArray(messages)) {
        return new Response(
          JSON.stringify({ error: 'Invalid request: messages array required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
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
          return new Response(
            JSON.stringify({ error: 'Message blocked by beforeSend hook' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          )
        }
      }

      const modelMessages = convertToModelMessages(messages)

      const result = streamText({
        model,
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

      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }

  return { POST }
}
