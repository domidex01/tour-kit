import { describe, expect, it, vi } from 'vitest'
import { createAnalyticsBridge } from '../../core/analytics-bridge'
import type { AiChatEvent } from '../../types/events'

describe('createAnalyticsBridge', () => {
  it('calls track with prefixed event name', () => {
    const track = vi.fn()
    const onEvent = createAnalyticsBridge({ track })

    const event: AiChatEvent = {
      type: 'message_sent',
      data: { messageLength: 42 },
      timestamp: new Date('2026-03-21T12:00:00Z'),
    }

    onEvent(event)

    expect(track).toHaveBeenCalledTimes(1)
    expect(track).toHaveBeenCalledWith(
      'ai_chat.message_sent',
      expect.objectContaining({ messageLength: 42 })
    )
  })

  it('passes event data as properties', () => {
    const track = vi.fn()
    const onEvent = createAnalyticsBridge({ track })

    const event: AiChatEvent = {
      type: 'chat_closed',
      data: { messageCount: 5 },
      timestamp: new Date(),
    }

    onEvent(event)

    const properties = track.mock.calls[0][1]
    expect(properties.messageCount).toBe(5)
  })

  it('includes timestamp in ISO format', () => {
    const track = vi.fn()
    const onEvent = createAnalyticsBridge({ track })

    const timestamp = new Date('2026-03-21T12:00:00Z')
    const event: AiChatEvent = {
      type: 'chat_opened',
      data: {},
      timestamp,
    }

    onEvent(event)

    const properties = track.mock.calls[0][1]
    expect(properties.timestamp).toBe('2026-03-21T12:00:00.000Z')
  })

  it('uses custom prefix when provided', () => {
    const track = vi.fn()
    const onEvent = createAnalyticsBridge({ track, prefix: 'my_app' })

    const event: AiChatEvent = {
      type: 'chat_opened',
      data: {},
      timestamp: new Date(),
    }

    onEvent(event)

    expect(track).toHaveBeenCalledWith('my_app.chat_opened', expect.any(Object))
  })

  it('uses default prefix "ai_chat" when none provided', () => {
    const track = vi.fn()
    const onEvent = createAnalyticsBridge({ track })

    const event: AiChatEvent = {
      type: 'error',
      data: { error: 'test' },
      timestamp: new Date(),
    }

    onEvent(event)

    expect(track).toHaveBeenCalledWith('ai_chat.error', expect.objectContaining({ error: 'test' }))
  })
})
