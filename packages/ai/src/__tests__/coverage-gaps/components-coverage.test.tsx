// @vitest-environment jsdom
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock the hooks that AiChatSuggestions uses internally
vi.mock('../../hooks/use-suggestions', () => ({
  useOptionalSuggestions: vi.fn(() => null),
}))

// Mock useAiChat so useSuggestions doesn't throw
vi.mock('../../hooks/use-ai-chat', () => ({
  useAiChat: vi.fn(() => ({
    messages: [],
    sendMessage: vi.fn(),
    status: 'ready',
    error: null,
  })),
}))

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
            <span key={suggestion} onClick={onSelect} data-testid="custom">
              {suggestion}
            </span>
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
})
