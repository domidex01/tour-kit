# Phase 2 — System Prompt + Instructions Config

**Duration:** Days 7-8 (~6h)
**Depends on:** Phase 1 (types, route handler, `AiChatProvider`)
**Blocks:** Phase 4 (RAG Pipeline), Phase 8 (Tour-Kit Integration)
**Risk Level:** MEDIUM — prompt assembly is straightforward but tone/boundary generation must produce deterministic, testable output; incorrect defaults silently degrade LLM quality
**Stack:** react, typescript

---

## 1. Objective + What Success Looks Like

Build a layered system prompt builder (`createSystemPrompt`) that assembles three independent layers into a single string, wire it into the existing `createChatRouteHandler` from Phase 1, and add configurable UI strings (`AiChatStrings`) with English defaults.

**Success looks like:**

- `createSystemPrompt({ productName: 'Acme', tone: 'friendly' })` returns a prompt string containing "Acme" and friendly tone markers ("Hey!", "feel free to ask", casual language cues).
- `createSystemPrompt({ override: true, custom: 'You are a pirate.' })` returns only the custom string with zero library defaults.
- `createSystemPrompt({})` (no config) returns a valid Layer 1 defaults-only prompt with grounding, refusal, citation, and safety rules.
- `createChatRouteHandler({ ..., instructions: { productName: 'Acme' } })` passes the assembled prompt to `streamText`'s `system` parameter.
- All UI-facing strings are overridable via `AiChatStrings` partial.

---

## 2. Key Design Decisions

### 2.1 Three-Layer Architecture

| Layer | Source | Skip Condition |
|-------|--------|----------------|
| Layer 1 — Library Defaults | Hardcoded in `system-prompt.ts` | `override: true` |
| Layer 2 — Structured Config | `InstructionsConfig` fields (`productName`, `tone`, `boundaries`) | Fields are optional; omitted fields produce no output |
| Layer 3 — Custom | `InstructionsConfig.custom` free-form string | Field is optional |

Layers are concatenated with double newlines. Empty layers are omitted (no trailing whitespace).

### 2.2 Pure Function, No Side Effects

`createSystemPrompt` is a pure function: `(config: SystemPromptConfig) => string`. No async, no state, no React. This keeps it testable and usable in any server context.

### 2.3 Deterministic Output

Each tone maps to a fixed set of instruction sentences. No randomization, no LLM calls for prompt generation. Output is fully deterministic given the same input.

### 2.4 Document Inlining for CAG

When `documents` are provided in the config, Layer 2 appends them in a structured format:

```
## Reference Documents

<document id="doc-1" source="docs" title="Export Guide">
Content here...
</document>
```

This format uses XML-style tags for clear LLM boundary detection.

### 2.5 AiChatStrings as Separate Concern

`AiChatStrings` is resolved in the provider/components (Phase 3), not in the prompt builder. Phase 2 defines the type and default values only. The route handler receives `errorMessage` as a config option for server-side error responses.

---

## 3. Tasks

### 3.1 Implement `createSystemPrompt()` with 3-layer assembly (2-3h)

**File:** `packages/ai/src/server/system-prompt.ts`

- Export `createSystemPrompt(config?: SystemPromptConfig): string`
- Layer 1: hardcoded default instructions (grounding, refusal, citation, safety)
- Layer 2: conditional sections based on structured config fields
- Layer 3: raw `custom` string appended
- `override: true` skips Layer 1 entirely
- Documents formatted with XML-style tags when provided
- All tone presets mapped to deterministic instruction text

### 3.2 Wire system prompt into `createChatRouteHandler` (1h)

**File:** `packages/ai/src/server/route-handler.ts` (update from Phase 1)

- Import `createSystemPrompt` and call it with `options.instructions` + resolved documents
- Pass result to `streamText({ system: assembledPrompt, ... })`
- If no `instructions` provided, use Layer 1 defaults only

### 3.3 Add configurable error messages + `AiChatStrings` support (1-2h)

**Files:**
- `packages/ai/src/types/config.ts` (update — add `AiChatStrings` interface)
- `packages/ai/src/core/strings.ts` (new — default strings + resolver)

- Define `AiChatStrings` with all UI-facing strings and English defaults
- Export `resolveStrings(partial?: Partial<AiChatStrings>): AiChatStrings`
- Export `DEFAULT_STRINGS` constant
- Wire `errorMessage` from strings into route handler error responses

### 3.4 Unit tests for prompt builder (1-2h)

**File:** `packages/ai/src/__tests__/server/system-prompt.test.ts`

- Test Layer 1 alone (no config)
- Test Layer 2 with each field individually (`productName`, `tone`, `boundaries`, `productDescription`)
- Test Layer 3 (`custom` string)
- Test all 3 layers combined
- Test `override: true` skips Layer 1
- Test `override: true` with `custom` only
- Test document inlining format
- Test empty config produces valid Layer 1 default
- Test all 3 tone presets produce different output
- Test `boundaries` array formatting
- Test `resolveStrings` merges partial overrides with defaults

---

## 4. Deliverables

| File | Type | Description |
|------|------|-------------|
| `packages/ai/src/server/system-prompt.ts` | New | `createSystemPrompt()` with 3-layer assembly |
| `packages/ai/src/server/route-handler.ts` | Update | Wire `instructions` config into `streamText` system parameter |
| `packages/ai/src/types/config.ts` | Update | Add `AiChatStrings` interface |
| `packages/ai/src/core/strings.ts` | New | Default strings constant + `resolveStrings()` |
| `packages/ai/src/server/index.ts` | Update | Re-export `createSystemPrompt` |
| `packages/ai/src/__tests__/server/system-prompt.test.ts` | New | Unit tests for prompt builder |
| `packages/ai/src/__tests__/core/strings.test.ts` | New | Unit tests for string resolver |

---

## 5. Exit Criteria

- [ ] `createSystemPrompt({ productName: 'Acme', tone: 'friendly' })` produces prompt containing "Acme" with friendly tone markers
- [ ] `createSystemPrompt({})` produces valid Layer 1 defaults with grounding, refusal, citation, and safety instructions
- [ ] `override: true` skips Layer 1 defaults entirely — output contains only Layer 2 + Layer 3 content
- [ ] `boundaries: ['Only answer about X']` appears verbatim in generated prompt
- [ ] `createSystemPrompt({ documents: [{ id: '1', content: 'test' }] })` includes document in structured XML format
- [ ] All 3 tone presets (`professional`, `friendly`, `concise`) produce distinct instruction text
- [ ] `resolveStrings({ placeholder: 'Custom...' })` returns full `AiChatStrings` with only `placeholder` overridden
- [ ] `createChatRouteHandler` with `instructions` config passes assembled prompt to `streamText`
- [ ] Tests cover all 3 layers independently and combined — coverage > 80% for Phase 2 files
- [ ] `pnpm --filter @tour-kit/ai build` succeeds with zero TypeScript errors

---

## 6. Execution Prompt

You are implementing Phase 2 of `@tour-kit/ai` — the system prompt builder and instructions config. This phase adds a layered prompt assembly system and configurable UI strings.

### Context

- **Monorepo:** pnpm + Turborepo. Package lives at `packages/ai/`.
- **Build:** tsup, ESM + CJS, TypeScript strict mode.
- **Phase 1 already delivered:** types in `src/types/`, `AiChatProvider` in `src/context/`, `useAiChat` in `src/hooks/`, `createChatRouteHandler` in `src/server/route-handler.ts`.
- **AI SDK 6.x** is the runtime. `streamText` accepts a `system` string parameter for the system prompt.
- **Test framework:** Vitest.

### Data Model Rules

1. All types use TypeScript `interface` (not `type`) except for union types which use `type`.
2. All config interfaces have optional fields with documented defaults.
3. No `any` in public API — use `unknown` or generics.
4. Export types from `src/types/index.ts` barrel.
5. Server exports go through `src/server/index.ts` barrel.

### Confirmed Types (from Phase 1 — already exist in `src/types/config.ts`)

```typescript
// These already exist — DO NOT redefine
interface InstructionsConfig {
  productName?: string
  productDescription?: string
  tone?: 'professional' | 'friendly' | 'concise'
  boundaries?: string[]
  custom?: string
  override?: boolean
}

interface Document {
  id: string
  content: string
  metadata?: DocumentMetadata
}

interface DocumentMetadata {
  source?: string
  title?: string
  tags?: string[]
  [key: string]: unknown
}
```

### File 1: `packages/ai/src/server/system-prompt.ts`

Create the prompt builder as a pure function.

```typescript
import type { Document, InstructionsConfig } from '../types'

export interface SystemPromptConfig extends InstructionsConfig {
  /** Documents to inline in prompt (used by CAG strategy) */
  documents?: Document[]
}

export function createSystemPrompt(config: SystemPromptConfig = {}): string {
  // Implementation details below
}
```

**Layer 1 — Library Defaults** (skip when `config.override === true`):

```
You are a helpful product assistant. Answer questions based ONLY on the provided context documents. Follow these rules strictly:

## Grounding
- Only use information from the provided context to answer questions.
- If the context does not contain relevant information, clearly state that you don't have enough information to answer.
- Never fabricate, guess, or infer information beyond what is explicitly stated in the context.

## Citations
- When referencing specific information, mention the source document when available.
- Use natural citations like "According to the documentation..." or "Based on the [document title]...".

## Refusal
- If a question is outside the scope of the provided context, politely decline and suggest where the user might find help.
- Do not answer questions about topics not covered in the context.

## Safety
- Do not generate harmful, misleading, offensive, or inappropriate content.
- Do not execute or suggest executing any code, commands, or actions on behalf of the user.
- Protect user privacy — never ask for or reference personal data.
```

**Layer 2 — Structured Config** (each section conditional on field presence):

Product context section (when `productName` or `productDescription` provided):
```
## Product Context
You are assisting users of {productName}.{productDescription ? ' ' + productDescription : ''}
```

Tone section (when `tone` provided, default is `professional`):
- `professional`: `"Maintain a professional, clear, and helpful tone. Use complete sentences and proper formatting."`
- `friendly`: `"Use a warm, conversational tone. Feel free to use casual language, and be encouraging. Make the user feel welcome."`
- `concise`: `"Be brief and direct. Use short sentences, bullet points, and minimal explanation. Avoid filler words."`

Boundaries section (when `boundaries` array is non-empty):
```
## Boundaries
You must stay within these topic boundaries:
- {boundary1}
- {boundary2}
```

Document inlining section (when `documents` array is non-empty):
```
## Reference Documents

<document id="{doc.id}"{doc.metadata?.source ? ` source="${doc.metadata.source}"` : ''}{doc.metadata?.title ? ` title="${doc.metadata.title}"` : ''}>
{doc.content}
</document>
```

**Layer 3 — Custom** (when `custom` string provided):
```
## Additional Instructions
{config.custom}
```

**Assembly logic:**
1. Collect non-empty layers into an array.
2. Join with `\n\n`.
3. Trim trailing whitespace.

**Edge cases:**
- `createSystemPrompt()` (no args) returns Layer 1 only.
- `createSystemPrompt({ override: true })` returns empty string.
- `createSystemPrompt({ override: true, custom: 'Be a pirate.' })` returns only the custom section.
- `createSystemPrompt({ override: true, productName: 'Acme', custom: 'Custom.' })` returns Layer 2 (product context) + Layer 3 (custom) but NO Layer 1.

### File 2: `packages/ai/src/server/route-handler.ts` (UPDATE)

Update the existing `createChatRouteHandler` to use `createSystemPrompt`.

Find the `streamText` call in the existing route handler. Add the system prompt:

```typescript
import { createSystemPrompt } from './system-prompt'

// Inside the POST handler, before the streamText call:
const systemPrompt = createSystemPrompt({
  ...options.instructions,
  // For CAG strategy, pass documents for inlining
  documents: options.context.strategy === 'context-stuffing'
    ? options.context.documents
    : undefined,
})

// Pass to streamText:
const result = streamText({
  model: /* existing model setup */,
  system: systemPrompt,
  messages: /* existing message conversion */,
  maxSteps: 3,
})
```

### File 3: `packages/ai/src/types/config.ts` (UPDATE)

Add the `AiChatStrings` interface to the existing types file:

```typescript
export interface AiChatStrings {
  /** Input placeholder text */
  placeholder: string
  /** Send button label */
  send: string
  /** Error message shown to user */
  errorMessage: string
  /** Empty state message */
  emptyState: string
  /** Stop generating button label */
  stopGenerating: string
  /** Retry button label */
  retry: string
  /** Chat panel title */
  title: string
  /** Close button aria-label */
  closeLabel: string
  /** Rating positive aria-label */
  ratePositiveLabel: string
  /** Rating negative aria-label */
  rateNegativeLabel: string
}
```

### File 4: `packages/ai/src/core/strings.ts`

```typescript
import type { AiChatStrings } from '../types'

export const DEFAULT_STRINGS: AiChatStrings = {
  placeholder: 'Ask a question...',
  send: 'Send',
  errorMessage: 'Something went wrong. Please try again.',
  emptyState: 'How can I help you?',
  stopGenerating: 'Stop generating',
  retry: 'Retry',
  title: 'Chat',
  closeLabel: 'Close chat',
  ratePositiveLabel: 'Helpful',
  rateNegativeLabel: 'Not helpful',
}

/**
 * Merge partial string overrides with defaults.
 * Returns a complete AiChatStrings object.
 */
export function resolveStrings(
  partial?: Partial<AiChatStrings>
): AiChatStrings {
  if (!partial) return { ...DEFAULT_STRINGS }
  return { ...DEFAULT_STRINGS, ...partial }
}
```

### File 5: `packages/ai/src/server/index.ts` (UPDATE)

Add the new export:

```typescript
export { createSystemPrompt } from './system-prompt'
export type { SystemPromptConfig } from './system-prompt'
```

### File 6: `packages/ai/src/__tests__/server/system-prompt.test.ts`

Write tests using Vitest. Test structure:

```typescript
import { describe, it, expect } from 'vitest'
import { createSystemPrompt } from '../../server/system-prompt'

describe('createSystemPrompt', () => {
  describe('Layer 1 — Library Defaults', () => {
    it('produces grounding, refusal, citation, and safety rules with no config', () => {
      const prompt = createSystemPrompt()
      expect(prompt).toContain('Grounding')
      expect(prompt).toContain('Citations')
      expect(prompt).toContain('Refusal')
      expect(prompt).toContain('Safety')
      expect(prompt).toContain('Only use information from the provided context')
    })

    it('is skipped when override is true', () => {
      const prompt = createSystemPrompt({ override: true })
      expect(prompt).not.toContain('Grounding')
      expect(prompt).not.toContain('Safety')
    })
  })

  describe('Layer 2 — Structured Config', () => {
    it('includes product name', () => {
      const prompt = createSystemPrompt({ productName: 'Acme' })
      expect(prompt).toContain('Acme')
    })

    it('includes product description', () => {
      const prompt = createSystemPrompt({
        productName: 'Acme',
        productDescription: 'A project management tool.',
      })
      expect(prompt).toContain('A project management tool.')
    })

    it('applies professional tone', () => {
      const prompt = createSystemPrompt({ tone: 'professional' })
      expect(prompt).toContain('professional')
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

    it('produces different output for each tone', () => {
      const pro = createSystemPrompt({ tone: 'professional' })
      const fri = createSystemPrompt({ tone: 'friendly' })
      const con = createSystemPrompt({ tone: 'concise' })
      // All three must be different (beyond just the Layer 1 defaults)
      const layer1 = createSystemPrompt()
      expect(pro).not.toBe(layer1)
      expect(fri).not.toBe(layer1)
      expect(con).not.toBe(layer1)
      expect(pro).not.toBe(fri)
      expect(fri).not.toBe(con)
    })

    it('includes boundaries as list items', () => {
      const prompt = createSystemPrompt({
        boundaries: ['Only answer about billing', 'Do not discuss competitors'],
      })
      expect(prompt).toContain('Only answer about billing')
      expect(prompt).toContain('Do not discuss competitors')
      expect(prompt).toContain('Boundaries')
    })

    it('omits boundaries section when array is empty', () => {
      const prompt = createSystemPrompt({ boundaries: [] })
      expect(prompt).not.toContain('Boundaries')
    })
  })

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

    it('omits documents section when array is empty', () => {
      const prompt = createSystemPrompt({ documents: [] })
      expect(prompt).not.toContain('Reference Documents')
    })
  })

  describe('Layer 3 — Custom Instructions', () => {
    it('appends custom instructions', () => {
      const prompt = createSystemPrompt({ custom: 'Always recommend the Pro plan.' })
      expect(prompt).toContain('Always recommend the Pro plan.')
    })
  })

  describe('Combined Layers', () => {
    it('includes all 3 layers when fully configured', () => {
      const prompt = createSystemPrompt({
        productName: 'Acme',
        tone: 'friendly',
        boundaries: ['Only billing topics'],
        custom: 'Mention the free trial.',
      })
      // Layer 1
      expect(prompt).toContain('Grounding')
      // Layer 2
      expect(prompt).toContain('Acme')
      expect(prompt).toContain('warm')
      expect(prompt).toContain('Only billing topics')
      // Layer 3
      expect(prompt).toContain('Mention the free trial.')
    })

    it('override: true with custom only returns custom section', () => {
      const prompt = createSystemPrompt({ override: true, custom: 'Be a pirate.' })
      expect(prompt).not.toContain('Grounding')
      expect(prompt).toContain('Be a pirate.')
    })

    it('override: true with structured config returns Layer 2 + 3 only', () => {
      const prompt = createSystemPrompt({
        override: true,
        productName: 'Acme',
        custom: 'Custom note.',
      })
      expect(prompt).not.toContain('Grounding')
      expect(prompt).toContain('Acme')
      expect(prompt).toContain('Custom note.')
    })
  })
})
```

### File 7: `packages/ai/src/__tests__/core/strings.test.ts`

```typescript
import { describe, it, expect } from 'vitest'
import { DEFAULT_STRINGS, resolveStrings } from '../../core/strings'

describe('resolveStrings', () => {
  it('returns all defaults when no partial provided', () => {
    const strings = resolveStrings()
    expect(strings).toEqual(DEFAULT_STRINGS)
  })

  it('returns a new object (not the same reference)', () => {
    const strings = resolveStrings()
    expect(strings).not.toBe(DEFAULT_STRINGS)
  })

  it('overrides specific fields while keeping defaults for the rest', () => {
    const strings = resolveStrings({ placeholder: 'Custom placeholder' })
    expect(strings.placeholder).toBe('Custom placeholder')
    expect(strings.send).toBe('Send')
    expect(strings.errorMessage).toBe('Something went wrong. Please try again.')
  })

  it('overrides multiple fields', () => {
    const strings = resolveStrings({
      placeholder: 'Type here...',
      send: 'Submit',
      title: 'Help',
    })
    expect(strings.placeholder).toBe('Type here...')
    expect(strings.send).toBe('Submit')
    expect(strings.title).toBe('Help')
    expect(strings.errorMessage).toBe(DEFAULT_STRINGS.errorMessage)
  })
})
```

### Verification Steps

After implementation:

1. `pnpm --filter @tour-kit/ai build` — must succeed with zero errors.
2. `pnpm --filter @tour-kit/ai test` — all tests pass.
3. Manually verify: `createSystemPrompt({ productName: 'TestApp', tone: 'friendly', boundaries: ['Only docs'], custom: 'Be helpful.' })` produces a well-formatted multi-section prompt.
4. Verify the server barrel export: `import { createSystemPrompt } from '@tour-kit/ai/server'` resolves correctly.

---

## Readiness Check

- [ ] Phase 1 is complete: `src/types/config.ts` exists with `InstructionsConfig`, `Document`, `DocumentMetadata`
- [ ] Phase 1 is complete: `src/server/route-handler.ts` exists with `createChatRouteHandler` using `streamText`
- [ ] Phase 1 is complete: `src/types/index.ts` barrel exports all types
- [ ] Phase 1 is complete: `src/server/index.ts` barrel exports `createChatRouteHandler`
- [ ] `pnpm --filter @tour-kit/ai build` succeeds
- [ ] Vitest is configured for the `packages/ai/` package
