/**
 * v2 §1.3a — direct coverage for the reducer moved out of `tour-provider.tsx`.
 *
 * Until this slice the reducer was only exercised through provider integration
 * tests, so its two load-bearing branches — `UPDATE_TOURS`'s shallow-identity
 * fast path and `HYDRATE_TERMINAL_TOURS`'s union merge — had no test that
 * would fail if they were dropped in the move. Every switch arm is asserted
 * here directly.
 */
import { describe, expect, it } from 'vitest'
import type { Tour } from '../../../types/tour'
import type { TourAction, TourReducerState } from '../../../types/tour-reducer'
import { MAX_HIDDEN_CHAIN, findAutoStartTour, tourReducer } from '../reducer'
import { makeTour, visibleStep } from './_helpers/make-tour'

const TOUR_A = makeTour('a', [visibleStep('a1'), visibleStep('a2'), visibleStep('a3')])
const TOUR_B = makeTour('b', [visibleStep('b1')])

function baseState(overrides: Partial<TourReducerState> = {}): TourReducerState {
  return {
    tourId: null,
    isActive: false,
    currentStepIndex: 0,
    currentStep: null,
    totalSteps: 0,
    isLoading: false,
    isTransitioning: false,
    completedTours: [],
    skippedTours: [],
    visitedSteps: [],
    stepVisitCount: new Map<string, number>(),
    previousStepId: null,
    tours: new Map<string, Tour>([
      [TOUR_A.id, TOUR_A],
      [TOUR_B.id, TOUR_B],
    ]),
    ...overrides,
  }
}

/** State as it looks mid-tour on `a`, step 1. */
function activeState(overrides: Partial<TourReducerState> = {}): TourReducerState {
  return baseState({
    tourId: 'a',
    isActive: true,
    currentStepIndex: 1,
    currentStep: TOUR_A.steps[1] ?? null,
    totalSteps: 3,
    visitedSteps: ['a1', 'a2'],
    stepVisitCount: new Map([
      ['a1', 1],
      ['a2', 1],
    ]),
    previousStepId: 'a1',
    ...overrides,
  })
}

describe('START_TOUR', () => {
  it('activates the tour and seeds visit tracking from the entry step', () => {
    const next = tourReducer(baseState(), { type: 'START_TOUR', tourId: 'a' })

    expect(next.tourId).toBe('a')
    expect(next.isActive).toBe(true)
    expect(next.currentStepIndex).toBe(0)
    expect(next.currentStep).toBe(TOUR_A.steps[0])
    expect(next.totalSteps).toBe(3)
    // Visit tracking must be seeded here — nothing else dispatches
    // TRACK_STEP_VISIT for the first step, so a miss here loses it entirely.
    expect(next.visitedSteps).toEqual(['a1'])
    expect(next.stepVisitCount.get('a1')).toBe(1)
    expect(next.previousStepId).toBeNull()
  })

  it('honours an explicit stepIndex over the tour startAt', () => {
    const tours = new Map<string, Tour>([['a', makeTour('a', TOUR_A.steps, { startAt: 2 })]])
    const next = tourReducer(baseState({ tours }), {
      type: 'START_TOUR',
      tourId: 'a',
      stepIndex: 1,
    })

    expect(next.currentStepIndex).toBe(1)
    expect(next.visitedSteps).toEqual(['a2'])
  })

  it('falls back to the tour startAt when no stepIndex is given', () => {
    const tours = new Map<string, Tour>([['a', makeTour('a', TOUR_A.steps, { startAt: 2 })]])
    const next = tourReducer(baseState({ tours }), { type: 'START_TOUR', tourId: 'a' })

    expect(next.currentStepIndex).toBe(2)
  })

  it('returns the same reference for an unregistered tour id', () => {
    const state = baseState()
    expect(tourReducer(state, { type: 'START_TOUR', tourId: 'ghost' })).toBe(state)
  })

  it('clears a previous tour visit history rather than appending to it', () => {
    const next = tourReducer(activeState(), { type: 'START_TOUR', tourId: 'b' })

    expect(next.visitedSteps).toEqual(['b1'])
    expect(next.stepVisitCount.get('a1')).toBeUndefined()
    expect(next.previousStepId).toBeNull()
  })
})

describe('NEXT_STEP / PREV_STEP / GO_TO_STEP', () => {
  it('NEXT_STEP advances one index and clears isTransitioning', () => {
    const next = tourReducer(activeState({ isTransitioning: true }), { type: 'NEXT_STEP' })

    expect(next.currentStepIndex).toBe(2)
    expect(next.currentStep).toBe(TOUR_A.steps[2])
    expect(next.isTransitioning).toBe(false)
  })

  it('PREV_STEP retreats one index', () => {
    const next = tourReducer(activeState(), { type: 'PREV_STEP' })

    expect(next.currentStepIndex).toBe(0)
    expect(next.currentStep).toBe(TOUR_A.steps[0])
  })

  it('GO_TO_STEP jumps to an arbitrary in-range index', () => {
    const next = tourReducer(activeState(), { type: 'GO_TO_STEP', stepIndex: 2 })

    expect(next.currentStepIndex).toBe(2)
  })

  it.each([
    ['past the last step', { type: 'GO_TO_STEP', stepIndex: 3 } as TourAction],
    ['before the first step', { type: 'GO_TO_STEP', stepIndex: -1 } as TourAction],
  ])('returns the same reference for an index %s', (_label, action) => {
    const state = activeState()
    expect(tourReducer(state, action)).toBe(state)
  })

  it('returns the same reference when no tour is active', () => {
    const state = baseState()
    expect(tourReducer(state, { type: 'NEXT_STEP' })).toBe(state)
  })

  it('does not touch visit tracking — TRACK_STEP_VISIT owns that', () => {
    const before = activeState()
    const next = tourReducer(before, { type: 'NEXT_STEP' })

    expect(next.visitedSteps).toBe(before.visitedSteps)
    expect(next.stepVisitCount).toBe(before.stepVisitCount)
  })
})

describe('SKIP_TOUR / COMPLETE_TOUR / STOP_TOUR', () => {
  it.each(['SKIP_TOUR', 'COMPLETE_TOUR', 'STOP_TOUR'] as const)(
    '%s produces the stopped shape',
    (type) => {
      const next = tourReducer(activeState({ isLoading: true, isTransitioning: true }), { type })

      expect(next.tourId).toBeNull()
      expect(next.isActive).toBe(false)
      expect(next.currentStepIndex).toBe(0)
      expect(next.currentStep).toBeNull()
      expect(next.totalSteps).toBe(0)
      expect(next.isLoading).toBe(false)
      expect(next.isTransitioning).toBe(false)
      expect(next.visitedSteps).toEqual([])
      expect(next.stepVisitCount.size).toBe(0)
      expect(next.previousStepId).toBeNull()
    }
  )

  it.each(['SKIP_TOUR', 'COMPLETE_TOUR', 'STOP_TOUR'] as const)(
    '%s keeps completedTours / skippedTours / tours intact',
    (type) => {
      // The terminal bookkeeping is a separate dispatch (ADD_COMPLETED /
      // ADD_SKIPPED) that runs *before* this one — wiping it here would lose
      // the record the very moment it was written.
      const before = activeState({ completedTours: ['x'], skippedTours: ['y'] })
      const next = tourReducer(before, { type })

      expect(next.completedTours).toEqual(['x'])
      expect(next.skippedTours).toEqual(['y'])
      expect(next.tours).toBe(before.tours)
    }
  )
})

describe('SET_LOADING / SET_TRANSITIONING', () => {
  it('SET_LOADING sets only isLoading', () => {
    expect(tourReducer(baseState(), { type: 'SET_LOADING', isLoading: true }).isLoading).toBe(true)
  })

  it('SET_TRANSITIONING sets only isTransitioning', () => {
    const next = tourReducer(activeState(), { type: 'SET_TRANSITIONING', isTransitioning: true })
    expect(next.isTransitioning).toBe(true)
    expect(next.currentStepIndex).toBe(1)
  })
})

describe('ADD_COMPLETED / ADD_SKIPPED', () => {
  it('ADD_COMPLETED appends an unseen id', () => {
    expect(tourReducer(baseState(), { type: 'ADD_COMPLETED', tourId: 'a' }).completedTours).toEqual(
      ['a']
    )
  })

  it('ADD_COMPLETED returns the same reference for an id already present', () => {
    // Load-bearing for §1.3f: a no-op dispatch must not produce a new snapshot
    // and must not notify subscribers.
    const state = baseState({ completedTours: ['a'] })
    expect(tourReducer(state, { type: 'ADD_COMPLETED', tourId: 'a' })).toBe(state)
  })

  it('ADD_SKIPPED appends an unseen id', () => {
    expect(tourReducer(baseState(), { type: 'ADD_SKIPPED', tourId: 'a' }).skippedTours).toEqual([
      'a',
    ])
  })

  it('ADD_SKIPPED returns the same reference for an id already present', () => {
    const state = baseState({ skippedTours: ['a'] })
    expect(tourReducer(state, { type: 'ADD_SKIPPED', tourId: 'a' })).toBe(state)
  })
})

describe('HYDRATE_TERMINAL_TOURS', () => {
  it('union-merges without dropping an ADD_COMPLETED that landed before hydration', () => {
    // The whole reason this arm merges instead of replacing: a tour completed
    // in the first commit, before the post-mount storage read resolved, would
    // otherwise be erased by the hydrate payload that predates it.
    const afterAdd = baseState({ completedTours: ['live'], skippedTours: ['live-skip'] })
    const next = tourReducer(afterAdd, {
      type: 'HYDRATE_TERMINAL_TOURS',
      completedTours: ['stored'],
      skippedTours: ['stored-skip'],
    })

    expect(next.completedTours).toEqual(['stored', 'live'])
    expect(next.skippedTours).toEqual(['stored-skip', 'live-skip'])
  })

  it('de-duplicates ids present on both sides', () => {
    const next = tourReducer(baseState({ completedTours: ['a'] }), {
      type: 'HYDRATE_TERMINAL_TOURS',
      completedTours: ['a', 'b'],
      skippedTours: [],
    })

    expect(next.completedTours).toEqual(['a', 'b'])
  })
})

describe('RESET', () => {
  it('with a tourId filters that id out of both lists and leaves the rest', () => {
    const next = tourReducer(baseState({ completedTours: ['a', 'b'], skippedTours: ['a'] }), {
      type: 'RESET',
      tourId: 'a',
    })

    expect(next.completedTours).toEqual(['b'])
    expect(next.skippedTours).toEqual([])
  })

  it('without a tourId clears both lists', () => {
    const next = tourReducer(baseState({ completedTours: ['a', 'b'], skippedTours: ['c'] }), {
      type: 'RESET',
    })

    expect(next.completedTours).toEqual([])
    expect(next.skippedTours).toEqual([])
  })

  it('does not stop an active tour', () => {
    expect(tourReducer(activeState(), { type: 'RESET' }).isActive).toBe(true)
  })
})

describe('UPDATE_TOURS', () => {
  it('returns the same reference when every tour is identity-equal', () => {
    // Consumers write `tours={[a, b]}` inline: the array identity churns every
    // render while the tour objects do not. Re-keying the Map on every render
    // would invalidate currentTour and stepIdMap downstream for nothing.
    const state = baseState()
    expect(tourReducer(state, { type: 'UPDATE_TOURS', tours: [TOUR_A, TOUR_B] })).toBe(state)
  })

  it('re-keys the Map when a tour object identity changes', () => {
    const replacement = makeTour('a', TOUR_A.steps)
    const next = tourReducer(baseState(), {
      type: 'UPDATE_TOURS',
      tours: [replacement, TOUR_B],
    })

    expect(next.tours.get('a')).toBe(replacement)
  })

  it('re-keys the Map when the tour count changes', () => {
    const next = tourReducer(baseState(), { type: 'UPDATE_TOURS', tours: [TOUR_A] })

    expect(next.tours.size).toBe(1)
    expect(next.tours.has('b')).toBe(false)
  })

  it('refreshes currentStep and totalSteps from the new tour object while active', () => {
    // A consumer editing `onAction` on a step mid-tour must see the new step
    // object, not the one captured at START_TOUR.
    const edited = makeTour('a', [visibleStep('a1'), visibleStep('a2-edited'), visibleStep('a3')])
    const next = tourReducer(activeState(), { type: 'UPDATE_TOURS', tours: [edited, TOUR_B] })

    expect(next.currentStep).toBe(edited.steps[1])
    expect(next.totalSteps).toBe(3)
  })

  it('leaves currentStep alone when the active tour disappears from the new list', () => {
    const before = activeState()
    const next = tourReducer(before, { type: 'UPDATE_TOURS', tours: [TOUR_B] })

    expect(next.tours.has('a')).toBe(false)
    expect(next.currentStep).toBe(before.currentStep)
  })

  it('does not refresh currentStep when no tour is active', () => {
    const edited = makeTour('a', [visibleStep('a1-edited')])
    const next = tourReducer(baseState(), { type: 'UPDATE_TOURS', tours: [edited] })

    expect(next.currentStep).toBeNull()
  })
})

describe('TRACK_STEP_VISIT / CLEAR_VISIT_TRACKING', () => {
  it('appends an unseen step and records the previous step id', () => {
    const next = tourReducer(activeState(), {
      type: 'TRACK_STEP_VISIT',
      stepId: 'a3',
      previousStepId: 'a2',
    })

    expect(next.visitedSteps).toEqual(['a1', 'a2', 'a3'])
    expect(next.stepVisitCount.get('a3')).toBe(1)
    expect(next.previousStepId).toBe('a2')
  })

  it('increments the count without duplicating a revisited step', () => {
    const next = tourReducer(activeState(), {
      type: 'TRACK_STEP_VISIT',
      stepId: 'a1',
      previousStepId: 'a2',
    })

    expect(next.visitedSteps).toEqual(['a1', 'a2'])
    expect(next.stepVisitCount.get('a1')).toBe(2)
  })

  it('copies the count Map rather than mutating the previous state', () => {
    const before = activeState()
    tourReducer(before, { type: 'TRACK_STEP_VISIT', stepId: 'a1', previousStepId: null })

    expect(before.stepVisitCount.get('a1')).toBe(1)
  })

  it('CLEAR_VISIT_TRACKING empties both structures and the previous id', () => {
    const next = tourReducer(activeState(), { type: 'CLEAR_VISIT_TRACKING' })

    expect(next.visitedSteps).toEqual([])
    expect(next.stepVisitCount.size).toBe(0)
    expect(next.previousStepId).toBeNull()
  })
})

describe('unknown action', () => {
  it('returns the same reference', () => {
    const state = baseState()
    expect(tourReducer(state, { type: 'NOT_A_REAL_ACTION' } as unknown as TourAction)).toBe(state)
  })
})

describe('findAutoStartTour', () => {
  it('returns the first tour declaring autoStart', () => {
    const auto = makeTour('auto', [visibleStep('s')], { autoStart: true })
    expect(findAutoStartTour([TOUR_A, auto], [])).toBe(auto)
  })

  it('returns undefined when no tour declares autoStart', () => {
    expect(findAutoStartTour([TOUR_A, TOUR_B], [])).toBeUndefined()
  })

  it('returns undefined when the autoStart tour is already completed', () => {
    const auto = makeTour('auto', [visibleStep('s')], { autoStart: true })
    expect(findAutoStartTour([auto], ['auto'])).toBeUndefined()
  })

  it('does not fall through to a later autoStart tour when the first is completed', () => {
    // `tours.find` picks one candidate and the completed check rejects it —
    // it never looks further. Pinning current behaviour, not endorsing it.
    const first = makeTour('first', [visibleStep('s')], { autoStart: true })
    const second = makeTour('second', [visibleStep('s')], { autoStart: true })
    expect(findAutoStartTour([first, second], ['first'])).toBeUndefined()
  })
})

describe('MAX_HIDDEN_CHAIN', () => {
  it('is the loop-guard bound the engine impls read', () => {
    expect(MAX_HIDDEN_CHAIN).toBe(50)
  })
})
