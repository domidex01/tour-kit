/**
 * v3 Phase 2 — `@tour-kit/checklists/engine` actually resolves.
 *
 * The guard file next door reads bytes; this one asks Node to resolve the
 * subpath for real, in both module systems — ESM through a dynamic `import()`
 * (a self-reference through `exports`, which needs no self-link in
 * `node_modules`) and CJS through a child process, because this worker is ESM.
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

describe('@tour-kit/checklists/engine subpath resolution', () => {
  it.skipIf(!distExists())('resolves via dynamic `import()` (ESM)', async () => {
    const mod = await import('@tour-kit/checklists/engine')
    // The exact key list, not a subset: this barrel is hand-written
    // `export … from` lines, so an accidental addition is as much a break as
    // an accidental removal — `checklistsReducer` or `signature` leaking out
    // would pass a subset check.
    expect(Object.keys(mod).sort().join(',')).toBe(
      [
        'LOCATION_CHANGE_EVENT',
        'attachUrlVisitTasks',
        'calculateProgress',
        'canCompleteTask',
        'createChecklist',
        'createChecklistsEngine',
        'createChecklistsHandle',
        'createTask',
        'getLockedTasks',
        'getNextTask',
        'hasCircularDependency',
        'initialChecklistsState',
        'matchesPattern',
        'registerUrlVisitTask',
        'resolveTaskDependencies',
        'seedChecklistsState',
      ].join(',')
    )
    expect(typeof mod.createChecklistsEngine).toBe('function')
    expect(typeof mod.createChecklistsHandle).toBe('function')
    expect(typeof mod.attachUrlVisitTasks).toBe('function')
  })

  it.skipIf(!distExists())('resolves via `require()` in a child Node process (CJS)', () => {
    const stdout = execFileSync(
      process.execPath,
      [
        '-e',
        "const m = require('@tour-kit/checklists/engine'); console.log(typeof m.createChecklistsEngine, typeof m.createChecklistsHandle, typeof m.attachUrlVisitTasks, 'ChecklistProvider' in m, 'useChecklist' in m);",
      ],
      { encoding: 'utf8', cwd: PKG_ROOT }
    )
    expect(stdout.trim()).toBe('function function function false false')
  })

  it.skipIf(!distExists())('runs a checklist with no DOM and no React in a child process', () => {
    // The claim the whole subpath exists to make, made the way a consumer
    // would make it: plain Node, no jsdom, no bundler.
    const stdout = execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `const { createChecklistsEngine } = await import('@tour-kit/checklists/engine')
         const cfg = { id: 'c1', title: 'X', tasks: [{ id: 't1', title: 'A' }, { id: 't2', title: 'B', dependsOn: ['t1'] }] }
         const e = createChecklistsEngine({ checklists: [cfg], persistence: { enabled: true } })
         const s1 = e.getState()
         console.log('stable:', e.getState() === s1)
         console.log('locked before:', s1.checklists.get('c1').tasks[1].locked)
         e.completeTask('c1','t1')
         console.log('unlocked after:', e.getState().checklists.get('c1').tasks[1].locked === false)
         console.log('progress:', e.getProgress('c1').percentage)
         e.boot(); e.destroy()
         e.completeTask('c1','t2')
         console.log('after destroy frozen:', e.getState().checklists.get('c1').tasks[1].completed === false)`,
      ],
      { encoding: 'utf8', cwd: PKG_ROOT }
    )
    expect(stdout.trim().split('\n')).toEqual([
      'stable: true',
      'locked before: true',
      'unlocked after: true',
      'progress: 50',
      'after destroy frozen: true',
    ])
  })

  it.skipIf(!distExists())('does NOT re-export the React surface', async () => {
    const mod = (await import('@tour-kit/checklists/engine')) as Record<string, unknown>
    for (const name of [
      'ChecklistProvider',
      'ChecklistContext',
      'useChecklistContext',
      'useChecklist',
      'useTask',
      'useChecklistsProgress',
      'useChecklistPersistence',
      'Checklist',
      'ChecklistPanel',
      'ChecklistLauncher',
      'ChecklistTask',
      'cn',
      'Slot',
      'UnifiedSlot',
    ]) {
      expect(mod, `@tour-kit/checklists/engine must not export ${name}`).not.toHaveProperty(name)
    }
  })

  it.skipIf(!distExists())('withholds the reducer, as core withholds tourReducer', async () => {
    // A reducer is the seam the engine and a binding share, not a consumer
    // API. Publishing it would make every handler's signature a compatibility
    // promise for a state shape that is deliberately internal. `signature` and
    // `createChecklistState` are the same kind of seam.
    const mod = (await import('@tour-kit/checklists/engine')) as Record<string, unknown>
    expect(mod).not.toHaveProperty('checklistsReducer')
    expect(mod).not.toHaveProperty('createChecklistState')
    expect(mod).not.toHaveProperty('signature')
    expect(mod).not.toHaveProperty('__resetForTests')
  })
})
