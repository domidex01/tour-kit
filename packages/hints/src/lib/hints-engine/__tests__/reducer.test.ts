/**
 * v3 Phase 1 — the ten reducer handlers, tested directly.
 *
 * Every case here is a scenario the 295 React tests already drive through
 * `<HintsProvider>`; re-expressing them against the pure function means a
 * divergence reds TWICE (here and there) rather than swapping behaviour
 * silently. The reducer moved verbatim out of `hints-provider.tsx:46-236`, so
 * a red in this file at move time means the move was not verbatim.
 */
import { describe, expect, it } from 'vitest'
import { emptyFrequencyState, hintsReducer } from '../reducer'
import type { HintsEngineState } from '../types'

function empty(): HintsEngineState {
  return { hints: new Map(), activeHint: null, frequencyState: new Map() }
}

function withHints(...ids: string[]): HintsEngineState {
  let state = empty()
  for (const id of ids) state = hintsReducer(state, { type: 'REGISTER', id })
  return state
}

describe('hintsReducer — one case per action', () => {
  it('REGISTER creates a closed, undismissed slot and is idempotent', () => {
    const once = hintsReducer(empty(), { type: 'REGISTER', id: 'a' })
    expect(once.hints.get('a')).toEqual({ id: 'a', isOpen: false, isDismissed: false })

    const twice = hintsReducer(once, { type: 'REGISTER', id: 'a' })
    expect(twice.hints.get('a')).toEqual({ id: 'a', isOpen: false, isDismissed: false })
    expect(twice.hints.size).toBe(1)
  })

  it('UNREGISTER drops the slot and clears activeHint when it was the active one', () => {
    const shown = hintsReducer(withHints('a', 'b'), { type: 'SHOW', id: 'a' })
    expect(shown.activeHint).toBe('a')

    const gone = hintsReducer(shown, { type: 'UNREGISTER', id: 'a' })
    expect(gone.hints.has('a')).toBe(false)
    expect(gone.activeHint).toBeNull()

    // …and leaves a different active hint alone.
    const other = hintsReducer(shown, { type: 'UNREGISTER', id: 'b' })
    expect(other.activeHint).toBe('a')
  })

  it('SHOW opens the hint, makes it active and closes the previous active one', () => {
    const a = hintsReducer(withHints('a', 'b'), { type: 'SHOW', id: 'a' })
    const b = hintsReducer(a, { type: 'SHOW', id: 'b' })

    expect(b.activeHint).toBe('b')
    expect(b.hints.get('b')?.isOpen).toBe(true)
    expect(b.hints.get('a')?.isOpen, 'the previous active hint stayed open').toBe(false)
  })

  it('SHOW on an unregistered or dismissed hint is a no-op', () => {
    const state = withHints('a')
    expect(hintsReducer(state, { type: 'SHOW', id: 'nope' })).toBe(state)

    const dismissed = hintsReducer(state, { type: 'DISMISS', id: 'a' })
    expect(hintsReducer(dismissed, { type: 'SHOW', id: 'a' })).toBe(dismissed)
  })

  it('HIDE closes the hint and clears activeHint when it was active', () => {
    const shown = hintsReducer(withHints('a'), { type: 'SHOW', id: 'a' })
    const hidden = hintsReducer(shown, { type: 'HIDE', id: 'a' })

    expect(hidden.hints.get('a')?.isOpen).toBe(false)
    expect(hidden.activeHint).toBeNull()
    // Already closed and not active: nothing to do.
    expect(hintsReducer(hidden, { type: 'HIDE', id: 'a' })).toBe(hidden)
  })

  it('DISMISS closes, marks dismissed and clears activeHint', () => {
    const shown = hintsReducer(withHints('a'), { type: 'SHOW', id: 'a' })
    const dismissed = hintsReducer(shown, { type: 'DISMISS', id: 'a' })

    expect(dismissed.hints.get('a')).toEqual({ id: 'a', isOpen: false, isDismissed: true })
    expect(dismissed.activeHint).toBeNull()
  })

  it('RESET un-dismisses the hint and drops its frequency entry', () => {
    const viewed = hintsReducer(withHints('a'), { type: 'RECORD_VIEW', id: 'a' })
    const dismissed = hintsReducer(viewed, { type: 'DISMISS', id: 'a' })
    expect(dismissed.frequencyState.has('a')).toBe(true)

    const reset = hintsReducer(dismissed, { type: 'RESET', id: 'a' })
    expect(reset.hints.get('a')?.isDismissed).toBe(false)
    expect(reset.frequencyState.has('a'), 'RESET kept the frequency entry').toBe(false)
  })

  it('RESET_ALL un-dismisses every hint and empties the frequency slice', () => {
    let state = withHints('a', 'b')
    state = hintsReducer(state, { type: 'DISMISS', id: 'a' })
    state = hintsReducer(state, { type: 'DISMISS', id: 'b' })

    const reset = hintsReducer(state, { type: 'RESET_ALL' })
    expect([...reset.hints.values()].every((h) => !h.isDismissed)).toBe(true)
    expect(reset.frequencyState.size).toBe(0)
  })

  it('RECORD_VIEW increments viewCount, stamps lastViewedAt and keeps isDismissed', () => {
    const first = hintsReducer(withHints('a'), { type: 'RECORD_VIEW', id: 'a' })
    expect(first.frequencyState.get('a')?.viewCount).toBe(1)
    expect(first.frequencyState.get('a')?.lastViewedAt).toBeInstanceOf(Date)

    const dismissed = hintsReducer(first, { type: 'DISMISS', id: 'a' })
    const second = hintsReducer(dismissed, { type: 'RECORD_VIEW', id: 'a' })
    expect(second.frequencyState.get('a')?.viewCount).toBe(2)
    expect(second.frequencyState.get('a')?.isDismissed, 'RECORD_VIEW cleared the flag').toBe(true)
  })

  it('CLEAR_DISMISSAL clears the flag on BOTH slices and keeps viewCount', () => {
    let state = hintsReducer(withHints('a'), { type: 'RECORD_VIEW', id: 'a' })
    state = hintsReducer(state, { type: 'RECORD_VIEW', id: 'a' })
    state = hintsReducer(state, { type: 'DISMISS', id: 'a' })

    const cleared = hintsReducer(state, { type: 'CLEAR_DISMISSAL', id: 'a' })
    expect(cleared.hints.get('a')?.isDismissed).toBe(false)
    expect(cleared.frequencyState.get('a')?.isDismissed).toBe(false)
    expect(cleared.frequencyState.get('a')?.viewCount, 'CLEAR_DISMISSAL reset the count').toBe(2)
  })

  it('HYDRATE_FREQUENCY writes every entry into the frequency slice', () => {
    const hydrated = hintsReducer(withHints('a'), {
      type: 'HYDRATE_FREQUENCY',
      entries: [['a', { viewCount: 4, isDismissed: false, lastViewedAt: null }]],
    })
    expect(hydrated.frequencyState.get('a')?.viewCount).toBe(4)
  })
})

describe('hintsReducer — the identities the binding depends on', () => {
  it('SHOW on an already-open active hint returns the SAME object', () => {
    // This is what makes `dispatch`'s `next === state` early return real, and
    // therefore what stops a no-op verb notifying every subscriber.
    const shown = hintsReducer(withHints('a'), { type: 'SHOW', id: 'a' })
    expect(hintsReducer(shown, { type: 'SHOW', id: 'a' })).toBe(shown)
  })

  it('HYDRATE_FREQUENCY mirrors isDismissed only onto already-registered slots', () => {
    // Materialising a slot here would bypass the auto-register tracking and
    // leave an orphan when the config list shrinks.
    const hydrated = hintsReducer(withHints('a'), {
      type: 'HYDRATE_FREQUENCY',
      entries: [
        ['a', { viewCount: 1, isDismissed: true, lastViewedAt: null }],
        ['ghost', { viewCount: 1, isDismissed: true, lastViewedAt: null }],
      ],
    })

    expect(hydrated.hints.get('a')?.isDismissed).toBe(true)
    expect(hydrated.hints.has('ghost'), 'hydration materialised an unregistered slot').toBe(false)
    expect(hydrated.frequencyState.get('ghost')?.isDismissed).toBe(true)
  })

  it('DISMISS mirrors into frequencyState so a reload still sees the dismissal', () => {
    const dismissed = hintsReducer(withHints('a'), { type: 'DISMISS', id: 'a' })
    expect(dismissed.frequencyState.get('a')).toEqual({
      ...emptyFrequencyState(),
      isDismissed: true,
    })
  })
})
