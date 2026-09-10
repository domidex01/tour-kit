/**
 * v3 Phase 3, Task 3.8 — the surveys engine contract and its four seams.
 */
import { describe, expect, it, vi } from 'vitest'
import { createFakeStorage } from '../../../__tests__/helpers/fake-storage'
import { seededRandom } from '../../../__tests__/helpers/seeded-random'
import {
  createSurveysEngine,
  initialSurveysState,
  seedSurveysState,
} from '../create-surveys-engine'
import { serializeState } from '../persistence'
import { createInitialSurveyState } from '../reducer'
import type { EngineSurveyConfig } from '../types'

const cfg = (id: string, over: Partial<EngineSurveyConfig> = {}): EngineSurveyConfig => ({
  id,
  type: 'nps',
  displayMode: 'modal',
  ...over,
})

describe('the constructor is inert', () => {
  it('reads no storage until boot()', async () => {
    const storage = createFakeStorage()
    const getItem = vi.spyOn(storage, 'getItem')
    const e = createSurveysEngine({ surveys: [cfg('a')], storage })
    expect(getItem).not.toHaveBeenCalled()
    await e.boot()
    expect(getItem).toHaveBeenCalledWith('tour-kit:surveys:state')
    e.destroy()
  })

  it('seeds configs before boot, so a binding renders them on the FIRST pass', () => {
    const e = createSurveysEngine({ surveys: [cfg('a'), cfg('b')] })
    expect([...e.getState().surveys.keys()]).toEqual(['a', 'b'])
    e.destroy()
  })

  it('the empty snapshot is frozen and shared', () => {
    expect(Object.isFrozen(initialSurveysState)).toBe(true)
    expect(seedSurveysState([])).toBe(initialSurveysState)
  })
})

describe('boot() is cancellable', () => {
  it('a destroy() during the storage read never lands a HYDRATE', async () => {
    // The provider carried a `cancelled` flag at :486 for exactly this. Core's
    // own boot() still has this hole; the port deliberately does not inherit it.
    let release: (v: string | null) => void = () => {}
    const storage = {
      getItem: () => new Promise<string | null>((r) => (release = r)) as unknown as string | null,
      setItem: () => {},
      removeItem: () => {},
    }
    const e = createSurveysEngine({ surveys: [cfg('a')], storage })
    const booting = e.boot()

    e.destroy() // teardown while the read is in flight
    release(serializeState(new Map([['a', { ...createInitialSurveyState('a'), viewCount: 9 }]]), [], null))
    await booting

    expect(e.getState().surveys.get('a')?.viewCount ?? 0).not.toBe(9)
  })

  it('hydrates view counts and the queue when it is NOT cancelled', async () => {
    const blob = serializeState(
      new Map([['a', { ...createInitialSurveyState('a'), viewCount: 4 }]]),
      ['b'],
      new Date('2026-09-01T00:00:00Z')
    )
    const e = createSurveysEngine({
      surveys: [cfg('a'), cfg('b')],
      storage: createFakeStorage({ 'tour-kit:surveys:state': blob }),
    })
    await e.boot()
    expect(e.getState().surveys.get('a')?.viewCount).toBe(4)
    expect(e.getState().queue).toEqual(['b'])
    e.destroy()
  })

  it('is idempotent, and a no-storage engine still registers', async () => {
    const e = createSurveysEngine({ surveys: [cfg('a')], storage: null })
    await e.boot()
    const s = e.getState()
    await e.boot()
    expect(e.getState()).toBe(s)
    expect(e.getState().surveys.has('a')).toBe(true)
    e.destroy()
  })
})

describe('setTourActive suppresses surveys (plan Decision 7)', () => {
  it('refuses show() while a tour runs, and admits it afterwards', async () => {
    const e = createSurveysEngine({ surveys: [cfg('a')], storage: null })
    await e.boot()

    e.setTourActive(true)
    expect(e.canShow('a')).toBe(false)
    e.show('a')
    expect(e.getState().activeSurvey).toBeNull()

    e.setTourActive(false)
    expect(e.canShow('a')).toBe(true)
    e.show('a')
    expect(e.getState().activeSurvey).toBe('a')
    e.destroy()
  })

  it('hides a visible survey the moment a tour starts, WITHOUT promoting the next', async () => {
    // `drain: false` — a tour is a suppression, not a completion. Draining here
    // would show survey B behind the tour that just suppressed survey A.
    const e = createSurveysEngine({ surveys: [cfg('a'), cfg('b')], storage: null })
    await e.boot()
    e.show('a')
    expect(e.getState().activeSurvey).toBe('a')

    e.setTourActive(true)
    expect(e.getState().activeSurvey).toBeNull()
    expect(e.getState().surveys.get('a')?.isVisible).toBe(false)
    e.destroy()
  })
})

describe('the injected random drives sampling deterministically', () => {
  it('refuses when the roll misses the rate, admits when it hits', async () => {
    const refuse = createSurveysEngine({
      surveys: [cfg('a', { samplingRate: 0.1 })],
      storage: null,
      random: seededRandom(0.5),
    })
    await refuse.boot()
    expect(refuse.canShow('a')).toBe(false)
    refuse.destroy()

    const admit = createSurveysEngine({
      surveys: [cfg('a', { samplingRate: 0.9 })],
      storage: null,
      random: seededRandom(0.5),
    })
    await admit.boot()
    expect(admit.canShow('a')).toBe(true)
    admit.destroy()
  })

  it('draws ONCE at construction, as the provider drew once per mount', async () => {
    const random = vi.fn(() => 0.5)
    const e = createSurveysEngine({ surveys: [cfg('a'), cfg('b')], storage: null, random })
    await e.boot()
    e.canShow('a')
    e.canShow('b')
    e.canShow('a')
    expect(random).toHaveBeenCalledTimes(1)
    e.destroy()
  })
})

describe('scoring fires on complete', () => {
  it('computes NPS from the numeric responses and reports the type', async () => {
    const onScoreCalculated = vi.fn()
    const e = createSurveysEngine({ surveys: [cfg('a')], storage: null, onScoreCalculated })
    await e.boot()
    e.answer('a', 'q1', 9)
    e.answer('a', 'q2', 3)
    e.complete('a')

    expect(onScoreCalculated).toHaveBeenCalledWith('a', 'nps', expect.objectContaining({ score: expect.any(Number) }))
    e.destroy()
  })

  it('skips scoring for `custom` and for a survey with no numeric answers', async () => {
    const onScoreCalculated = vi.fn()
    const e = createSurveysEngine({
      surveys: [cfg('c', { type: 'custom' }), cfg('t')],
      storage: null,
      onScoreCalculated,
    })
    await e.boot()
    e.answer('c', 'q', 9)
    e.complete('c')
    e.answer('t', 'q', 'free text')
    e.complete('t')
    expect(onScoreCalculated).not.toHaveBeenCalled()
    e.destroy()
  })

  it('hands complete() every recorded response', async () => {
    const onComplete = vi.fn()
    const e = createSurveysEngine({ surveys: [cfg('a')], storage: null, onComplete })
    await e.boot()
    e.answer('a', 'q1', 7)
    e.complete('a')
    expect(onComplete.mock.calls[0]?.[1].get('q1')).toBe(7)
    e.destroy()
  })
})

describe('nextQuestion owns the ORDER, the caller owns the question', () => {
  const mk = (validateStep: Parameters<typeof createSurveysEngine>[0]['validateStep']) =>
    createSurveysEngine({ surveys: [cfg('a')], storage: null, validateStep })

  it('records the error and does NOT advance when validation fails', async () => {
    const e = mk(() => ({ questionId: 'q1', error: 'required' }))
    await e.boot()
    expect(e.nextQuestion('a')).toBe('required')
    expect(e.getState().surveys.get('a')?.currentStep).toBe(0)
    expect(e.getState().surveys.get('a')?.validationErrors.get('q1')).toBe('required')
    e.destroy()
  })

  it('clears the error and advances when it passes', async () => {
    let fail = true
    const e = mk(() => ({ questionId: 'q1', error: fail ? 'required' : null }))
    await e.boot()
    e.nextQuestion('a')
    fail = false
    expect(e.nextQuestion('a')).toBeNull()
    expect(e.getState().surveys.get('a')?.currentStep).toBe(1)
    expect(e.getState().surveys.get('a')?.validationErrors.size).toBe(0)
    e.destroy()
  })

  it('advances freely with no validator wired at all', async () => {
    const e = createSurveysEngine({ surveys: [cfg('a')], storage: null })
    await e.boot()
    expect(e.nextQuestion('a')).toBeNull()
    expect(e.getState().surveys.get('a')?.currentStep).toBe(1)
    e.destroy()
  })
})

describe('destroy is terminal', () => {
  it('freezes state — a verb after destroy() changes nothing', async () => {
    const e = createSurveysEngine({ surveys: [cfg('a'), cfg('b')], storage: null })
    await e.boot()
    e.show('a')
    const last = e.getState()
    e.destroy()
    e.show('b')
    e.dismiss('a')
    e.resetAll()
    expect(e.getState()).toBe(last)
  })

  it('stops notifying, and a second destroy() is a no-op', async () => {
    const e = createSurveysEngine({ surveys: [cfg('a')], storage: null })
    await e.boot()
    const listener = vi.fn()
    e.subscribe(listener)
    e.destroy()
    e.destroy()
    e.show('a')
    expect(listener).not.toHaveBeenCalled()
  })

  it('a throwing subscriber does not abort the fan-out', async () => {
    const e = createSurveysEngine({ surveys: [cfg('a')], storage: null })
    await e.boot()
    const after = vi.fn()
    e.subscribe(() => {
      throw new Error('boom')
    })
    e.subscribe(after)
    expect(() => e.show('a')).not.toThrow()
    expect(after).toHaveBeenCalled()
    e.destroy()
  })
})

describe('persistence writes through the INJECTED adapter', () => {
  it('never resolves its own — six existing suites depend on that (§0 C5)', async () => {
    const storage = createFakeStorage()
    const e = createSurveysEngine({ surveys: [cfg('a')], storage })
    await e.boot()
    e.show('a')
    const blob = storage.snapshot()['tour-kit:surveys:state']
    expect(blob, 'the engine wrote somewhere other than the injected adapter').toBeDefined()
    expect(JSON.parse(blob).surveys[0][1].viewCount).toBe(1)
    e.destroy()
  })

  it('a null storage is a supported configuration, not a crash', async () => {
    const e = createSurveysEngine({ surveys: [cfg('a')], storage: null })
    await e.boot()
    expect(() => {
      e.show('a')
      e.complete('a')
      e.resetAll()
    }).not.toThrow()
    e.destroy()
  })
})
