/**
 * v3 Phase 3 — the step-3 engine contract, quoted at
 * `core/src/lib/tour-engine/create-tour-engine.ts:16-27`: an INERT constructor,
 * a reference-stable `getState()`, a synchronous `subscribe()`, and a terminal
 * `destroy()`.
 */
import { describe, expect, it, vi } from 'vitest'
import { createFakeStorage } from '../../../__tests__/helpers/fake-storage'
import {
  createAnnouncementsEngine,
  emptyAnnouncementsState,
  seedAnnouncementsState,
} from '../create-announcements-engine'
import type { EngineAnnouncementConfig } from '../types'

const cfg = (
  id: string,
  over: Partial<EngineAnnouncementConfig> = {}
): EngineAnnouncementConfig => ({
  id,
  variant: 'modal',
  autoShow: false,
  ...over,
})

describe('the constructor is inert', () => {
  it('reads no storage and starts no timer before boot()', () => {
    const storage = createFakeStorage({ 'tour-kit:announcements:a': '{"viewCount":7}' })
    const getItem = vi.spyOn(storage, 'getItem')
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout')

    const e = createAnnouncementsEngine({ announcements: [cfg('a')], storage })
    expect(getItem, 'constructor read storage').not.toHaveBeenCalled()
    expect(setTimeoutSpy, 'constructor started a timer').not.toHaveBeenCalled()

    // …and boot() is what makes it real.
    e.boot()
    expect(getItem).toHaveBeenCalledWith('tour-kit:announcements:a')
    expect(e.getAnnouncementState('a')?.viewCount).toBe(7)

    setTimeoutSpy.mockRestore()
    e.destroy()
  })

  it('seeds configs before boot, so a binding renders them on the FIRST pass', () => {
    // Phase 2 found a handle that constructs on first verb renders an empty
    // snapshot on the server. The seed is what keeps the payload non-empty.
    const e = createAnnouncementsEngine({ announcements: [cfg('a'), cfg('b')], storage: null })
    expect([...e.getState().configs.keys()]).toEqual(['a', 'b'])
    expect(e.getState().announcements.size).toBe(2)
    e.destroy()
  })

  it('the empty snapshot is frozen and identical on every call', () => {
    expect(emptyAnnouncementsState()).toBe(emptyAnnouncementsState())
    expect(Object.isFrozen(emptyAnnouncementsState())).toBe(true)
  })

  it('seedAnnouncementsState is storage-free and boot-free', () => {
    const storage = createFakeStorage({ 'tour-kit:announcements:a': '{"viewCount":7}' })
    const getItem = vi.spyOn(storage, 'getItem')
    const seeded = seedAnnouncementsState([cfg('a')])
    expect(getItem).not.toHaveBeenCalled()
    expect(seeded.configs.get('a')?.id).toBe('a')
    expect(seeded.announcements.get('a')?.viewCount).toBe(0)
  })
})

describe('getState is reference-stable', () => {
  it('returns the identical object across no-op verbs', () => {
    const e = createAnnouncementsEngine({ announcements: [cfg('a')], storage: null })
    e.boot()
    const s = e.getState()
    e.show('nope')
    e.hide('nope')
    e.dismiss('nope')
    e.complete('nope')
    e.reset('nope')
    expect(e.getState()).toBe(s)
    e.destroy()
  })

  it('boot() is idempotent — a second call changes nothing', () => {
    const e = createAnnouncementsEngine({ announcements: [cfg('a')], storage: null })
    e.boot()
    const s = e.getState()
    e.boot()
    expect(e.getState()).toBe(s)
    e.destroy()
  })
})

describe('destroy is terminal', () => {
  it('clears pending advance timers so nothing fires after teardown', () => {
    vi.useFakeTimers()
    const onShow = vi.fn()
    const e = createAnnouncementsEngine({
      announcements: [cfg('first', { autoShow: true }), cfg('second', { autoShow: true })],
      storage: null,
      queueConfig: { maxConcurrent: 1, delayBetween: 50 },
      onShow,
    })
    e.boot()
    onShow.mockClear()
    e.dismiss('first')
    e.destroy() // the advance timer is pending right now
    vi.runAllTimers()
    expect(onShow, 'a timer fired after destroy()').not.toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('stops notifying subscribers, and a second destroy() is a no-op', () => {
    const e = createAnnouncementsEngine({ announcements: [cfg('a')], storage: null })
    e.boot()
    const listener = vi.fn()
    e.subscribe(listener)
    e.destroy()
    e.destroy()
    e.show('a')
    expect(listener).not.toHaveBeenCalled()
  })

  it('freezes state — a verb after destroy() changes nothing', () => {
    // Clearing the listener set is NOT enough: without a guard in `dispatch`,
    // `show()` still mutates and the next `getState()` reports a change nobody
    // was told about. A torn-down engine must keep its last answer.
    const e = createAnnouncementsEngine({
      announcements: [cfg('a'), cfg('b')],
      storage: null,
    })
    e.boot()
    e.show('a')
    const last = e.getState()
    e.destroy()
    e.show('b')
    e.dismiss('a')
    e.resetAll()
    expect(e.getState()).toBe(last)
  })

  it('boot() after destroy() does nothing', () => {
    const e = createAnnouncementsEngine({ announcements: [cfg('a')], storage: null })
    e.destroy()
    e.boot()
    expect(e.getState().announcements.get('a')?.viewCount ?? 0).toBe(0)
  })
})

describe('the injected analytics callback', () => {
  const track = vi.fn()
  const mk = () =>
    createAnnouncementsEngine({
      announcements: [cfg('a', { category: 'feature', priority: 'high' })],
      storage: null,
      analytics: { track },
    })

  it('fires shown / dismissed / completed with the derived metadata', () => {
    track.mockClear()
    const e = mk()
    e.boot()

    e.show('a')
    expect(track).toHaveBeenCalledWith('announcement_shown', {
      tourId: 'a',
      metadata: expect.objectContaining({
        announcementId: 'a',
        variant: 'modal',
        priority: 'high',
        category: 'feature',
        trigger: 'manual',
        viewCount: 1,
      }),
    })

    e.dismiss('a', 'close_button')
    expect(track).toHaveBeenCalledWith('announcement_dismissed', {
      tourId: 'a',
      metadata: expect.objectContaining({ reason: 'close_button' }),
    })
    e.destroy()
  })

  it('forceShow stamps trigger="forced" so dashboards can filter previews out', () => {
    track.mockClear()
    const e = mk()
    e.boot()
    e.dismiss('a')
    track.mockClear()
    e.forceShow('a')
    expect(track).toHaveBeenCalledWith(
      'announcement_shown',
      expect.objectContaining({ metadata: expect.objectContaining({ trigger: 'forced' }) })
    )
    expect(e.getState().announcements.get('a')?.isDismissed).toBe(false)
    e.destroy()
  })

  it('the engine works with no analytics at all', () => {
    const e = createAnnouncementsEngine({ announcements: [cfg('a')], storage: null })
    e.boot()
    expect(() => e.show('a')).not.toThrow()
    e.destroy()
  })
})

describe('persistence round-trips through the injected adapter', () => {
  it('writes view counts and dismissals, and reset() removes the key', () => {
    const storage = createFakeStorage()
    const e = createAnnouncementsEngine({ announcements: [cfg('a')], storage })
    e.boot()
    e.show('a')
    expect(JSON.parse(storage.snapshot()['tour-kit:announcements:a'])).toMatchObject({
      viewCount: 1,
    })

    e.dismiss('a', 'escape_key')
    expect(JSON.parse(storage.snapshot()['tour-kit:announcements:a'])).toMatchObject({
      isDismissed: true,
      dismissalReason: 'escape_key',
    })

    e.reset('a')
    expect(storage.getItem('tour-kit:announcements:a')).toBeNull()
    e.destroy()
  })

  it('a corrupt blob degrades to no restore rather than throwing', () => {
    const storage = createFakeStorage({ 'tour-kit:announcements:a': 'not json{' })
    const e = createAnnouncementsEngine({ announcements: [cfg('a')], storage })
    expect(() => e.boot()).not.toThrow()
    expect(e.getAnnouncementState('a')?.viewCount).toBe(0)
    e.destroy()
  })

  it('a null storage is a supported configuration, not a crash', () => {
    const e = createAnnouncementsEngine({ announcements: [cfg('a')], storage: null })
    e.boot()
    expect(() => {
      e.show('a')
      e.resetAll()
    }).not.toThrow()
    e.destroy()
  })
})

describe('subscribe', () => {
  it('is synchronous, and unsubscribing stops the fan-out', () => {
    const e = createAnnouncementsEngine({ announcements: [cfg('a')], storage: null })
    e.boot()
    const seen: number[] = []
    const off = e.subscribe(() => seen.push(e.getState().announcements.get('a')?.viewCount ?? -1))
    e.show('a')
    expect(seen).toEqual([1]) // already there, no await
    off()
    e.hide('a')
    expect(seen).toEqual([1])
    e.destroy()
  })

  it('a throwing subscriber does not abort the fan-out', () => {
    // core's createListeners is fault-isolated; this pins that we use it.
    const e = createAnnouncementsEngine({ announcements: [cfg('a')], storage: null })
    e.boot()
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
