import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import transform from '../transforms/from-joyride'
import { runTransform } from './_helpers'

const FIXTURES = join(__dirname, '..', '..', '__tests__', 'fixtures', 'joyride')
const MDX = join(
  __dirname,
  '..',
  '..',
  '..',
  '..',
  'apps',
  'docs',
  'content',
  'docs',
  'migration',
  'joyride.mdx'
)

function slugify(heading: string): string {
  return heading
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
}

describe('TODO anchors emitted by from-joyride resolve to headings in joyride.mdx', () => {
  it('every emitted anchor matches a slugified heading in the MDX docs page', () => {
    expect(
      existsSync(MDX),
      `expected migration docs page at ${MDX} — write apps/docs/content/docs/migration/joyride.mdx`
    ).toBe(true)
    const mdx = readFileSync(MDX, 'utf8')
    const headings = new Set<string>(
      [...mdx.matchAll(/^#{1,6}\s+(.+)$/gm)].map(([, h]) => slugify(h))
    )

    const emittedAnchors = new Set<string>()
    for (const file of readdirSync(FIXTURES).filter((f) => f.endsWith('.input.tsx'))) {
      const out = runTransform(transform, readFileSync(join(FIXTURES, file), 'utf8'), file)
      for (const m of out.matchAll(
        /\/\/ TODO:.*?https:\/\/tourkit\.dev\/migration\/joyride#([a-z0-9-]+)/g
      )) {
        emittedAnchors.add(m[1])
      }
    }

    const orphans = [...emittedAnchors].filter((a) => !headings.has(a))
    expect(orphans, `orphan anchors with no MDX heading: ${orphans.join(', ')}`).toEqual([])
  })
})
