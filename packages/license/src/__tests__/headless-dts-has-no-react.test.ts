// @vitest-environment node
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
/**
 * `@tour-kit/license/headless` is the door `@tour-kit/vue` and
 * `@tour-kit/svelte` import, and their whole pitch is "no React installed".
 *
 * A scan of `headless.d.ts` ALONE is not enough, and that is the point of this
 * file. tsup's dts pass rolls every type module both entries reach into one
 * shared declaration chunk and has `headless.d.ts` import it — `splitting:
 * false` does not apply to declarations. `types/index.ts` used to declare
 * `LicenseGateProps` with `children: React.ReactNode` next to `LicenseState`,
 * so the React namespace travelled into that chunk with no import to resolve
 * it, and a Vue app running `vue-tsc` with `skipLibCheck: false` and no
 * `@types/react` got `TS2503: Cannot find namespace 'React'` from inside
 * `node_modules`. React prop types live in `types/react.ts` now; this walks the
 * closure so they cannot drift back.
 */
import { describe, expect, it } from 'vitest'

const DIST = resolve(__dirname, '..', '..', 'dist')
const distExists = () => existsSync(DIST)

/** Every `.d.ts` reachable from an entry, following relative imports. */
function closureOf(entry: string): string[] {
  const seen = new Set<string>()
  const queue = [entry]

  while (queue.length > 0) {
    const file = queue.pop() as string
    if (seen.has(file) || !existsSync(file)) continue
    seen.add(file)

    for (const [, spec] of readFileSync(file, 'utf8').matchAll(/from\s*['"](\.[^'"]+)['"]/g)) {
      // tsup writes `./chunk.js` in declarations; the file on disk is `.d.ts`.
      queue.push(join(dirname(file), spec.replace(/\.js$/, '.d.ts')))
    }
  }
  return [...seen]
}

/** React in a TYPE position — comments mention it constantly and legitimately. */
function reactTypeRefs(source: string): string[] {
  const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')
  return [...code.matchAll(/\bReact\.[A-Za-z]+|from\s*['"]react(?:\/[^'"]*)?['"]/g)].map(
    (m) => m[0]
  )
}

describe('@tour-kit/license/headless declarations', () => {
  it.skipIf(!distExists())('reaches more than just its own file', () => {
    // The guard against a closure walk that quietly finds nothing. If the
    // shared chunk stops being imported this assertion is the one that says so,
    // rather than every React check below passing vacuously.
    const closure = closureOf(join(DIST, 'headless.d.ts'))
    expect(closure.length, `headless.d.ts closure: ${closure.join(', ')}`).toBeGreaterThan(1)
  })

  it.skipIf(!distExists())('CONTROL — the same scan DOES find React in index.d.ts', () => {
    // index.d.ts is the React entry. If this comes back empty the matcher is
    // broken and the negative assertion below proves nothing.
    const refs = closureOf(join(DIST, 'index.d.ts')).flatMap((f) =>
      reactTypeRefs(readFileSync(f, 'utf8'))
    )
    expect(refs.length, 'the React entry names no React — scan is broken').toBeGreaterThan(0)
  })

  it.skipIf(!distExists())('names React nowhere in its closure', () => {
    for (const file of closureOf(join(DIST, 'headless.d.ts'))) {
      const refs = reactTypeRefs(readFileSync(file, 'utf8'))
      expect(refs, `${file} names React in a type position: ${refs.join(', ')}`).toEqual([])
    }
  })
})
