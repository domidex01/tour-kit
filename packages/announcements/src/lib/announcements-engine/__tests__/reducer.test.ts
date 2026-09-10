/**
 * v3 Phase 3 Task 3.2 — the reducer, now that it is a React-free leaf.
 *
 * One case per action arm plus the identity rule: `useSyncExternalStore`
 * compares with `Object.is`, so an arm that returns a fresh object for a no-op
 * is an infinite render loop in the binding, not a cosmetic waste.
 */
import { describe, expect, it } from 'vitest'
import { announcementsReducer, createInitialState } from '../reducer'
import type { AnnouncementsEngineState, EngineAnnouncementConfig } from '../types'

const cfg = (
  id: string,
  over: Partial<EngineAnnouncementConfig> = {}
): EngineAnnouncementConfig => ({
  id,
  variant: 'modal',
  ...over,
})

const empty = (): AnnouncementsEngineState => ({
  announcements: new Map(),
  configs: new Map(),
  activeAnnouncement: null,
  queue: [],
  eligibleIds: new Set<string>(),
})

const withOne = (id = 'a', over: Partial<EngineAnnouncementConfig> = {}) =>
  announcementsReducer(empty(), { type: 'REGISTER', config: cfg(id, over) })

describe('createInitialState', () => {
  it('starts every counter and timestamp at its zero value', () => {
    expect(createInitialState('a')).toEqual({
      id: 'a',
      isActive: false,
      isVisible: false,
      isDismissed: false,
      viewCount: 0,
      lastViewedAt: null,
      dismissedAt: null,
      dismissalReason: null,
      completedAt: null,
    })
  })
})

describe('announcementsReducer', () => {
  it('REGISTER adds state and config, and re-registering keeps the existing state', () => {
    const once = withOne('a')
    expect(once.announcements.get('a')?.viewCount).toBe(0)
    expect(once.configs.get('a')?.variant).toBe('modal')

    const shown = announcementsReducer(once, { type: 'SHOW', id: 'a' })
    const again = announcementsReducer(shown, {
      type: 'REGISTER',
      config: cfg('a', { priority: 'high' }),
    })
    // The view count survives a re-register; only the config is replaced.
    expect(again.announcements.get('a')?.viewCount).toBe(1)
    expect(again.configs.get('a')?.priority).toBe('high')
  })

  it('UNREGISTER drops state, config, the active id and the queue entry', () => {
    let s = withOne('a')
    s = announcementsReducer(s, { type: 'SHOW', id: 'a' })
    s = announcementsReducer(s, { type: 'ADVANCE_QUEUE', queue: ['a', 'b'] })
    s = announcementsReducer(s, { type: 'UNREGISTER', id: 'a' })
    expect(s.announcements.has('a')).toBe(false)
    expect(s.configs.has('a')).toBe(false)
    expect(s.activeAnnouncement).toBeNull()
    expect(s.queue).toEqual(['b'])
  })

  it('SHOW activates, increments viewCount and stamps lastViewedAt', () => {
    const s = announcementsReducer(withOne('a'), { type: 'SHOW', id: 'a' })
    expect(s.announcements.get('a')).toMatchObject({
      isActive: true,
      isVisible: true,
      viewCount: 1,
    })
    expect(s.announcements.get('a')?.lastViewedAt).toBeInstanceOf(Date)
    expect(s.activeAnnouncement).toBe('a')
  })

  it('SHOW refuses a dismissed announcement; FORCE_SHOW clears the dismissal', () => {
    let s = withOne('a')
    s = announcementsReducer(s, { type: 'DISMISS', id: 'a', reason: 'close_button' })
    const refused = announcementsReducer(s, { type: 'SHOW', id: 'a' })
    expect(refused).toBe(s) // identity: nothing changed

    const forced = announcementsReducer(s, { type: 'FORCE_SHOW', id: 'a' })
    expect(forced.announcements.get('a')).toMatchObject({
      isVisible: true,
      isDismissed: false,
      dismissedAt: null,
      dismissalReason: null,
    })
  })

  it('HIDE clears visibility and the active id but keeps the view count', () => {
    let s = announcementsReducer(withOne('a'), { type: 'SHOW', id: 'a' })
    s = announcementsReducer(s, { type: 'HIDE', id: 'a' })
    expect(s.announcements.get('a')).toMatchObject({
      isActive: false,
      isVisible: false,
      viewCount: 1,
    })
    expect(s.activeAnnouncement).toBeNull()
  })

  it('DISMISS records the reason and removes the id from the queue', () => {
    let s = withOne('a')
    s = announcementsReducer(s, { type: 'ADVANCE_QUEUE', queue: ['a'] })
    s = announcementsReducer(s, { type: 'DISMISS', id: 'a', reason: 'escape_key' })
    expect(s.announcements.get('a')).toMatchObject({
      isDismissed: true,
      dismissalReason: 'escape_key',
    })
    expect(s.announcements.get('a')?.dismissedAt).toBeInstanceOf(Date)
    expect(s.queue).toEqual([])
  })

  it('COMPLETE stamps completedAt without marking dismissed', () => {
    const s = announcementsReducer(withOne('a'), { type: 'COMPLETE', id: 'a' })
    expect(s.announcements.get('a')?.completedAt).toBeInstanceOf(Date)
    expect(s.announcements.get('a')?.isDismissed).toBe(false)
  })

  it('RESET and RESET_ALL clear dismissal and counters', () => {
    let s = withOne('a')
    s = announcementsReducer(s, { type: 'REGISTER', config: cfg('b') })
    s = announcementsReducer(s, { type: 'SHOW', id: 'a' })
    s = announcementsReducer(s, { type: 'DISMISS', id: 'b', reason: 'auto_dismiss' })

    const one = announcementsReducer(s, { type: 'RESET', id: 'a' })
    expect(one.announcements.get('a')).toMatchObject({ viewCount: 0, lastViewedAt: null })
    expect(one.announcements.get('b')?.isDismissed).toBe(true) // untouched

    const all = announcementsReducer(s, { type: 'RESET_ALL' })
    expect(all.announcements.get('b')).toMatchObject({ isDismissed: false, dismissedAt: null })
    expect(all.announcements.get('a')?.viewCount).toBe(0)
  })

  it('SET_ACTIVE writes exactly its own field', () => {
    const s = announcementsReducer(withOne('a'), { type: 'SET_ACTIVE', id: 'a' })
    expect(s.activeAnnouncement).toBe('a')
  })

  describe('ADVANCE_QUEUE — the single writer of state.queue (Decision 5)', () => {
    it('writes the queue alone when no id is being promoted', () => {
      const s = announcementsReducer(withOne('a'), { type: 'ADVANCE_QUEUE', queue: ['x'] })
      expect(s.queue).toEqual(['x'])
      expect(s.activeAnnouncement).toBeNull()
    })

    it('promotes and re-syncs in ONE pass when `show` is set', () => {
      let s = withOne('a')
      s = announcementsReducer(s, { type: 'REGISTER', config: cfg('b') })
      s = announcementsReducer(s, { type: 'ADVANCE_QUEUE', queue: ['a', 'b'] })

      const next = announcementsReducer(s, { type: 'ADVANCE_QUEUE', queue: ['b'], show: 'a' })
      // Both halves land together — there is no snapshot between them.
      expect(next.activeAnnouncement).toBe('a')
      expect(next.queue).toEqual(['b'])
      expect(next.announcements.get('a')).toMatchObject({ isVisible: true, viewCount: 1 })
    })

    it('still re-syncs the queue when the promoted id is dismissed', () => {
      // `getNext()` already dequeued it, so dropping the re-sync IS the desync.
      let s = withOne('a')
      s = announcementsReducer(s, { type: 'DISMISS', id: 'a', reason: 'programmatic' })
      const next = announcementsReducer(s, { type: 'ADVANCE_QUEUE', queue: [], show: 'a' })
      expect(next.activeAnnouncement).toBeNull()
      expect(next.announcements.get('a')?.isVisible).toBe(false)
    })

    it('returns the identical object when the queue is unchanged and nothing promotes', () => {
      const s = announcementsReducer(withOne('a'), { type: 'ADVANCE_QUEUE', queue: [] })
      expect(announcementsReducer(s, { type: 'ADVANCE_QUEUE', queue: [] })).toBe(s)
    })
  })

  it('RESTORE_STATE merges partials onto registered ids and ignores unknown ones', () => {
    const s = announcementsReducer(withOne('a'), {
      type: 'RESTORE_STATE',
      states: new Map([
        ['a', { viewCount: 4, isDismissed: true }],
        ['ghost', { viewCount: 99 }],
      ]),
    })
    expect(s.announcements.get('a')).toMatchObject({ viewCount: 4, isDismissed: true })
    expect(s.announcements.has('ghost')).toBe(false)
  })

  it('returns the IDENTICAL object for every no-op arm', () => {
    const s = withOne('a')
    for (const action of [
      { type: 'SHOW', id: 'missing' },
      { type: 'HIDE', id: 'missing' },
      { type: 'DISMISS', id: 'missing', reason: 'programmatic' },
      { type: 'COMPLETE', id: 'missing' },
      { type: 'RESET', id: 'missing' },
      { type: 'FORCE_SHOW', id: 'missing' },
    ] as const) {
      expect(announcementsReducer(s, action), `${action.type} on a missing id`).toBe(s)
    }
  })
})
