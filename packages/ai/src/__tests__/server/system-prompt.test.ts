// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { createSystemPrompt } from '../../server/system-prompt'

describe('createSystemPrompt', () => {
  // -------------------------------------------------------
  // Layer 1 — Library Defaults
  // -------------------------------------------------------
  describe('Layer 1 — Library Defaults', () => {
    it('produces grounding, refusal, citation, and safety rules with no config', () => {
      const prompt = createSystemPrompt()
      expect(prompt).toContain('Grounding')
      expect(prompt).toContain('Citations')
      expect(prompt).toContain('Refusal')
      expect(prompt).toContain('Safety')
      expect(prompt).toContain('Only use information from the provided context')
    })

    it('includes refusal instructions for out-of-scope questions', () => {
      const prompt = createSystemPrompt()
      expect(prompt).toContain('politely decline')
    })

    it('includes safety instructions against harmful content', () => {
      const prompt = createSystemPrompt()
      expect(prompt).toContain('Do not generate harmful')
      expect(prompt).toContain('Protect user privacy')
    })

    it('is skipped when override is true', () => {
      const prompt = createSystemPrompt({ override: true })
      expect(prompt).not.toContain('Grounding')
      expect(prompt).not.toContain('Safety')
      expect(prompt).not.toContain('Refusal')
      expect(prompt).not.toContain('Citations')
    })

    it('returns non-empty string with no config (Layer 1 only)', () => {
      const prompt = createSystemPrompt()
      expect(prompt.length).toBeGreaterThan(0)
      expect(prompt.trim()).toBe(prompt)
    })
  })

  // -------------------------------------------------------
  // Layer 2 — Structured Config: Product Context
  // -------------------------------------------------------
  describe('Layer 2 — Product Context', () => {
    it('includes product name when provided', () => {
      const prompt = createSystemPrompt({ productName: 'Acme' })
      expect(prompt).toContain('Acme')
      expect(prompt).toContain('Product Context')
    })

    it('includes product description alongside product name', () => {
      const prompt = createSystemPrompt({
        productName: 'Acme',
        productDescription: 'A project management tool.',
      })
      expect(prompt).toContain('Acme')
      expect(prompt).toContain('A project management tool.')
    })

    it('includes product description when only description is provided', () => {
      const prompt = createSystemPrompt({
        productDescription: 'A project management tool.',
      })
      expect(prompt).toContain('A project management tool.')
    })

    it('omits product context section when no product fields provided', () => {
      const prompt = createSystemPrompt({ tone: 'concise' })
      expect(prompt).not.toContain('Product Context')
    })
  })

  // -------------------------------------------------------
  // Layer 2 — Structured Config: Tone
  // -------------------------------------------------------
  describe('Layer 2 — Tone Presets', () => {
    it('applies professional tone', () => {
      const prompt = createSystemPrompt({ tone: 'professional' })
      expect(prompt).toContain('professional')
      expect(prompt).toContain('clear')
    })

    it('applies friendly tone', () => {
      const prompt = createSystemPrompt({ tone: 'friendly' })
      expect(prompt).toContain('warm')
      expect(prompt).toContain('conversational')
    })

    it('applies concise tone', () => {
      const prompt = createSystemPrompt({ tone: 'concise' })
      expect(prompt).toContain('brief')
      expect(prompt).toContain('direct')
    })

    it('produces distinct output for each tone preset', () => {
      const professional = createSystemPrompt({ tone: 'professional' })
      const friendly = createSystemPrompt({ tone: 'friendly' })
      const concise = createSystemPrompt({ tone: 'concise' })

      expect(professional).not.toBe(friendly)
      expect(friendly).not.toBe(concise)
      expect(professional).not.toBe(concise)
    })

    it('all tone outputs differ from defaults-only prompt', () => {
      const defaults = createSystemPrompt()
      const professional = createSystemPrompt({ tone: 'professional' })
      const friendly = createSystemPrompt({ tone: 'friendly' })
      const concise = createSystemPrompt({ tone: 'concise' })

      expect(professional).not.toBe(defaults)
      expect(friendly).not.toBe(defaults)
      expect(concise).not.toBe(defaults)
    })

    it('is deterministic — same input produces same output', () => {
      const first = createSystemPrompt({ tone: 'friendly' })
      const second = createSystemPrompt({ tone: 'friendly' })
      expect(first).toBe(second)
    })
  })

  // -------------------------------------------------------
  // Layer 2 — Structured Config: Boundaries
  // -------------------------------------------------------
  describe('Layer 2 — Boundaries', () => {
    it('includes boundaries as list items', () => {
      const prompt = createSystemPrompt({
        boundaries: ['Only answer about billing', 'Do not discuss competitors'],
      })
      expect(prompt).toContain('Boundaries')
      expect(prompt).toContain('Only answer about billing')
      expect(prompt).toContain('Do not discuss competitors')
    })

    it('formats each boundary as a markdown list item', () => {
      const prompt = createSystemPrompt({
        boundaries: ['Only billing topics'],
      })
      expect(prompt).toContain('- Only billing topics')
    })

    it('omits boundaries section when array is empty', () => {
      const prompt = createSystemPrompt({ boundaries: [] })
      expect(prompt).not.toContain('Boundaries')
    })

    it('omits boundaries section when not provided', () => {
      const prompt = createSystemPrompt({ productName: 'Acme' })
      expect(prompt).not.toContain('Boundaries')
    })

    it('includes multiple boundaries in order', () => {
      const prompt = createSystemPrompt({
        boundaries: ['First boundary', 'Second boundary', 'Third boundary'],
      })
      const firstIdx = prompt.indexOf('First boundary')
      const secondIdx = prompt.indexOf('Second boundary')
      const thirdIdx = prompt.indexOf('Third boundary')
      expect(firstIdx).toBeLessThan(secondIdx)
      expect(secondIdx).toBeLessThan(thirdIdx)
    })
  })

  // -------------------------------------------------------
  // Layer 2 — Document Inlining
  // -------------------------------------------------------
  describe('Layer 2 — Document Inlining', () => {
    it('inlines documents with XML-style tags', () => {
      const prompt = createSystemPrompt({
        documents: [
          { id: 'doc-1', content: 'Export guide content here.' },
        ],
      })
      expect(prompt).toContain('<document id="doc-1">')
      expect(prompt).toContain('Export guide content here.')
      expect(prompt).toContain('</document>')
      expect(prompt).toContain('Reference Documents')
    })

    it('includes source and title attributes in document tags', () => {
      const prompt = createSystemPrompt({
        documents: [{
          id: 'doc-2',
          content: 'Pricing info.',
          metadata: { source: 'docs', title: 'Pricing' },
        }],
      })
      expect(prompt).toContain('source="docs"')
      expect(prompt).toContain('title="Pricing"')
    })

    it('omits optional attributes when metadata is missing', () => {
      const prompt = createSystemPrompt({
        documents: [{ id: 'doc-3', content: 'Content only.' }],
      })
      expect(prompt).toContain('<document id="doc-3">')
      expect(prompt).not.toContain('source=')
      expect(prompt).not.toContain('title=')
    })

    it('inlines multiple documents in order', () => {
      const prompt = createSystemPrompt({
        documents: [
          { id: 'doc-1', content: 'First document.' },
          { id: 'doc-2', content: 'Second document.' },
        ],
      })
      const firstIdx = prompt.indexOf('doc-1')
      const secondIdx = prompt.indexOf('doc-2')
      expect(firstIdx).toBeLessThan(secondIdx)
    })

    it('omits documents section when array is empty', () => {
      const prompt = createSystemPrompt({ documents: [] })
      expect(prompt).not.toContain('Reference Documents')
    })

    it('omits documents section when not provided', () => {
      const prompt = createSystemPrompt({ productName: 'Acme' })
      expect(prompt).not.toContain('Reference Documents')
    })
  })

  // -------------------------------------------------------
  // Layer 3 — Custom Instructions
  // -------------------------------------------------------
  describe('Layer 3 — Custom Instructions', () => {
    it('appends custom instructions', () => {
      const prompt = createSystemPrompt({ custom: 'Always recommend the Pro plan.' })
      expect(prompt).toContain('Always recommend the Pro plan.')
      expect(prompt).toContain('Additional Instructions')
    })

    it('appends custom string verbatim', () => {
      const custom = 'Respond only in haiku format.\nNo exceptions.'
      const prompt = createSystemPrompt({ custom })
      expect(prompt).toContain(custom)
    })

    it('omits custom section when not provided', () => {
      const prompt = createSystemPrompt({ productName: 'Acme' })
      expect(prompt).not.toContain('Additional Instructions')
    })
  })

  // -------------------------------------------------------
  // Combined Layers
  // -------------------------------------------------------
  describe('Combined Layers', () => {
    it('includes all 3 layers when fully configured', () => {
      const prompt = createSystemPrompt({
        productName: 'Acme',
        tone: 'friendly',
        boundaries: ['Only billing topics'],
        documents: [{ id: 'doc-1', content: 'Billing FAQ.' }],
        custom: 'Mention the free trial.',
      })
      // Layer 1
      expect(prompt).toContain('Grounding')
      expect(prompt).toContain('Safety')
      // Layer 2
      expect(prompt).toContain('Acme')
      expect(prompt).toContain('warm')
      expect(prompt).toContain('Only billing topics')
      expect(prompt).toContain('doc-1')
      // Layer 3
      expect(prompt).toContain('Mention the free trial.')
    })

    it('override: true with custom only returns custom section', () => {
      const prompt = createSystemPrompt({ override: true, custom: 'Be a pirate.' })
      expect(prompt).not.toContain('Grounding')
      expect(prompt).not.toContain('Safety')
      expect(prompt).toContain('Be a pirate.')
    })

    it('override: true with structured config returns Layer 2 + Layer 3 only', () => {
      const prompt = createSystemPrompt({
        override: true,
        productName: 'Acme',
        tone: 'concise',
        custom: 'Custom note.',
      })
      expect(prompt).not.toContain('Grounding')
      expect(prompt).not.toContain('Safety')
      expect(prompt).toContain('Acme')
      expect(prompt).toContain('brief')
      expect(prompt).toContain('Custom note.')
    })

    it('override: true with no other config returns empty string', () => {
      const prompt = createSystemPrompt({ override: true })
      expect(prompt).toBe('')
    })

    it('layers are separated by double newlines', () => {
      const prompt = createSystemPrompt({
        productName: 'Acme',
        custom: 'Custom.',
      })
      expect(prompt).toContain('\n\n')
    })

    it('output has no trailing whitespace', () => {
      const prompt = createSystemPrompt({
        productName: 'Acme',
        tone: 'friendly',
        custom: 'Be helpful.',
      })
      expect(prompt).toBe(prompt.trimEnd())
    })
  })

  // -------------------------------------------------------
  // Edge Cases
  // -------------------------------------------------------
  describe('Edge Cases', () => {
    it('empty config object produces Layer 1 defaults', () => {
      const prompt = createSystemPrompt({})
      const noArgs = createSystemPrompt()
      expect(prompt).toBe(noArgs)
    })

    it('undefined fields are treated as absent', () => {
      const prompt = createSystemPrompt({
        productName: undefined,
        tone: undefined,
        boundaries: undefined,
        custom: undefined,
        documents: undefined,
      })
      const defaults = createSystemPrompt()
      expect(prompt).toBe(defaults)
    })
  })
})
