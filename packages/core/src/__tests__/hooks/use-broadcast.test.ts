import { renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useBroadcast } from '../../hooks/use-broadcast'

interface TestMsg {
  type: 'test'
  value: number
}

describe('useBroadcast: round-trip (US-2)', () => {
  it('post → subscribe round-trips a message between two channel instances', async () => {
    const channelName = `tk-test-${Math.random().toString(36).slice(2)}`
    const sender = renderHook(() => useBroadcast<TestMsg>(channelName))
    const receiver = renderHook(() => useBroadcast<TestMsg>(channelName))

    const received = new Promise<TestMsg>((resolve) => {
      receiver.result.current.subscribe((msg) => resolve(msg))
    })

    sender.result.current.post({ type: 'test', value: 42 })

    const msg = await received
    expect(msg.value).toBe(42)

    sender.unmount()
    receiver.unmount()
  })
})

describe('useBroadcast: cleanup', () => {
  it('closes the channel on unmount', () => {
    const closeSpy = vi.spyOn(BroadcastChannel.prototype, 'close')
    const { unmount } = renderHook(() => useBroadcast<TestMsg>('tk-cleanup-test'))
    unmount()
    expect(closeSpy).toHaveBeenCalled()
    closeSpy.mockRestore()
  })
})

describe('useBroadcast: BroadcastChannel undefined fallback (US-3)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns no-op post / subscribe when BroadcastChannel is unavailable', () => {
    vi.stubGlobal('BroadcastChannel', undefined as unknown as typeof BroadcastChannel)
    const { result } = renderHook(() => useBroadcast<TestMsg>('tk-fallback'))
    const handler = vi.fn()
    expect(() => result.current.post({ type: 'test', value: 1 })).not.toThrow()
    const cleanup = result.current.subscribe(handler)
    expect(typeof cleanup).toBe('function')
    expect(() => cleanup()).not.toThrow()
    expect(handler).not.toHaveBeenCalled()
  })
})

describe('useBroadcast: disabled by options.enabled = false', () => {
  it('returns no-op post and subscribe when enabled is false', () => {
    const channelName = `tk-disabled-${Math.random().toString(36).slice(2)}`
    const sender = renderHook(() => useBroadcast<TestMsg>(channelName, { enabled: false }))

    // A second instance with enabled=true to receive (would fire if the
    // disabled instance posted anything).
    const receiver = renderHook(() => useBroadcast<TestMsg>(channelName))
    const handler = vi.fn()
    const cleanup = receiver.result.current.subscribe(handler)

    sender.result.current.post({ type: 'test', value: 99 })

    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(handler).not.toHaveBeenCalled()
        cleanup()
        sender.unmount()
        receiver.unmount()
        resolve()
      }, 30)
    })
  })
})

describe('useBroadcast: channel name passthrough', () => {
  it('routes messages by channel name (different names → no cross-talk)', async () => {
    const sender = renderHook(() => useBroadcast<TestMsg>('tk-name-A'))
    const receiverSame = renderHook(() => useBroadcast<TestMsg>('tk-name-A'))
    const receiverOther = renderHook(() => useBroadcast<TestMsg>('tk-name-B'))

    const sameHandler = vi.fn()
    const otherHandler = vi.fn()
    receiverSame.result.current.subscribe(sameHandler)
    receiverOther.result.current.subscribe(otherHandler)

    sender.result.current.post({ type: 'test', value: 7 })

    await new Promise((resolve) => setTimeout(resolve, 30))

    expect(sameHandler).toHaveBeenCalledWith({ type: 'test', value: 7 })
    expect(otherHandler).not.toHaveBeenCalled()

    sender.unmount()
    receiverSame.unmount()
    receiverOther.unmount()
  })
})
