import { describe, expect, it } from 'vitest'

describe('Barrel Exports — US-5', () => {
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

  it('server entry does NOT export React components', async () => {
    const serverModule = await import('../../server/index')
    expect(serverModule).not.toHaveProperty('AiChatProvider')
    expect(serverModule).not.toHaveProperty('useAiChat')
  })
})
