/**
 * v3 Phase 3 — `advanceQueue` is ONE transition (plan Decision 5, US-2).
 *
 * The provider advances across a `setTimeout` boundary in two dispatches
 * (`announcements-provider.tsx:650-662` and `:697-709` before this phase):
 * `scheduler.getNext()` MUTATES the scheduler, a separate `UPDATE_QUEUE`
 * re-syncs React, and only then does the show land. That is the over-count-by-1
 * the 2026 queue-desync fix chased.
 *
 * A CORRECTION to the test plan's §7 draft, found by running it. Its
 * assertions read `getState()` once AFTER the advance has fully settled:
 *
 *     e.dismiss('first'); vi.runAllTimers()
 *     expect(e.getState().queue).toEqual([])
 *
 * A two-step implementation reaches the SAME final state, so that case passes
 * against the very draft it was written to kill — it is vacuous. What actually
 * distinguishes one transition from two is the sequence of snapshots a
 * SUBSCRIBER sees, because that is what a binding renders:
 *
 *   - two-step: an intermediate snapshot exists where the promoted id has left
 *     `queue` but is not yet `activeAnnouncement` — a frame in which the item
 *     is nowhere, which is precisely the mis-count consumers reported
 *   - one-step: no such snapshot can exist, and the advance costs one notify
 *
 * RED-FIRST: these were run against the two-step draft in
 * `create-announcements-engine.ts` and seen red before the atomic version was
 * written. If they go green on a two-step draft again, they have stopped
 * discriminating — fix the test, not the code.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createFakeStorage } from '../../../__tests__/helpers/fake-storage'
import { createAnnouncementsEngine } from '../create-announcements-engine'
import type { AnnouncementsEngineState, EngineAnnouncementConfig } from '../types'

const cfg = (id: string): EngineAnnouncementConfig => ({ id, variant: 'modal', autoShow: true })

const mk = (...ids: string[]) =>
  createAnnouncementsEngine({
    announcements: ids.map(cfg),
    storage: createFakeStorage(),
    now: () => new Date('2026-09-10T10:00:00Z'),
    // maxConcurrent 1 so the second config queues rather than showing
    queueConfig: { maxConcurrent: 1, delayBetween: 10 },
  })

/** Every snapshot a subscriber saw, in order. */
const record = (e: ReturnType<typeof mk>) => {
  const seen: AnnouncementsEngineState<EngineAnnouncementConfig>[] = []
  e.subscribe(() => seen.push(e.getState()))
  return seen
}

describe('advanceQueue is a single transition', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('never lets a subscriber observe the promoted id as neither queued nor active', () => {
    const e = mk('first', 'second')
    e.boot()
    expect(e.getState().queue).toEqual(['second'])

    const seen = record(e)
    e.dismiss('first')
    vi.runAllTimers()

    // The load-bearing assertion. In a two-step advance there is a frame where
    // `getNext()` has dequeued 'second' and the SHOW has not landed, so the id
    // is in neither place and a binding renders "0 queued, nothing active".
    for (const [i, s] of seen.entries()) {
      const queued = s.queue.includes('second')
      const active = s.activeAnnouncement === 'second'
      const dismissedFirst = s.announcements.get('first')?.isDismissed === true
      if (!dismissedFirst) continue // frames before the dismiss landed
      expect(queued || active, `snapshot ${i}: 'second' was neither queued nor active`).toBe(true)
    }

    const s = e.getState()
    expect(s.activeAnnouncement).toBe('second')
    expect(s.queue).toEqual([])
    e.destroy()
  })

  it('the complete path advances in one transition too — it is a second timer site', () => {
    const e = mk('first', 'second')
    e.boot()
    const seen = record(e)
    e.complete('first')
    vi.runAllTimers()

    for (const [i, s] of seen.entries()) {
      if (s.announcements.get('first')?.completedAt == null) continue
      expect(
        s.queue.includes('second') || s.activeAnnouncement === 'second',
        `snapshot ${i}: 'second' vanished between the two dispatches`
      ).toBe(true)
    }
    expect(e.getState()).toMatchObject({ activeAnnouncement: 'second', queue: [] })
    e.destroy()
  })

  it('showNext() advances without a timer and without desync', () => {
    const e = mk('first', 'second')
    e.boot()
    e.hide('first')
    const seen = record(e)
    e.showNext()

    for (const [i, s] of seen.entries()) {
      expect(
        s.queue.includes('second') || s.activeAnnouncement === 'second',
        `snapshot ${i}: 'second' vanished`
      ).toBe(true)
    }
    expect(e.getState()).toMatchObject({ activeAnnouncement: 'second', queue: [] })
    e.destroy()
  })

  it('costs exactly ONE notification, because it is one dispatch', () => {
    const e = mk('first', 'second')
    e.boot()
    e.hide('first')
    let notifies = 0
    e.subscribe(() => {
      notifies++
    })
    e.showNext()
    // Two-step: UPDATE_QUEUE then SHOW — two notifications, two renders.
    expect(notifies).toBe(1)
    e.destroy()
  })

  it('clearQueue() empties the queue and the scheduler together', () => {
    const e = mk('first', 'second')
    e.boot()
    e.clearQueue()
    expect(e.getState().queue).toEqual([])
    // The scheduler must agree, or the next advance resurrects a cleared id.
    e.showNext()
    expect(e.getState().activeAnnouncement).toBe('first')
    e.destroy()
  })

  it('is the ONLY writer of state.queue — the reducer has no bare queue arm', async () => {
    // The structural half of Decision 5. Seven `UPDATE_QUEUE` dispatch sites
    // collapse to one writer; a reviewer can check that by reading, but only a
    // test keeps it true as the file changes.
    // NOTE: the test plan's §7 draft used `new URL('../reducer.ts',
    // import.meta.url)`. Under this vitest/jsdom config `import.meta.url` is
    // not a `file:` URL and `readFileSync` throws "The URL must be of scheme
    // file". Resolve from `process.cwd()` (the package root) instead.
    const { readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const src = readFileSync(join(process.cwd(), 'src/lib/announcements-engine/reducer.ts'), 'utf8')
    expect(src, 'reducer still writes state.queue outside advanceQueue').not.toMatch(
      /case 'UPDATE_QUEUE'/
    )
  })

  it('a no-op dispatch returns the identical state object', () => {
    // useSyncExternalStore compares with Object.is; a fresh object every
    // dispatch is an infinite render loop in the binding.
    const e = mk('first')
    e.boot()
    const before = e.getState()
    e.show('does-not-exist')
    expect(e.getState()).toBe(before)
    e.destroy()
  })
})
