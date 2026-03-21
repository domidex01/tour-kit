/**
 * Test middleware that injects a static context string into the last user message.
 * This validates that wrapLanguageModel + transformParams works in our build system.
 */
export const testRagMiddleware = {
  transformParams: async ({ params }: { params: any }) => {
    console.log('[middleware-spike] transformParams called')

    const lastUserMessage = params.prompt.findLast((msg: any) => msg.role === 'user')

    if (!lastUserMessage || lastUserMessage.role !== 'user') {
      console.log('[middleware-spike] No user message found, skipping injection')
      return params
    }

    // Inject test context as a text part at the beginning of the last user message
    const injectedContext = {
      type: 'text' as const,
      text: '\n\n[INJECTED CONTEXT FROM MIDDLEWARE]\nProduct name: Tour Kit\nVersion: 0.4.1\nDescription: A headless onboarding and product tour library for React.\nFeatures: Step-by-step tours, hints, checklists, announcements.\n[END INJECTED CONTEXT]\n\nPlease reference the above context in your response.',
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
