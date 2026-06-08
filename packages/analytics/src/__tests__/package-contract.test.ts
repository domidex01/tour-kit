import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

/**
 * Guards the optional-peer design against a naive "fix" for the `next build`
 * failure. The correct fix is the `/* webpackIgnore *​/` magic comment on each
 * dynamic import (see `build/optional-imports.*`). A tempting but wrong fix is
 * to promote the SDKs to hard `dependencies` — that re-bloats every consumer
 * (posthog-js alone is ~1 MB) and reintroduces the original design mistake.
 *
 * So: assert the three analytics SDKs stay optional peers, and never appear in
 * `dependencies`.
 */

const OPTIONAL_SDKS = ['posthog-js', 'mixpanel-browser', '@amplitude/analytics-browser'] as const

const pkgPath = join(dirname(fileURLToPath(import.meta.url)), '../../package.json')
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
  dependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  peerDependenciesMeta?: Record<string, { optional?: boolean }>
}

describe('@tour-kit/analytics optional-peer contract', () => {
  for (const sdk of OPTIONAL_SDKS) {
    it(`${sdk} is declared as a peer dependency`, () => {
      expect(pkg.peerDependencies?.[sdk]).toBeDefined()
    })

    it(`${sdk} is marked optional in peerDependenciesMeta`, () => {
      expect(pkg.peerDependenciesMeta?.[sdk]?.optional).toBe(true)
    })

    it(`${sdk} is NOT a hard dependency`, () => {
      expect(pkg.dependencies?.[sdk]).toBeUndefined()
    })
  }
})
