import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Every `@tour-kit/*` symbol a docs page imports has to be one the package
 * actually exports.
 *
 * The v3 binding and engine pages were written against the source, but nothing
 * kept them there: rename an export and the guide keeps printing the old name
 * until a reader hits the error. This reads the packages' barrels rather than
 * their `dist/`, so it needs no build and cannot be disarmed by a missing one.
 *
 * Scoped to the pages that document a package's public API directly. A prose
 * page that names a symbol in passing is not the drift this guards.
 */
const ROOT = path.resolve(__dirname, '../../../..')
const CONTENT = path.resolve(__dirname, '../../content/docs')

const PAGES = ['vue/index.mdx', 'svelte/index.mdx', 'guides/headless-engine.mdx']

/** `@tour-kit/core/engine` is a barrel the bindings re-export wholesale. */
const BARREL: Record<string, string> = {
  '@tour-kit/core': 'packages/core/src/index.ts',
  '@tour-kit/core/engine': 'packages/core/src/engine/index.ts',
  '@tour-kit/vue': 'packages/vue/src/index.ts',
  '@tour-kit/svelte': 'packages/svelte/src/index.ts',
}

const stripComments = (src: string): string =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

/**
 * Names a barrel exports, following `export * from` one hop into another
 * barrel we know — which is exactly how both bindings republish `/engine`.
 */
function exportsOf(specifier: string, seen = new Set<string>()): Set<string> {
  const names = new Set<string>()
  const rel = BARREL[specifier]
  if (!rel || seen.has(specifier)) return names
  seen.add(specifier)

  const src = stripComments(readFileSync(path.join(ROOT, rel), 'utf8'))

  // `export { a, type B, c as d } from '...'` and bare `export { ... }`
  for (const block of src.matchAll(/export\s+(?:type\s+)?\{([^}]*)\}/g)) {
    for (const entry of block[1].split(',')) {
      const name = entry
        .trim()
        .replace(/^type\s+/, '')
        .split(/\s+as\s+/)
        .pop()
        ?.trim()
      if (name) names.add(name)
    }
  }

  // `export function x`, `export const x`, `export interface X`, `export type X`
  for (const m of src.matchAll(
    /export\s+(?:declare\s+)?(?:async\s+)?(?:function|const|let|var|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)/g
  )) {
    names.add(m[1])
  }

  for (const m of src.matchAll(/export\s+\*\s+from\s+['"]([^'"]+)['"]/g)) {
    for (const n of exportsOf(m[1], seen)) names.add(n)
  }

  return names
}

/** `import { a, type B } from '@tour-kit/x'` inside a fenced code block. */
function importsIn(mdx: string): Array<{ specifier: string; names: string[] }> {
  const out: Array<{ specifier: string; names: string[] }> = []
  for (const m of mdx.matchAll(/import\s+\{([^}]*)\}\s+from\s+['"](@tour-kit\/[^'"]+)['"]/g)) {
    const names = m[1]
      .split(',')
      .map((e) =>
        e
          .trim()
          .replace(/^type\s+/, '')
          .split(/\s+as\s+/)[0]
          .trim()
      )
      .filter(Boolean)
    out.push({ specifier: m[2], names })
  }
  return out
}

describe('docs imports resolve to real exports', () => {
  it('the extractor finds a known export and rejects an invented one', () => {
    const engine = exportsOf('@tour-kit/core/engine')
    expect(engine.has('createEngineHandle')).toBe(true)
    expect(engine.has('resolveTarget')).toBe(true)
    expect(engine.has('createTourEngineDefinitelyNot')).toBe(false)
  })

  it('both bindings republish the engine barrel', () => {
    for (const binding of ['@tour-kit/vue', '@tour-kit/svelte']) {
      expect(exportsOf(binding).has('resolveTarget')).toBe(true)
    }
  })

  it.each(PAGES)('%s imports only symbols that exist', (page) => {
    const mdx = readFileSync(path.join(CONTENT, page), 'utf8')
    const statements = importsIn(mdx)
    expect(statements.length).toBeGreaterThan(0)

    const missing: string[] = []
    for (const { specifier, names } of statements) {
      const available = exportsOf(specifier)
      if (available.size === 0) continue // specifier we do not model
      for (const name of names) {
        if (!available.has(name)) missing.push(`${page}: ${specifier} has no export "${name}"`)
      }
    }
    expect(missing).toEqual([])
  })
})
