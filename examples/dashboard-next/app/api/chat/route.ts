import { openai } from '@ai-sdk/openai'
import { createChatRouteHandler } from '@tour-kit/ai/server'
import { createUIMessageStream, createUIMessageStreamResponse } from 'ai'

export const runtime = 'nodejs'

const hasKey = Boolean(process.env.OPENAI_API_KEY)

const handler = hasKey
  ? createChatRouteHandler({
      model: openai('gpt-4o-mini'),
      context: {
        strategy: 'context-stuffing',
        documents: [
          {
            id: 'helm-overview',
            content:
              'Helm is a demo B2B project-analytics workspace. Routes: /dashboard, /dashboard/projects, /dashboard/analytics, /dashboard/team, /dashboard/billing, /dashboard/settings. To invite a teammate, open Team and click Invite. Export CSV lives on the Analytics page.',
          },
        ],
      },
      instructions: {
        productName: 'Helm',
        tone: 'friendly',
        custom:
          'You are the Helm assistant. Keep answers short and grounded in the demo dashboard.',
      },
    })
  : null

const fallbackMessage = 'AI key not configured. Set OPENAI_API_KEY to enable live chat.'

function createFallbackResponse() {
  const textId = 'fallback-text'
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      writer.write({ type: 'start', messageId: 'fallback-assistant' })
      writer.write({ type: 'text-start', id: textId })
      writer.write({ type: 'text-delta', id: textId, delta: fallbackMessage })
      writer.write({ type: 'text-end', id: textId })
      writer.write({ type: 'finish', finishReason: 'stop' })
    },
  })

  return createUIMessageStreamResponse({ stream })
}

export async function POST(req: Request) {
  if (!handler) {
    return createFallbackResponse()
  }
  return handler.POST(req)
}
