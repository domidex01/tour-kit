/**
 * v3 Phase 3 Task 3.7 — the surveys reducer, now a React-free leaf.
 *
 * `drainQueue` is the interesting half. Unlike announcements it was ALREADY
 * atomic: a pure recursive function called from inside four reducer arms, so
 * the promotion and the queue write happen in one transition by construction.
 * These cases pin that, because a future refactor that pulls it out into a
 * second dispatch would reintroduce exactly the desync Decision 5 fixed next
 * door.
 */
import { describe, expect, it } from 'vitest'
import { createInitialSurveyState, drainQueue, surveysReducer } from '../reducer'
import type { EngineSurveyConfig, SurveysEngineState } from '../types'

const cfg = (id: string): EngineSurveyConfig => ({ id, type: 'nps', displayMode: 'modal' })
const empty = (): SurveysEngineState => ({ surveys: new Map(), activeSurvey: null, queue: [] })

const register = (state: SurveysEngineState, ...ids: string[]) =>
  ids.reduce((s, id) => surveysReducer(s, { type: 'REGISTER', config: cfg(id) }), state)

describe('createInitialSurveyState', () => {
  it('starts every counter at zero and both maps empty', () => {
    const s = createInitialSurveyState('a')
    expect(s).toMatchObject({
      id: 'a',
      isActive: false,
      isCompleted: false,
      viewCount: 0,
      snoozeCount: 0,
      currentStep: 0,
    })
    expect(s.responses.size).toBe(0)
    expect(s.validationErrors.size).toBe(0)
  })
})

describe('surveysReducer', () => {
  it('REGISTER is idempotent — a second one keeps the existing state', () => {
    let s = register(empty(), 'a')
    s = surveysReducer(s, { type: 'SHOW', id: 'a' })
    const again = surveysReducer(s, { type: 'REGISTER', config: cfg('a') })
    expect(again).toBe(s)
    expect(again.surveys.get('a')?.viewCount).toBe(1)
  })

  it('SHOW activates and counts; UNREGISTER removes and clears the active id', () => {
    let s = surveysReducer(register(empty(), 'a'), { type: 'SHOW', id: 'a' })
    expect(s).toMatchObject({ activeSurvey: 'a' })
    expect(s.surveys.get('a')).toMatchObject({ isVisible: true, viewCount: 1 })
    s = surveysReducer(s, { type: 'UNREGISTER', id: 'a' })
    expect(s.surveys.has('a')).toBe(false)
    expect(s.activeSurvey).toBeNull()
  })

  it('ANSWER records a response and NEXT/PREV_QUESTION walk the step', () => {
    let s = register(empty(), 'a')
    s = surveysReducer(s, { type: 'ANSWER', id: 'a', questionId: 'q1', value: 9 })
    expect(s.surveys.get('a')?.responses.get('q1')).toBe(9)
    s = surveysReducer(s, { type: 'NEXT_QUESTION', id: 'a' })
    expect(s.surveys.get('a')?.currentStep).toBe(1)
    s = surveysReducer(s, { type: 'PREV_QUESTION', id: 'a' })
    expect(s.surveys.get('a')?.currentStep).toBe(0)
    // Never below zero.
    s = surveysReducer(s, { type: 'PREV_QUESTION', id: 'a' })
    expect(s.surveys.get('a')?.currentStep).toBe(0)
  })

  it('validation errors set and clear, and are never persisted state', () => {
    let s = register(empty(), 'a')
    s = surveysReducer(s, {
      type: 'SET_VALIDATION_ERROR',
      id: 'a',
      questionId: 'q1',
      error: 'required',
    })
    expect(s.surveys.get('a')?.validationErrors.get('q1')).toBe('required')
    s = surveysReducer(s, { type: 'CLEAR_VALIDATION_ERROR', id: 'a', questionId: 'q1' })
    expect(s.surveys.get('a')?.validationErrors.size).toBe(0)
  })

  it('SNOOZE stamps snoozeUntil and counts', () => {
    const s = surveysReducer(register(empty(), 'a'), {
      type: 'SNOOZE',
      id: 'a',
      delayDays: 3,
      drain: false,
    })
    expect(s.surveys.get('a')).toMatchObject({ isSnoozed: true, snoozeCount: 1 })
    expect(s.surveys.get('a')?.snoozeUntil).toBeInstanceOf(Date)
  })

  it('RESET and RESET_ALL clear the terminal flags', () => {
    let s = register(empty(), 'a', 'b')
    s = surveysReducer(s, { type: 'COMPLETE', id: 'a', drain: false })
    s = surveysReducer(s, { type: 'DISMISS', id: 'b', reason: 'close_button', drain: false })

    const one = surveysReducer(s, { type: 'RESET', id: 'a' })
    expect(one.surveys.get('a')?.isCompleted).toBe(false)
    expect(one.surveys.get('b')?.isDismissed).toBe(true)

    const all = surveysReducer(s, { type: 'RESET_ALL' })
    expect(all.surveys.get('a')?.isCompleted).toBe(false)
    expect(all.surveys.get('b')?.isDismissed).toBe(false)
  })

  it('HYDRATE replaces surveys and queue wholesale', () => {
    const surveys = new Map([['a', { ...createInitialSurveyState('a'), viewCount: 5 }]])
    const s = surveysReducer(empty(), { type: 'HYDRATE', surveys, queue: ['a'] })
    expect(s.surveys.get('a')?.viewCount).toBe(5)
    expect(s.queue).toEqual(['a'])
  })

  it('returns the IDENTICAL object for every no-op arm', () => {
    const s = register(empty(), 'a')
    for (const action of [
      { type: 'SHOW', id: 'missing' },
      { type: 'HIDE', id: 'missing', drain: false },
      { type: 'COMPLETE', id: 'missing', drain: false },
      { type: 'ANSWER', id: 'missing', questionId: 'q', value: 1 },
      { type: 'RESET', id: 'missing' },
    ] as const) {
      expect(surveysReducer(s, action), `${action.type} on a missing id`).toBe(s)
    }
  })
})

describe('drainQueue is atomic by construction (Decision 5)', () => {
  it('promotes the head and shortens the queue in ONE transition', () => {
    let s = register(empty(), 'a', 'b')
    s = { ...s, queue: ['a', 'b'] }
    const next = drainQueue(s)
    expect(next.activeSurvey).toBe('a')
    expect(next.queue).toEqual(['b'])
    expect(next.surveys.get('a')).toMatchObject({ isVisible: true, viewCount: 1 })
  })

  it('skips completed and dismissed entries without a second pass', () => {
    let s = register(empty(), 'done', 'gone', 'live')
    s = surveysReducer(s, { type: 'COMPLETE', id: 'done', drain: false })
    s = surveysReducer(s, { type: 'DISMISS', id: 'gone', reason: 'close_button', drain: false })
    const next = drainQueue({ ...s, queue: ['done', 'gone', 'live'] })
    expect(next.activeSurvey).toBe('live')
    expect(next.queue).toEqual([])
  })

  it('skips ids with no registered state', () => {
    const s = register(empty(), 'live')
    const next = drainQueue({ ...s, queue: ['ghost', 'live'] })
    expect(next.activeSurvey).toBe('live')
  })

  it('clears the active survey when nothing is left to promote', () => {
    let s = register(empty(), 'a')
    s = surveysReducer(s, { type: 'SHOW', id: 'a' })
    const next = drainQueue({ ...s, queue: [] })
    expect(next.activeSurvey).toBeNull()
  })

  it('runs from inside HIDE, DISMISS, SNOOZE and COMPLETE when drain is true', () => {
    // The structural claim: these four arms drain INSIDE the reducer, so the
    // promotion is part of the same transition rather than a follow-up dispatch.
    for (const action of [
      { type: 'HIDE', id: 'a', drain: true },
      { type: 'DISMISS', id: 'a', reason: 'close_button', drain: true },
      { type: 'SNOOZE', id: 'a', drain: true },
      { type: 'COMPLETE', id: 'a', drain: true },
    ] as const) {
      let s = register(empty(), 'a', 'b')
      s = surveysReducer(s, { type: 'SHOW', id: 'a' })
      s = { ...s, queue: ['b'] }
      const next = surveysReducer(s, action)
      expect(next.activeSurvey, action.type).toBe('b')
      expect(next.queue, action.type).toEqual([])
    }
  })
})
