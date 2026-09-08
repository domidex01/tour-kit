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

describe('@tour-kit/svelte package.json', () => {
  it('names react in no dependency field at all', () => {
    for (const field of ['dependencies', 'devDependencies', 'peerDependencies'] as const) {
      const names = Object.keys(pkg[field] ?? {})
      expect(names, field).not.toContain('react')
      expect(names, field).not.toContain('react-dom')
      expect(names, field).not.toContain('@types/react')
    }
  })

  it('depends on core and peers on svelte', () => {
    expect(pkg.dependencies?.['@tour-kit/core']).toBe('workspace:*')
    expect(pkg.peerDependencies?.svelte).toBeDefined()
  })

  it('@sveltejs/kit is an OPTIONAL peer — the adapter is a factory over primitives', () => {
    // The package never imports `$app/*`; without `optional` every consumer
    // with no SvelteKit would still have to install it.
    expect(pkg.peerDependencies?.['@sveltejs/kit']).toBeDefined()
    expect(pkg.peerDependenciesMeta?.['@sveltejs/kit']?.optional).toBe(true)
  })

  it('is private until the v2 licence lands (§3.2)', () => {
    expect(pkg.private).toBe(true)
  })
})
