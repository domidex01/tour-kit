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
    expect(pkg.dependencies?.['@tour-kit/core']).toBe('workspace:*')
    expect(pkg.peerDependencies?.vue).toBeDefined()
  })

  it('vue-router is an OPTIONAL peer — the adapter is a factory over primitives', () => {
    // Without this a consumer with no router still has to install one.
    expect(pkg.peerDependencies?.['vue-router']).toBeDefined()
    expect(pkg.peerDependenciesMeta?.['vue-router']?.optional).toBe(true)
  })

  it('is private until the v2 licence lands (§3.2)', () => {
    expect(pkg.private).toBe(true)
  })
})
