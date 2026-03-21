import { describe, expect, it, vi } from 'vitest'
import { emitEvent } from '../../core/events'
import type { AiChatEvent } from '../../types/events'

describe('emitEvent', () => {
  it('calls onEvent with correct event shape', () => {
    const onEvent = vi.fn()

    emitEvent(onEvent, 'message_sent', { messageLength: 42 })

    expect(onEvent).toHaveBeenCalledTimes(1)
    const event: AiChatEvent = onEvent.mock.calls[0][0]
    expect(event.type).toBe('message_sent')
    expect(event.data).toEqual({ messageLength: 42 })
    expect(event.timestamp).toBeInstanceOf(Date)
  })

  it('includes timestamp as Date instance', () => {
    const onEvent = vi.fn()

    emitEvent(onEvent, 'chat_opened', {})

    const event: AiChatEvent = onEvent.mock.calls[0][0]
    expect(event.timestamp).toBeInstanceOf(Date)
  })

  it('does nothing when onEvent is undefined', () => {
    // Should not throw
    expect(() => emitEvent(undefined, 'chat_opened', {})).not.toThrow()
  })

  it('catches and logs handler errors', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const onEvent = vi.fn().mockImplementation(() => {
      throw new Error('handler exploded')
    })

    // Should not throw
    expect(() => emitEvent(onEvent, 'error', { error: 'test' })).not.toThrow()
    expect(warnSpy).toHaveBeenCalled()
    warnSpy.mockRestore()
  })
})
