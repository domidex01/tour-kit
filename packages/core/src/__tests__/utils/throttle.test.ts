import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { throttleLeading, throttleRAF, throttleTime } from '../../utils/throttle'

describe('throttleRAF', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('coalesces rapid calls to a single execution', async () => {
    const callback = vi.fn()
    const throttled = throttleRAF(callback)

    // Simulate rapid calls
    throttled()
    throttled()
    throttled()

    expect(callback).not.toHaveBeenCalled()

    // Advance to next animation frame
    await vi.advanceTimersToNextTimerAsync()

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('passes the most recent arguments to the callback', async () => {
    const callback = vi.fn()
    const throttled = throttleRAF(callback)

    throttled('first')
    throttled('second')
    throttled('third')

    await vi.advanceTimersToNextTimerAsync()

    expect(callback).toHaveBeenCalledWith('third')
  })

  it('allows subsequent calls after animation frame completes', async () => {
    const callback = vi.fn()
    const throttled = throttleRAF(callback)

    throttled()
    await vi.advanceTimersToNextTimerAsync()
    expect(callback).toHaveBeenCalledTimes(1)

    throttled()
    await vi.advanceTimersToNextTimerAsync()
    expect(callback).toHaveBeenCalledTimes(2)
  })

  it('cancels pending execution when cancel is called', async () => {
    const callback = vi.fn()
    const throttled = throttleRAF(callback)

    throttled()
    throttled.cancel()

    await vi.advanceTimersToNextTimerAsync()

    expect(callback).not.toHaveBeenCalled()
  })

  it('can be called again after cancel', async () => {
    const callback = vi.fn()
    const throttled = throttleRAF(callback)

    throttled()
    throttled.cancel()
    throttled()

    await vi.advanceTimersToNextTimerAsync()

    expect(callback).toHaveBeenCalledTimes(1)
  })
})

describe('throttleTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('executes immediately on first call', () => {
    const callback = vi.fn()
    const throttled = throttleTime(callback, 1000)

    throttled('first')

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('first')
  })

  it('queues subsequent calls within interval', () => {
    const callback = vi.fn()
    const throttled = throttleTime(callback, 1000)

    throttled('first')
    throttled('second')
    throttled('third')

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('first')
  })

  it('executes queued call after interval expires', () => {
    const callback = vi.fn()
    const throttled = throttleTime(callback, 1000)

    throttled('first')
    throttled('second')

    vi.advanceTimersByTime(1000)

    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenLastCalledWith('second')
  })

  it('uses the most recent arguments for queued call', () => {
    const callback = vi.fn()
    const throttled = throttleTime(callback, 1000)

    throttled('first')
    throttled('second')
    throttled('third')

    vi.advanceTimersByTime(1000)

    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenLastCalledWith('third')
  })

  it('flush executes pending call immediately', () => {
    const callback = vi.fn()
    const throttled = throttleTime(callback, 1000)

    throttled('first')
    throttled('second')

    expect(callback).toHaveBeenCalledTimes(1)

    throttled.flush()

    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenLastCalledWith('second')
  })

  it('flush does nothing when no pending call', () => {
    const callback = vi.fn()
    const throttled = throttleTime(callback, 1000)

    throttled('first')
    throttled.flush()

    expect(callback).toHaveBeenCalledTimes(1)

    throttled.flush()

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('cancel prevents pending execution', () => {
    const callback = vi.fn()
    const throttled = throttleTime(callback, 1000)

    throttled('first')
    throttled('second')
    throttled.cancel()

    vi.advanceTimersByTime(1000)

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('first')
  })

  it('allows immediate execution after interval', () => {
    const callback = vi.fn()
    const throttled = throttleTime(callback, 1000)

    throttled('first')
    vi.advanceTimersByTime(1000)
    throttled('second')

    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenLastCalledWith('second')
  })
})

describe('throttleLeading', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('executes immediately on first call', () => {
    const callback = vi.fn()
    const throttled = throttleLeading(callback, 1000)

    throttled('first')

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('first')
  })

  it('ignores subsequent calls within interval', () => {
    const callback = vi.fn()
    const throttled = throttleLeading(callback, 1000)

    throttled('first')
    throttled('second')
    throttled('third')

    expect(callback).toHaveBeenCalledTimes(1)
    expect(callback).toHaveBeenCalledWith('first')
  })

  it('allows execution after interval expires', () => {
    const callback = vi.fn()
    const throttled = throttleLeading(callback, 1000)

    throttled('first')
    vi.advanceTimersByTime(1000)
    throttled('second')

    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenLastCalledWith('second')
  })

  it('blocks calls until interval fully expires', () => {
    const callback = vi.fn()
    const throttled = throttleLeading(callback, 1000)

    throttled('first')
    vi.advanceTimersByTime(500)
    throttled('second') // Should be ignored

    expect(callback).toHaveBeenCalledTimes(1)

    vi.advanceTimersByTime(500)
    throttled('third') // Should execute

    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenLastCalledWith('third')
  })

  it('cancel resets the throttle state', () => {
    const callback = vi.fn()
    const throttled = throttleLeading(callback, 1000)

    throttled('first')
    throttled.cancel()
    throttled('second') // Should execute immediately after cancel

    expect(callback).toHaveBeenCalledTimes(2)
    expect(callback).toHaveBeenLastCalledWith('second')
  })
})
