import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
/**
 * The manifest half of "no React installed". Modelled on
 * `packages/analytics/src/__tests__/package-contract.test.ts`.
 */
import { describe, expect, it } from 'vitest'

const pkg = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../package.json'), 'utf8')
) as {
  private?: boolean
  license?: string
  files?: string[]
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  peerDependenciesMeta?: Record<string, { optional?: boolean }>
}

describe('@tour-kit/vue package.json', () => {
  it('names react in no dependency field at all', () => {
    for (const field of ['dependencies', 'devDependencies', 'peerDependencies'] as const) {
      const names = Object.keys(pkg[field] ?? {})
      expect(names, field).not.toContain('react')
      expect(names, field).not.toContain('react-dom')
      expect(names, field).not.toContain('@types/react')
    }
  })

  it('depends on core and peers on vue', () => {
    // #154: core is a caret range, not an exact pin — an exact pin shipped a
    // nested stale core in consumers who updated core alone, which is how the
    // lifecycle-hook regression hid from the reporter.
    expect(pkg.dependencies?.['@tour-kit/core']).toBe('workspace:^')
    expect(pkg.peerDependencies?.vue).toBeDefined()
  })

  it('vue-router is an OPTIONAL peer — the adapter is a factory over primitives', () => {
    // Without this a consumer with no router still has to install one.
    expect(pkg.peerDependencies?.['vue-router']).toBeDefined()
    expect(pkg.peerDependenciesMeta?.['vue-router']?.optional).toBe(true)
  })

  it('is published, under BUSL-1.1, with the licence text in the tarball', () => {
    // The binding layers the unlicensed badge, so the terms it layers it under
    // have to actually ship. `files` is explicit rather than left to npm's
    // implicit licence-file include — the same call the core/react/hints
    // relicense made.
    expect(pkg.private).toBeUndefined()
    expect(pkg.license).toBe('BUSL-1.1')
    expect(pkg.files).toContain('LICENSE.md')
  })

  it('depends on the licence package — the badge is not optional', () => {
    // An optional peer would make the gate opt-in, which is no gate at all.
    expect(pkg.dependencies?.['@tour-kit/license']).toBe('workspace:*')
  })
})
