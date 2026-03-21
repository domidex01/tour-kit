// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSystemPrompt } from '../../server/system-prompt'

// Mock the AI SDK streamText
vi.mock('ai', () => ({
  streamText: vi.fn().mockReturnValue({
    toUIMessageStreamResponse: vi.fn().mockReturnValue(new Response('ok')),
  }),
  convertToModelMessages: vi.fn().mockReturnValue([]),
}))

describe('Route handler instructions wiring', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createSystemPrompt integration with route handler config', () => {
    it('produces a valid system prompt from instructions config', () => {
      const prompt = createSystemPrompt({
        productName: 'Acme',
        tone: 'friendly',
        boundaries: ['Only docs topics'],
      })
      expect(typeof prompt).toBe('string')
      expect(prompt.length).toBeGreaterThan(0)
      expect(prompt).toContain('Acme')
      expect(prompt).toContain('warm')
      expect(prompt).toContain('Only docs topics')
    })

    it('produces a prompt with inlined documents for CAG strategy', () => {
      const prompt = createSystemPrompt({
        productName: 'Acme',
        documents: [
          { id: 'faq', content: 'FAQ content here.', metadata: { source: 'help', title: 'FAQ' } },
        ],
      })
      expect(prompt).toContain('<document id="faq"')
      expect(prompt).toContain('FAQ content here.')
      expect(prompt).toContain('source="help"')
    })

    it('produces Layer 1 defaults when no instructions provided', () => {
      const prompt = createSystemPrompt()
      expect(prompt).toContain('Grounding')
      expect(prompt).toContain('Safety')
    })

    it('respects override flag from instructions config', () => {
      const prompt = createSystemPrompt({
        override: true,
        custom: 'Only answer about billing.',
      })
      expect(prompt).not.toContain('Grounding')
      expect(prompt).toContain('Only answer about billing.')
    })
  })
})
