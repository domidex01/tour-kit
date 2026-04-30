import { describe, expect, it } from 'vitest'
import { UnifiedSlot as Canonical } from '@tour-kit/core'
import { UnifiedSlot as Wrapper } from '../slot'

describe('@tour-kit/adoption lib/slot wrapper', () => {
  it('re-exports the canonical UnifiedSlot identity from @tour-kit/core', () => {
    expect(Wrapper).toBe(Canonical)
  })
})
