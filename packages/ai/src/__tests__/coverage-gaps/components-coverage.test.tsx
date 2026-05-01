// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { UseAiChatReturn } from '../../hooks/use-ai-chat'

// Mock the context module so AiChatSuggestions can render outside a provider
vi.mock('../../context/ai-chat-context', () => ({
  AiChatContext: {
    ...(() => {
      const { createContext } = require('react')
      return createContext(null)
    })(),
  },
}))

// Mock useAiChat for AiChatMessageList — set return value per-test via
// `mockUseAiChat.mockReturnValue(...)` below.
const mockUseAiChat = vi.fn<() => UseAiChatReturn>()
vi.mock('../../hooks/use-ai-chat', () => ({
  useAiChat: () => mockUseAiChat(),
}))

function buildChatState(overrides: Partial<UseAiChatReturn> = {}): UseAiChatReturn {
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

describe('Component coverage gaps', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AiChatSuggestions', () => {
    it('renders suggestion chips from explicit props', async () => {
      const { AiChatSuggestions } = await import('../../components/ai-chat-suggestions')
      render(
        <AiChatSuggestions
          suggestions={['How do I start?', 'What features exist?']}
          onSelect={vi.fn()}
        />
      )

      expect(screen.getByText('How do I start?')).toBeDefined()
      expect(screen.getByText('What features exist?')).toBeDefined()
    })

    it('calls onSelect when a suggestion is clicked', async () => {
      const onSelect = vi.fn()
      const { AiChatSuggestions } = await import('../../components/ai-chat-suggestions')
      render(<AiChatSuggestions suggestions={['How do I start?']} onSelect={onSelect} />)

      fireEvent.click(screen.getByText('How do I start?'))
      expect(onSelect).toHaveBeenCalledWith('How do I start?')
    })

    it('renders null when no suggestions', async () => {
      const { AiChatSuggestions } = await import('../../components/ai-chat-suggestions')
      const { container } = render(<AiChatSuggestions suggestions={[]} onSelect={vi.fn()} />)

      expect(container.innerHTML).toBe('')
    })

    it('renders with custom renderSuggestion', async () => {
      const { AiChatSuggestions } = await import('../../components/ai-chat-suggestions')
      render(
        <AiChatSuggestions
          suggestions={['Custom']}
          onSelect={vi.fn()}
          renderSuggestion={(suggestion, onSelect) => (
            <button key={suggestion} type="button" onClick={onSelect} data-testid="custom">
              {suggestion}
            </button>
          )}
        />
      )

      expect(screen.getByTestId('custom')).toBeDefined()
      expect(screen.getByText('Custom')).toBeDefined()
    })

    it('has accessible fieldset with label', async () => {
      const { AiChatSuggestions } = await import('../../components/ai-chat-suggestions')
      render(<AiChatSuggestions suggestions={['Test']} onSelect={vi.fn()} />)

      const fieldset = screen.getByRole('group', { name: 'Suggested questions' })
      expect(fieldset).toBeDefined()
    })

    it('applies className prop', async () => {
      const { AiChatSuggestions } = await import('../../components/ai-chat-suggestions')
      const { container } = render(
        <AiChatSuggestions suggestions={['Test']} onSelect={vi.fn()} className="my-class" />
      )

      expect(container.firstElementChild?.className).toContain('my-class')
    })
  })

  describe('AiChatMessageList a11y', () => {
    beforeEach(() => {
      // jsdom does not implement scrollIntoView; AiChatMessageList calls it
      // in an effect after each render.
      Element.prototype.scrollIntoView = vi.fn()
    })

    it('declares an explicit polite live region with chat-conversation label', async () => {
      mockUseAiChat.mockReturnValue(
        buildChatState({
          messages: [
            {
              id: 'm1',
              role: 'assistant',
              parts: [{ type: 'text', text: 'hello' }],
            } as never,
          ],
          status: 'ready',
        })
      )
      const { AiChatMessageList } = await import('../../components/ai-chat-message-list')
      render(<AiChatMessageList />)

      const log = screen.getByRole('log', { name: 'Chat conversation' })
      expect(log.getAttribute('aria-live')).toBe('polite')
      expect(log.getAttribute('aria-atomic')).toBe('false')
      expect(log.getAttribute('aria-relevant')).toBe('additions text')
    })

    it('reports aria-busy="true" while streaming', async () => {
      mockUseAiChat.mockReturnValue(
        buildChatState({
          messages: [
            { id: 'm1', role: 'user', parts: [{ type: 'text', text: 'hi' }] } as never,
          ],
          status: 'streaming',
        })
      )
      const { AiChatMessageList } = await import('../../components/ai-chat-message-list')
      render(<AiChatMessageList />)

      expect(screen.getByRole('log').getAttribute('aria-busy')).toBe('true')
    })

    it('reports aria-busy="false" when not streaming', async () => {
      mockUseAiChat.mockReturnValue(
        buildChatState({
          messages: [
            { id: 'm1', role: 'user', parts: [{ type: 'text', text: 'hi' }] } as never,
            {
              id: 'm2',
              role: 'assistant',
              parts: [{ type: 'text', text: 'done' }],
            } as never,
          ],
          status: 'ready',
        })
      )
      const { AiChatMessageList } = await import('../../components/ai-chat-message-list')
      render(<AiChatMessageList />)

      expect(screen.getByRole('log').getAttribute('aria-busy')).toBe('false')
    })

    it('renders no log region when there are no messages and not streaming', async () => {
      mockUseAiChat.mockReturnValue(buildChatState({ messages: [], status: 'ready' }))
      const { AiChatMessageList } = await import('../../components/ai-chat-message-list')
      const { container } = render(<AiChatMessageList />)

      expect(container.querySelector('[role="log"]')).toBeNull()
    })
  })
})
