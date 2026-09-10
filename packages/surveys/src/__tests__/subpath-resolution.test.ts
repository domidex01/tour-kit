/**
 * v3 Phase 3 — `@tour-kit/surveys/engine` actually resolves.
 *
 * The guard file next door reads bytes; this one asks Node to resolve the
 * subpath for real, in both module systems — ESM through a dynamic `import()`
 * (a self-reference through `exports`, which needs no self-link in
 * `node_modules`) and CJS through a child process, because this worker is ESM.
 *
 * Copied from CHECKLISTS, not hints (§6 D5): hints' file ends with four
 * `peerDependenciesMeta.<dep>.optional === true` cases, and hints marks
 * `react`/`react-dom` optional where surveys does not.
 *
 * The refusal list is a first-class assertion, not a footnote: the barrel is
 * defined as much by what it withholds as by what it exports.
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const PKG_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const distExists = () => existsSync(join(PKG_ROOT, 'dist'))

describe('@tour-kit/surveys/engine subpath resolution', () => {
  it.skipIf(!distExists())('resolves via dynamic `import()` (ESM)', async () => {
    const mod = await import('@tour-kit/surveys/engine')
    // The exact key list, not a subset: this barrel is hand-written
    // `export … from` lines, so an accidental addition is as much a break as an
    // accidental removal — `surveysReducer` leaking out would pass a subset check.
    expect(Object.keys(mod).sort().join(',')).toBe(
      [
        'DEFAULT_SURVEY_QUEUE_CONFIG',
        'createSurveysEngine',
        'createSurveysHandle',
        'initialSurveysState',
        'passesFrequencyGates',
        'seedSurveysState',
      ].join(',')
    )
    expect(typeof mod.createSurveysEngine).toBe('function')
    expect(typeof mod.createSurveysHandle).toBe('function')
  })

  it.skipIf(!distExists())('resolves via `require()` in a child Node process (CJS)', () => {
    const stdout = execFileSync(
      process.execPath,
      [
        '-e',
        "const m = require('@tour-kit/surveys/engine'); console.log(typeof m.createSurveysEngine, typeof m.createSurveysHandle, 'SurveysProvider' in m, 'useSurvey' in m);",
      ],
      { encoding: 'utf8', cwd: PKG_ROOT }
    )
    expect(stdout.trim()).toBe('function function false false')
  })

  it.skipIf(!distExists())('runs a survey with no DOM and no React in a child process', () => {
    // The claim the whole subpath exists to make, made the way a consumer
    // would make it: plain Node, no jsdom, no bundler.
    const stdout = execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `const { createSurveysEngine } = await import('@tour-kit/surveys/engine')
         const e = createSurveysEngine({
           surveys: [{ id: 's1', type: 'nps' }, { id: 's2', type: 'csat' }],
           storage: null,
           random: () => 0,
         })
         const s1 = e.getState()
         console.log('stable:', e.getState() === s1)
         console.log('seeded before boot:', s1.surveys.size === 2 && s1.activeSurvey === null)
         await e.boot()
         e.show('s1')
         console.log('active:', e.getState().activeSurvey)
         e.answer('s1','q1',9); e.answer('s1','q2',10)
         let scored = null
         const e2 = createSurveysEngine({
           surveys: [{ id: 's1', type: 'nps' }], storage: null, random: () => 0,
           onScoreCalculated: (id, type, r) => { scored = type + ':' + r.score },
         })
         await e2.boot(); e2.answer('s1','q1',10); e2.complete('s1')
         console.log('scored:', scored)
         e.setTourActive(true)
         console.log('tour suppresses:', e.canShow('s2') === false)
         e.setTourActive(false)
         console.log('tour releases:', e.canShow('s2') === true)
         const before = e.getState()
         e.destroy(); e.show('s2')
         console.log('after destroy frozen:', e.getState() === before)`,
      ],
      { encoding: 'utf8', cwd: PKG_ROOT }
    )
    expect(stdout.trim().split('\n')).toEqual([
      'stable: true',
      'seeded before boot: true',
      'active: s1',
      'scored: nps:100',
      'tour suppresses: true',
      'tour releases: true',
      'after destroy frozen: true',
    ])
  })

  it.skipIf(!distExists())('does NOT re-export the React surface', async () => {
    const mod = (await import('@tour-kit/surveys/engine')) as Record<string, unknown>
    for (const name of [
      'SurveysProvider',
      'SurveysContext',
      'useSurveysContext',
      'useSurvey',
      'useSurveys',
      'useSurveyScoring',
      'Survey',
      'SurveyModal',
      'NpsModal',
      'CsatModal',
      'CesModal',
      'cn',
      'Slot',
      'UnifiedSlot',
    ]) {
      expect(mod, `@tour-kit/surveys/engine must not export ${name}`).not.toHaveProperty(name)
    }
  })

  it.skipIf(!distExists())('withholds the reducer, as core withholds tourReducer', async () => {
    // A reducer is the seam the engine and a binding share, not a consumer API.
    // `drainQueue` in particular: publishing it would make an internal queue
    // shape a compatibility promise.
    const mod = (await import('@tour-kit/surveys/engine')) as Record<string, unknown>
    for (const name of [
      'surveysReducer',
      'drainQueue',
      'updateSurvey',
      'createInitialSurveyState',
      'serializeState',
      'deserializeState',
      'passesSampling',
      'daysBetween',
    ]) {
      expect(mod, `@tour-kit/surveys/engine must withhold ${name}`).not.toHaveProperty(name)
    }
  })
})
