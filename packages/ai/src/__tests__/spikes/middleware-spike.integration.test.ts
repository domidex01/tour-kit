import { describe, expect, it } from 'vitest'
import { describeWithApiKey } from '../helpers/skip-conditions'

describeWithApiKey('Middleware Spike — US-3', () => {
  it('wrapLanguageModel + transformParams intercepts the prompt', async () => {
    const { streamText, convertToModelMessages, wrapLanguageModel } = await import('ai')
    const { openai } = await import('@ai-sdk/openai')

    let transformParamsCalled = false

    const middleware = {
      specificationVersion: 'v3' as const,
      transformParams: async ({ params }: { params: any }) => {
        transformParamsCalled = true

        const lastUserMessage = params.prompt.findLast(
          (msg: any) => msg.role === 'user'
        )

        if (!lastUserMessage || lastUserMessage.role !== 'user') {
          return params
        }

        const injectedContext = {
          type: 'text' as const,
          text: '\n\n[INJECTED CONTEXT] Product name: Tour Kit. Version: 0.4.1. It is a headless onboarding library.\n\nPlease mention Tour Kit version 0.4.1 in your response.',
        }

        return {
          ...params,
          prompt: params.prompt.map((msg: any) => {
            if (msg === lastUserMessage && msg.role === 'user') {
              return {
                ...msg,
                content: [injectedContext, ...msg.content],
              }
            }
            return msg
          }),
        }
      },
    }

    // openai() returns LanguageModelV2 but wrapLanguageModel expects V3
    // This is a known type mismatch in AI SDK 6.x — runtime behavior is compatible
    const wrappedModel = wrapLanguageModel({
      model: openai('gpt-4o-mini') as any,
      middleware,
    })

    const messages = await convertToModelMessages([
      { role: 'user' as const, parts: [{ type: 'text' as const, text: 'Tell me about this product.' }] },
    ])

    const result = streamText({
      model: wrappedModel,
      messages,
      maxOutputTokens: 200,
    })

    // Consume the stream to completion
    const response = result.toUIMessageStreamResponse()
    const reader = response.body!.getReader()
    const chunks: string[] = []

    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      if (value) {
        chunks.push(new TextDecoder().decode(value))
      }
    }

    expect(transformParamsCalled).toBe(true)

    // The full response text should reference the injected context
    const fullResponse = chunks.join('')
    expect(fullResponse.toLowerCase()).toMatch(/tour\s*kit|0\.4\.1|onboarding/)
  }, 30_000)
})
