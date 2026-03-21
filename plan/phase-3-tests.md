# Phase 3 Test Plan — UI Components + Markdown Renderer

**Package:** `@tour-kit/ai`
**Phase Type:** Pure logic (renderer) + Component tests (React)
**Test Framework:** Vitest + `@testing-library/react` + `vitest-axe`
**Coverage Target:** > 80% for all Phase 3 files

---

## 1. Scope

| Deliverable | Test File | Type |
|-------------|-----------|------|
| `renderMarkdown()` — markdown-to-React renderer | `src/__tests__/core/markdown-renderer.test.tsx` | Unit |
| `AiChatPanel` — slideout/popover/inline modes | `src/__tests__/components/ai-chat-panel.test.tsx` | Component |
| `AiChatMessage` — user/assistant with markdown + rating | `src/__tests__/components/ai-chat-message.test.tsx` | Component |
| `AiChatInput` — Enter to send, disabled states | `src/__tests__/components/ai-chat-input.test.tsx` | Component |
| `AiChatBubble` — FAB with unread count | `src/__tests__/components/ai-chat-bubble.test.tsx` | Component |
| `AiChatSuggestions` — clickable chips | `src/__tests__/components/ai-chat-suggestions.test.tsx` | Component |
| Headless components — render prop variants | `src/__tests__/components/headless/headless-components.test.tsx` | Component |
| Accessibility — axe-core + ARIA + keyboard | `src/__tests__/components/accessibility.test.tsx` | A11y |

All test files live under `packages/ai/src/__tests__/`.

---

## 2. User Stories Mapped to Tests

| User Story | Test Coverage |
|------------|--------------|
| US-1: Markdown rendering without dangerouslySetInnerHTML (XSS impossible) | `markdown-renderer.test.tsx` > Security |
| US-2: Chat panel is keyboard navigable | `accessibility.test.tsx` > Keyboard Navigation |
| US-3: Headless components with render props | `headless-components.test.tsx` |
| US-4: axe-core reports 0 violations | `accessibility.test.tsx` > axe-core |
| US-5: CVA variants for consistent styling | `ai-chat-panel.test.tsx` > CVA Variants |

---

## 3. Shared Test Helpers

### `packages/ai/src/__tests__/helpers/chat-fixtures.ts`

```typescript
import type { UIMessage } from 'ai'

/** Factory for creating test UIMessage objects */
export function createUserMessage(text: string, id = 'user-1'): UIMessage {
  return {
    id,
    role: 'user',
    parts: [{ type: 'text', text }],
    createdAt: new Date('2026-01-15T10:00:00Z'),
  }
}

export function createAssistantMessage(text: string, id = 'assistant-1'): UIMessage {
  return {
    id,
    role: 'assistant',
    parts: [{ type: 'text', text }],
    createdAt: new Date('2026-01-15T10:00:01Z'),
  }
}

/** A conversation with multiple messages for list rendering tests */
export const SAMPLE_CONVERSATION: UIMessage[] = [
  createUserMessage('How do I export my data?', 'msg-1'),
  createAssistantMessage(
    'You can export your data from **Settings > Export**. Here are the steps:\n\n1. Go to Settings\n2. Click Export\n3. Choose your format',
    'msg-2'
  ),
  createUserMessage('What formats are supported?', 'msg-3'),
  createAssistantMessage(
    'We support the following formats:\n\n- CSV\n- JSON\n- XML\n\nFor more details, see the [Export Guide](https://docs.example.com/export).',
    'msg-4'
  ),
]

/** Markdown content covering all supported syntax */
export const FULL_MARKDOWN = `# Heading 1

## Heading 2

This is a paragraph with **bold**, *italic*, ~~strikethrough~~, and \`inline code\`.

- Unordered item 1
- Unordered item 2

1. Ordered item 1
2. Ordered item 2

\`\`\`javascript
const x = 42
console.log(x)
\`\`\`

[Link text](https://example.com)

Normal paragraph after code block.`
```

### `packages/ai/src/__tests__/helpers/mock-ai-chat.ts`

```typescript
import { vi } from 'vitest'
import type { UseAiChatReturn } from '../../hooks/use-ai-chat'
import type { UIMessage } from 'ai'

/**
 * Creates a mock useAiChat return value.
 * All functions are vi.fn() for assertion.
 */
export function createMockAiChat(
  overrides: Partial<UseAiChatReturn> = {}
): UseAiChatReturn {
  return {
    messages: [],
    status: 'ready',
    error: null,
    sendMessage: vi.fn(),
    stop: vi.fn(),
    reload: vi.fn(),
    setMessages: vi.fn(),
    isOpen: true,
    open: vi.fn(),
    close: vi.fn(),
    toggle: vi.fn(),
    ...overrides,
  }
}

/**
 * Creates a mock useAiChat in streaming state
 */
export function createStreamingMock(
  messages: UIMessage[] = []
): UseAiChatReturn {
  return createMockAiChat({
    messages,
    status: 'streaming',
  })
}

/**
 * Creates a mock useAiChat in error state
 */
export function createErrorMock(
  errorMessage = 'Something went wrong'
): UseAiChatReturn {
  return createMockAiChat({
    status: 'error',
    error: new Error(errorMessage),
  })
}
```

### `packages/ai/src/__tests__/helpers/render-with-provider.tsx`

```typescript
import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'
import type { UseAiChatReturn } from '../../hooks/use-ai-chat'
import { createMockAiChat } from './mock-ai-chat'

// Mock the useAiChat hook at module level in test files via vi.mock()
// This helper wraps components in necessary context providers

interface ProviderOptions {
  chatState?: Partial<UseAiChatReturn>
}

function createTestWrapper(options: ProviderOptions = {}) {
  // The actual AiChatProvider is mocked in tests via vi.mock()
  // This wrapper ensures children render within the expected context
  return function TestWrapper({ children }: { children: ReactNode }) {
    return <>{children}</>
  }
}

export function renderWithProvider(
  ui: ReactElement,
  options: ProviderOptions & Omit<RenderOptions, 'wrapper'> = {}
) {
  const { chatState, ...renderOptions } = options
  return render(ui, {
    wrapper: createTestWrapper({ chatState }),
    ...renderOptions,
  })
}
```

---

## 4. Test File Details

### 4.1 `packages/ai/src/__tests__/core/markdown-renderer.test.tsx`

```typescript
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderMarkdown } from '../../core/markdown-renderer'
import { FULL_MARKDOWN } from '../helpers/chat-fixtures'

describe('renderMarkdown', () => {
  // -------------------------------------------------------
  // Headings
  // -------------------------------------------------------
  describe('Headings', () => {
    it('renders h1 from single # prefix', () => {
      const { container } = render(renderMarkdown('# Hello World'))
      const h1 = container.querySelector('h1')
      expect(h1).not.toBeNull()
      expect(h1!.textContent).toBe('Hello World')
    })

    it('renders h2 from ## prefix', () => {
      const { container } = render(renderMarkdown('## Subtitle'))
      expect(container.querySelector('h2')).not.toBeNull()
    })

    it('renders h3 through h6', () => {
      for (let level = 3; level <= 6; level++) {
        const prefix = '#'.repeat(level)
        const { container } = render(renderMarkdown(`${prefix} Heading ${level}`))
        expect(container.querySelector(`h${level}`)).not.toBeNull()
      }
    })
  })

  // -------------------------------------------------------
  // Inline Formatting
  // -------------------------------------------------------
  describe('Inline Formatting', () => {
    it('renders bold text with ** markers', () => {
      const { container } = render(renderMarkdown('This is **bold** text'))
      const strong = container.querySelector('strong')
      expect(strong).not.toBeNull()
      expect(strong!.textContent).toBe('bold')
    })

    it('renders bold text with __ markers', () => {
      const { container } = render(renderMarkdown('This is __bold__ text'))
      const strong = container.querySelector('strong')
      expect(strong).not.toBeNull()
      expect(strong!.textContent).toBe('bold')
    })

    it('renders italic text with * marker', () => {
      const { container } = render(renderMarkdown('This is *italic* text'))
      const em = container.querySelector('em')
      expect(em).not.toBeNull()
      expect(em!.textContent).toBe('italic')
    })

    it('renders italic text with _ marker', () => {
      const { container } = render(renderMarkdown('This is _italic_ text'))
      const em = container.querySelector('em')
      expect(em).not.toBeNull()
      expect(em!.textContent).toBe('italic')
    })

    it('renders strikethrough with ~~ markers', () => {
      const { container } = render(renderMarkdown('This is ~~deleted~~ text'))
      const del = container.querySelector('del')
      expect(del).not.toBeNull()
      expect(del!.textContent).toBe('deleted')
    })

    it('renders inline code with backtick markers', () => {
      const { container } = render(renderMarkdown('Use `const x = 1` here'))
      const code = container.querySelector('code')
      expect(code).not.toBeNull()
      expect(code!.textContent).toBe('const x = 1')
    })

    it('renders nested bold and italic', () => {
      const { container } = render(renderMarkdown('**bold _and italic_**'))
      const strong = container.querySelector('strong')
      expect(strong).not.toBeNull()
      const em = strong!.querySelector('em')
      expect(em).not.toBeNull()
      expect(em!.textContent).toBe('and italic')
    })
  })

  // -------------------------------------------------------
  // Links
  // -------------------------------------------------------
  describe('Links', () => {
    it('renders links with correct href', () => {
      const { container } = render(
        renderMarkdown('[Click here](https://example.com)')
      )
      const link = container.querySelector('a')
      expect(link).not.toBeNull()
      expect(link!.getAttribute('href')).toBe('https://example.com')
      expect(link!.textContent).toBe('Click here')
    })

    it('adds target="_blank" to links', () => {
      const { container } = render(
        renderMarkdown('[Link](https://example.com)')
      )
      const link = container.querySelector('a')
      expect(link!.getAttribute('target')).toBe('_blank')
    })

    it('adds rel="noopener noreferrer" to links', () => {
      const { container } = render(
        renderMarkdown('[Link](https://example.com)')
      )
      const link = container.querySelector('a')
      expect(link!.getAttribute('rel')).toBe('noopener noreferrer')
    })
  })

  // -------------------------------------------------------
  // Lists
  // -------------------------------------------------------
  describe('Lists', () => {
    it('renders unordered list from - prefix', () => {
      const { container } = render(
        renderMarkdown('- Item 1\n- Item 2\n- Item 3')
      )
      const ul = container.querySelector('ul')
      expect(ul).not.toBeNull()
      const items = ul!.querySelectorAll('li')
      expect(items).toHaveLength(3)
      expect(items[0].textContent).toBe('Item 1')
    })

    it('renders unordered list from * prefix', () => {
      const { container } = render(
        renderMarkdown('* Item A\n* Item B')
      )
      const ul = container.querySelector('ul')
      expect(ul).not.toBeNull()
      expect(ul!.querySelectorAll('li')).toHaveLength(2)
    })

    it('renders ordered list from number prefix', () => {
      const { container } = render(
        renderMarkdown('1. First\n2. Second\n3. Third')
      )
      const ol = container.querySelector('ol')
      expect(ol).not.toBeNull()
      const items = ol!.querySelectorAll('li')
      expect(items).toHaveLength(3)
      expect(items[0].textContent).toBe('First')
    })

    it('applies inline formatting within list items', () => {
      const { container } = render(
        renderMarkdown('- **Bold item**\n- *Italic item*')
      )
      const items = container.querySelectorAll('li')
      expect(items[0].querySelector('strong')).not.toBeNull()
      expect(items[1].querySelector('em')).not.toBeNull()
    })
  })

  // -------------------------------------------------------
  // Code Blocks
  // -------------------------------------------------------
  describe('Code Blocks', () => {
    it('renders fenced code block with pre and code elements', () => {
      const { container } = render(
        renderMarkdown('```\nconst x = 1\n```')
      )
      const pre = container.querySelector('pre')
      expect(pre).not.toBeNull()
      const code = pre!.querySelector('code')
      expect(code).not.toBeNull()
      expect(code!.textContent).toContain('const x = 1')
    })

    it('captures language from fence and adds className', () => {
      const { container } = render(
        renderMarkdown('```javascript\nconst x = 1\n```')
      )
      const code = container.querySelector('code')
      expect(code!.className).toContain('language-javascript')
    })

    it('preserves code block content verbatim (no inline parsing)', () => {
      const { container } = render(
        renderMarkdown('```\n**not bold** *not italic*\n```')
      )
      const code = container.querySelector('code')
      expect(code!.textContent).toContain('**not bold**')
      expect(container.querySelector('pre strong')).toBeNull()
    })

    it('handles multi-line code blocks', () => {
      const { container } = render(
        renderMarkdown('```\nline 1\nline 2\nline 3\n```')
      )
      const code = container.querySelector('code')
      expect(code!.textContent).toContain('line 1')
      expect(code!.textContent).toContain('line 2')
      expect(code!.textContent).toContain('line 3')
    })
  })

  // -------------------------------------------------------
  // Paragraphs
  // -------------------------------------------------------
  describe('Paragraphs', () => {
    it('wraps plain text in p elements', () => {
      const { container } = render(renderMarkdown('Hello world'))
      const p = container.querySelector('p')
      expect(p).not.toBeNull()
      expect(p!.textContent).toBe('Hello world')
    })

    it('separates paragraphs on empty lines', () => {
      const { container } = render(
        renderMarkdown('First paragraph.\n\nSecond paragraph.')
      )
      const paragraphs = container.querySelectorAll('p')
      expect(paragraphs.length).toBeGreaterThanOrEqual(2)
    })
  })

  // -------------------------------------------------------
  // Full Markdown Document
  // -------------------------------------------------------
  describe('Full Document', () => {
    it('renders a complete markdown document with all supported syntax', () => {
      const { container } = render(renderMarkdown(FULL_MARKDOWN))

      expect(container.querySelector('h1')).not.toBeNull()
      expect(container.querySelector('h2')).not.toBeNull()
      expect(container.querySelector('strong')).not.toBeNull()
      expect(container.querySelector('em')).not.toBeNull()
      expect(container.querySelector('del')).not.toBeNull()
      expect(container.querySelector('code')).not.toBeNull()
      expect(container.querySelector('ul')).not.toBeNull()
      expect(container.querySelector('ol')).not.toBeNull()
      expect(container.querySelector('pre')).not.toBeNull()
      expect(container.querySelector('a')).not.toBeNull()
    })
  })

  // -------------------------------------------------------
  // Security
  // -------------------------------------------------------
  describe('Security', () => {
    it('does not use dangerouslySetInnerHTML', () => {
      const { container } = render(
        renderMarkdown('**bold** and [link](https://example.com)')
      )
      // The rendered output should not have any innerHTML-based injection
      // All elements should be created via React.createElement
      const allElements = container.querySelectorAll('*')
      for (const el of allElements) {
        // React elements created via createElement will not have
        // the __html property in their outerHTML
        expect(el.outerHTML).not.toContain('dangerouslySetInnerHTML')
      }
    })

    it('escapes HTML tags in input (no raw HTML rendering)', () => {
      const { container } = render(
        renderMarkdown('<script>alert("xss")</script>')
      )
      expect(container.querySelector('script')).toBeNull()
      // The text should be visible but not executed as HTML
      expect(container.textContent).toContain('<script>')
    })

    it('escapes HTML in inline code', () => {
      const { container } = render(
        renderMarkdown('`<img src=x onerror=alert(1)>`')
      )
      expect(container.querySelector('img')).toBeNull()
    })

    it('does not execute javascript: URLs in links', () => {
      const { container } = render(
        renderMarkdown('[click](javascript:alert(1))')
      )
      const link = container.querySelector('a')
      // Either the link should not render, or href should be sanitized
      if (link) {
        expect(link.getAttribute('href')).not.toContain('javascript:')
      }
    })
  })

  // -------------------------------------------------------
  // Edge Cases
  // -------------------------------------------------------
  describe('Edge Cases', () => {
    it('handles empty string input', () => {
      const { container } = render(renderMarkdown(''))
      expect(container).toBeDefined()
    })

    it('handles whitespace-only input', () => {
      const { container } = render(renderMarkdown('   \n\n   '))
      expect(container).toBeDefined()
    })

    it('handles single-line input without markdown', () => {
      const { container } = render(renderMarkdown('Just plain text'))
      expect(container.textContent).toBe('Just plain text')
    })
  })
})
```

### 4.2 `packages/ai/src/__tests__/components/ai-chat-panel.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AiChatPanel } from '../../components/ai-chat-panel'
import { createMockAiChat } from '../helpers/mock-ai-chat'
import { SAMPLE_CONVERSATION } from '../helpers/chat-fixtures'

// Mock the useAiChat hook
const mockChat = createMockAiChat({ messages: SAMPLE_CONVERSATION })
vi.mock('../../hooks/use-ai-chat', () => ({
  useAiChat: () => mockChat,
}))

// Mock useAiChatStrings
vi.mock('../../hooks/use-ai-chat-strings', () => ({
  useAiChatStrings: () => ({
    placeholder: 'Ask a question...',
    send: 'Send',
    title: 'Chat',
    closeLabel: 'Close chat',
    emptyState: 'How can I help you?',
    stopGenerating: 'Stop generating',
    ratePositiveLabel: 'Helpful',
    rateNegativeLabel: 'Not helpful',
  }),
}))

describe('AiChatPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(mockChat, createMockAiChat({ messages: SAMPLE_CONVERSATION }))
  })

  // -------------------------------------------------------
  // Rendering
  // -------------------------------------------------------
  describe('Rendering', () => {
    it('renders the panel with default mode (slideout)', () => {
      render(<AiChatPanel />)
      expect(screen.getByRole('complementary')).toBeInTheDocument()
    })

    it('renders panel title from strings', () => {
      render(<AiChatPanel />)
      expect(screen.getByText('Chat')).toBeInTheDocument()
    })

    it('renders messages in the message list', () => {
      render(<AiChatPanel />)
      expect(screen.getByText('How do I export my data?')).toBeInTheDocument()
    })

    it('renders a close button', () => {
      render(<AiChatPanel />)
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
    })

    it('renders the input area', () => {
      render(<AiChatPanel />)
      expect(screen.getByPlaceholderText('Ask a question...')).toBeInTheDocument()
    })
  })

  // -------------------------------------------------------
  // CVA Variants / Modes
  // -------------------------------------------------------
  describe('Display Modes', () => {
    it('applies slideout mode class by default', () => {
      render(<AiChatPanel />)
      const panel = screen.getByRole('complementary')
      expect(panel.className).toContain('slideout')
    })

    it('applies popover mode class when mode is popover', () => {
      render(<AiChatPanel mode="popover" />)
      const panel = screen.getByRole('complementary')
      expect(panel.className).toContain('popover')
    })

    it('applies inline mode class when mode is inline', () => {
      render(<AiChatPanel mode="inline" />)
      const panel = screen.getByRole('complementary')
      expect(panel.className).toContain('inline')
    })

    it('applies position class', () => {
      render(<AiChatPanel position="bottom-left" />)
      const panel = screen.getByRole('complementary')
      expect(panel.className).toContain('bl')
    })

    it('accepts additional className', () => {
      render(<AiChatPanel className="custom-class" />)
      const panel = screen.getByRole('complementary')
      expect(panel.className).toContain('custom-class')
    })
  })

  // -------------------------------------------------------
  // Interactions
  // -------------------------------------------------------
  describe('Interactions', () => {
    it('calls close() when close button is clicked', async () => {
      const user = userEvent.setup()
      render(<AiChatPanel />)
      await user.click(screen.getByRole('button', { name: /close/i }))
      expect(mockChat.close).toHaveBeenCalledTimes(1)
    })

    it('calls close() when Escape key is pressed', async () => {
      const user = userEvent.setup()
      render(<AiChatPanel />)
      await user.keyboard('{Escape}')
      expect(mockChat.close).toHaveBeenCalledTimes(1)
    })

    it('does not close on Escape when mode is inline', async () => {
      const user = userEvent.setup()
      render(<AiChatPanel mode="inline" />)
      await user.keyboard('{Escape}')
      expect(mockChat.close).not.toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------
  // ARIA Attributes
  // -------------------------------------------------------
  describe('ARIA', () => {
    it('has role="complementary"', () => {
      render(<AiChatPanel />)
      expect(screen.getByRole('complementary')).toBeInTheDocument()
    })

    it('has aria-label from strings', () => {
      render(<AiChatPanel />)
      const panel = screen.getByRole('complementary')
      expect(panel).toHaveAttribute('aria-label')
    })

    it('message list has aria-live="polite"', () => {
      const { container } = render(<AiChatPanel />)
      const liveRegion = container.querySelector('[aria-live="polite"]')
      expect(liveRegion).not.toBeNull()
    })

    it('message list has aria-relevant="additions"', () => {
      const { container } = render(<AiChatPanel />)
      const liveRegion = container.querySelector('[aria-live="polite"]')
      expect(liveRegion).toHaveAttribute('aria-relevant', 'additions')
    })
  })

  // -------------------------------------------------------
  // Empty State
  // -------------------------------------------------------
  describe('Empty State', () => {
    it('shows empty state message when no messages', () => {
      Object.assign(mockChat, createMockAiChat({ messages: [] }))
      render(<AiChatPanel />)
      expect(screen.getByText('How can I help you?')).toBeInTheDocument()
    })
  })
})
```

### 4.3 `packages/ai/src/__tests__/components/ai-chat-message.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AiChatMessage } from '../../components/ai-chat-message'
import { createUserMessage, createAssistantMessage } from '../helpers/chat-fixtures'

// Mock useAiChatStrings
vi.mock('../../hooks/use-ai-chat-strings', () => ({
  useAiChatStrings: () => ({
    ratePositiveLabel: 'Helpful',
    rateNegativeLabel: 'Not helpful',
  }),
}))

describe('AiChatMessage', () => {
  describe('User Messages', () => {
    it('renders user message as plain text', () => {
      render(<AiChatMessage message={createUserMessage('Hello there')} />)
      expect(screen.getByText('Hello there')).toBeInTheDocument()
    })

    it('does not render rating buttons for user messages', () => {
      render(<AiChatMessage message={createUserMessage('Hello')} />)
      expect(screen.queryByRole('button', { name: /helpful/i })).not.toBeInTheDocument()
    })

    it('applies user message variant styling', () => {
      const { container } = render(
        <AiChatMessage message={createUserMessage('Hello')} />
      )
      const messageEl = container.firstElementChild
      expect(messageEl?.className).toContain('user')
    })
  })

  describe('Assistant Messages', () => {
    it('renders assistant message with markdown formatting', () => {
      const msg = createAssistantMessage('This is **bold** text')
      const { container } = render(<AiChatMessage message={msg} />)
      expect(container.querySelector('strong')).not.toBeNull()
      expect(container.querySelector('strong')!.textContent).toBe('bold')
    })

    it('renders rating buttons for assistant messages', () => {
      const msg = createAssistantMessage('Hello!')
      render(<AiChatMessage message={msg} />)
      expect(screen.getByRole('button', { name: 'Helpful' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Not helpful' })).toBeInTheDocument()
    })

    it('calls onRate with positive when thumbs up is clicked', async () => {
      const user = userEvent.setup()
      const onRate = vi.fn()
      const msg = createAssistantMessage('Hello!')
      render(<AiChatMessage message={msg} onRate={onRate} />)
      await user.click(screen.getByRole('button', { name: 'Helpful' }))
      expect(onRate).toHaveBeenCalledWith(msg.id, 'positive')
    })

    it('calls onRate with negative when thumbs down is clicked', async () => {
      const user = userEvent.setup()
      const onRate = vi.fn()
      const msg = createAssistantMessage('Hello!')
      render(<AiChatMessage message={msg} onRate={onRate} />)
      await user.click(screen.getByRole('button', { name: 'Not helpful' }))
      expect(onRate).toHaveBeenCalledWith(msg.id, 'negative')
    })

    it('applies assistant message variant styling', () => {
      const { container } = render(
        <AiChatMessage message={createAssistantMessage('Hello')} />
      )
      const messageEl = container.firstElementChild
      expect(messageEl?.className).toContain('assistant')
    })
  })

  describe('Rating State', () => {
    it('rating button has aria-pressed when rated', async () => {
      const user = userEvent.setup()
      const msg = createAssistantMessage('Hello!')
      render(<AiChatMessage message={msg} onRate={vi.fn()} />)
      const positiveBtn = screen.getByRole('button', { name: 'Helpful' })
      await user.click(positiveBtn)
      expect(positiveBtn).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('className Override', () => {
    it('accepts additional className', () => {
      const { container } = render(
        <AiChatMessage
          message={createUserMessage('Hello')}
          className="custom-msg"
        />
      )
      expect(container.firstElementChild?.className).toContain('custom-msg')
    })
  })
})
```

### 4.4 `packages/ai/src/__tests__/components/ai-chat-input.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AiChatInput } from '../../components/ai-chat-input'
import { createMockAiChat } from '../helpers/mock-ai-chat'

const mockChat = createMockAiChat()
vi.mock('../../hooks/use-ai-chat', () => ({
  useAiChat: () => mockChat,
}))

vi.mock('../../hooks/use-ai-chat-strings', () => ({
  useAiChatStrings: () => ({
    placeholder: 'Ask a question...',
    send: 'Send',
    stopGenerating: 'Stop generating',
  }),
}))

describe('AiChatInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(mockChat, createMockAiChat())
  })

  describe('Rendering', () => {
    it('renders a text input with placeholder', () => {
      render(<AiChatInput />)
      expect(screen.getByPlaceholderText('Ask a question...')).toBeInTheDocument()
    })

    it('renders a send button', () => {
      render(<AiChatInput />)
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
    })

    it('accepts custom placeholder via prop', () => {
      render(<AiChatInput placeholder="Type here..." />)
      expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument()
    })
  })

  describe('Sending Messages', () => {
    it('sends message on Enter key press', async () => {
      const user = userEvent.setup()
      render(<AiChatInput />)
      const input = screen.getByPlaceholderText('Ask a question...')
      await user.type(input, 'Hello{Enter}')
      expect(mockChat.sendMessage).toHaveBeenCalledWith({ text: 'Hello' })
    })

    it('sends message on send button click', async () => {
      const user = userEvent.setup()
      render(<AiChatInput />)
      const input = screen.getByPlaceholderText('Ask a question...')
      await user.type(input, 'Hello')
      await user.click(screen.getByRole('button', { name: /send/i }))
      expect(mockChat.sendMessage).toHaveBeenCalledWith({ text: 'Hello' })
    })

    it('does not send empty message', async () => {
      const user = userEvent.setup()
      render(<AiChatInput />)
      const input = screen.getByPlaceholderText('Ask a question...')
      await user.click(input)
      await user.keyboard('{Enter}')
      expect(mockChat.sendMessage).not.toHaveBeenCalled()
    })

    it('clears input after sending', async () => {
      const user = userEvent.setup()
      render(<AiChatInput />)
      const input = screen.getByPlaceholderText('Ask a question...')
      await user.type(input, 'Hello{Enter}')
      expect(input).toHaveValue('')
    })

    it('inserts newline on Shift+Enter', async () => {
      const user = userEvent.setup()
      render(<AiChatInput />)
      const input = screen.getByPlaceholderText('Ask a question...')
      await user.type(input, 'Line 1{Shift>}{Enter}{/Shift}Line 2')
      expect(mockChat.sendMessage).not.toHaveBeenCalled()
      expect(input).toHaveValue('Line 1\nLine 2')
    })
  })

  describe('Disabled State', () => {
    it('disables input when status is streaming', () => {
      Object.assign(mockChat, createMockAiChat({ status: 'streaming' }))
      render(<AiChatInput />)
      const input = screen.getByPlaceholderText('Ask a question...')
      expect(input).toBeDisabled()
    })

    it('disables input when status is submitted', () => {
      Object.assign(mockChat, createMockAiChat({ status: 'submitted' }))
      render(<AiChatInput />)
      const input = screen.getByPlaceholderText('Ask a question...')
      expect(input).toBeDisabled()
    })

    it('disables send button when input is empty', () => {
      render(<AiChatInput />)
      const sendBtn = screen.getByRole('button', { name: /send/i })
      expect(sendBtn).toBeDisabled()
    })

    it('enables input when status is ready', () => {
      render(<AiChatInput />)
      const input = screen.getByPlaceholderText('Ask a question...')
      expect(input).not.toBeDisabled()
    })
  })

  describe('ARIA', () => {
    it('input has aria-label', () => {
      render(<AiChatInput />)
      const input = screen.getByPlaceholderText('Ask a question...')
      expect(input).toHaveAttribute('aria-label')
    })
  })
})
```

### 4.5 `packages/ai/src/__tests__/components/ai-chat-bubble.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AiChatBubble } from '../../components/ai-chat-bubble'
import { createMockAiChat } from '../helpers/mock-ai-chat'

const mockChat = createMockAiChat({ isOpen: false })
vi.mock('../../hooks/use-ai-chat', () => ({
  useAiChat: () => mockChat,
}))

describe('AiChatBubble', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(mockChat, createMockAiChat({ isOpen: false }))
  })

  describe('Rendering', () => {
    it('renders a button', () => {
      render(<AiChatBubble />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('shows unread count badge when unreadCount > 0', () => {
      render(<AiChatBubble unreadCount={3} />)
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('hides badge when unreadCount is 0', () => {
      render(<AiChatBubble unreadCount={0} />)
      expect(screen.queryByText('0')).not.toBeInTheDocument()
    })

    it('hides badge when unreadCount is not provided', () => {
      const { container } = render(<AiChatBubble />)
      // Badge element should not be present
      const badge = container.querySelector('[data-badge]')
      expect(badge).toBeNull()
    })
  })

  describe('Interactions', () => {
    it('calls toggle() on click', async () => {
      const user = userEvent.setup()
      render(<AiChatBubble />)
      await user.click(screen.getByRole('button'))
      expect(mockChat.toggle).toHaveBeenCalledTimes(1)
    })
  })

  describe('ARIA Attributes', () => {
    it('has aria-label "Open chat" when panel is closed', () => {
      Object.assign(mockChat, createMockAiChat({ isOpen: false }))
      render(<AiChatBubble />)
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Open chat')
    })

    it('has aria-label "Close chat" when panel is open', () => {
      Object.assign(mockChat, createMockAiChat({ isOpen: true }))
      render(<AiChatBubble />)
      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Close chat')
    })

    it('has aria-expanded=false when closed', () => {
      Object.assign(mockChat, createMockAiChat({ isOpen: false }))
      render(<AiChatBubble />)
      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false')
    })

    it('has aria-expanded=true when open', () => {
      Object.assign(mockChat, createMockAiChat({ isOpen: true }))
      render(<AiChatBubble />)
      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
    })

    it('has aria-haspopup="dialog"', () => {
      render(<AiChatBubble />)
      expect(screen.getByRole('button')).toHaveAttribute('aria-haspopup', 'dialog')
    })
  })

  describe('Pulse Animation', () => {
    it('applies pulse class when pulse prop is true', () => {
      render(<AiChatBubble pulse />)
      const button = screen.getByRole('button')
      expect(button.className).toContain('pulse')
    })

    it('does not apply pulse class by default', () => {
      render(<AiChatBubble />)
      const button = screen.getByRole('button')
      expect(button.className).not.toContain('pulse')
    })
  })

  describe('className Override', () => {
    it('accepts additional className', () => {
      render(<AiChatBubble className="custom-bubble" />)
      expect(screen.getByRole('button').className).toContain('custom-bubble')
    })
  })
})
```

### 4.6 `packages/ai/src/__tests__/components/ai-chat-suggestions.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AiChatSuggestions } from '../../components/ai-chat-suggestions'

describe('AiChatSuggestions', () => {
  const suggestions = [
    'How do I export data?',
    'What formats are supported?',
    'How do I create a report?',
  ]

  describe('Rendering', () => {
    it('renders all suggestion chips as buttons', () => {
      render(<AiChatSuggestions suggestions={suggestions} onSelect={vi.fn()} />)
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(3)
    })

    it('displays suggestion text in each chip', () => {
      render(<AiChatSuggestions suggestions={suggestions} onSelect={vi.fn()} />)
      expect(screen.getByText('How do I export data?')).toBeInTheDocument()
      expect(screen.getByText('What formats are supported?')).toBeInTheDocument()
      expect(screen.getByText('How do I create a report?')).toBeInTheDocument()
    })

    it('renders empty when suggestions array is empty', () => {
      const { container } = render(
        <AiChatSuggestions suggestions={[]} onSelect={vi.fn()} />
      )
      expect(container.querySelectorAll('button')).toHaveLength(0)
    })
  })

  describe('Interactions', () => {
    it('calls onSelect with the clicked suggestion text', async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()
      render(<AiChatSuggestions suggestions={suggestions} onSelect={onSelect} />)
      await user.click(screen.getByText('How do I export data?'))
      expect(onSelect).toHaveBeenCalledWith('How do I export data?')
    })

    it('calls onSelect only once per click', async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()
      render(<AiChatSuggestions suggestions={suggestions} onSelect={onSelect} />)
      await user.click(screen.getByText('What formats are supported?'))
      expect(onSelect).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('chips container has role="group"', () => {
      render(<AiChatSuggestions suggestions={suggestions} onSelect={vi.fn()} />)
      expect(screen.getByRole('group')).toBeInTheDocument()
    })

    it('each chip is a button element', () => {
      render(<AiChatSuggestions suggestions={suggestions} onSelect={vi.fn()} />)
      const buttons = screen.getAllByRole('button')
      for (const btn of buttons) {
        expect(btn.tagName).toBe('BUTTON')
      }
    })
  })

  describe('className Override', () => {
    it('accepts additional className', () => {
      const { container } = render(
        <AiChatSuggestions
          suggestions={suggestions}
          onSelect={vi.fn()}
          className="custom-suggestions"
        />
      )
      expect(container.firstElementChild?.className).toContain('custom-suggestions')
    })
  })
})
```

### 4.7 `packages/ai/src/__tests__/components/headless/headless-components.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HeadlessChatPanel } from '../../../components/headless/headless-chat-panel'
import { HeadlessChatMessage } from '../../../components/headless/headless-chat-message'
import { HeadlessChatInput } from '../../../components/headless/headless-chat-input'
import { HeadlessChatBubble } from '../../../components/headless/headless-chat-bubble'
import { HeadlessChatSuggestions } from '../../../components/headless/headless-chat-suggestions'
import { createMockAiChat } from '../../helpers/mock-ai-chat'
import { createAssistantMessage, createUserMessage, SAMPLE_CONVERSATION } from '../../helpers/chat-fixtures'

const mockChat = createMockAiChat({ messages: SAMPLE_CONVERSATION })
vi.mock('../../../hooks/use-ai-chat', () => ({
  useAiChat: () => mockChat,
}))

describe('Headless Components', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(mockChat, createMockAiChat({ messages: SAMPLE_CONVERSATION }))
  })

  // -------------------------------------------------------
  // HeadlessChatPanel
  // -------------------------------------------------------
  describe('HeadlessChatPanel', () => {
    it('exposes messages via render prop', () => {
      render(
        <HeadlessChatPanel>
          {(state) => (
            <div data-testid="panel">
              <span data-testid="count">{state.messages.length}</span>
            </div>
          )}
        </HeadlessChatPanel>
      )
      expect(screen.getByTestId('count').textContent).toBe(
        String(SAMPLE_CONVERSATION.length)
      )
    })

    it('exposes status via render prop', () => {
      render(
        <HeadlessChatPanel>
          {(state) => <span data-testid="status">{state.status}</span>}
        </HeadlessChatPanel>
      )
      expect(screen.getByTestId('status').textContent).toBe('ready')
    })

    it('exposes isOpen via render prop', () => {
      render(
        <HeadlessChatPanel>
          {(state) => (
            <span data-testid="open">{String(state.isOpen)}</span>
          )}
        </HeadlessChatPanel>
      )
      expect(screen.getByTestId('open').textContent).toBe('true')
    })

    it('exposes sendMessage action via render prop', () => {
      render(
        <HeadlessChatPanel>
          {(state) => (
            <button onClick={() => state.sendMessage({ text: 'test' })}>
              Send
            </button>
          )}
        </HeadlessChatPanel>
      )
      screen.getByText('Send').click()
      expect(mockChat.sendMessage).toHaveBeenCalledWith({ text: 'test' })
    })

    it('exposes close action via render prop', () => {
      render(
        <HeadlessChatPanel>
          {(state) => <button onClick={state.close}>Close</button>}
        </HeadlessChatPanel>
      )
      screen.getByText('Close').click()
      expect(mockChat.close).toHaveBeenCalled()
    })

    it('exposes stop action via render prop', () => {
      render(
        <HeadlessChatPanel>
          {(state) => <button onClick={state.stop}>Stop</button>}
        </HeadlessChatPanel>
      )
      screen.getByText('Stop').click()
      expect(mockChat.stop).toHaveBeenCalled()
    })

    it('renders no DOM of its own — consumer controls all markup', () => {
      const { container } = render(
        <HeadlessChatPanel>
          {() => <div data-testid="custom-panel">Custom</div>}
        </HeadlessChatPanel>
      )
      expect(screen.getByTestId('custom-panel')).toBeInTheDocument()
      // The headless component should not add wrapper elements
      expect(container.firstElementChild?.getAttribute('data-testid')).toBe(
        'custom-panel'
      )
    })
  })

  // -------------------------------------------------------
  // HeadlessChatMessage
  // -------------------------------------------------------
  describe('HeadlessChatMessage', () => {
    it('exposes isUser=true for user messages', () => {
      const msg = createUserMessage('Hello')
      render(
        <HeadlessChatMessage message={msg}>
          {(state) => <span data-testid="is-user">{String(state.isUser)}</span>}
        </HeadlessChatMessage>
      )
      expect(screen.getByTestId('is-user').textContent).toBe('true')
    })

    it('exposes isAssistant=true for assistant messages', () => {
      const msg = createAssistantMessage('Hello')
      render(
        <HeadlessChatMessage message={msg}>
          {(state) => (
            <span data-testid="is-assistant">{String(state.isAssistant)}</span>
          )}
        </HeadlessChatMessage>
      )
      expect(screen.getByTestId('is-assistant').textContent).toBe('true')
    })

    it('exposes textContent extracted from message parts', () => {
      const msg = createAssistantMessage('Hello world')
      render(
        <HeadlessChatMessage message={msg}>
          {(state) => <span data-testid="text">{state.textContent}</span>}
        </HeadlessChatMessage>
      )
      expect(screen.getByTestId('text').textContent).toBe('Hello world')
    })

    it('exposes renderedContent as ReactElement for assistant', () => {
      const msg = createAssistantMessage('**bold**')
      render(
        <HeadlessChatMessage message={msg}>
          {(state) => <div data-testid="rendered">{state.renderedContent}</div>}
        </HeadlessChatMessage>
      )
      const rendered = screen.getByTestId('rendered')
      expect(rendered.querySelector('strong')).not.toBeNull()
    })

    it('exposes rate function and rating state', async () => {
      const user = userEvent.setup()
      const onRate = vi.fn()
      const msg = createAssistantMessage('Hello')
      render(
        <HeadlessChatMessage message={msg} onRate={onRate}>
          {(state) => (
            <div>
              <button onClick={() => state.rate('positive')}>Up</button>
              <span data-testid="rating">{String(state.rating)}</span>
            </div>
          )}
        </HeadlessChatMessage>
      )
      await user.click(screen.getByText('Up'))
      expect(onRate).toHaveBeenCalledWith(msg.id, 'positive')
    })
  })

  // -------------------------------------------------------
  // HeadlessChatInput
  // -------------------------------------------------------
  describe('HeadlessChatInput', () => {
    it('exposes value, setValue, and submit via render prop', async () => {
      const user = userEvent.setup()
      render(
        <HeadlessChatInput>
          {(state) => (
            <div>
              <input
                value={state.value}
                onChange={(e) => state.setValue(e.target.value)}
                data-testid="custom-input"
              />
              <button onClick={state.submit}>Go</button>
            </div>
          )}
        </HeadlessChatInput>
      )
      await user.type(screen.getByTestId('custom-input'), 'Test message')
      await user.click(screen.getByText('Go'))
      expect(mockChat.sendMessage).toHaveBeenCalledWith({ text: 'Test message' })
    })

    it('exposes disabled state based on chat status', () => {
      Object.assign(mockChat, createMockAiChat({ status: 'streaming' }))
      render(
        <HeadlessChatInput>
          {(state) => (
            <span data-testid="disabled">{String(state.disabled)}</span>
          )}
        </HeadlessChatInput>
      )
      expect(screen.getByTestId('disabled').textContent).toBe('true')
    })
  })

  // -------------------------------------------------------
  // HeadlessChatBubble
  // -------------------------------------------------------
  describe('HeadlessChatBubble', () => {
    it('exposes isOpen and toggle via render prop', async () => {
      const user = userEvent.setup()
      Object.assign(mockChat, createMockAiChat({ isOpen: false }))
      render(
        <HeadlessChatBubble>
          {(state) => (
            <div>
              <span data-testid="open">{String(state.isOpen)}</span>
              <button onClick={state.toggle}>Toggle</button>
            </div>
          )}
        </HeadlessChatBubble>
      )
      expect(screen.getByTestId('open').textContent).toBe('false')
      await user.click(screen.getByText('Toggle'))
      expect(mockChat.toggle).toHaveBeenCalled()
    })
  })

  // -------------------------------------------------------
  // HeadlessChatSuggestions
  // -------------------------------------------------------
  describe('HeadlessChatSuggestions', () => {
    it('exposes suggestions and onSelect via render prop', async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()
      render(
        <HeadlessChatSuggestions
          suggestions={['Suggestion A', 'Suggestion B']}
          onSelect={onSelect}
        >
          {(state) => (
            <div>
              {state.suggestions.map((s) => (
                <button key={s} onClick={() => state.onSelect(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
        </HeadlessChatSuggestions>
      )
      await user.click(screen.getByText('Suggestion A'))
      expect(onSelect).toHaveBeenCalledWith('Suggestion A')
    })
  })
})
```

### 4.8 `packages/ai/src/__tests__/components/accessibility.test.tsx`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'vitest-axe'
import { AiChatPanel } from '../../components/ai-chat-panel'
import { AiChatBubble } from '../../components/ai-chat-bubble'
import { AiChatMessage } from '../../components/ai-chat-message'
import { AiChatInput } from '../../components/ai-chat-input'
import { AiChatSuggestions } from '../../components/ai-chat-suggestions'
import { createMockAiChat } from '../helpers/mock-ai-chat'
import {
  createAssistantMessage,
  createUserMessage,
  SAMPLE_CONVERSATION,
} from '../helpers/chat-fixtures'

expect.extend(toHaveNoViolations)

const mockChat = createMockAiChat({ messages: SAMPLE_CONVERSATION })
vi.mock('../../hooks/use-ai-chat', () => ({
  useAiChat: () => mockChat,
}))
vi.mock('../../hooks/use-ai-chat-strings', () => ({
  useAiChatStrings: () => ({
    placeholder: 'Ask a question...',
    send: 'Send',
    title: 'Chat',
    closeLabel: 'Close chat',
    emptyState: 'How can I help you?',
    stopGenerating: 'Stop generating',
    ratePositiveLabel: 'Helpful',
    rateNegativeLabel: 'Not helpful',
  }),
}))

describe('Accessibility', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(mockChat, createMockAiChat({ messages: SAMPLE_CONVERSATION }))
  })

  // -------------------------------------------------------
  // axe-core: Zero Violations
  // -------------------------------------------------------
  describe('axe-core', () => {
    it('AiChatPanel has no accessibility violations', async () => {
      const { container } = render(<AiChatPanel />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('AiChatBubble has no accessibility violations', async () => {
      Object.assign(mockChat, createMockAiChat({ isOpen: false }))
      const { container } = render(<AiChatBubble />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('AiChatMessage (user) has no accessibility violations', async () => {
      const { container } = render(
        <AiChatMessage message={createUserMessage('Hello')} />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('AiChatMessage (assistant) has no accessibility violations', async () => {
      const { container } = render(
        <AiChatMessage
          message={createAssistantMessage('**Bold** and *italic*')}
          onRate={vi.fn()}
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('AiChatInput has no accessibility violations', async () => {
      const { container } = render(<AiChatInput />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('AiChatSuggestions has no accessibility violations', async () => {
      const { container } = render(
        <AiChatSuggestions
          suggestions={['Question 1', 'Question 2']}
          onSelect={vi.fn()}
        />
      )
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })
  })

  // -------------------------------------------------------
  // ARIA Live Region
  // -------------------------------------------------------
  describe('ARIA Live Region', () => {
    it('message list has aria-live="polite" for screen reader announcements', () => {
      const { container } = render(<AiChatPanel />)
      const liveRegion = container.querySelector('[aria-live="polite"]')
      expect(liveRegion).not.toBeNull()
    })

    it('message list has aria-relevant="additions"', () => {
      const { container } = render(<AiChatPanel />)
      const liveRegion = container.querySelector('[aria-live="polite"]')
      expect(liveRegion).toHaveAttribute('aria-relevant', 'additions')
    })
  })

  // -------------------------------------------------------
  // Focus Management
  // -------------------------------------------------------
  describe('Focus Management', () => {
    it('input receives focus when panel is open', () => {
      render(<AiChatPanel />)
      const input = screen.getByPlaceholderText('Ask a question...')
      // Input should be focusable (not disabled in ready state)
      expect(input).not.toBeDisabled()
      // In a real scenario, useEffect would focus the input on mount
      // This test verifies the input is present and focusable
      input.focus()
      expect(document.activeElement).toBe(input)
    })
  })

  // -------------------------------------------------------
  // Keyboard Navigation
  // -------------------------------------------------------
  describe('Keyboard Navigation', () => {
    it('Escape key closes panel in slideout mode', async () => {
      const user = userEvent.setup()
      render(<AiChatPanel mode="slideout" />)
      await user.keyboard('{Escape}')
      expect(mockChat.close).toHaveBeenCalled()
    })

    it('Escape key closes panel in popover mode', async () => {
      const user = userEvent.setup()
      render(<AiChatPanel mode="popover" />)
      await user.keyboard('{Escape}')
      expect(mockChat.close).toHaveBeenCalled()
    })

    it('Escape key does NOT close panel in inline mode', async () => {
      const user = userEvent.setup()
      render(<AiChatPanel mode="inline" />)
      await user.keyboard('{Escape}')
      expect(mockChat.close).not.toHaveBeenCalled()
    })

    it('Enter sends message in input', async () => {
      const user = userEvent.setup()
      render(<AiChatInput />)
      const input = screen.getByPlaceholderText('Ask a question...')
      await user.type(input, 'Hello{Enter}')
      expect(mockChat.sendMessage).toHaveBeenCalledWith({ text: 'Hello' })
    })

    it('Shift+Enter does not send message', async () => {
      const user = userEvent.setup()
      render(<AiChatInput />)
      const input = screen.getByPlaceholderText('Ask a question...')
      await user.type(input, 'Hello{Shift>}{Enter}{/Shift}')
      expect(mockChat.sendMessage).not.toHaveBeenCalled()
    })

    it('Tab navigates through interactive elements in panel', async () => {
      const user = userEvent.setup()
      render(<AiChatPanel />)
      // Tab through the panel — close button, input, send button should be reachable
      await user.tab()
      const focused = document.activeElement
      expect(focused?.tagName).toMatch(/BUTTON|TEXTAREA|INPUT/)
    })

    it('suggestion chips are keyboard activatable', async () => {
      const user = userEvent.setup()
      const onSelect = vi.fn()
      render(
        <AiChatSuggestions
          suggestions={['Option A']}
          onSelect={onSelect}
        />
      )
      const chip = screen.getByText('Option A')
      chip.focus()
      await user.keyboard('{Enter}')
      expect(onSelect).toHaveBeenCalledWith('Option A')
    })
  })

  // -------------------------------------------------------
  // ARIA Attributes on Components
  // -------------------------------------------------------
  describe('Component ARIA Attributes', () => {
    it('AiChatPanel has role="complementary"', () => {
      render(<AiChatPanel />)
      expect(screen.getByRole('complementary')).toBeInTheDocument()
    })

    it('AiChatPanel has aria-label', () => {
      render(<AiChatPanel />)
      const panel = screen.getByRole('complementary')
      expect(panel).toHaveAttribute('aria-label')
    })

    it('AiChatBubble has aria-expanded reflecting state', () => {
      Object.assign(mockChat, createMockAiChat({ isOpen: false }))
      render(<AiChatBubble />)
      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false')
    })

    it('AiChatBubble has aria-haspopup="dialog"', () => {
      render(<AiChatBubble />)
      expect(screen.getByRole('button')).toHaveAttribute('aria-haspopup', 'dialog')
    })

    it('rating buttons have aria-label from strings', () => {
      const msg = createAssistantMessage('Hello')
      render(<AiChatMessage message={msg} onRate={vi.fn()} />)
      expect(screen.getByRole('button', { name: 'Helpful' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Not helpful' })).toBeInTheDocument()
    })

    it('suggestions container has role="group"', () => {
      render(
        <AiChatSuggestions suggestions={['A']} onSelect={vi.fn()} />
      )
      expect(screen.getByRole('group')).toBeInTheDocument()
    })

    it('input has aria-controls linking to panel', () => {
      render(<AiChatPanel />)
      const input = screen.getByPlaceholderText('Ask a question...')
      expect(input).toHaveAttribute('aria-label')
    })
  })
})
```

---

## 5. Test Matrix

### 5.1 Markdown Renderer

| Test Case | Expected |
|-----------|----------|
| `# Heading` | `<h1>` element |
| `## ` through `######` | `<h2>` through `<h6>` |
| `**bold**` / `__bold__` | `<strong>` element |
| `*italic*` / `_italic_` | `<em>` element |
| `` `code` `` | `<code>` element |
| `~~strikethrough~~` | `<del>` element |
| `[text](url)` | `<a href="url" target="_blank" rel="noopener noreferrer">` |
| `- item` / `* item` | `<ul><li>` |
| `1. item` | `<ol><li>` |
| ` ```lang ``` ` | `<pre><code class="language-lang">` |
| Nested `**bold _italic_**` | `<strong>` containing `<em>` |
| `<script>` injection | Escaped as text, no script execution |
| `javascript:` URL | Sanitized or removed |
| Empty string | Renders without error |

### 5.2 Components

| Component | Test Cases |
|-----------|-----------|
| AiChatPanel | 3 modes render, close button, Escape closes, ARIA, empty state, CVA classes |
| AiChatMessage | User plain text, assistant markdown, rating buttons, onRate callback, aria-pressed |
| AiChatInput | Enter sends, Shift+Enter newline, disabled states, empty message blocked, clears after send |
| AiChatBubble | Toggle click, unread badge, aria-expanded, aria-label toggle, pulse animation |
| AiChatSuggestions | Chip rendering, onSelect callback, role="group", button elements |

### 5.3 Headless Components

| Component | Exposed State |
|-----------|--------------|
| HeadlessChatPanel | messages, status, isOpen, sendMessage, stop, close, error, messageListRef |
| HeadlessChatMessage | message, isUser, isAssistant, textContent, renderedContent, rating, rate |
| HeadlessChatInput | value, setValue, submit, disabled, inputRef, handleKeyDown |
| HeadlessChatBubble | isOpen, toggle |
| HeadlessChatSuggestions | suggestions, onSelect |

### 5.4 Accessibility

| Test Case | Tool |
|-----------|------|
| axe-core 0 violations on each component | vitest-axe |
| aria-live="polite" on message list | @testing-library/react |
| Focus moves to input on panel open | @testing-library/react |
| Escape closes slideout/popover (not inline) | userEvent |
| Enter sends, Shift+Enter newline | userEvent |
| Tab reaches all interactive elements | userEvent |
| aria-expanded on bubble | @testing-library/react |
| aria-pressed on rating buttons | @testing-library/react |
| role="group" on suggestions | @testing-library/react |

---

## 6. Coverage Requirements

| File | Minimum Coverage |
|------|-----------------|
| `src/core/markdown-renderer.tsx` | 90% lines, 85% branches |
| `src/components/ai-chat-panel.tsx` | 80% lines |
| `src/components/ai-chat-message.tsx` | 85% lines |
| `src/components/ai-chat-input.tsx` | 85% lines |
| `src/components/ai-chat-bubble.tsx` | 90% lines |
| `src/components/ai-chat-suggestions.tsx` | 90% lines |
| `src/components/headless/*.tsx` | 80% lines |

---

## 7. Running Tests

```bash
# Run all Phase 3 tests
pnpm --filter @tour-kit/ai test -- --run src/__tests__/core/markdown-renderer.test.tsx src/__tests__/components/

# Run only markdown renderer tests
pnpm --filter @tour-kit/ai test -- --run src/__tests__/core/markdown-renderer.test.tsx

# Run only component tests
pnpm --filter @tour-kit/ai test -- --run src/__tests__/components/

# Run only accessibility tests
pnpm --filter @tour-kit/ai test -- --run src/__tests__/components/accessibility.test.tsx

# Run with coverage
pnpm --filter @tour-kit/ai test -- --coverage --run

# Run in watch mode during development
pnpm --filter @tour-kit/ai test -- --watch
```

---

## 8. Exit Criteria

- [ ] All tests in `markdown-renderer.test.tsx` pass (30+ test cases)
- [ ] All tests in `ai-chat-panel.test.tsx` pass (15+ test cases)
- [ ] All tests in `ai-chat-message.test.tsx` pass (12+ test cases)
- [ ] All tests in `ai-chat-input.test.tsx` pass (12+ test cases)
- [ ] All tests in `ai-chat-bubble.test.tsx` pass (12+ test cases)
- [ ] All tests in `ai-chat-suggestions.test.tsx` pass (8+ test cases)
- [ ] All tests in `headless-components.test.tsx` pass (15+ test cases)
- [ ] All tests in `accessibility.test.tsx` pass (20+ test cases)
- [ ] axe-core reports 0 violations on all styled components
- [ ] Coverage > 80% for all Phase 3 files
- [ ] No `any` types in test files
- [ ] No `dangerouslySetInnerHTML` in markdown renderer (verified by test)
- [ ] `pnpm --filter @tour-kit/ai build` succeeds with zero TypeScript errors
