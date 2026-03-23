import type { LanguageModel } from 'ai'
import { createChatRouteHandler } from '@tour-kit/ai/server'

// TODO: Install @ai-sdk/openai and replace with:
//   import { openai } from '@ai-sdk/openai'
//   const model = openai('gpt-4o-mini')
//
// Install a provider to use this route:
//   pnpm add @ai-sdk/openai
const model: LanguageModel = new Proxy({} as LanguageModel, {
  get(_, prop) {
    if (prop === 'modelId') return 'placeholder'
    if (prop === 'provider') return 'placeholder'
    throw new Error(
      'No AI model configured. Install @ai-sdk/openai and update this file. ' +
        'See: https://sdk.vercel.ai/docs/getting-started'
    )
  },
})

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
  model,
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
