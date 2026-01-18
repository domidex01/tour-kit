# @tour-kit/ai

AI-powered personalization using Vercel AI SDK for Tour Kit.

> **Note**: This package is currently in development.

## Installation

```bash
npm install @tour-kit/ai @tour-kit/core ai
# or
pnpm add @tour-kit/ai @tour-kit/core ai
```

### Peer Dependencies

Install your preferred AI provider:

```bash
# OpenAI
npm install @ai-sdk/openai

# Anthropic
npm install @ai-sdk/anthropic
```

## Planned Features

### AI-Powered Tour Content

Generate personalized tour content based on user context:

```tsx
import { AIProvider, useAITour } from '@tour-kit/ai/react'

function App() {
  return (
    <AIProvider config={{ provider: 'openai', modelName: 'gpt-4o-mini' }}>
      <TourWithAI />
    </AIProvider>
  )
}

function TourWithAI() {
  const { personalizedContent } = useAITour({
    tour: baseTour,
    userContext: { role: 'developer', experience: 'beginner' },
  })

  return <Tour steps={personalizedContent} />
}
```

### Server Actions (Next.js)

```tsx
'use server'
import { createAIActions } from '@tour-kit/ai/server'

const ai = createAIActions({ provider: 'openai' })
export const getDecision = ai.getDecision
export const getContent = ai.getContent
```

### Tour Recommendations

```tsx
import { recommendTour } from '@tour-kit/ai'

const recommendation = await recommendTour({
  availableTours: tours,
  userBehavior: { pagesVisited: [...], timeOnSite: 300 },
  goal: 'increase feature adoption',
})
```

## Architecture

```
@tour-kit/ai
├── core/           # AI SDK utilities (server-side)
│   ├── schemas.ts  # Zod schemas for structured output
│   ├── provider.ts # createAIProvider factory
│   └── decision.ts # generateAIDecision
├── server/         # Server action/route helpers
│   └── actions.ts  # createAIActions for Server Actions
├── react/          # Client-side hooks
│   ├── context.tsx # AIProvider
│   └── use-ai-tour.ts
└── types/          # Type definitions
```

## Documentation

Full documentation: [https://tour-kit.dev/docs/ai](https://tour-kit.dev/docs/ai)

## License

MIT
