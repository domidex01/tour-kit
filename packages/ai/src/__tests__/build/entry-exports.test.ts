import { describe, expect, it } from 'vitest'

describe('Entry Point Exports — US-1', () => {
  it('client entry exports AI_PACKAGE_VERSION', async () => {
    const clientModule = await import('../../index')
    expect(clientModule.AI_PACKAGE_VERSION).toBe('0.0.0')
  })

  it('server entry exports SERVER_ENTRY', async () => {
    const serverModule = await import('../../server/index')
    expect(serverModule.SERVER_ENTRY).toBe(true)
  })

  it('headless entry exports HEADLESS_ENTRY', async () => {
    const headlessModule = await import('../../headless')
    expect(headlessModule.HEADLESS_ENTRY).toBe(true)
  })
})
