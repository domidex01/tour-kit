import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import fromDriver from '../transforms/from-driver'
import fromJoyride from '../transforms/from-joyride'
import fromShepherd from '../transforms/from-shepherd'
import { runTransform } from './_helpers'

const PKG_ROOT = join(__dirname, '..', '..')
const REPO_ROOT = join(PKG_ROOT, '..', '..')

interface SourceAnchors {
  name: 'joyride' | 'shepherd' | 'driver'
  transform: typeof fromJoyride
  fixturesDir: string
  mdxPath: string
}

const SOURCES: readonly SourceAnchors[] = [
  {
    name: 'joyride',
    transform: fromJoyride,
    fixturesDir: join(PKG_ROOT, '__tests__', 'fixtures', 'joyride'),
    mdxPath: join(REPO_ROOT, 'apps', 'docs', 'content', 'docs', 'migration', 'joyride.mdx'),
  },
  {
    name: 'shepherd',
    transform: fromShepherd as unknown as typeof fromJoyride,
    fixturesDir: join(PKG_ROOT, '__tests__', 'fixtures', 'shepherd'),
    mdxPath: join(REPO_ROOT, 'apps', 'docs', 'content', 'docs', 'migration', 'shepherd.mdx'),
  },
  {
    name: 'driver',
    transform: fromDriver as unknown as typeof fromJoyride,
    fixturesDir: join(PKG_ROOT, '__tests__', 'fixtures', 'driver'),
    mdxPath: join(REPO_ROOT, 'apps', 'docs', 'content', 'docs', 'migration', 'driver.mdx'),
  },
]

function slugify(heading: string): string {
  return heading
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
}

for (const src of SOURCES) {
  describe(`TODO anchors emitted by from-${src.name} resolve to headings in ${src.name}.mdx`, () => {
    if (!existsSync(src.fixturesDir)) {
      it.skip(`corpus not present at ${src.fixturesDir}`, () => {})
      return
    }
    if (!existsSync(src.mdxPath)) {
      it.skip(`migration MDX not present at ${src.mdxPath}`, () => {})
      return
    }

    it('every emitted anchor matches a slugified heading in the MDX docs page', () => {
      const mdx = readFileSync(src.mdxPath, 'utf8')
      const headings = new Set<string>(
        [...mdx.matchAll(/^#{1,6}\s+(.+)$/gm)].map(([, h]) => slugify(h))
      )

      const anchorPattern = new RegExp(
        `\\/\\/ TODO:.*?https:\\/\\/tourkit\\.dev\\/migration\\/${src.name}#([a-z0-9-]+)`,
        'g'
      )

      const emittedAnchors = new Set<string>()
      for (const file of readdirSync(src.fixturesDir).filter((f) => f.endsWith('.input.tsx'))) {
        const out = runTransform(
          src.transform,
          readFileSync(join(src.fixturesDir, file), 'utf8'),
          file
        )
        for (const m of out.matchAll(anchorPattern)) {
          emittedAnchors.add(m[1])
        }
      }

      const orphans = [...emittedAnchors].filter((a) => !headings.has(a))
      expect(orphans, `orphan anchors with no MDX heading: ${orphans.join(', ')}`).toEqual([])
    })
  })
}
