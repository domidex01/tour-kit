import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import transform from '../transforms/replay-bridge-to-use-tour-actions'
import { normalize, reparses, runTransform } from './_helpers'

const __here = dirname(fileURLToPath(import.meta.url))
const FIXTURES = join(
  __here,
  '..',
  '..',
  '__tests__',
  'fixtures',
  'replay-bridge-to-use-tour-actions'
)

function loadFixture(name: 'basic'): { input: string; expected: string } {
  return {
    input: readFileSync(join(FIXTURES, `${name}.input.tsx`), 'utf8'),
    expected: readFileSync(join(FIXTURES, `${name}.expected.tsx`), 'utf8'),
  }
}

describe('replay-bridge-to-use-tour-actions — happy path', () => {
  it('rewrites window.dispatchEvent(new CustomEvent("tour-replay")) → useTourActions(id).start()', () => {
    const { input, expected } = loadFixture('basic')
    const actual = runTransform(transform, input, 'basic.input.tsx')
    expect(normalize(actual)).toBe(normalize(expected))
    expect(reparses(actual)).toBe(true)
  })

  it('adds `import { useTourActions } from "@tour-kit/core"` (merges into existing import if present)', () => {
    const { input } = loadFixture('basic')
    const out = runTransform(transform, input, 'basic.input.tsx')
    expect(out).toMatch(/import\s*\{[^}]*useTourActions[^}]*\}\s*from\s*['"]@tour-kit\/core['"]/)
  })

  it('strips matching addEventListener AND cleanup-return removeEventListener', () => {
    const { input } = loadFixture('basic')
    const out = runTransform(transform, input, 'basic.input.tsx')
    expect(out).not.toContain("window.addEventListener('tour-replay'")
    expect(out).not.toContain("window.removeEventListener('tour-replay'")
  })
})

describe('replay-bridge-to-use-tour-actions — idempotency', () => {
  it('running the transform twice produces the same output as one pass', () => {
    const { input } = loadFixture('basic')
    const firstPass = runTransform(transform, input, 'basic.input.tsx')
    const secondPass = runTransform(transform, firstPass, 'basic.input.tsx')
    expect(normalize(secondPass)).toBe(normalize(firstPass))
  })

  it('a file with no tour-replay pattern is returned unchanged', () => {
    const benign = `
import { useEffect } from 'react'

export function Unrelated() {
  useEffect(() => {
    window.addEventListener('resize', () => {})
  }, [])
  return null
}
`
    const out = runTransform(transform, benign, 'unrelated.tsx')
    expect(out).toBe(benign)
  })
})

describe('replay-bridge-to-use-tour-actions — import-kind correctness', () => {
  it('does NOT inject useTourActions into a type-only @tour-kit/core import', () => {
    // Type-only imports get stripped by tsc — adding a runtime value to one
    // would yield `useTourActions is not defined` at runtime. Verify the
    // codemod synthesizes a fresh value-import instead.
    const src = `
import type { Tour } from '@tour-kit/core'
export function trigger() {
  window.dispatchEvent(new CustomEvent('tour-replay', { detail: { id: 'welcome' } }))
}
export type _T = Tour
`
    const out = runTransform(transform, src, 'type-only.tsx')
    // The original type-only import stays as-is.
    expect(out).toMatch(/import\s+type\s+\{\s*Tour\s*\}\s+from\s+['"]@tour-kit\/core['"]/)
    // A separate value-import was added.
    expect(out).toMatch(/import\s+\{\s*useTourActions\s*\}\s+from\s+['"]@tour-kit\/core['"]/)
    // And the dispatch was rewritten.
    expect(out).toContain("useTourActions('welcome').start()")
  })

  it('merges into an existing value-import alongside other value specifiers', () => {
    const src = `
import { useTour } from '@tour-kit/core'
export function trigger() {
  window.dispatchEvent(new CustomEvent('tour-replay', { detail: { id: 'x' } }))
}
void useTour
`
    const out = runTransform(transform, src, 'merge.tsx')
    expect(out).toMatch(
      /import\s+\{[^}]*useTour[^}]*useTourActions[^}]*\}\s+from\s+['"]@tour-kit\/core['"]/
    )
  })
})

describe('replay-bridge-to-use-tour-actions — block-body cleanup return', () => {
  it('strips block-body arrow cleanup: return () => { window.removeEventListener(...) }', () => {
    const src = `
import { useEffect } from 'react'
function Bridge() {
  useEffect(() => {
    const handler = () => {}
    window.addEventListener('tour-replay', handler)
    return () => {
      window.removeEventListener('tour-replay', handler)
    }
  }, [])
}
void Bridge
`
    const out = runTransform(transform, src, 'block-cleanup.tsx')
    expect(out).not.toContain("window.addEventListener('tour-replay'")
    expect(out).not.toContain("window.removeEventListener('tour-replay'")
    // The block-body return was stripped entirely (no dangling no-op cleanup).
    expect(out).not.toMatch(/return\s*\(\s*\)\s*=>\s*\{/)
  })
})

describe('replay-bridge-to-use-tour-actions — heuristic guardrails', () => {
  it('leaves the source untouched and emits a TODO when CustomEvent.detail is not a literal id', () => {
    const ambiguous = `
export function trigger(id: string) {
  window.dispatchEvent(new CustomEvent('tour-replay', { detail: { kind: 'replay' } }))
}
`
    const out = runTransform(transform, ambiguous, 'ambiguous.tsx')
    // Detail.id missing → no import added (the import would only be needed if
    // we actually rewrote a dispatch). The TODO text references the API name
    // for human reviewers, so we assert the import line specifically.
    expect(out).not.toMatch(
      /import\s*\{[^}]*useTourActions[^}]*\}\s*from\s*['"]@tour-kit\/core['"]/
    )
    // The dispatchEvent call stays put so the dev can rewrite manually.
    expect(out).toContain("new CustomEvent('tour-replay'")
    // And a TODO comment is attached so reviewers see the manual step.
    expect(out).toMatch(/\/\/\s*TODO\(tour-kit\)/)
  })

  it('does NOT rewrite dispatches with a different event name', () => {
    const otherEvent = `
export function trigger() {
  window.dispatchEvent(new CustomEvent('not-tour-replay', { detail: { id: 'x' } }))
}
`
    const out = runTransform(transform, otherEvent, 'other.tsx')
    expect(out).toBe(otherEvent)
  })
})
