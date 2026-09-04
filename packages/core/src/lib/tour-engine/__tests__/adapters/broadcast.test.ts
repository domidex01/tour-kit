/**
 * v2 §1.3b — `createBroadcast` against jsdom's real `BroadcastChannel`.
 *
 * Deliberately not a hand-rolled fake: jsdom delivers through `MessageChannel`
 * microtasks, and the cross-tab tie-break in §1.3e depends on that real
 * ordering. A synchronous fake would pass a tie-break test the browser fails.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { type BroadcastStore, createBroadcast } from '../../adapters/broadcast'

interface Msg {
  type: 'tour:active'
  tourId: string
  tabId: string
  ts: number
}

const msg = (tabId: string): Msg => ({ type: 'tour:active', tourId: 't', tabId, ts: Date.now() })

/** jsdom posts through MessageChannel microtasks — let them run. */
const drain = () => new Promise((r) => setTimeout(r, 0))

const open: BroadcastStore<Msg>[] = []
function channel(name = 'tourkit:test'): BroadcastStore<Msg> {
  const c = createBroadcast<Msg>(name)
  open.push(c)
  return c
}

afterEach(() => {
  for (const c of open.splice(0)) c.close()
  vi.unstubAllGlobals()
})

describe('round trip', () => {
  it('delivers a posted message to another instance on the same channel', async () => {
    const a = channel()
    const b = channel()
    const seen = vi.fn()
    b.subscribe(seen)

    a.post(msg('a'))
    await drain()

    expect(seen).toHaveBeenCalledTimes(1)
    expect(seen).toHaveBeenCalledWith(expect.objectContaining({ tabId: 'a' }))
  })

  it('does not deliver across different channel names', async () => {
    const a = channel('chan-a')
    const b = channel('chan-b')
    const seen = vi.fn()
    b.subscribe(seen)

    a.post(msg('a'))
    await drain()

    expect(seen).not.toHaveBeenCalled()
  })

  it('delivers to every subscriber on one instance', async () => {
    const a = channel()
    const b = channel()
    const first = vi.fn()
    const second = vi.fn()
    b.subscribe(first)
    b.subscribe(second)

    a.post(msg('a'))
    await drain()

    expect(first).toHaveBeenCalledTimes(1)
    expect(second).toHaveBeenCalledTimes(1)
  })

  it('does not echo a post back to the sender', async () => {
    // Self-filtering by tabId is the caller's job precisely because the
    // channel already does not echo; if that ever changed, the engine would
    // pause itself.
    const a = channel()
    channel()
    const seen = vi.fn()
    a.subscribe(seen)

    a.post(msg('a'))
    await drain()

    expect(seen).not.toHaveBeenCalled()
  })
})

describe('teardown', () => {
  it('the unsubscribe returned by subscribe stops delivery', async () => {
    const a = channel()
    const b = channel()
    const seen = vi.fn()
    const unsubscribe = b.subscribe(seen)
    unsubscribe()

    a.post(msg('a'))
    await drain()

    expect(seen).not.toHaveBeenCalled()
  })

  it('close() on the receiver stops delivery', async () => {
    const a = channel()
    const b = channel()
    const seen = vi.fn()
    b.subscribe(seen)
    b.close()

    a.post(msg('a'))
    await drain()

    expect(seen).not.toHaveBeenCalled()
  })

  it('close() is idempotent and post() after it does not throw', async () => {
    const a = channel()
    a.close()

    expect(() => a.close()).not.toThrow()
    expect(() => a.post(msg('a'))).not.toThrow()
  })
})

describe('unavailable / disabled', () => {
  it('returns a working no-op shape when BroadcastChannel is undefined', () => {
    vi.stubGlobal('BroadcastChannel', undefined as unknown as typeof BroadcastChannel)

    const c = createBroadcast<Msg>('tourkit:test')
    expect(() => c.post(msg('a'))).not.toThrow()
    expect(() => c.subscribe(vi.fn())()).not.toThrow()
    expect(() => c.close()).not.toThrow()
  })

  it('returns a no-op shape when enabled is false', async () => {
    const a = channel()
    const off = createBroadcast<Msg>('tourkit:test', { enabled: false })
    const seen = vi.fn()
    off.subscribe(seen)

    a.post(msg('a'))
    await drain()

    expect(seen).not.toHaveBeenCalled()
    off.close()
  })

  it('a disabled instance posts nothing to live listeners', async () => {
    const listener = channel()
    const seen = vi.fn()
    listener.subscribe(seen)

    const off = createBroadcast<Msg>('tourkit:test', { enabled: false })
    off.post(msg('off'))
    await drain()

    expect(seen).not.toHaveBeenCalled()
    off.close()
  })
})
