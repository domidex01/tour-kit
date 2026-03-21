import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMockStreamResult } from '../helpers/mock-stream-text'
import { createTestDocuments } from '../helpers/test-documents'

const mockStreamResult = createMockStreamResult()

vi.mock('ai', () => ({
  streamText: vi.fn(() => mockStreamResult),
  convertToModelMessages: vi.fn((msgs: unknown[]) => msgs),
  generateText: vi.fn(),
}))

import { generateText } from 'ai'

const mockGenerateText = vi.mocked(generateText)

describe('createChatRouteHandler — suggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns JSON response with suggestions when ?suggestions=true', async () => {
    mockGenerateText.mockResolvedValue({
      text: 'How do I export?\nWhat plans are available?\nHow do I invite?',
    } as Awaited<ReturnType<typeof generateText>>)

    const { createChatRouteHandler } = await import('../../server/route-handler')

    const handler = createChatRouteHandler({
      model: 'openai/gpt-4o-mini' as unknown as import('ai').LanguageModel,
      context: {
        strategy: 'context-stuffing',
        documents: createTestDocuments(1),
      },
    })

    const req = new Request('http://localhost/api/chat?suggestions=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            parts: [{ type: 'text', text: 'Hello' }],
          },
          {
            id: 'msg-2',
            role: 'assistant',
            parts: [{ type: 'text', text: 'Hi there!' }],
          },
        ],
      }),
    })

    const response = await handler.POST(req)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.suggestions).toBeInstanceOf(Array)
    expect(data.suggestions.length).toBeGreaterThan(0)
  })

  it('calls generateSuggestions with messages from request body', async () => {
    mockGenerateText.mockResolvedValue({
      text: 'Q1\nQ2\nQ3',
    } as Awaited<ReturnType<typeof generateText>>)

    const { createChatRouteHandler } = await import('../../server/route-handler')

    const handler = createChatRouteHandler({
      model: 'openai/gpt-4o-mini' as unknown as import('ai').LanguageModel,
      context: {
        strategy: 'context-stuffing',
        documents: createTestDocuments(1),
      },
    })

    const req = new Request('http://localhost/api/chat?suggestions=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            parts: [{ type: 'text', text: 'How do I start?' }],
          },
        ],
      }),
    })

    await handler.POST(req)

    expect(mockGenerateText).toHaveBeenCalledOnce()
    const call = mockGenerateText.mock.calls[0][0]
    expect(call.prompt).toContain('How do I start?')
  })

  it('passes productName from instructions config', async () => {
    mockGenerateText.mockResolvedValue({
      text: 'Q1\nQ2\nQ3',
    } as Awaited<ReturnType<typeof generateText>>)

    const { createChatRouteHandler } = await import('../../server/route-handler')

    const handler = createChatRouteHandler({
      model: 'openai/gpt-4o-mini' as unknown as import('ai').LanguageModel,
      context: {
        strategy: 'context-stuffing',
        documents: createTestDocuments(1),
      },
      instructions: {
        productName: 'Acme App',
      },
    })

    const req = new Request('http://localhost/api/chat?suggestions=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            parts: [{ type: 'text', text: 'Hello' }],
          },
        ],
      }),
    })

    await handler.POST(req)

    const prompt = mockGenerateText.mock.calls[0][0].prompt as string
    expect(prompt).toContain('about Acme App')
  })

  it('returns 200 with empty suggestions array on engine error', async () => {
    mockGenerateText.mockRejectedValue(new Error('API error'))

    const { createChatRouteHandler } = await import('../../server/route-handler')

    const handler = createChatRouteHandler({
      model: 'openai/gpt-4o-mini' as unknown as import('ai').LanguageModel,
      context: {
        strategy: 'context-stuffing',
        documents: createTestDocuments(1),
      },
    })

    const req = new Request('http://localhost/api/chat?suggestions=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            id: 'msg-1',
            role: 'user',
            parts: [{ type: 'text', text: 'Hello' }],
          },
        ],
      }),
    })

    const response = await handler.POST(req)
    expect(response.status).toBe(200)

    const data = await response.json()
    expect(data.suggestions).toEqual([])
  })
})
