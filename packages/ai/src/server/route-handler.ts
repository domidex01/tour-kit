import { convertToModelMessages, streamText, type UIMessage } from 'ai'
import type { ChatRouteHandlerOptions, ContextStuffingConfig } from '../types'

export function createChatRouteHandler(options: ChatRouteHandlerOptions): { POST: (req: Request) => Promise<Response> } {
  const { model, context, instructions } = options

  if (context.strategy === 'rag') {
    throw new Error(
      'RAG strategy is not yet implemented. Use "context-stuffing" strategy.'
    )
  }

  const systemPrompt = buildSystemPrompt(context as ContextStuffingConfig, instructions)

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

function buildSystemPrompt(
  context: ContextStuffingConfig,
  instructions?: ChatRouteHandlerOptions['instructions']
): string {
  const parts: string[] = []

  if (!instructions?.override) {
    const productName = instructions?.productName ?? 'this product'
    parts.push(
      `You are a helpful assistant for ${productName}.`,
      'Answer questions based ONLY on the provided documentation context.',
      'If the answer is not in the provided context, say "I don\'t have information about that in my documentation."',
      'Do not make up information or hallucinate facts.',
      'Be concise and direct in your responses.',
    )
  }

  if (instructions?.productDescription) {
    parts.push(`Product description: ${instructions.productDescription}`)
  }

  if (instructions?.tone) {
    const toneMap = {
      professional: 'Use a professional, authoritative tone.',
      friendly: 'Use a warm, friendly, approachable tone.',
      concise: 'Be extremely concise. Use short sentences and bullet points.',
    } as const
    parts.push(toneMap[instructions.tone])
  }

  if (instructions?.boundaries && instructions.boundaries.length > 0) {
    parts.push('BOUNDARIES:')
    for (const boundary of instructions.boundaries) {
      parts.push(`- ${boundary}`)
    }
  }

  if (instructions?.custom) {
    parts.push(instructions.custom)
  }

  if (context.documents.length > 0) {
    parts.push('')
    parts.push('--- DOCUMENTATION CONTEXT ---')
    for (const doc of context.documents) {
      const header = doc.metadata?.title ? `[${doc.metadata.title}]` : `[Document ${doc.id}]`
      parts.push(`${header}\n${doc.content}`)
    }
    parts.push('--- END DOCUMENTATION CONTEXT ---')
  }

  return parts.join('\n')
}
