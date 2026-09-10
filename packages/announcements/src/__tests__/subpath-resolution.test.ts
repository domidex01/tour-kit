/**
 * v3 Phase 3 — `@tour-kit/announcements/engine` actually resolves.
 *
 * The guard file next door reads bytes; this one asks Node to resolve the
 * subpath for real, in both module systems — ESM through a dynamic `import()`
 * (a self-reference through `exports`, which needs no self-link in
 * `node_modules`) and CJS through a child process, because this worker is ESM.
 *
 * Copied from CHECKLISTS, not hints (§6 D5): hints' file ends with four
 * `peerDependenciesMeta.<dep>.optional === true` cases, and hints marks
 * `react`/`react-dom` optional where announcements does not. Those four cases
 * would be permanently red here and this phase does not change that.
 *
 * The refusal list is a first-class assertion, not a footnote: the barrel is
 * defined as much by what it withholds as by what it exports. Without it, an
 * `export *` from the main entry would satisfy every other case in this file.
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const distExists = () => existsSync(join(PKG_ROOT, 'dist'))

describe('@tour-kit/announcements/engine subpath resolution', () => {
  it.skipIf(!distExists())('resolves via dynamic `import()` (ESM)', async () => {
    const mod = await import('@tour-kit/announcements/engine')
    // The exact key list, not a subset: this barrel is hand-written
    // `export … from` lines, so an accidental addition is as much a break as an
    // accidental removal — `announcementsReducer` leaking out would pass a
    // subset check.
    expect(Object.keys(mod).sort().join(',')).toBe(
      [
        'DEFAULT_QUEUE_CONFIG',
        'FORCE_SHOW_BYPASS',
        'createAnnouncementsEngine',
        'createAnnouncementsHandle',
        'emptyAnnouncementsState',
        'evaluateAnnouncementAudience',
        'seedAnnouncementsState',
      ].join(',')
    )
    expect(typeof mod.createAnnouncementsEngine).toBe('function')
    expect(typeof mod.createAnnouncementsHandle).toBe('function')
  })

  it.skipIf(!distExists())('resolves via `require()` in a child Node process (CJS)', () => {
    const stdout = execFileSync(
      process.execPath,
      [
        '-e',
        "const m = require('@tour-kit/announcements/engine'); console.log(typeof m.createAnnouncementsEngine, typeof m.createAnnouncementsHandle, 'AnnouncementsProvider' in m, 'useAnnouncement' in m);",
      ],
      { encoding: 'utf8', cwd: PKG_ROOT }
    )
    expect(stdout.trim()).toBe('function function false false')
  })

  it.skipIf(!distExists())('runs announcements with no DOM and no React in a child process', () => {
    // The claim the whole subpath exists to make, made the way a consumer
    // would make it: plain Node, no jsdom, no bundler.
    const stdout = execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `const { createAnnouncementsEngine } = await import('@tour-kit/announcements/engine')
         const e = createAnnouncementsEngine({
           announcements: [
             { id: 'a', autoShow: true },
             { id: 'b', autoShow: true },
             { id: 'gated', autoShow: true, audience: { segment: 'admins' } },
           ],
           storage: null,
           queueConfig: { maxConcurrent: 1 },
         })
         const s1 = e.getState()
         console.log('stable:', e.getState() === s1)
         console.log('seeded before boot:', s1.configs.size === 3 && s1.activeAnnouncement === null)
         e.boot()
         console.log('active:', e.getState().activeAnnouncement)
         console.log('queued:', e.getState().queue.join('|'))
         console.log('segment closed:', e.canShow('gated') === false)
         e.setSegments({ admins: true })
         console.log('segment open:', e.canShow('gated') === true)
         e.destroy()
         e.show('b')
         console.log('after destroy frozen:', e.getState().activeAnnouncement === 'a')`,
      ],
      { encoding: 'utf8', cwd: PKG_ROOT }
    )
    expect(stdout.trim().split('\n')).toEqual([
      'stable: true',
      'seeded before boot: true',
      'active: a',
      'queued: b',
      'segment closed: true',
      'segment open: true',
      'after destroy frozen: true',
    ])
  })

  it.skipIf(!distExists())('does NOT re-export the React surface', async () => {
    const mod = (await import('@tour-kit/announcements/engine')) as Record<string, unknown>
    for (const name of [
      'AnnouncementsProvider',
      'AnnouncementsContext',
      'useAnnouncementsContext',
      'useAnnouncement',
      'useAnnouncements',
      'useAnnouncementQueue',
      'useFilteredAnnouncements',
      'Announcement',
      'AnnouncementModal',
      'AnnouncementToast',
      'AnnouncementBanner',
      'AnnouncementSpotlight',
      'cn',
      'Slot',
      'UnifiedSlot',
    ]) {
      expect(mod, `@tour-kit/announcements/engine must not export ${name}`).not.toHaveProperty(name)
    }
  })

  it.skipIf(!distExists())('withholds the reducer, as core withholds tourReducer', async () => {
    // A reducer is the seam the engine and a binding share, not a consumer
    // API. Publishing it would make every handler's signature a compatibility
    // promise for a state shape that is deliberately internal.
    const mod = (await import('@tour-kit/announcements/engine')) as Record<string, unknown>
    expect(mod).not.toHaveProperty('announcementsReducer')
    expect(mod).not.toHaveProperty('createInitialState')
    expect(mod).not.toHaveProperty('getStorageKey')
    expect(mod).not.toHaveProperty('STORAGE_KEY_PREFIX')
    expect(mod).not.toHaveProperty('getAnnouncementAnalyticsMetadata')
    expect(mod).not.toHaveProperty('computeEligibleIds')
  })
})
