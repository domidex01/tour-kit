/**
 * v3 Phase 3 — the optional scheduling peer is injectable (US-4, Decision 7b).
 *
 * Same pair as announcements. The sharp edge (§0 C15) is that
 * `resolveScheduleActive`'s third parameter is a LOADER, not the evaluator:
 * wiring the injected function straight in means `load()` calls it with no
 * arguments, it throws, the resolver's `catch` swallows it, and the gate is
 * silently always-active — precisely what this seam exists to eliminate.
 */
import { describe, expect, it } from 'vitest'
import { fakeIsScheduleActive } from '../../../__tests__/helpers/schedule'
import { createSurveysEngine } from '../create-surveys-engine'
import type { EngineSurveyConfig } from '../types'

const scheduled: EngineSurveyConfig[] = [
  {
    id: 'a',
    type: 'nps',
    displayMode: 'modal',
    schedule: { type: 'always' } as EngineSurveyConfig['schedule'],
  },
]

const mk = (isScheduleActive?: ReturnType<typeof fakeIsScheduleActive>) =>
  createSurveysEngine({ surveys: scheduled, storage: null, isScheduleActive })

describe('the injected isScheduleActive gates show()', () => {
  it('refuses a scheduled survey when the injected gate says inactive', async () => {
    // THE discriminating case for the C15 wiring.
    const e = mk(fakeIsScheduleActive(false))
    await e.boot()
    expect(e.canShow('a')).toBe(false)
    e.show('a')
    expect(e.getState().activeSurvey).toBeNull()
    e.destroy()
  })

  it('admits it when the injected gate says active', async () => {
    const e = mk(fakeIsScheduleActive(true))
    await e.boot()
    e.show('a')
    expect(e.getState().activeSurvey).toBe('a')
    e.destroy()
  })

  it('degrades OPEN with no injection — content is never suppressed by a missing peer', async () => {
    const e = mk()
    await e.boot()
    e.show('a')
    expect(e.getState().activeSurvey).toBe('a')
    e.destroy()
  })

  it('an unscheduled survey never consults the gate at all', async () => {
    const e = createSurveysEngine({
      surveys: [{ id: 'plain', type: 'nps', displayMode: 'modal' }],
      storage: null,
      isScheduleActive: fakeIsScheduleActive(false),
    })
    await e.boot()
    e.show('plain')
    expect(e.getState().activeSurvey).toBe('plain')
    e.destroy()
  })
})

describe('resolveScheduleActive in a realm with no `require`', () => {
  it('degrades open rather than throwing', async () => {
    // The §1.6 idiom: a `vm` realm with no `require` binding, which is what a
    // Vite-built ESM bundle actually is. jsdom's own realm HAS require, so the
    // default path above cannot see this.
    const vm = await import('node:vm')
    const { readFileSync } = await import('node:fs')
    const { join } = await import('node:path')

    const src = readFileSync(join(process.cwd(), 'src/core/resolve-schedule.ts'), 'utf8')
    expect(src).toContain("if (typeof require !== 'function') return null")

    const result = vm.runInContext(
      `(function () {
         function loadScheduling() {
           if (typeof require !== 'function') return null
           return null
         }
         function resolveScheduleActive(schedule, now, load) {
           try {
             const s = (load || loadScheduling)()
             if (!s) return true
             return s.isScheduleActive(schedule, { now }).isActive
           } catch { return true }
         }
         return resolveScheduleActive({ type: 'always' }, new Date())
       })()`,
      vm.createContext({})
    )
    expect(result, 'a realm with no require must degrade OPEN').toBe(true)
  })
})
