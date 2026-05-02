// SPIKE — delete this file before the first Phase 1.x feature PR merges (Phase 0 fail-safe #1).
import { describe, expect, it } from 'vitest'

describe('SPIKE: BroadcastChannel in jsdom', () => {
  it('posts and receives messages between two channels of the same name', async () => {
    expect(typeof BroadcastChannel).toBe('function')
    const channelA = new BroadcastChannel('tk-spike')
    const channelB = new BroadcastChannel('tk-spike')

    const received = await new Promise<unknown>((resolve) => {
      channelB.addEventListener('message', (e) => resolve(e.data))
      channelA.postMessage({ type: 'tour:active', tabId: 'A' })
    })

    expect(received).toEqual({ type: 'tour:active', tabId: 'A' })

    channelA.close()
    channelB.close()
  })
})
