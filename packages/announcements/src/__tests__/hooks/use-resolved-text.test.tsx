import { useResolvedText as coreUseResolvedText } from '@tour-kit/core'
import { describe, expect, it } from 'vitest'
import { useResolvedText } from '../../lib/use-resolved-text'

describe('useResolvedText (announcements re-export)', () => {
  it('is identity-equal to the @tour-kit/core implementation', () => {
    // Phase 1 (refactor train) — the per-package hook is now a thin
    // re-export of `@tour-kit/core`'s canonical implementation. Identity
    // equality is the cheapest proof that no shadow copy exists.
    expect(useResolvedText).toBe(coreUseResolvedText)
  })
})
