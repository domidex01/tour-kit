import { describe, expect, it } from 'vitest'

describe('Entry Point Exports — US-1', () => {
  it('client entry exports AiChatProvider', async () => {
    const clientModule = await import('../../index')
    expect(clientModule.AiChatProvider).toBeDefined()
  })

  it('client entry exports useAiChat', async () => {
    const clientModule = await import('../../index')
    expect(clientModule.useAiChat).toBeDefined()
  })

  it('server entry exports createChatRouteHandler', async () => {
    const serverModule = await import('../../server/index')
    expect(serverModule.createChatRouteHandler).toBeDefined()
  })

  it('headless entry exports AiChatPanelHeadless', async () => {
    const headlessModule = await import('../../headless')
    expect(headlessModule.AiChatPanelHeadless).toBeDefined()
    expect(headlessModule.useAiChat).toBeDefined()
    expect(headlessModule.useSuggestions).toBeDefined()
    expect(headlessModule.useTourAssistant).toBeDefined()
  })
})
