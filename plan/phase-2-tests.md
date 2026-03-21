# Phase 2 Test Plan — System Prompt + Instructions Config

**Package:** `@tour-kit/ai`
**Phase Type:** Pure logic — no heavy dependencies to mock
**Test Framework:** Vitest + `@testing-library/react`
**Coverage Target:** > 80% for all Phase 2 files

---

## 1. Scope

| Deliverable | Test File | Type |
|-------------|-----------|------|
| `createSystemPrompt()` — 3-layer assembly | `src/__tests__/server/system-prompt.test.ts` | Unit |
| `resolveStrings()` + `DEFAULT_STRINGS` | `src/__tests__/core/strings.test.ts` | Unit |
| Route handler `instructions` wiring | `src/__tests__/server/route-handler-instructions.test.ts` | Unit |

All test files live under `packages/ai/src/__tests__/`.

---

## 2. User Stories Mapped to Tests

| User Story | Test Coverage |
|------------|--------------|
| US-1: `createSystemPrompt()` with no args returns safe defaults | `system-prompt.test.ts` > Layer 1 — Library Defaults > produces defaults with no config |
| US-2: `override: true` skips Layer 1 | `system-prompt.test.ts` > Combined Layers > override tests |
| US-3: Tone presets produce distinct deterministic output | `system-prompt.test.ts` > Layer 2 — Structured Config > tone tests |
| US-4: `resolveStrings()` merges partials with defaults | `strings.test.ts` > resolveStrings > all tests |

---

## 3. Test File Details

### 3.1 `packages/ai/src/__tests__/server/system-prompt.test.ts`

```typescript
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
      // Layer 1 and Layer 2 should be separated
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
```

### 3.2 `packages/ai/src/__tests__/core/strings.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { DEFAULT_STRINGS, resolveStrings } from '../../core/strings'
import type { AiChatStrings } from '../../types'

describe('DEFAULT_STRINGS', () => {
  it('has all required string keys', () => {
    const requiredKeys: (keyof AiChatStrings)[] = [
      'placeholder',
      'send',
      'errorMessage',
      'emptyState',
      'stopGenerating',
      'retry',
      'title',
      'closeLabel',
      'ratePositiveLabel',
      'rateNegativeLabel',
    ]
    for (const key of requiredKeys) {
      expect(DEFAULT_STRINGS).toHaveProperty(key)
      expect(typeof DEFAULT_STRINGS[key]).toBe('string')
    }
  })

  it('has non-empty values for all keys', () => {
    for (const [key, value] of Object.entries(DEFAULT_STRINGS)) {
      expect(value, `${key} should not be empty`).not.toBe('')
    }
  })

  it('has English defaults', () => {
    expect(DEFAULT_STRINGS.placeholder).toBe('Ask a question...')
    expect(DEFAULT_STRINGS.send).toBe('Send')
    expect(DEFAULT_STRINGS.errorMessage).toBe('Something went wrong. Please try again.')
    expect(DEFAULT_STRINGS.emptyState).toBe('How can I help you?')
    expect(DEFAULT_STRINGS.title).toBe('Chat')
  })
})

describe('resolveStrings', () => {
  it('returns all defaults when no partial provided', () => {
    const strings = resolveStrings()
    expect(strings).toEqual(DEFAULT_STRINGS)
  })

  it('returns all defaults when undefined is passed', () => {
    const strings = resolveStrings(undefined)
    expect(strings).toEqual(DEFAULT_STRINGS)
  })

  it('returns a new object (not the same reference as DEFAULT_STRINGS)', () => {
    const strings = resolveStrings()
    expect(strings).not.toBe(DEFAULT_STRINGS)
  })

  it('overrides a single field while keeping all other defaults', () => {
    const strings = resolveStrings({ placeholder: 'Custom placeholder' })
    expect(strings.placeholder).toBe('Custom placeholder')
    expect(strings.send).toBe('Send')
    expect(strings.errorMessage).toBe('Something went wrong. Please try again.')
    expect(strings.emptyState).toBe('How can I help you?')
    expect(strings.stopGenerating).toBe('Stop generating')
    expect(strings.retry).toBe('Retry')
    expect(strings.title).toBe('Chat')
    expect(strings.closeLabel).toBe('Close chat')
    expect(strings.ratePositiveLabel).toBe('Helpful')
    expect(strings.rateNegativeLabel).toBe('Not helpful')
  })

  it('overrides multiple fields simultaneously', () => {
    const strings = resolveStrings({
      placeholder: 'Type here...',
      send: 'Submit',
      title: 'Help',
    })
    expect(strings.placeholder).toBe('Type here...')
    expect(strings.send).toBe('Submit')
    expect(strings.title).toBe('Help')
    // Non-overridden fields remain defaults
    expect(strings.errorMessage).toBe(DEFAULT_STRINGS.errorMessage)
    expect(strings.retry).toBe(DEFAULT_STRINGS.retry)
  })

  it('overrides all fields at once', () => {
    const custom: AiChatStrings = {
      placeholder: 'p',
      send: 's',
      errorMessage: 'e',
      emptyState: 'em',
      stopGenerating: 'sg',
      retry: 'r',
      title: 't',
      closeLabel: 'cl',
      ratePositiveLabel: 'rp',
      rateNegativeLabel: 'rn',
    }
    const strings = resolveStrings(custom)
    expect(strings).toEqual(custom)
  })

  it('empty partial object returns all defaults', () => {
    const strings = resolveStrings({})
    expect(strings).toEqual(DEFAULT_STRINGS)
  })

  it('does not mutate DEFAULT_STRINGS when overriding', () => {
    const originalPlaceholder = DEFAULT_STRINGS.placeholder
    resolveStrings({ placeholder: 'Modified' })
    expect(DEFAULT_STRINGS.placeholder).toBe(originalPlaceholder)
  })
})
```

### 3.3 `packages/ai/src/__tests__/server/route-handler-instructions.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
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
```

---

## 4. Shared Test Helpers

### `packages/ai/src/__tests__/helpers/prompt-fixtures.ts`

```typescript
import type { Document } from '../../types'
import type { SystemPromptConfig } from '../../server/system-prompt'

/** Minimal config — produces only Layer 1 defaults */
export const EMPTY_CONFIG: SystemPromptConfig = {}

/** Full config — all 3 layers active */
export const FULL_CONFIG: SystemPromptConfig = {
  productName: 'TestApp',
  productDescription: 'A testing application for automated tests.',
  tone: 'friendly',
  boundaries: ['Only answer about testing', 'Do not discuss pricing'],
  custom: 'Always be encouraging.',
  documents: [
    {
      id: 'doc-test-1',
      content: 'Guide to writing tests.',
      metadata: { source: 'docs', title: 'Testing Guide' },
    },
    {
      id: 'doc-test-2',
      content: 'FAQ about test coverage.',
      metadata: { source: 'faq', title: 'Coverage FAQ' },
    },
  ],
}

/** Override config — skips Layer 1 */
export const OVERRIDE_CONFIG: SystemPromptConfig = {
  override: true,
  productName: 'OverrideApp',
  custom: 'You are a custom assistant.',
}

/** Sample documents for document inlining tests */
export const SAMPLE_DOCUMENTS: Document[] = [
  { id: 'doc-1', content: 'First document content.' },
  {
    id: 'doc-2',
    content: 'Second document content.',
    metadata: { source: 'docs', title: 'Doc Two' },
  },
  {
    id: 'doc-3',
    content: 'Third document content.',
    metadata: { source: 'api', title: 'API Ref', tags: ['api', 'reference'] },
  },
]
```

---

## 5. Test Matrix

| Test Case | File | Expected Result |
|-----------|------|-----------------|
| No args | system-prompt.test.ts | Layer 1 defaults with all 4 sections |
| Empty object `{}` | system-prompt.test.ts | Same as no args |
| `productName` only | system-prompt.test.ts | Layer 1 + product context section |
| `productName` + `productDescription` | system-prompt.test.ts | Layer 1 + full product context |
| `tone: 'professional'` | system-prompt.test.ts | Contains professional tone text |
| `tone: 'friendly'` | system-prompt.test.ts | Contains friendly tone text |
| `tone: 'concise'` | system-prompt.test.ts | Contains concise tone text |
| All 3 tones compared | system-prompt.test.ts | All 3 outputs are distinct |
| `boundaries` with items | system-prompt.test.ts | Boundaries section with list items |
| `boundaries: []` | system-prompt.test.ts | No Boundaries section |
| `documents` with items | system-prompt.test.ts | XML-style document tags |
| `documents` with metadata | system-prompt.test.ts | source/title attributes |
| `documents: []` | system-prompt.test.ts | No Reference Documents section |
| `custom` string | system-prompt.test.ts | Additional Instructions section |
| All layers combined | system-prompt.test.ts | All sections present |
| `override: true` only | system-prompt.test.ts | Empty string |
| `override: true` + `custom` | system-prompt.test.ts | Custom only, no Layer 1 |
| `override: true` + structured | system-prompt.test.ts | Layer 2 + 3, no Layer 1 |
| `resolveStrings()` no args | strings.test.ts | Full defaults |
| `resolveStrings({})` empty | strings.test.ts | Full defaults |
| `resolveStrings` single override | strings.test.ts | One field changed, rest default |
| `resolveStrings` multiple overrides | strings.test.ts | Multiple fields changed |
| `resolveStrings` all overrides | strings.test.ts | All fields from partial |
| DEFAULT_STRINGS immutability | strings.test.ts | Not mutated after resolveStrings |

---

## 6. Coverage Requirements

| File | Minimum Coverage |
|------|-----------------|
| `src/server/system-prompt.ts` | 90% lines, 90% branches |
| `src/core/strings.ts` | 95% lines, 100% branches |
| `src/types/config.ts` (AiChatStrings) | Type-only — no runtime coverage needed |

---

## 7. Running Tests

```bash
# Run Phase 2 tests only
pnpm --filter @tour-kit/ai test -- --run src/__tests__/server/system-prompt.test.ts src/__tests__/core/strings.test.ts src/__tests__/server/route-handler-instructions.test.ts

# Run with coverage
pnpm --filter @tour-kit/ai test -- --coverage --run

# Run in watch mode during development
pnpm --filter @tour-kit/ai test -- --watch
```

---

## 8. Exit Criteria

- [ ] All tests in `system-prompt.test.ts` pass (28+ test cases)
- [ ] All tests in `strings.test.ts` pass (10+ test cases)
- [ ] All tests in `route-handler-instructions.test.ts` pass (4+ test cases)
- [ ] Coverage > 80% for `system-prompt.ts` and `strings.ts`
- [ ] No `any` types in test files
- [ ] `pnpm --filter @tour-kit/ai build` succeeds with zero TypeScript errors
