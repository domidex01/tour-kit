import { createChatRouteHandler } from '@tour-kit/ai/server'
import { openai } from '@ai-sdk/openai'

export const runtime = 'nodejs'

const hasKey = Boolean(process.env.OPENAI_API_KEY)

const handler = hasKey
  ? createChatRouteHandler({
      model: openai('gpt-4o-mini'),
      context: {
        strategy: 'context-stuffing',
        documents: [
          {
            id: 'stacks-overview',
            content:
              'Stacks is a demo team workspace. Routes: /dashboard, /dashboard/projects, /dashboard/team, /dashboard/settings, /dashboard/help. Export CSV lives on the project kanban page.',
          },
        ],
      },
      instructions: {
        productName: 'Stacks',
        tone: 'friendly',
        custom:
          'You are the Stacks assistant. Keep answers short and grounded in the demo dashboard.',
      },
    })
  : null

export async function POST(req: Request) {
  if (!handler) {
    return new Response('AI key not configured — set OPENAI_API_KEY to enable chat.', {
      status: 200,
    })
  }
  return handler.POST(req)
}
