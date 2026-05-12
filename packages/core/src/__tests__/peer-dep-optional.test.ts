import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PKG_JSON_PATH = join(__dirname, '..', '..', 'package.json')

interface CorePackageJson {
  peerDependencies?: Record<string, string>
  peerDependenciesMeta?: Record<string, { optional?: boolean }>
}

function readCorePkg(): CorePackageJson {
  return JSON.parse(readFileSync(PKG_JSON_PATH, 'utf8')) as CorePackageJson
}

describe('@tour-kit/core package.json — zod is an optional peer', () => {
  it('declares the canonical dual-major zod peer range', () => {
    const pkg = readCorePkg()
    expect(pkg.peerDependencies?.zod).toBe('^3.25.0 || ^4.0.0')
  })

  it('marks zod as optional in peerDependenciesMeta', () => {
    const pkg = readCorePkg()
    expect(pkg.peerDependenciesMeta?.zod?.optional).toBe(true)
  })
})
