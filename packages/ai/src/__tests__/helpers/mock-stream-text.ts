import { vi } from 'vitest'

export interface MockStreamResult {
  toUIMessageStreamResponse: ReturnType<typeof vi.fn>
  text: Promise<string>
  usage: Promise<{ promptTokens: number; completionTokens: number }>
}

export function createMockStreamResult(
  overrides: Partial<MockStreamResult> = {}
): MockStreamResult {
  return {
    toUIMessageStreamResponse: vi.fn(() => new Response('mock stream', {
      headers: { 'Content-Type': 'text/event-stream' },
    })),
    text: Promise.resolve('Mock AI response'),
    usage: Promise.resolve({ promptTokens: 10, completionTokens: 20 }),
    ...overrides,
  }
}
