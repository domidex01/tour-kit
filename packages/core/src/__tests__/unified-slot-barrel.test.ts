import { describe, expect, it } from 'vitest'
import * as core from '../index'

describe('@tour-kit/core barrel — UnifiedSlot surface', () => {
  it('exports UnifiedSlot', () => {
    expect(core.UnifiedSlot).toBeDefined()
  })

  it('keeps cn (Phase 1) and UnifiedSlot (Phase 2) co-existing on the public barrel', () => {
    expect(typeof core.cn).toBe('function')
    expect(core.UnifiedSlot).toBeDefined()
  })
})
