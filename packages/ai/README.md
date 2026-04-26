# @tour-kit/ai

AI-powered chat assistant for product tours. Adds a conversational AI layer that understands your tour structure and guides users through onboarding.

**Alternative to:** Intercom Fin, Crisp MagicReply embedded for onboarding, Pendo Listen, hand-rolled OpenAI/Anthropic chat-with-tour-context.

## Installation

```bash
pnpm add @tour-kit/ai
```

## Quick Start

### Client Setup

Wrap your app with `AiChatProvider` and use the provided hooks:

```tsx
import { AiChatProvider, useAiChat, useTourAssistant } from '@tour-kit/ai'

function App() {
  return (
    <AiChatProvider
      config={{
        endpoint: '/api/chat',
        tourContext: true,
      }}
    >
      <ChatWidget />
    </AiChatProvider>
  )
}

function ChatWidget() {
  const { messages, sendMessage, status } = useAiChat()
  const { tourContext } = useTourAssistant()

  return (
    <div>
      {messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
      <input
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            sendMessage({ text: e.currentTarget.value })
          }
        }}
      />
    </div>
  )
}
```

### Server Setup (Next.js)

Create an API route handler:

```ts
// app/api/chat/route.ts
import { createChatRouteHandler } from '@tour-kit/ai/server'
import { openai } from '@ai-sdk/openai'

const { POST } = createChatRouteHandler({
  model: openai('gpt-4o-mini'),
  context: {
    strategy: 'context-stuffing',
    documents: [],
  },
})

export { POST }
```

## Features

- **Context-Augmented Generation (CAG)** — Stuff tour context directly into prompts
- **Retrieval-Augmented Generation (RAG)** — Vector search over documentation
- **Tour Integration** — Automatically understands your tour steps and state
- **Rate Limiting** — Client and server-side rate limiting out of the box
- **Suggestions** — AI-generated follow-up suggestions
- **SSR Safe** — Clean client/server separation

## API

### Client Exports

| Export | Description |
|--------|-------------|
| `AiChatProvider` | Context provider for AI chat |
| `useAiChat` | Core chat hook (messages, send, status) |
| `useTourAssistant` | Tour-aware assistant hook |
| `useSuggestions` | AI-generated suggestion chips |
| `AiChatSuggestions` | Pre-built suggestions component |

### Server Exports (`@tour-kit/ai/server`)

| Export | Description |
|--------|-------------|
| `createChatRouteHandler` | API route handler factory |
| `createSystemPrompt` | System prompt builder |
| `createInMemoryVectorStore` | In-memory vector store for RAG |
| `createRetriever` | Document retriever factory |
| `createRAGMiddleware` | RAG middleware for route handler |

## License

MIT
