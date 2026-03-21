import { describe, expectTypeOf, it } from 'vitest'
import type { AiChatEvent, AiChatEventType } from '../../types/events'

describe('Event Types — US-5', () => {
  it('AiChatEvent has type, data, and timestamp', () => {
    expectTypeOf<AiChatEvent>().toHaveProperty('type')
    expectTypeOf<AiChatEvent>().toHaveProperty('data')
    expectTypeOf<AiChatEvent>().toHaveProperty('timestamp')
  })

  it('AiChatEventType includes all event types', () => {
    expectTypeOf<'chat_opened'>().toMatchTypeOf<AiChatEventType>()
    expectTypeOf<'message_sent'>().toMatchTypeOf<AiChatEventType>()
    expectTypeOf<'response_received'>().toMatchTypeOf<AiChatEventType>()
    expectTypeOf<'error'>().toMatchTypeOf<AiChatEventType>()
  })
})
