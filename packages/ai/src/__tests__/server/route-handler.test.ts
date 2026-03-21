import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockStreamResult } from '../helpers/mock-stream-text'
import { createTestDocuments } from '../helpers/test-documents'

const mockStreamResult = createMockStreamResult()

vi.mock('ai', () => ({
  streamText: vi.fn(() => mockStreamResult),
  convertToModelMessages: vi.fn((msgs: unknown[]) => msgs),
}))

describe('createChatRouteHandler — US-2', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns an object with a POST function', async () => {
    const { createChatRouteHandler } = await import('../../server/route-handler')

    const handler = createChatRouteHandler({
      model: 'openai/gpt-4o-mini',
      context: {
        strategy: 'context-stuffing',
        documents: createTestDocuments(3),
      },
    })

    expect(handler).toHaveProperty('POST')
    expect(typeof handler.POST).toBe('function')
  })

  it('POST returns a Response object', async () => {
    const { createChatRouteHandler } = await import('../../server/route-handler')
    const { streamText } = await import('ai')

    const handler = createChatRouteHandler({
      model: 'openai/gpt-4o-mini',
      context: {
        strategy: 'context-stuffing',
        documents: createTestDocuments(3),
      },
    })

    const request = new Request('http://localhost/api/chat', {
      method: 'POST',
      body: JSON.stringify({
        messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] }],
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await handler.POST(request)

    expect(response).toBeInstanceOf(Response)
    expect(streamText).toHaveBeenCalledTimes(1)
    expect(mockStreamResult.toUIMessageStreamResponse).toHaveBeenCalledTimes(1)
  })
})
