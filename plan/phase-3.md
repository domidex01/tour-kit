# Phase 3 — UI Components + Markdown Renderer

**Duration:** Days 9-14 (~20h)
**Depends on:** Phase 1 (provider, hooks, types)
**Blocks:** Phase 5 (Suggestions), Phase 9 (Docs + Ship)
**Risk Level:** MEDIUM — component count is high (5 styled + 5 headless) but each is individually simple; the markdown renderer is the main technical risk (must be < 3KB gzipped with no `dangerouslySetInnerHTML`)
**Stack:** react, typescript

---

## 1. Objective + What Success Looks Like

Build the full chat UI layer: 5 styled components with CVA variants, 5 headless render-prop counterparts, a built-in lightweight markdown renderer, and the UnifiedSlot/UILibrary context copies. All components are WCAG 2.1 AA compliant.

**Success looks like:**

- A developer drops `<AiChatBubble />` and `<AiChatPanel />` into their app and gets a working chat slideout with styled defaults.
- A developer uses `<HeadlessChatPanel>` with render props to build a fully custom UI.
- AI responses render markdown (bold, italic, code, lists, links, headings) without external dependencies.
- `axe-core` reports 0 violations on the rendered chat panel with messages.
- All components accept `className` for Tailwind/CSS override.
- The chat panel is functional at 320px viewport width.

---

## 2. Key Design Decisions

### 2.1 Styled + Headless Split

Every component exists in two forms:

| Form | Location | Pattern | Styling |
|------|----------|---------|---------|
| Styled | `src/components/ai-chat-*.tsx` | Standard React component | CVA variants + CSS custom properties |
| Headless | `src/components/headless/headless-chat-*.tsx` | Render prop pattern | None — consumer provides all markup |

Styled components internally use headless components for logic, adding CVA classes on top. This ensures logic is never duplicated.

### 2.2 CVA for Variants

All variant definitions live in `src/components/ui/` as separate files. Components import their variants. This matches the pattern used in `@tour-kit/react`.

```typescript
// Example: chat-panel.variants.ts
import { cva } from 'class-variance-authority'

export const chatPanelVariants = cva('tk-ai-panel', {
  variants: {
    mode: {
      slideout: 'tk-ai-panel--slideout',
      popover: 'tk-ai-panel--popover',
      inline: 'tk-ai-panel--inline',
    },
    position: {
      'bottom-right': 'tk-ai-panel--br',
      'bottom-left': 'tk-ai-panel--bl',
    },
  },
  defaultVariants: {
    mode: 'slideout',
    position: 'bottom-right',
  },
})
```

### 2.3 CSS Custom Properties for Theming

All colors, spacing, and typography are defined as CSS custom properties in `src/styles/variables.css`. Component CSS in `src/styles/components.css` references these variables. Users can override at the `:root` or container level.

### 2.4 Built-in Markdown Renderer

The renderer is a pure React function: `(markdown: string) => ReactElement`. It produces React elements directly via `React.createElement` — no `dangerouslySetInnerHTML`, no DOM parsing. This is critical for security (XSS prevention) and SSR compatibility.

### 2.5 Non-modal Panel

The chat panel is explicitly non-modal. It does NOT trap focus. Users can interact with the page while chat is open. This matches the spec's accessibility requirements. Focus moves to the input on open, Escape closes the panel.

### 2.6 UnifiedSlot Copy

Each tour-kit package has its own copy of `lib/slot.tsx`, `lib/unified-slot.tsx`, and `lib/ui-library-context.tsx`. The `@tour-kit/ai` package follows this same pattern — copy from `@tour-kit/react` without modification.

---

## 3. Tasks

### 3.1 Built-in markdown renderer (3-4h)

**File:** `packages/ai/src/core/markdown-renderer.tsx`

- Parse markdown string into tokens (line-by-line + inline spans)
- Produce React elements via `React.createElement` — no innerHTML
- Support: bold (`**`), italic (`*`/`_`), inline code (`` ` ``), fenced code blocks (` ``` `), links (`[text](url)`), unordered lists (`-`/`*`), ordered lists (`1.`), headings (`#`-`######`), paragraphs, line breaks
- Links: force `target="_blank"` and `rel="noopener noreferrer"`
- Strikethrough (`~~`) support
- Must be < 3KB gzipped
- Export: `renderMarkdown(content: string): ReactElement`

### 3.2 `AiChatMessage` with markdown rendering, rating callback (2-3h)

**Files:**
- `packages/ai/src/components/ai-chat-message.tsx` (styled)
- `packages/ai/src/components/headless/headless-chat-message.tsx` (headless)
- `packages/ai/src/components/ui/chat-message.variants.ts` (CVA)

- Renders a single message (user or assistant)
- Assistant messages pass through `renderMarkdown`
- User messages render as plain text
- Optional `onRate` callback with `'positive' | 'negative'`
- Rating UI: thumbs up/down buttons on assistant messages
- Timestamp display (optional)
- Styling differentiates user vs assistant messages

### 3.3 `AiChatInput` with send button, disabled state, Enter to send (2h)

**Files:**
- `packages/ai/src/components/ai-chat-input.tsx` (styled)
- `packages/ai/src/components/headless/headless-chat-input.tsx` (headless)
- `packages/ai/src/components/ui/chat-input.variants.ts` (CVA)

- Text input with integrated send button
- Enter to send (without Shift), Shift+Enter for newline
- Disabled state when `status === 'streaming'` or `status === 'submitted'`
- `placeholder` prop (default from `AiChatStrings`)
- `onSubmit` callback
- Auto-focus management

### 3.4 `AiChatPanel` — slideout/popover/inline modes (3-4h)

**Files:**
- `packages/ai/src/components/ai-chat-panel.tsx` (styled)
- `packages/ai/src/components/headless/headless-chat-panel.tsx` (headless)
- `packages/ai/src/components/ui/chat-panel.variants.ts` (CVA)

- Three display modes: `slideout`, `popover`, `inline`
- `slideout`: fixed right panel, slides in from right edge
- `popover`: floating card anchored to bubble trigger
- `inline`: block-level element, no positioning
- Position prop: `bottom-right` (default), `bottom-left`
- Header with title + close button
- Message list with auto-scroll to bottom on new messages
- Footer with `AiChatInput`
- Responsive: usable at 320px viewport width
- Escape key closes panel (slideout and popover modes)
- ARIA: `role="complementary"`, `aria-label` from strings

### 3.5 `AiChatBubble` trigger button (1-2h)

**Files:**
- `packages/ai/src/components/ai-chat-bubble.tsx` (styled)
- `packages/ai/src/components/headless/headless-chat-bubble.tsx` (headless)
- `packages/ai/src/components/ui/chat-bubble.variants.ts` (CVA)

- Floating action button to toggle chat panel
- `unreadCount` badge (number, hidden when 0)
- `pulse` animation prop (CSS animation via custom property)
- Calls `useAiChat().toggle()` on click
- `aria-label`: "Open chat" / "Close chat" depending on state
- `aria-expanded` reflects panel state

### 3.6 `AiChatSuggestions` chip component (1h)

**Files:**
- `packages/ai/src/components/ai-chat-suggestions.tsx` (styled)
- `packages/ai/src/components/headless/headless-chat-suggestions.tsx` (headless)
- `packages/ai/src/components/ui/chat-suggestions.variants.ts` (CVA)

- Renders clickable suggestion chips
- `suggestions: string[]` prop
- `onSelect` callback fires with clicked suggestion text
- Chips are `<button>` elements for accessibility
- Horizontal wrap layout

### 3.7 Headless variants — render-prop versions (2-3h)

All headless components in `packages/ai/src/components/headless/`:

- Each headless component receives the same data props as its styled counterpart
- Children is a render prop: `children: (state: HeadlessState) => ReactElement`
- State object exposes all relevant data + actions
- No DOM output from headless components — consumer controls all markup
- Export barrel: `packages/ai/src/components/headless/index.ts`

### 3.8 CVA variant definitions + CSS custom properties (2h)

**Files:**
- `packages/ai/src/components/ui/` — all variant files (created in tasks 3.2-3.6)
- `packages/ai/src/styles/variables.css` — CSS custom properties
- `packages/ai/src/styles/components.css` — component styles

CSS custom properties in `variables.css`:
```css
:root {
  /* Panel */
  --tk-ai-panel-width: 400px;
  --tk-ai-panel-max-height: 600px;
  --tk-ai-panel-bg: #ffffff;
  --tk-ai-panel-border: #e5e7eb;
  --tk-ai-panel-radius: 12px;
  --tk-ai-panel-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);

  /* Messages */
  --tk-ai-msg-user-bg: #3b82f6;
  --tk-ai-msg-user-text: #ffffff;
  --tk-ai-msg-assistant-bg: #f3f4f6;
  --tk-ai-msg-assistant-text: #111827;

  /* Input */
  --tk-ai-input-bg: #ffffff;
  --tk-ai-input-border: #d1d5db;
  --tk-ai-input-focus: #3b82f6;

  /* Bubble */
  --tk-ai-bubble-bg: #3b82f6;
  --tk-ai-bubble-text: #ffffff;
  --tk-ai-bubble-size: 56px;

  /* Suggestions */
  --tk-ai-chip-bg: #f3f4f6;
  --tk-ai-chip-text: #374151;
  --tk-ai-chip-hover-bg: #e5e7eb;

  /* Typography */
  --tk-ai-font-family: inherit;
  --tk-ai-font-size: 14px;
  --tk-ai-line-height: 1.5;

  /* Code blocks */
  --tk-ai-code-bg: #1f2937;
  --tk-ai-code-text: #e5e7eb;
  --tk-ai-code-font: 'Fira Code', 'Fira Mono', monospace;
}
```

### 3.9 Accessibility: ARIA live region, focus management, keyboard nav, axe-core tests (2-3h)

**File:** `packages/ai/src/__tests__/components/accessibility.test.tsx`

Accessibility implementation across components:

- `AiChatPanel`: `role="complementary"`, `aria-label` from strings
- Message list container: `aria-live="polite"`, `aria-relevant="additions"`
- New assistant messages announced to screen readers via live region
- `AiChatInput`: `aria-label` from strings, associated with panel via `aria-controls`
- `AiChatBubble`: `aria-expanded`, `aria-haspopup="dialog"`, `aria-label` toggles
- Rating buttons: `aria-label` from strings, `aria-pressed` state
- Suggestion chips: `role="group"` on container, each chip is a `<button>`
- Focus management: input receives focus on panel open
- Keyboard: Escape closes panel (slideout/popover), Enter sends message
- axe-core tests: render each component and assert 0 violations

### 3.10 UnifiedSlot + UI library context (1h)

**Files:**
- `packages/ai/src/lib/unified-slot.tsx` — copy from `packages/react/src/lib/unified-slot.tsx`
- `packages/ai/src/lib/ui-library-context.tsx` — copy from `packages/react/src/lib/ui-library-context.tsx`
- `packages/ai/src/lib/slot.tsx` — copy from `packages/react/src/lib/slot.tsx`

Direct copies with no modifications. These enable the `asChild` pattern for all styled components.

---

## 4. Deliverables

| File | Type | Description |
|------|------|-------------|
| `packages/ai/src/core/markdown-renderer.tsx` | New | Lightweight markdown-to-React renderer |
| `packages/ai/src/components/ai-chat-message.tsx` | New | Styled message component |
| `packages/ai/src/components/ai-chat-input.tsx` | New | Styled input component |
| `packages/ai/src/components/ai-chat-panel.tsx` | New | Styled panel (slideout/popover/inline) |
| `packages/ai/src/components/ai-chat-bubble.tsx` | New | Styled trigger bubble |
| `packages/ai/src/components/ai-chat-suggestions.tsx` | New | Styled suggestion chips |
| `packages/ai/src/components/headless/headless-chat-message.tsx` | New | Headless message |
| `packages/ai/src/components/headless/headless-chat-input.tsx` | New | Headless input |
| `packages/ai/src/components/headless/headless-chat-panel.tsx` | New | Headless panel |
| `packages/ai/src/components/headless/headless-chat-bubble.tsx` | New | Headless bubble |
| `packages/ai/src/components/headless/headless-chat-suggestions.tsx` | New | Headless suggestions |
| `packages/ai/src/components/headless/index.ts` | New | Headless barrel export |
| `packages/ai/src/components/ui/chat-panel.variants.ts` | New | CVA panel variants |
| `packages/ai/src/components/ui/chat-message.variants.ts` | New | CVA message variants |
| `packages/ai/src/components/ui/chat-input.variants.ts` | New | CVA input variants |
| `packages/ai/src/components/ui/chat-bubble.variants.ts` | New | CVA bubble variants |
| `packages/ai/src/components/ui/chat-suggestions.variants.ts` | New | CVA suggestion variants |
| `packages/ai/src/styles/variables.css` | New | CSS custom properties |
| `packages/ai/src/styles/components.css` | New | Component base styles |
| `packages/ai/src/lib/unified-slot.tsx` | New | UnifiedSlot (copy from react pkg) |
| `packages/ai/src/lib/ui-library-context.tsx` | New | UILibrary context (copy from react pkg) |
| `packages/ai/src/lib/slot.tsx` | New | Slot helper (copy from react pkg) |
| `packages/ai/src/lib/utils.ts` | New | `cn()` utility (clsx + tailwind-merge, matching other UI packages) |
| `packages/ai/src/tailwind/index.ts` | New | Tailwind CSS plugin for AI chat components |
| `packages/ai/src/__tests__/core/markdown-renderer.test.tsx` | New | Markdown renderer tests |
| `packages/ai/src/__tests__/components/accessibility.test.tsx` | New | axe-core accessibility tests |
| `packages/ai/src/__tests__/components/ai-chat-panel.test.tsx` | New | Panel component tests |
| `packages/ai/src/__tests__/components/ai-chat-message.test.tsx` | New | Message component tests |

---

## 5. Exit Criteria

- [ ] All 5 styled components render with default styles and accept `className` override
- [ ] All 5 headless variants expose all state via render props — consumer controls all markup
- [ ] Markdown renderer handles: bold, italic, inline code, fenced code blocks, links, unordered lists, ordered lists, headings (h1-h6), strikethrough
- [ ] Markdown renderer gzipped size < 3KB
- [ ] Markdown renderer produces React elements only — no `dangerouslySetInnerHTML`
- [ ] Links rendered by markdown include `target="_blank"` and `rel="noopener noreferrer"`
- [ ] `AiChatPanel` renders in all 3 modes: slideout, popover, inline
- [ ] `AiChatPanel` is functional at 320px viewport width
- [ ] `AiChatBubble` shows unread count badge and pulse animation
- [ ] axe-core reports 0 violations on chat panel with messages
- [ ] Escape closes panel (slideout/popover modes)
- [ ] Enter sends message, Shift+Enter inserts newline
- [ ] New messages announced to screen readers via ARIA live region
- [ ] Input receives focus when panel opens
- [ ] `AiChatBubble` has correct `aria-expanded` and `aria-label` states
- [ ] CSS custom properties in `variables.css` can be overridden at `:root` level
- [ ] `pnpm --filter @tour-kit/ai build` succeeds with zero TypeScript errors
- [ ] All component tests pass, coverage > 80% for Phase 3 files

---

## 6. Execution Prompt

You are implementing Phase 3 of `@tour-kit/ai` — the UI components and markdown renderer. This phase builds the full chat widget UI layer.

### Context

- **Monorepo:** pnpm + Turborepo. Package lives at `packages/ai/`.
- **Build:** tsup, ESM + CJS, TypeScript strict mode. CSS files are included in the build output.
- **Phase 1 already delivered:** `AiChatProvider`, `useAiChat` hook, types including `AiChatConfig`, `AiChatStrings`, `ChatStatus`, `AiChatState`.
- **Phase 2 already delivered:** `createSystemPrompt`, `resolveStrings`, `DEFAULT_STRINGS`.
- **Existing pattern:** `packages/react/src/lib/unified-slot.tsx`, `packages/react/src/lib/ui-library-context.tsx`, `packages/react/src/lib/slot.tsx` — copy these files verbatim into `packages/ai/src/lib/`.
- **Existing pattern:** `packages/react/src/components/ui/` contains CVA variant files. Follow same structure.
- **AI SDK 6.x:** `UIMessage` type has `role: 'user' | 'assistant'` and `parts: MessagePart[]` where `MessagePart` can be `{ type: 'text', text: string }` among others.
- **Test framework:** Vitest + `@testing-library/react`. For accessibility: `vitest-axe` or `jest-axe` (Vitest-compatible).
- **CVA:** `class-variance-authority` is already a dependency in the monorepo.
- All component files MUST have `'use client'` directive at the top for Next.js App Router compatibility.

### Data Model Rules

1. All types use TypeScript `interface` (not `type`) except for union types.
2. All component props interfaces are exported.
3. All components accept `className?: string` for override.
4. Styled components use `React.forwardRef` for ref forwarding.
5. Headless components use render props: `children: (state: T) => ReactElement`.
6. No `any` in public API.
7. All ARIA attributes use string literals, not variables, for readability.

### Confirmed Types (from Phase 1 — already exist)

```typescript
// From AI SDK 6.x
interface UIMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  parts: MessagePart[]
  createdAt?: Date
}

type MessagePart =
  | { type: 'text'; text: string }
  | { type: 'tool-invocation'; toolInvocation: ToolInvocation }
  | { type: 'source'; source: Source }

// From Phase 1 — src/types/config.ts
type ChatStatus = 'ready' | 'submitted' | 'streaming' | 'error'

// From Phase 1 — src/hooks/use-ai-chat.ts
interface UseAiChatReturn {
  messages: UIMessage[]
  status: ChatStatus
  error: Error | null
  sendMessage(input: { text: string }): void
  stop(): void
  reload(): void
  setMessages(messages: UIMessage[]): void
  isOpen: boolean
  open(): void
  close(): void
  toggle(): void
}

// From Phase 2 — src/types/config.ts
interface AiChatStrings {
  placeholder: string
  send: string
  errorMessage: string
  emptyState: string
  stopGenerating: string
  retry: string
  title: string
  closeLabel: string
  ratePositiveLabel: string
  rateNegativeLabel: string
}
```

### File 1: `packages/ai/src/core/markdown-renderer.tsx`

Build a lightweight markdown-to-React-elements renderer. No external dependencies. No `dangerouslySetInnerHTML`.

```typescript
'use client'

import { createElement, Fragment, type ReactElement } from 'react'

/**
 * Renders a markdown string as React elements.
 * Supports: bold, italic, strikethrough, inline code, fenced code blocks,
 * links, unordered lists, ordered lists, headings (h1-h6), paragraphs.
 *
 * Gzip budget: < 3KB
 */
export function renderMarkdown(content: string): ReactElement {
  // Implementation below
}
```

**Parsing strategy — two-pass approach:**

Pass 1 — Block-level parsing (line-by-line):
1. Split content by `\n`.
2. Track state: `inCodeBlock` (boolean), `codeBlockLang` (string), `codeBlockLines` (string[]).
3. For each line:
   - If `` ``` `` fence detected and not in code block: enter code block, capture language.
   - If `` ``` `` fence detected and in code block: emit code block element, reset state.
   - If in code block: accumulate line.
   - If `#` prefix: emit heading element (count `#` for level 1-6).
   - If `- ` or `* ` prefix: accumulate list item (unordered).
   - If `{digit}. ` prefix: accumulate list item (ordered).
   - Otherwise: accumulate paragraph text.
4. When list context changes (list item -> non-list, or list type changes): emit accumulated list.
5. When paragraph text ends (empty line or block element): emit paragraph.

Pass 2 — Inline parsing (within text nodes):
1. Process text with regex-based replacements, building an array of React elements and strings.
2. Order of inline parsing (greedy, left-to-right):
   - Links: `\[([^\]]+)\]\(([^)]+)\)` -> `<a>` with `target="_blank"` and `rel="noopener noreferrer"`
   - Bold: `\*\*(.+?)\*\*` or `__(.+?)__` -> `<strong>`
   - Italic: `\*(.+?)\*` or `_(.+?)_` -> `<em>` (careful: must not match `**`)
   - Strikethrough: `~~(.+?)~~` -> `<del>`
   - Inline code: `` `([^`]+)` `` -> `<code>`
3. Use a recursive approach: split on the first match, recurse on the remaining segments.

**Key implementation details:**
- Use `createElement` exclusively — no JSX to keep bundle minimal.
- Every element needs a unique `key` prop (use incrementing counter).
- Code blocks: wrap in `<pre><code className="language-{lang}">`.
- Headings: `<h1>` through `<h6>` based on `#` count.
- Lists: `<ul><li>` or `<ol><li>`.
- Paragraphs: `<p>` wrapping inline-parsed content.
- Empty lines between paragraphs are paragraph separators.
- Nested inline formatting should work: `**bold _and italic_**`.

**What NOT to support (v1):**
- Tables, images, blockquotes, footnotes, math/LaTeX, raw HTML, nested lists.

### File 2: `packages/ai/src/components/headless/headless-chat-panel.tsx`

```typescript
'use client'

import type { ReactElement } from 'react'
import { useAiChat } from '../../hooks/use-ai-chat'
import type { UIMessage } from 'ai'

export interface HeadlessChatPanelState {
  messages: UIMessage[]
  status: ChatStatus
  error: Error | null
  isOpen: boolean
  sendMessage(input: { text: string }): void
  stop(): void
  close(): void
  /** Ref callback for the message list container — enables auto-scroll */
  messageListRef: React.RefCallback<HTMLElement>
}

export interface HeadlessChatPanelProps {
  children: (state: HeadlessChatPanelState) => ReactElement
}

export function HeadlessChatPanel({ children }: HeadlessChatPanelProps): ReactElement | null {
  const chat = useAiChat()
  // Auto-scroll logic: useRef + useEffect to scroll to bottom on new messages
  // Keyboard: useEffect to add Escape listener when isOpen
  // Return null when !isOpen (for slideout/popover — inline always renders)
  // Call children(state)
}
```

### File 3: `packages/ai/src/components/ai-chat-panel.tsx`

```typescript
'use client'

import * as React from 'react'
import { HeadlessChatPanel } from './headless/headless-chat-panel'
import { AiChatMessage } from './ai-chat-message'
import { AiChatInput } from './ai-chat-input'
import { chatPanelVariants } from './ui/chat-panel.variants'
import { useAiChatStrings } from '../hooks/use-ai-chat-strings'
import { cn } from '../lib/utils'

export interface AiChatPanelProps {
  /** Display mode */
  mode?: 'slideout' | 'popover' | 'inline'
  /** Panel position (for slideout and popover) */
  position?: 'bottom-right' | 'bottom-left'
  /** Additional CSS classes */
  className?: string
  /** Rating callback for messages */
  onRate?(messageId: string, rating: 'positive' | 'negative'): void
}

export const AiChatPanel = React.forwardRef<HTMLDivElement, AiChatPanelProps>(
  ({ mode = 'slideout', position = 'bottom-right', className, onRate }, ref) => {
    // Uses HeadlessChatPanel internally
    // Renders: header (title + close button) + message list + input
    // Applies chatPanelVariants({ mode, position })
    // ARIA: role="complementary", aria-label from strings
    // Messages rendered via AiChatMessage
    // Input rendered via AiChatInput
    // Auto-scroll message list on new messages
  }
)
AiChatPanel.displayName = 'AiChatPanel'
```

### File 4: `packages/ai/src/components/headless/headless-chat-message.tsx`

```typescript
'use client'

import type { ReactElement } from 'react'
import type { UIMessage } from 'ai'

export interface HeadlessChatMessageState {
  message: UIMessage
  isUser: boolean
  isAssistant: boolean
  textContent: string
  /** Rendered markdown (ReactElement) for assistant messages, plain text for user */
  renderedContent: ReactElement
  rating: 'positive' | 'negative' | null
  rate(rating: 'positive' | 'negative'): void
}

export interface HeadlessChatMessageProps {
  message: UIMessage
  onRate?(messageId: string, rating: 'positive' | 'negative'): void
  children: (state: HeadlessChatMessageState) => ReactElement
}
```

### File 5: `packages/ai/src/components/ai-chat-message.tsx`

```typescript
'use client'

import * as React from 'react'
import { HeadlessChatMessage } from './headless/headless-chat-message'
import { chatMessageVariants } from './ui/chat-message.variants'
import { cn } from '../lib/utils'

export interface AiChatMessageProps {
  message: UIMessage
  onRate?(messageId: string, rating: 'positive' | 'negative'): void
  className?: string
}

// Uses HeadlessChatMessage internally
// Renders message bubble with variant styling based on role
// Assistant messages show rating buttons (thumbs up/down)
// Rating buttons: aria-label from strings, aria-pressed
```

### File 6: `packages/ai/src/components/headless/headless-chat-input.tsx`

```typescript
'use client'

import { useState, useCallback, useRef, type ReactElement } from 'react'
import { useAiChat } from '../../hooks/use-ai-chat'

export interface HeadlessChatInputState {
  value: string
  setValue(value: string): void
  submit(): void
  disabled: boolean
  inputRef: React.RefObject<HTMLTextAreaElement | null>
  handleKeyDown(e: React.KeyboardEvent): void
}

export interface HeadlessChatInputProps {
  placeholder?: string
  onSubmit?(text: string): void
  disabled?: boolean
  children: (state: HeadlessChatInputState) => ReactElement
}

// Internal logic:
// - Manages input value state
// - submit(): calls sendMessage({ text: value }), clears value
// - disabled: true when chat status is 'streaming' or 'submitted', or prop disabled
// - handleKeyDown: Enter sends (calls submit), Shift+Enter inserts newline
// - inputRef for focus management
```

### File 7: `packages/ai/src/components/ai-chat-input.tsx`

```typescript
'use client'

import * as React from 'react'
import { HeadlessChatInput } from './headless/headless-chat-input'
import { chatInputVariants } from './ui/chat-input.variants'
import { useAiChatStrings } from '../hooks/use-ai-chat-strings'
import { cn } from '../lib/utils'

export interface AiChatInputProps {
  placeholder?: string
  onSubmit?(text: string): void
  disabled?: boolean
  className?: string
}

// Renders <textarea> + send <button>
// Uses HeadlessChatInput for logic
// aria-label on textarea from strings.placeholder
// Send button: aria-label from strings.send, disabled when input empty or chat busy
```

### File 8: `packages/ai/src/components/headless/headless-chat-bubble.tsx`

```typescript
'use client'

import type { ReactElement } from 'react'
import { useAiChat } from '../../hooks/use-ai-chat'

export interface HeadlessChatBubbleState {
  isOpen: boolean
  toggle(): void
  unreadCount: number
}

export interface HeadlessChatBubbleProps {
  unreadCount?: number
  children: (state: HeadlessChatBubbleState) => ReactElement
}
```

### File 9: `packages/ai/src/components/ai-chat-bubble.tsx`

```typescript
'use client'

import * as React from 'react'
import { HeadlessChatBubble } from './headless/headless-chat-bubble'
import { chatBubbleVariants } from './ui/chat-bubble.variants'
import { cn } from '../lib/utils'

export interface AiChatBubbleProps {
  unreadCount?: number
  pulse?: boolean
  className?: string
}

// Renders floating <button>
// aria-expanded={isOpen}
// aria-haspopup="dialog"
// aria-label: "Open chat" or "Close chat" based on isOpen
// Badge: rendered when unreadCount > 0
// Pulse: CSS animation class when pulse prop is true
```

### File 10: `packages/ai/src/components/headless/headless-chat-suggestions.tsx`

```typescript
'use client'

import type { ReactElement } from 'react'

export interface HeadlessChatSuggestionsState {
  suggestions: string[]
  select(suggestion: string): void
}

export interface HeadlessChatSuggestionsProps {
  suggestions: string[]
  onSelect?(suggestion: string): void
  children: (state: HeadlessChatSuggestionsState) => ReactElement
}
```

### File 11: `packages/ai/src/components/ai-chat-suggestions.tsx`

```typescript
'use client'

import * as React from 'react'
import { HeadlessChatSuggestions } from './headless/headless-chat-suggestions'
import { chatSuggestionsVariants } from './ui/chat-suggestions.variants'
import { cn } from '../lib/utils'

export interface AiChatSuggestionsProps {
  suggestions: string[]
  onSelect?(suggestion: string): void
  className?: string
}

// Container: role="group", aria-label="Suggested questions"
// Each chip: <button> element, calls onSelect on click
// Horizontal flex-wrap layout
```

### File 12: CVA Variant Files

**`packages/ai/src/components/ui/chat-panel.variants.ts`:**
```typescript
import { cva } from 'class-variance-authority'

export const chatPanelVariants = cva('tk-ai-panel', {
  variants: {
    mode: {
      slideout: 'tk-ai-panel--slideout',
      popover: 'tk-ai-panel--popover',
      inline: 'tk-ai-panel--inline',
    },
    position: {
      'bottom-right': 'tk-ai-panel--br',
      'bottom-left': 'tk-ai-panel--bl',
    },
  },
  defaultVariants: {
    mode: 'slideout',
    position: 'bottom-right',
  },
})
```

**`packages/ai/src/components/ui/chat-message.variants.ts`:**
```typescript
import { cva } from 'class-variance-authority'

export const chatMessageVariants = cva('tk-ai-message', {
  variants: {
    role: {
      user: 'tk-ai-message--user',
      assistant: 'tk-ai-message--assistant',
    },
  },
  defaultVariants: {
    role: 'assistant',
  },
})
```

**`packages/ai/src/components/ui/chat-input.variants.ts`:**
```typescript
import { cva } from 'class-variance-authority'

export const chatInputVariants = cva('tk-ai-input', {
  variants: {
    disabled: {
      true: 'tk-ai-input--disabled',
      false: '',
    },
  },
  defaultVariants: {
    disabled: false,
  },
})
```

**`packages/ai/src/components/ui/chat-bubble.variants.ts`:**
```typescript
import { cva } from 'class-variance-authority'

export const chatBubbleVariants = cva('tk-ai-bubble', {
  variants: {
    pulse: {
      true: 'tk-ai-bubble--pulse',
      false: '',
    },
  },
  defaultVariants: {
    pulse: false,
  },
})
```

**`packages/ai/src/components/ui/chat-suggestions.variants.ts`:**
```typescript
import { cva } from 'class-variance-authority'

export const chatSuggestionsVariants = cva('tk-ai-suggestions', {})
```

### File 13: `packages/ai/src/lib/utils.ts`

```typescript
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge class names with Tailwind conflict resolution.
 * Matches the cn() utility used in all other tour-kit UI packages.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

**Implementation notes:**
- This matches the exact `cn()` pattern from `@tour-kit/react`, `@tour-kit/hints`, and all other UI packages.
- Requires `clsx` and `tailwind-merge` as dependencies (already available in the monorepo).

### File 14: `packages/ai/src/styles/variables.css`

Define all CSS custom properties as shown in Task 3.8 above. Include dark mode overrides:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --tk-ai-panel-bg: #1f2937;
    --tk-ai-panel-border: #374151;
    --tk-ai-msg-assistant-bg: #374151;
    --tk-ai-msg-assistant-text: #f9fafb;
    --tk-ai-input-bg: #1f2937;
    --tk-ai-input-border: #4b5563;
    --tk-ai-chip-bg: #374151;
    --tk-ai-chip-text: #d1d5db;
    --tk-ai-chip-hover-bg: #4b5563;
  }
}
```

### File 15: `packages/ai/src/styles/components.css`

Base component styles using the CSS custom properties. Include:

- `.tk-ai-panel` base styles (width, bg, border, shadow, font)
- `.tk-ai-panel--slideout` (fixed position, right edge, full height, slide animation)
- `.tk-ai-panel--popover` (absolute/fixed position, max-height, border-radius)
- `.tk-ai-panel--inline` (block display, border, border-radius)
- `.tk-ai-panel--br` / `.tk-ai-panel--bl` (positioning)
- `.tk-ai-message` base + role variants
- `.tk-ai-input` base + disabled variant
- `.tk-ai-bubble` base + pulse animation keyframes
- `.tk-ai-suggestions` + chip styles
- `@media (max-width: 480px)` responsive overrides (panel fills viewport width)
- `@media (prefers-reduced-motion: reduce)` disables animations

### File 16: UnifiedSlot + UI Library Context

Copy these files verbatim from `packages/react/src/lib/`:
- `unified-slot.tsx` -> `packages/ai/src/lib/unified-slot.tsx`
- `ui-library-context.tsx` -> `packages/ai/src/lib/ui-library-context.tsx`
- `slot.tsx` -> `packages/ai/src/lib/slot.tsx`

No modifications needed.

### File 17: `packages/ai/src/tailwind/index.ts`

Tailwind plugin for AI chat component classes. Matches the pattern from `@tour-kit/react/tailwind` and other UI packages.

```typescript
import plugin from 'tailwindcss/plugin'

/**
 * Tailwind CSS plugin for @tour-kit/ai chat components.
 * Provides utility classes and theme extensions for AI chat widgets.
 */
export const tourKitAiPlugin = plugin(
  ({ addComponents }) => {
    addComponents({
      '.tk-ai-panel': {
        '--tk-ai-panel-width': '400px',
        '--tk-ai-panel-max-height': '600px',
      },
      '.tk-ai-bubble': {
        '--tk-ai-bubble-size': '56px',
      },
    })
  },
  {
    theme: {
      extend: {
        colors: {
          'tk-ai': {
            panel: 'var(--tk-ai-panel-bg)',
            'panel-border': 'var(--tk-ai-panel-border)',
            'msg-user': 'var(--tk-ai-msg-user-bg)',
            'msg-user-text': 'var(--tk-ai-msg-user-text)',
            'msg-assistant': 'var(--tk-ai-msg-assistant-bg)',
            'msg-assistant-text': 'var(--tk-ai-msg-assistant-text)',
            'input-bg': 'var(--tk-ai-input-bg)',
            'input-border': 'var(--tk-ai-input-border)',
            'input-focus': 'var(--tk-ai-input-focus)',
            bubble: 'var(--tk-ai-bubble-bg)',
            'bubble-text': 'var(--tk-ai-bubble-text)',
            chip: 'var(--tk-ai-chip-bg)',
            'chip-text': 'var(--tk-ai-chip-text)',
            'chip-hover': 'var(--tk-ai-chip-hover-bg)',
          },
        },
        width: {
          'tk-ai-panel': 'var(--tk-ai-panel-width)',
          'tk-ai-bubble': 'var(--tk-ai-bubble-size)',
        },
        height: {
          'tk-ai-bubble': 'var(--tk-ai-bubble-size)',
        },
        maxHeight: {
          'tk-ai-panel': 'var(--tk-ai-panel-max-height)',
        },
        keyframes: {
          'tk-ai-pulse': {
            '0%, 100%': { transform: 'scale(1)' },
            '50%': { transform: 'scale(1.05)' },
          },
        },
        animation: {
          'tk-ai-pulse': 'tk-ai-pulse 2s ease-in-out infinite',
        },
      },
    },
  }
)

export default tourKitAiPlugin
```

**Implementation notes:**
- Follows the exact Tailwind plugin pattern from `@tour-kit/react/tailwind` and `@tour-kit/hints/tailwind`.
- Maps CSS custom properties to Tailwind theme tokens so consumers can use `bg-tk-ai-panel`, `text-tk-ai-msg-user-text`, etc.
- Exported from `@tour-kit/ai/tailwind` entry point (add to `tsup.config.ts` and `package.json` exports).

**Required updates to `packages/ai/tsup.config.ts`:**
Add `'tailwind/index': 'src/tailwind/index.ts'` to the `entry` object.

**Required updates to `packages/ai/package.json`:**
Add the `./tailwind` export path:
```json
"./tailwind": {
  "import": {
    "types": "./dist/tailwind/index.d.ts",
    "default": "./dist/tailwind/index.js"
  },
  "require": {
    "types": "./dist/tailwind/index.d.cts",
    "default": "./dist/tailwind/index.cjs"
  }
}
```

### File 18: `packages/ai/src/__tests__/core/markdown-renderer.test.tsx`

```typescript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { renderMarkdown } from '../../core/markdown-renderer'

describe('renderMarkdown', () => {
  describe('inline formatting', () => {
    it('renders bold text', () => {
      const { container } = render(renderMarkdown('This is **bold** text'))
      expect(container.querySelector('strong')?.textContent).toBe('bold')
    })

    it('renders italic text', () => {
      const { container } = render(renderMarkdown('This is *italic* text'))
      expect(container.querySelector('em')?.textContent).toBe('italic')
    })

    it('renders inline code', () => {
      const { container } = render(renderMarkdown('Use `console.log` here'))
      expect(container.querySelector('code')?.textContent).toBe('console.log')
    })

    it('renders strikethrough', () => {
      const { container } = render(renderMarkdown('This is ~~deleted~~ text'))
      expect(container.querySelector('del')?.textContent).toBe('deleted')
    })

    it('renders links with security attributes', () => {
      const { container } = render(renderMarkdown('[Click here](https://example.com)'))
      const link = container.querySelector('a')
      expect(link?.getAttribute('href')).toBe('https://example.com')
      expect(link?.getAttribute('target')).toBe('_blank')
      expect(link?.getAttribute('rel')).toBe('noopener noreferrer')
      expect(link?.textContent).toBe('Click here')
    })

    it('renders nested bold and italic', () => {
      const { container } = render(renderMarkdown('**bold *and italic* text**'))
      const strong = container.querySelector('strong')
      expect(strong).toBeTruthy()
      expect(strong?.querySelector('em')).toBeTruthy()
    })
  })

  describe('block elements', () => {
    it('renders headings h1-h6', () => {
      for (let i = 1; i <= 6; i++) {
        const prefix = '#'.repeat(i)
        const { container } = render(renderMarkdown(`${prefix} Heading ${i}`))
        expect(container.querySelector(`h${i}`)?.textContent).toBe(`Heading ${i}`)
      }
    })

    it('renders unordered lists', () => {
      const md = '- Item 1\n- Item 2\n- Item 3'
      const { container } = render(renderMarkdown(md))
      const items = container.querySelectorAll('li')
      expect(items).toHaveLength(3)
      expect(container.querySelector('ul')).toBeTruthy()
    })

    it('renders ordered lists', () => {
      const md = '1. First\n2. Second\n3. Third'
      const { container } = render(renderMarkdown(md))
      const items = container.querySelectorAll('li')
      expect(items).toHaveLength(3)
      expect(container.querySelector('ol')).toBeTruthy()
    })

    it('renders fenced code blocks', () => {
      const md = '```javascript\nconst x = 1\n```'
      const { container } = render(renderMarkdown(md))
      const pre = container.querySelector('pre')
      const code = pre?.querySelector('code')
      expect(code?.textContent).toBe('const x = 1')
      expect(code?.className).toContain('language-javascript')
    })

    it('renders paragraphs', () => {
      const md = 'First paragraph.\n\nSecond paragraph.'
      const { container } = render(renderMarkdown(md))
      const paragraphs = container.querySelectorAll('p')
      expect(paragraphs).toHaveLength(2)
    })
  })

  describe('edge cases', () => {
    it('handles empty string', () => {
      const { container } = render(renderMarkdown(''))
      expect(container.textContent).toBe('')
    })

    it('handles plain text with no markdown', () => {
      const { container } = render(renderMarkdown('Just plain text'))
      expect(container.textContent).toBe('Just plain text')
    })

    it('does not use dangerouslySetInnerHTML', () => {
      // Verify no innerHTML is set by checking the rendered output is React elements
      const element = renderMarkdown('**test**')
      expect(element).toBeTruthy()
      expect(typeof element).toBe('object') // ReactElement, not string
    })
  })
})
```

### File 18: `packages/ai/src/__tests__/components/accessibility.test.tsx`

```typescript
import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
// Import components — wrap in mock AiChatProvider for context

expect.extend(toHaveNoViolations)

// Test each component for axe violations:
// - AiChatPanel with mock messages
// - AiChatBubble
// - AiChatInput
// - AiChatMessage with user and assistant messages
// - AiChatSuggestions with sample suggestions
//
// Also test:
// - AiChatBubble has aria-expanded
// - AiChatPanel has role="complementary" and aria-label
// - Message list has aria-live="polite"
// - Rating buttons have aria-label and aria-pressed
// - Suggestion container has role="group"
```

### File 19: Barrel Exports

**`packages/ai/src/components/headless/index.ts`:**
```typescript
export { HeadlessChatPanel } from './headless-chat-panel'
export { HeadlessChatMessage } from './headless-chat-message'
export { HeadlessChatInput } from './headless-chat-input'
export { HeadlessChatBubble } from './headless-chat-bubble'
export { HeadlessChatSuggestions } from './headless-chat-suggestions'

export type { HeadlessChatPanelProps, HeadlessChatPanelState } from './headless-chat-panel'
export type { HeadlessChatMessageProps, HeadlessChatMessageState } from './headless-chat-message'
export type { HeadlessChatInputProps, HeadlessChatInputState } from './headless-chat-input'
export type { HeadlessChatBubbleProps, HeadlessChatBubbleState } from './headless-chat-bubble'
export type { HeadlessChatSuggestionsProps, HeadlessChatSuggestionsState } from './headless-chat-suggestions'
```

**Update `packages/ai/src/index.ts`** to export all styled and headless components, plus `renderMarkdown`. Use the explicit section-comment barrel export style matching `@tour-kit/core` and `@tour-kit/react`:

```typescript
// ============================================
// CONTEXT & PROVIDERS
// ============================================
export { AiChatProvider } from './context/ai-chat-provider'
export { AiChatContext, type AiChatContextValue } from './context/ai-chat-context'

// ============================================
// HOOKS
// ============================================
export { useAiChat, type UseAiChatReturn } from './hooks/use-ai-chat'

// ============================================
// COMPONENTS (STYLED)
// ============================================
export { AiChatPanel } from './components/ai-chat-panel'
export { AiChatBubble } from './components/ai-chat-bubble'
export { AiChatMessage } from './components/ai-chat-message'
export { AiChatInput } from './components/ai-chat-input'
export { AiChatSuggestions } from './components/ai-chat-suggestions'

// ============================================
// COMPONENTS (HEADLESS)
// ============================================
export {
  HeadlessChatPanel,
  HeadlessChatMessage,
  HeadlessChatInput,
  HeadlessChatBubble,
  HeadlessChatSuggestions,
} from './components/headless'

// ============================================
// UTILITIES
// ============================================
export { renderMarkdown } from './core/markdown-renderer'
export { cn } from './lib/utils'

// ============================================
// TYPES
// ============================================
export type {
  AiChatConfig,
  SuggestionsConfig,
  PersistenceConfig,
  PersistenceAdapter,
  ClientRateLimitConfig,
  AiChatStrings,
  ChatStatus,
  AiChatState,
  ChatRouteHandlerOptions,
  ContextConfig,
  ContextStuffingConfig,
  RAGConfig,
  InstructionsConfig,
  ServerRateLimitConfig,
  Document,
  DocumentMetadata,
  RetrievedDocument,
  VectorStoreAdapter,
  EmbeddingAdapter,
  RateLimitStore,
  AiChatEvent,
  AiChatEventType,
} from './types'

export type { AiChatPanelProps } from './components/ai-chat-panel'
export type { AiChatBubbleProps } from './components/ai-chat-bubble'
export type { AiChatMessageProps } from './components/ai-chat-message'
export type { AiChatInputProps } from './components/ai-chat-input'
export type { AiChatSuggestionsProps } from './components/ai-chat-suggestions'

export type {
  HeadlessChatPanelProps,
  HeadlessChatPanelState,
  HeadlessChatMessageProps,
  HeadlessChatMessageState,
  HeadlessChatInputProps,
  HeadlessChatInputState,
  HeadlessChatBubbleProps,
  HeadlessChatBubbleState,
  HeadlessChatSuggestionsProps,
  HeadlessChatSuggestionsState,
} from './components/headless'
```

### Verification Steps

After implementation:

1. `pnpm --filter @tour-kit/ai build` — must succeed with zero errors.
2. `pnpm --filter @tour-kit/ai test` — all tests pass.
3. Verify markdown renderer size: build output, check gzipped size of `markdown-renderer` chunk < 3KB.
4. Verify no `dangerouslySetInnerHTML` in any file: search for the string across all Phase 3 files.
5. Verify all component files have `'use client'` directive.
6. Verify all styled components accept `className` prop.
7. Run axe-core tests — 0 violations.

---

## Readiness Check

- [ ] Phase 1 is complete: `AiChatProvider` and `useAiChat` hook exist and work
- [ ] Phase 1 is complete: all types (`AiChatConfig`, `ChatStatus`, `UIMessage`) are defined
- [ ] Phase 2 is complete: `AiChatStrings` type and `DEFAULT_STRINGS` exist
- [ ] Phase 2 is complete: `resolveStrings()` utility exists
- [ ] `class-variance-authority` is available in the monorepo
- [ ] `@testing-library/react` is available for component tests
- [ ] `jest-axe` or `vitest-axe` is available for accessibility tests
- [ ] `packages/react/src/lib/unified-slot.tsx` exists to copy from
- [ ] `packages/react/src/lib/ui-library-context.tsx` exists to copy from
- [ ] `packages/react/src/lib/slot.tsx` exists to copy from
- [ ] `pnpm --filter @tour-kit/ai build` succeeds
- [ ] Vitest is configured for the `packages/ai/` package
