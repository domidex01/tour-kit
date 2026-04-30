import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Phase 3 cleanup: after deleting `packages/announcements/src/lib/ui-library-context.tsx`,
 * no announcements barrel may dangle a re-export pointing at the removed file.
 *
 * The phase-3 plan named `packages/announcements/src/lib/index.ts` as the offending barrel,
 * but that file does not exist in this repo — the actual re-exports live in
 * `src/index.ts` and `src/headless.ts`. We assert against those real barrels instead.
 */
const ANNOUNCEMENTS_SRC = join(__dirname, '..', '..')
const PUBLIC_INDEX = readFileSync(join(ANNOUNCEMENTS_SRC, 'index.ts'), 'utf8')
const HEADLESS_INDEX = readFileSync(join(ANNOUNCEMENTS_SRC, 'headless.ts'), 'utf8')

describe('announcements barrels — Phase 3 dangling re-export cleanup', () => {
  it('public src/index.ts does not re-export ./lib/ui-library-context', () => {
    expect(PUBLIC_INDEX).not.toMatch(/['"]\.\/lib\/ui-library-context['"]/)
  })

  it('public src/index.ts does not re-export ./ui-library-context', () => {
    expect(PUBLIC_INDEX).not.toMatch(/['"]\.\/ui-library-context['"]/)
  })

  it('headless barrel does not re-export ./lib/ui-library-context', () => {
    expect(HEADLESS_INDEX).not.toMatch(/['"]\.\/lib\/ui-library-context['"]/)
  })

  it('headless barrel does not re-export ./ui-library-context', () => {
    expect(HEADLESS_INDEX).not.toMatch(/['"]\.\/ui-library-context['"]/)
  })
})
