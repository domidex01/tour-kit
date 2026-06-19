import { describe, expectTypeOf, it } from 'vitest'
import type {
  AiChatConfig,
  ChatRouteHandlerOptions,
  ChatStatus,
  ContextStuffingConfig,
  RAGConfig,
  RAGMiddlewareOptions,
  RetrieverOptions,
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

// US-2 / US-3: Slice 4 removes two knobs that never did anything. These guards
// fail (as "unused @ts-expect-error") if a future author re-introduces the
// dead field — they lock the honesty claim at the type level. The matching
// @deprecated/rg checks live in the slice exit criteria (TS erases @deprecated).
describe('Removed AI knobs (US-2, US-3)', () => {
  it('RAGConfig no longer carries a live `rerank` field', () => {
    // `rerank()` is an AI SDK 6 export; this package pins ai@^5 → genuinely unwireable.
    // @ts-expect-error — `rerank` is removed from RAGConfig in 0.13.0
    const _r: RAGConfig['rerank'] = undefined
    void _r
  })

  it('RAGMiddlewareOptions no longer carries a live `rerank` field', () => {
    // @ts-expect-error — `rerank` is removed from RAGMiddlewareOptions in 0.13.0
    const _r: RAGMiddlewareOptions['rerank'] = undefined
    void _r
  })

  it('ChatRouteHandlerOptions no longer carries a live `maxDuration` field', () => {
    // maxDuration is a Next.js route-segment export, not a handler param.
    // @ts-expect-error — `maxDuration` is removed from ChatRouteHandlerOptions in 0.13.0
    const _m: ChatRouteHandlerOptions['maxDuration'] = undefined
    void _m
  })

  it('RetrieverOptions and RAGMiddlewareOptions expose the wired `minScore`', () => {
    expectTypeOf<RetrieverOptions['minScore']>().toEqualTypeOf<number | undefined>()
    expectTypeOf<RAGMiddlewareOptions['minScore']>().toEqualTypeOf<number | undefined>()
    expectTypeOf<RAGConfig['minScore']>().toEqualTypeOf<number | undefined>()
  })
})
