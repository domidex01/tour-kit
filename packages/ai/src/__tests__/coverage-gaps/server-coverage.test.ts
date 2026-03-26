import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock AI SDK
vi.mock('ai', () => ({
  streamText: vi.fn().mockReturnValue({
    toUIMessageStreamResponse: vi.fn().mockReturnValue(new Response('ok')),
  }),
  convertToModelMessages: vi.fn().mockReturnValue([]),
  generateText: vi.fn().mockResolvedValue({ text: '' }),
  wrapLanguageModel: vi.fn((opts) => opts.model),
  embed: vi.fn(),
  embedMany: vi.fn(),
  cosineSimilarity: vi.fn().mockReturnValue(0.85),
}))

describe('Server — coverage gaps', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // -------------------------------------------------------
  // Route handler edge cases
  // -------------------------------------------------------
  describe('route handler error paths', () => {
    it('returns 400 for missing messages field', async () => {
      const { createChatRouteHandler } = await import('../../server/route-handler')

      const { POST } = createChatRouteHandler({
        model: {} as any,
        context: { strategy: 'context-stuffing', documents: [] },
      })

      const request = new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notMessages: [] }),
      })

      const response = await POST(request)
      expect(response.status).toBeGreaterThanOrEqual(400)
    })

    it('returns 429 when rate limit is exceeded', async () => {
      const { createChatRouteHandler } = await import('../../server/route-handler')

      const { POST } = createChatRouteHandler({
        model: {} as any,
        context: { strategy: 'context-stuffing', documents: [] },
        rateLimit: {
          maxMessages: 1,
          windowMs: 60000,
          identifier: (req: Request) => req.headers.get('x-forwarded-for') ?? '127.0.0.1',
        },
      })

      const makeRequest = () =>
        new Request('http://localhost/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-forwarded-for': '127.0.0.1',
          },
          body: JSON.stringify({
            messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'hi' }] }],
          }),
        })

      // First request should succeed
      const first = await POST(makeRequest())
      expect(first.status).toBeLessThan(400)

      // Second request should be rate limited
      const second = await POST(makeRequest())
      expect(second.status).toBe(429)
    })

    it('handles beforeSend hook that returns null (blocks message)', async () => {
      const beforeSend = vi.fn().mockReturnValue(null)
      const { createChatRouteHandler } = await import('../../server/route-handler')

      const { POST } = createChatRouteHandler({
        model: {} as any,
        context: { strategy: 'context-stuffing', documents: [] },
        beforeSend,
      })

      const request = new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'hello' }] }],
        }),
      })

      const response = await POST(request)
      expect(beforeSend).toHaveBeenCalled()
      // When beforeSend returns null, should return 200 with blocked flag
      expect(response.status).toBe(200)
      const body = await response.json()
      expect(body.blocked).toBe(true)
    })

    it('returns 500 on internal error', async () => {
      const { streamText } = await import('ai')
      vi.mocked(streamText).mockImplementationOnce(() => {
        throw new Error('Model unavailable')
      })

      const { createChatRouteHandler } = await import('../../server/route-handler')

      const { POST } = createChatRouteHandler({
        model: {} as any,
        context: { strategy: 'context-stuffing', documents: [] },
      })

      const request = new Request('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ id: '1', role: 'user', parts: [{ type: 'text', text: 'hello' }] }],
        }),
      })

      const response = await POST(request)
      expect(response.status).toBe(500)
    })
  })

  // -------------------------------------------------------
  // System prompt edge cases
  // -------------------------------------------------------
  describe('system prompt — uncovered branches', () => {
    it('handles productDescription without productName', async () => {
      const { createSystemPrompt } = await import('../../server/system-prompt')
      const prompt = createSystemPrompt({
        productDescription: 'A great tool for teams.',
      })
      expect(prompt).toContain('A great tool for teams.')
    })

    it('handles boundaries config', async () => {
      const { createSystemPrompt } = await import('../../server/system-prompt')
      const prompt = createSystemPrompt({
        boundaries: ['Only answer about Tour Kit'],
      })
      expect(prompt).toContain('Only answer about Tour Kit')
      expect(prompt).toContain('Boundaries')
    })

    it('handles documents with metadata', async () => {
      const { createSystemPrompt } = await import('../../server/system-prompt')
      const prompt = createSystemPrompt({
        documents: [
          { id: 'doc-1', content: 'Hello', metadata: { title: 'Test Doc', source: 'test' } },
        ],
      })
      expect(prompt).toContain('id="doc-1"')
      expect(prompt).toContain('title="Test Doc"')
    })

    it('handles empty documents array', async () => {
      const { createSystemPrompt } = await import('../../server/system-prompt')
      const prompt = createSystemPrompt({ documents: [] })
      expect(prompt).not.toContain('Reference Documents')
    })

    it('handles tone configuration', async () => {
      const { createSystemPrompt } = await import('../../server/system-prompt')
      const prompt = createSystemPrompt({ tone: 'friendly' })
      expect(prompt).toContain('warm')
    })

    it('handles custom instructions', async () => {
      const { createSystemPrompt } = await import('../../server/system-prompt')
      const prompt = createSystemPrompt({ custom: 'Always reply in French.' })
      expect(prompt).toContain('Always reply in French.')
      expect(prompt).toContain('Additional Instructions')
    })

    it('handles tour context in system prompt', async () => {
      const { createSystemPrompt } = await import('../../server/system-prompt')
      const prompt = createSystemPrompt({
        tourContext: {
          activeTour: { id: 't1', name: 'Onboarding', currentStep: 0, totalSteps: 3 },
          activeStep: { id: 's1', title: 'Welcome', content: 'Start here' },
          completedTours: [],
          checklistProgress: null,
        },
      })
      expect(prompt).toContain('Current User Context')
      expect(prompt).toContain('Onboarding')
      expect(prompt).toContain('Welcome')
    })

    it('does not include tour context when no active tour', async () => {
      const { createSystemPrompt } = await import('../../server/system-prompt')
      const prompt = createSystemPrompt({
        tourContext: {
          activeTour: null,
          activeStep: null,
          completedTours: [],
          checklistProgress: null,
        },
      })
      expect(prompt).not.toContain('Current User Context')
    })

    it('handles override flag', async () => {
      const { createSystemPrompt } = await import('../../server/system-prompt')
      const prompt = createSystemPrompt({ override: true, custom: 'Custom only.' })
      // When override is set, layer 1 defaults should not appear
      expect(prompt).not.toContain('helpful product assistant')
      expect(prompt).toContain('Custom only.')
    })
  })

  // -------------------------------------------------------
  // Suggestion engine edge cases
  // -------------------------------------------------------
  describe('parseSuggestions', () => {
    it('strips numbered prefixes', async () => {
      const { parseSuggestions } = await import('../../core/suggestion-engine')
      const result = parseSuggestions('1. First\n2. Second\n3. Third', 3)
      expect(result).toEqual(['First', 'Second', 'Third'])
    })

    it('strips bullet prefixes', async () => {
      const { parseSuggestions } = await import('../../core/suggestion-engine')
      const result = parseSuggestions('- First\n* Second', 3)
      expect(result).toEqual(['First', 'Second'])
    })

    it('strips surrounding quotes', async () => {
      const { parseSuggestions } = await import('../../core/suggestion-engine')
      const result = parseSuggestions('"Quoted question?"', 3)
      expect(result).toEqual(['Quoted question?'])
    })

    it('limits to count', async () => {
      const { parseSuggestions } = await import('../../core/suggestion-engine')
      const result = parseSuggestions('A\nB\nC\nD\nE', 2)
      expect(result).toHaveLength(2)
    })

    it('filters empty lines', async () => {
      const { parseSuggestions } = await import('../../core/suggestion-engine')
      const result = parseSuggestions('A\n\n\nB', 3)
      expect(result).toEqual(['A', 'B'])
    })
  })
})
