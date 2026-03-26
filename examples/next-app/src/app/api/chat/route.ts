import { openai } from '@ai-sdk/openai'
import { createChatRouteHandler } from '@tour-kit/ai/server'

const productDocs = [
  {
    id: 'getting-started',
    content:
      'To get started with Tour Kit, install the package and wrap your app in a TourKitProvider.',
    metadata: { title: 'Getting Started' },
  },
  {
    id: 'features',
    content: 'Tour Kit supports guided tours, hints, checklists, and AI-powered chat assistance.',
    metadata: { title: 'Features' },
  },
]

const { POST } = createChatRouteHandler({
  model: openai('gpt-4o-mini'),
  context: {
    strategy: 'context-stuffing',
    documents: productDocs,
  },
  instructions: {
    productName: 'Tour Kit Demo',
    tone: 'friendly',
    boundaries: ['Only answer questions about Tour Kit and its features'],
  },
})

export { POST }
