import { UnifiedSlot as Canonical } from '@tour-kit/core'
import { describe, expect, it } from 'vitest'
import { UnifiedSlot as Wrapper } from '../slot'

describe('@tour-kit/hints lib/slot wrapper', () => {
  it('re-exports the canonical UnifiedSlot identity from @tour-kit/core', () => {
    expect(Wrapper).toBe(Canonical)
  })
})
