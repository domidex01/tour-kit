import { describe, expectTypeOf, it } from 'vitest'
import type {
  AiChatConfig,
  ChatRouteHandlerOptions,
  ChatStatus,
  ContextStuffingConfig,
} from '../../types/config'

describe('Config Types — US-5', () => {
  it('AiChatConfig requires endpoint', () => {
    expectTypeOf<AiChatConfig>().toHaveProperty('endpoint')
    expectTypeOf<AiChatConfig['endpoint']>().toBeString()
  })

  it('AiChatConfig has optional tourContext', () => {
    expectTypeOf<AiChatConfig>().toHaveProperty('tourContext')
    expectTypeOf<AiChatConfig['tourContext']>().toEqualTypeOf<boolean | undefined>()
  })

  it('ChatStatus is a string union of 4 values', () => {
    expectTypeOf<'ready'>().toMatchTypeOf<ChatStatus>()
    expectTypeOf<'submitted'>().toMatchTypeOf<ChatStatus>()
    expectTypeOf<'streaming'>().toMatchTypeOf<ChatStatus>()
    expectTypeOf<'error'>().toMatchTypeOf<ChatStatus>()
  })

  it('ChatRouteHandlerOptions requires model and context', () => {
    expectTypeOf<ChatRouteHandlerOptions>().toHaveProperty('model')
    expectTypeOf<ChatRouteHandlerOptions>().toHaveProperty('context')
  })

  it('ContextStuffingConfig has strategy "context-stuffing"', () => {
    expectTypeOf<ContextStuffingConfig['strategy']>().toEqualTypeOf<'context-stuffing'>()
  })
})
