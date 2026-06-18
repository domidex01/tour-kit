import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TourAssistantContext } from '../../hooks/use-tour-assistant'

// Mock AI SDK
vi.mock('ai', () => ({
  streamText: vi.fn().mockReturnValue({
    toUIMessageStreamResponse: vi.fn().mockReturnValue(new Response('ok')),
  }),
  convertToModelMessages: vi.fn().mockReturnValue([]),
  wrapLanguageModel: vi.fn((opts: { model: unknown }) => opts.model),
}))

// Mock internal dependencies
vi.mock('../../core/events', () => ({
  emitEvent: vi.fn(),
}))

vi.mock('../../core/suggestion-engine', () => ({
  generateSuggestions: vi.fn().mockResolvedValue([]),
}))

vi.mock('../../server/rag-middleware', () => ({
  createRAGMiddleware: vi.fn(),
}))

vi.mock('../../server/rate-limiter', () => ({
  createServerRateLimiter: vi.fn(),
}))

vi.mock('../../server/retriever', () => ({
  createRetriever: vi.fn(),
}))

import { createChatRouteHandler } from '../../server/route-handler'
import { createSystemPrompt } from '../../server/system-prompt'

/** Fixture: tour context in request body */
const tourContextPayload: TourAssistantContext = {
  activeTour: {
    id: 'onboarding',
    name: 'Onboarding Tour',
    currentStep: 2,
    totalSteps: 5,
  },
  activeStep: {
    id: 'step-connect',
    title: 'Connect your data source',
    content: 'Click the Add Connection button.',
  },
  completedTours: ['getting-started'],
  checklistProgress: null,
}

describe('Route handler — tourContext parsing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('parses tourContext from request body JSON', async () => {
    const handler = createChatRouteHandler({
      model: {} as Parameters<typeof createChatRouteHandler>[0]['model'],
      context: { strategy: 'context-stuffing', documents: [] },
    })

    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [],
        tourContext: tourContextPayload,
      }),
    })

    const response = await handler.POST(request)
    expect(response).toBeInstanceOf(Response)
  })

  it('handles request without tourContext field', async () => {
    const handler = createChatRouteHandler({
      model: {} as Parameters<typeof createChatRouteHandler>[0]['model'],
      context: { strategy: 'context-stuffing', documents: [] },
    })

    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: [] }),
    })

    const response = await handler.POST(request)
    expect(response).toBeInstanceOf(Response)
  })

  it('system prompt includes tour context when tourContext is in body', () => {
    const prompt = createSystemPrompt({
      productName: 'TestApp',
      tourContext: tourContextPayload,
    })

    expect(prompt).toContain('Current User Context')
    expect(prompt).toContain('Onboarding Tour')
    expect(prompt).toContain('Connect your data source')
  })

  it('system prompt excludes tour context when not in body', () => {
    const prompt = createSystemPrompt({
      productName: 'TestApp',
    })

    expect(prompt).not.toContain('Current User Context')
  })
})

// US-5: parseTourContext() is the untrusted-input boundary — its truncation
// guards (title>500 / content>2000 → reject the whole context) are only
// reachable THROUGH the handler, so assert them at the streamText system prompt.
describe('Route handler — parseTourContext truncation guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  async function postWithTourContext(tourContext: unknown): Promise<string> {
    const { streamText } = await import('ai')
    const handler = createChatRouteHandler({
      model: {} as Parameters<typeof createChatRouteHandler>[0]['model'],
      context: { strategy: 'context-stuffing', documents: [] },
    })
    await handler.POST(
      new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hi' }] }],
          tourContext,
        }),
      })
    )
    const call = (streamText as ReturnType<typeof vi.fn>).mock.calls[0][0]
    return call.system as string
  }

  it('drops the whole tourContext when activeStep.title exceeds 500 chars', async () => {
    const system = await postWithTourContext({
      ...tourContextPayload,
      activeStep: { id: 'step-connect', title: 'x'.repeat(501), content: 'ok' },
    })
    expect(system).not.toContain('Current User Context')
  })

  it('drops the whole tourContext when activeStep.content exceeds 2000 chars', async () => {
    const system = await postWithTourContext({
      ...tourContextPayload,
      activeStep: { id: 'step-connect', title: 'Connect', content: 'y'.repeat(2001) },
    })
    expect(system).not.toContain('Current User Context')
  })

  it('keeps a tourContext whose fields are within the guards', async () => {
    const system = await postWithTourContext(tourContextPayload)
    expect(system).toContain('Current User Context')
    expect(system).toContain('Onboarding Tour')
  })
})
