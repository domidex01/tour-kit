import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import * as announcements from '../index'

describe('@tour-kit/announcements barrel (Phase 1 surface)', () => {
  it('exports FORCE_SHOW_BYPASS as a frozen tuple', () => {
    expect(announcements.FORCE_SHOW_BYPASS).toEqual([
      'frequency',
      'cooldown',
      'viewCount',
      'isDismissed',
      'audience',
    ])
  })

  it('exports AnnouncementsProvider at the top level', () => {
    expect(typeof announcements.AnnouncementsProvider).toBe('function')
  })

  it('exports useAnnouncement and useAnnouncementsContext at the top level', () => {
    expect(typeof announcements.useAnnouncement).toBe('function')
    expect(typeof announcements.useAnnouncementsContext).toBe('function')
  })
})

// Build-artifact assertion — runs only when `pnpm --filter @tour-kit/announcements
// build` has populated dist/. Local-dev runs skip cleanly via existsSync().
//
// `forceShow` is a METHOD on AnnouncementsContextValue / UseAnnouncementReturn,
// so its symbol lives in the chained `./headless.d.ts` re-export, not the
// top-level index.d.ts. We grep both so a regression at either layer fails.
const __here = dirname(fileURLToPath(import.meta.url))
const DIST_DTS = join(__here, '..', '..', 'dist', 'index.d.ts')
const DIST_DTS_CTS = join(__here, '..', '..', 'dist', 'index.d.cts')
const DIST_HEADLESS_DTS = join(__here, '..', '..', 'dist', 'headless.d.ts')

describe('@tour-kit/announcements dist artifact (Phase 1 surface)', () => {
  it.skipIf(!existsSync(DIST_DTS))(
    'index.d.ts re-exports FORCE_SHOW_BYPASS at the top level',
    () => {
      const dts = readFileSync(DIST_DTS, 'utf8')
      expect(dts).toMatch(/FORCE_SHOW_BYPASS/)
    }
  )

  it.skipIf(!existsSync(DIST_DTS_CTS))(
    'index.d.cts re-exports FORCE_SHOW_BYPASS (CJS consumers)',
    () => {
      const dcts = readFileSync(DIST_DTS_CTS, 'utf8')
      expect(dcts).toMatch(/FORCE_SHOW_BYPASS/)
    }
  )

  it.skipIf(!existsSync(DIST_HEADLESS_DTS))(
    'headless.d.ts (re-exported by index) declares forceShow on the context value',
    () => {
      const dts = readFileSync(DIST_HEADLESS_DTS, 'utf8')
      // Should appear at least twice: on AnnouncementsContextValue.forceShow
      // (id-taking) and UseAnnouncementReturn.forceShow (id-bound).
      const matches = dts.match(/forceShow/g) ?? []
      expect(matches.length).toBeGreaterThanOrEqual(2)
    }
  )
})
