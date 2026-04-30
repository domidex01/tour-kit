import { describe, expect, it } from 'vitest'
import * as core from '../index'

describe('@tour-kit/core barrel — UILibraryContext surface', () => {
  it('exports UILibraryProvider', () => {
    expect(core.UILibraryProvider).toBeDefined()
  })

  it('exports useUILibrary as a function', () => {
    expect(typeof core.useUILibrary).toBe('function')
  })

  it('keeps cn (Phase 1), UnifiedSlot (Phase 2), and UILibraryProvider (Phase 3) co-existing on the public barrel', () => {
    expect(typeof core.cn).toBe('function')
    expect(core.UnifiedSlot).toBeDefined()
    expect(core.UILibraryProvider).toBeDefined()
    expect(typeof core.useUILibrary).toBe('function')
  })
})
