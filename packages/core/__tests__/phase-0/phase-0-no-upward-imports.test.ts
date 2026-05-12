import { describe, expect, it } from 'vitest'
import { repoRoot, run } from './_helpers'

const REPO = repoRoot()

describe('Phase 0 — @tour-kit/core has no upward imports', () => {
  it('packages/core/src has no imports from @tour-kit/license', () => {
    const r = run(`grep -rln "from '@tour-kit/license'" packages/core/src || true`, { cwd: REPO })
    expect(r.stdout.trim()).toBe('')
  })

  it('packages/core/src has no imports from @tour-kit/scheduling', () => {
    const r = run(`grep -rln "from '@tour-kit/scheduling'" packages/core/src || true`, {
      cwd: REPO,
    })
    expect(r.stdout.trim()).toBe('')
  })
})
