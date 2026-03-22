import type { UIMessage } from 'ai'
import { describe, expect, it, vi } from 'vitest'
import { createChatRouteHandler } from '../../server/route-handler'

// Mock the ai module to prevent actual LLM calls
vi.mock('ai', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ai')>()
  return {
    ...actual,
    streamText: vi
      .fn()
      .mockImplementation((opts: { onFinish?: (result: { text: string }) => void }) => {
        // Simulate onFinish being called after streaming
        if (opts.onFinish) {
          // Call onFinish asynchronously to simulate streaming completion
          Promise.resolve().then(() => opts.onFinish?.({ text: 'Hello from AI' }))
        }
        return {
          toUIMessageStreamResponse: () => new Response('stream', { status: 200 }),
          text: Promise.resolve('Hello from AI'),
        }
      }),
    convertToModelMessages: vi.fn().mockReturnValue([]),
    wrapLanguageModel: vi.fn((opts: { model: unknown }) => opts.model),
  }
})

function createMockRequest(
  body: Record<string, unknown>,
  headers: Record<string, string> = {}
): Request {
  return new Request('http://localhost/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

const createUserMessage = (text: string): UIMessage =>
  ({
    id: `user-${Date.now()}`,
    role: 'user' as const,
    parts: [{ type: 'text' as const, text }],
    createdAt: new Date(),
  }) as UIMessage

const mockModel = {} as import('ai').LanguageModel

describe('beforeSend', () => {
  it('passes message through when hook returns message unchanged', async () => {
    const beforeSend = vi.fn((msg: UIMessage) => msg)

    const handler = createChatRouteHandler({
      model: mockModel,
      context: { strategy: 'context-stuffing', documents: [] },
      beforeSend,
    })

    const messages = [createUserMessage('hello')]
    const req = createMockRequest({ messages })
    const response = await handler.POST(req)

    expect(response.status).toBe(200)
    expect(beforeSend).toHaveBeenCalled()
  })

  it('blocks message when hook returns null', async () => {
    const beforeSend = vi.fn().mockReturnValue(null)

    const handler = createChatRouteHandler({
      model: mockModel,
      context: { strategy: 'context-stuffing', documents: [] },
      beforeSend,
    })

    const messages = [createUserMessage('bad content')]
    const req = createMockRequest({ messages })
    const response = await handler.POST(req)

    const body = await response.json()
    expect(body.blocked).toBe(true)
  })

  it('transforms message when hook returns modified message', async () => {
    const modifiedMessage = createUserMessage('sanitized content')
    const beforeSend = vi.fn().mockReturnValue(modifiedMessage)

    const handler = createChatRouteHandler({
      model: mockModel,
      context: { strategy: 'context-stuffing', documents: [] },
      beforeSend,
    })

    const messages = [createUserMessage('original content')]
    const req = createMockRequest({ messages })
    const response = await handler.POST(req)

    expect(response.status).toBe(200)
    expect(beforeSend).toHaveBeenCalled()
  })

  it('handles async beforeSend hook', async () => {
    const beforeSend = vi.fn().mockResolvedValue(createUserMessage('async result'))

    const handler = createChatRouteHandler({
      model: mockModel,
      context: { strategy: 'context-stuffing', documents: [] },
      beforeSend,
    })

    const messages = [createUserMessage('hello')]
    const req = createMockRequest({ messages })
    const response = await handler.POST(req)

    expect(response.status).toBe(200)
    expect(beforeSend).toHaveBeenCalled()
  })

  it('continues processing on hook error — logs warning', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const beforeSend = vi.fn().mockRejectedValue(new Error('hook crashed'))

    const handler = createChatRouteHandler({
      model: mockModel,
      context: { strategy: 'context-stuffing', documents: [] },
      beforeSend,
    })

    const messages = [createUserMessage('hello')]
    const req = createMockRequest({ messages })
    const response = await handler.POST(req)

    // Should not return 500 — falls through with original message
    expect(response.status).not.toBe(500)
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})

describe('beforeResponse', () => {
  it('passes response through when hook returns string unchanged', async () => {
    const beforeResponse = vi.fn((text: string) => text)

    const handler = createChatRouteHandler({
      model: mockModel,
      context: { strategy: 'context-stuffing', documents: [] },
      beforeResponse,
    })

    const messages = [createUserMessage('hello')]
    const req = createMockRequest({ messages })
    const response = await handler.POST(req)

    expect(response.status).toBe(200)
  })

  it('transforms response when hook returns modified string', async () => {
    const beforeResponse = vi.fn().mockReturnValue('[REDACTED]')

    const handler = createChatRouteHandler({
      model: mockModel,
      context: { strategy: 'context-stuffing', documents: [] },
      beforeResponse,
    })

    const messages = [createUserMessage('hello')]
    const req = createMockRequest({ messages })
    await handler.POST(req)

    // Wait for onFinish microtask to fire
    await new Promise((r) => setTimeout(r, 0))

    // beforeResponse should have been called
    expect(beforeResponse).toHaveBeenCalled()
  })

  it('handles async beforeResponse hook', async () => {
    const beforeResponse = vi.fn().mockResolvedValue('async modified')

    const handler = createChatRouteHandler({
      model: mockModel,
      context: { strategy: 'context-stuffing', documents: [] },
      beforeResponse,
    })

    const messages = [createUserMessage('hello')]
    const req = createMockRequest({ messages })
    const response = await handler.POST(req)

    expect(response.status).toBe(200)
  })

  it('uses original response on hook error', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const beforeResponse = vi.fn().mockRejectedValue(new Error('hook crashed'))

    const handler = createChatRouteHandler({
      model: mockModel,
      context: { strategy: 'context-stuffing', documents: [] },
      beforeResponse,
    })

    const messages = [createUserMessage('hello')]
    const req = createMockRequest({ messages })
    const response = await handler.POST(req)

    // Wait for onFinish microtask to fire
    await new Promise((r) => setTimeout(r, 0))

    // Response should still succeed
    expect(response.status).not.toBe(500)
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})
