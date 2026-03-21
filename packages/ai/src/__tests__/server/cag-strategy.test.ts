import { describe, expect, it, vi, beforeEach } from 'vitest'
import { createMockStreamResult } from '../helpers/mock-stream-text'
import { createTestDocument } from '../helpers/test-documents'

const mockStreamResult = createMockStreamResult()

vi.mock('ai', () => ({
  streamText: vi.fn(() => mockStreamResult),
  convertToModelMessages: vi.fn((msgs: unknown[]) => msgs),
}))

describe('CAG Strategy — US-4', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('stuffs all document content into the system prompt', async () => {
    const { createChatRouteHandler } = await import('../../server/route-handler')
    const { streamText } = await import('ai')

    const docs = [
      createTestDocument({ id: 'doc-1', content: 'Tour Kit supports React 18 and 19.' }),
      createTestDocument({ id: 'doc-2', content: 'Install with pnpm add @tour-kit/core.' }),
      createTestDocument({ id: 'doc-3', content: 'WCAG 2.1 AA compliance is built-in.' }),
    ]

    const handler = createChatRouteHandler({
      model: 'openai/gpt-4o-mini',
      context: { strategy: 'context-stuffing', documents: docs },
    })

    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }],
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    await handler.POST(request)

    const streamTextCall = (streamText as ReturnType<typeof vi.fn>).mock.calls[0][0]
    const systemPrompt = streamTextCall.system as string

    expect(systemPrompt).toContain('Tour Kit supports React 18 and 19.')
    expect(systemPrompt).toContain('Install with pnpm add @tour-kit/core.')
    expect(systemPrompt).toContain('WCAG 2.1 AA compliance is built-in.')
  })

  it('handles empty documents array gracefully', async () => {
    const { createChatRouteHandler } = await import('../../server/route-handler')
    const { streamText } = await import('ai')

    const handler = createChatRouteHandler({
      model: 'openai/gpt-4o-mini',
      context: { strategy: 'context-stuffing', documents: [] },
    })

    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }],
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    await handler.POST(request)

    expect(streamText).toHaveBeenCalledTimes(1)
  })

  it('includes instructions config in system prompt when provided', async () => {
    const { createChatRouteHandler } = await import('../../server/route-handler')
    const { streamText } = await import('ai')

    const handler = createChatRouteHandler({
      model: 'openai/gpt-4o-mini',
      context: {
        strategy: 'context-stuffing',
        documents: [createTestDocument({ content: 'Some content.' })],
      },
      instructions: {
        productName: 'Tour Kit',
        productDescription: 'A headless onboarding library',
        tone: 'friendly',
        boundaries: ['Do not discuss competitor products'],
      },
    })

    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }],
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    await handler.POST(request)

    const streamTextCall = (streamText as ReturnType<typeof vi.fn>).mock.calls[0][0]
    const systemPrompt = streamTextCall.system as string

    expect(systemPrompt).toContain('Tour Kit')
    expect(systemPrompt).toContain('headless onboarding library')
    expect(systemPrompt).toContain('Do not discuss competitor products')
  })
})
