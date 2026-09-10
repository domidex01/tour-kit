/**
 * v3 Phase 3 Task 3.7 — serialize/deserialize, now React-free leaves.
 *
 * The blob crosses a trust boundary: `localStorage` can hold anything a user,
 * an extension or a previous version put there. These cases pin the two
 * properties that matter — the persisted shape is a deliberate allow-list, and
 * nothing malformed can throw its way out.
 */
import { describe, expect, it } from 'vitest'
import { createFakeStorage } from '../../../__tests__/helpers/fake-storage'
import { deserializeState, serializeState } from '../persistence'
import { createInitialSurveyState } from '../reducer'
import type { SurveyState } from '../types'

const state = (over: Partial<SurveyState> = {}): SurveyState => ({
  ...createInitialSurveyState('a'),
  ...over,
})

describe('round trip', () => {
  it('preserves counts, dates, responses and the queue', () => {
    const shown = new Date('2026-09-10T10:00:00.000Z')
    const surveys = new Map([
      ['a', state({ viewCount: 3, lastViewedAt: shown, responses: new Map([['q1', 9]]) })],
    ])
    const raw = serializeState(surveys, ['b'], shown)
    const back = deserializeState(raw)

    expect(back?.surveys.get('a')).toMatchObject({ viewCount: 3 })
    expect(back?.surveys.get('a')?.lastViewedAt?.toISOString()).toBe(shown.toISOString())
    expect(back?.surveys.get('a')?.responses.get('q1')).toBe(9)
    expect(back?.queue).toEqual(['b'])
    expect(back?.lastShownAt?.toISOString()).toBe(shown.toISOString())
  })

  it('never persists validationErrors — they are UI state', () => {
    // The blob is built field-by-field rather than by spread precisely so a new
    // SurveyState field cannot leak into storage. This is that guarantee.
    const surveys = new Map([['a', state({ validationErrors: new Map([['q1', 'required']]) })]])
    const raw = serializeState(surveys, [], null)
    expect(raw).not.toContain('required')
    expect(deserializeState(raw)?.surveys.get('a')?.validationErrors.size).toBe(0)
  })

  it('comes back inactive — a reload never resumes a visible survey', () => {
    const surveys = new Map([['a', state({ isActive: true, isVisible: true })]])
    const back = deserializeState(serializeState(surveys, [], null))
    expect(back?.surveys.get('a')).toMatchObject({ isActive: false, isVisible: false })
  })

  it('survives a Storage round trip, not just an in-memory one', () => {
    const storage = createFakeStorage()
    storage.setItem('k', serializeState(new Map([['a', state({ snoozeCount: 2 })]]), [], null))
    expect(deserializeState(storage.getItem('k'))?.surveys.get('a')?.snoozeCount).toBe(2)
  })
})

describe('a malformed blob degrades to null rather than throwing', () => {
  it.each([
    ['null input', null],
    ['empty string', ''],
    ['not JSON', 'not json{'],
    ['JSON but not the shape', '{"nope":1}'],
    ['surveys is not an array', '{"surveys":5,"queue":[]}'],
  ])('%s', (_label, raw) => {
    expect(() => deserializeState(raw)).not.toThrow()
    expect(deserializeState(raw)).toBeNull()
  })

  it('a blob written before validationErrors existed still loads', () => {
    // Back-compat: old blobs have no such key, and a fresh empty Map is the
    // default — a stale error must never resurface after a reload.
    const raw = JSON.stringify({
      surveys: [['a', { ...createInitialSurveyState('a'), responses: [] }]],
      queue: [],
      lastShownAt: null,
    })
    expect(deserializeState(raw)?.surveys.get('a')?.validationErrors.size).toBe(0)
  })
})
