import { describe, expect, it } from 'vitest'
import { describeWithApiKey } from '../helpers/skip-conditions'

describeWithApiKey('Streaming Spike — US-2', () => {
  it('streamText produces a ReadableStream response', async () => {
    const { streamText, convertToModelMessages } = await import('ai')
    const { openai } = await import('@ai-sdk/openai')

    const messages = await convertToModelMessages([
      { role: 'user' as const, parts: [{ type: 'text' as const, text: 'Say hello in 5 words.' }] },
    ])

    const result = streamText({
      model: openai('gpt-4o-mini'),
      messages,
      maxOutputTokens: 50,
    })

    const response = result.toUIMessageStreamResponse()
    expect(response).toBeInstanceOf(Response)
    expect(response.headers.get('content-type')).toContain('text/event-stream')

    // Verify the body is a ReadableStream
    expect(response.body).toBeInstanceOf(ReadableStream)

    // Read at least one chunk to confirm streaming works
    const reader = response.body!.getReader()
    const { value, done } = await reader.read()
    expect(done).toBe(false)
    expect(value).toBeDefined()
    reader.releaseLock()
  }, 30_000)
})
