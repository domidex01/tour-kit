import { describe, expect, it } from 'vitest'
import { UnifiedSlot } from '@tour-kit/core'

describe('@tour-kit/surveys imports UnifiedSlot from @tour-kit/core directly', () => {
  it('UnifiedSlot is reachable on the core barrel', () => {
    // forwardRef returns an exotic component — the runtime check is "defined and non-null".
    expect(UnifiedSlot).toBeDefined()
    expect(UnifiedSlot).not.toBeNull()
  })
})
