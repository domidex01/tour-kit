import type { LanguageModel } from 'ai'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('ai', () => ({
  generateText: vi.fn(),
}))

import { generateText } from 'ai'
import { generateSuggestions } from '../../core/suggestion-engine'

const mockGenerateText = vi.mocked(generateText)

const mockModel = { specificationVersion: 'v2' } as unknown as LanguageModel

describe('generateSuggestions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls generateText with a prompt containing conversation context', async () => {
    mockGenerateText.mockResolvedValue({
      text: 'Follow-up 1\nFollow-up 2\nFollow-up 3',
    } as Awaited<ReturnType<typeof generateText>>)

    await generateSuggestions({
      messages: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ],
      model: mockModel,
    })

    expect(mockGenerateText).toHaveBeenCalledOnce()
    const call = mockGenerateText.mock.calls[0][0]
    expect(call.prompt).toContain('user: Hello')
    expect(call.prompt).toContain('assistant: Hi there!')
    expect(call.model).toBe(mockModel)
  })

  it('includes product name in prompt when provided', async () => {
    mockGenerateText.mockResolvedValue({
      text: 'Q1\nQ2\nQ3',
    } as Awaited<ReturnType<typeof generateText>>)

    await generateSuggestions({
      messages: [{ role: 'user', content: 'Hello' }],
      model: mockModel,
      productName: 'Acme App',
    })

    const call = mockGenerateText.mock.calls[0][0]
    expect(call.prompt).toContain('about Acme App')
  })

  it('uses only the last 6 messages for context', async () => {
    mockGenerateText.mockResolvedValue({
      text: 'Q1\nQ2\nQ3',
    } as Awaited<ReturnType<typeof generateText>>)

    const messages = Array.from({ length: 10 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i}`,
    }))

    await generateSuggestions({ messages, model: mockModel })

    const call = mockGenerateText.mock.calls[0][0]
    // Should contain last 6 messages (indices 4-9)
    expect(call.prompt).toContain('Message 4')
    expect(call.prompt).toContain('Message 9')
    expect(call.prompt).not.toContain('Message 3')
  })

  it('returns parsed suggestions from multi-line response', async () => {
    mockGenerateText.mockResolvedValue({
      text: 'How do I export?\nWhat plans are available?\nHow do I invite team members?',
    } as Awaited<ReturnType<typeof generateText>>)

    const result = await generateSuggestions({
      messages: [{ role: 'user', content: 'Hello' }],
      model: mockModel,
    })

    expect(result).toEqual([
      'How do I export?',
      'What plans are available?',
      'How do I invite team members?',
    ])
  })

  it('returns at most count suggestions (default 3)', async () => {
    mockGenerateText.mockResolvedValue({
      text: 'Q1\nQ2\nQ3\nQ4\nQ5',
    } as Awaited<ReturnType<typeof generateText>>)

    const result = await generateSuggestions({
      messages: [{ role: 'user', content: 'Hello' }],
      model: mockModel,
    })

    expect(result).toHaveLength(3)
  })

  it('respects custom count parameter', async () => {
    mockGenerateText.mockResolvedValue({
      text: 'Q1\nQ2\nQ3\nQ4\nQ5',
    } as Awaited<ReturnType<typeof generateText>>)

    const result = await generateSuggestions({
      messages: [{ role: 'user', content: 'Hello' }],
      model: mockModel,
      count: 5,
    })

    expect(result).toHaveLength(5)
  })

  it('returns empty array on generateText error', async () => {
    mockGenerateText.mockRejectedValue(new Error('API error'))

    const result = await generateSuggestions({
      messages: [{ role: 'user', content: 'Hello' }],
      model: mockModel,
    })

    expect(result).toEqual([])
  })

  it('returns empty array when messages is empty', async () => {
    const result = await generateSuggestions({
      messages: [],
      model: mockModel,
    })

    expect(result).toEqual([])
    expect(mockGenerateText).not.toHaveBeenCalled()
  })

  it('passes the model identifier to generateText', async () => {
    mockGenerateText.mockResolvedValue({
      text: 'Q1\nQ2\nQ3',
    } as Awaited<ReturnType<typeof generateText>>)

    await generateSuggestions({
      messages: [{ role: 'user', content: 'Hello' }],
      model: mockModel,
    })

    expect(mockGenerateText.mock.calls[0][0].model).toBe(mockModel)
  })

  describe('prompt construction', () => {
    it('includes rules about format (no numbering, concise, diverse)', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'Q1\nQ2\nQ3',
      } as Awaited<ReturnType<typeof generateText>>)

      await generateSuggestions({
        messages: [{ role: 'user', content: 'Hello' }],
        model: mockModel,
      })

      const prompt = mockGenerateText.mock.calls[0][0].prompt as string
      expect(prompt).toContain('Do NOT number them')
      expect(prompt).toContain('concise')
      expect(prompt).toContain('diverse')
    })

    it('requests exactly count suggestions', async () => {
      mockGenerateText.mockResolvedValue({
        text: 'Q1\nQ2\nQ3\nQ4\nQ5',
      } as Awaited<ReturnType<typeof generateText>>)

      await generateSuggestions({
        messages: [{ role: 'user', content: 'Hello' }],
        model: mockModel,
        count: 5,
      })

      const prompt = mockGenerateText.mock.calls[0][0].prompt as string
      expect(prompt).toContain('exactly 5')
    })
  })
})
