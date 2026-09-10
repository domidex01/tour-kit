/**
 * v3 Phase 3, Task 3.4 — the handle composes core's generic `createHandle`.
 */
import { describe, expect, it, vi } from 'vitest'
import { createFakeStorage } from '../../../__tests__/helpers/fake-storage'
import { createAnnouncementsHandle } from '../create-announcements-handle'
import type { EngineAnnouncementConfig } from '../types'

const cfg = (id: string): EngineAnnouncementConfig => ({ id, variant: 'modal', autoShow: false })

describe('createAnnouncementsHandle', () => {
  it('serves the seeded snapshot BEFORE any verb constructs the engine', () => {
    const storage = createFakeStorage({ 'tour-kit:announcements:a': '{"viewCount":9}' })
    const getItem = vi.spyOn(storage, 'getItem')

    const handle = createAnnouncementsHandle({ announcements: [cfg('a')], storage })
    // Nothing has been constructed: the configs are visible, storage is untouched.
    expect([...handle.getState().configs.keys()]).toEqual(['a'])
    expect(getItem).not.toHaveBeenCalled()
  })

  it('hands the engine the SAME seed object it served, so nobody renders twice', () => {
    // Phase 2's finding: two equal-but-distinct seeds make `Object.is` false, so
    // `useSyncExternalStore` re-renders the instant the engine is constructed.
    const handle = createAnnouncementsHandle({ announcements: [cfg('a')], storage: null })
    const before = handle.getState()
    const engine = handle.ensure()
    expect(engine.getState()).toBe(before)
  })

  it('constructs once — ensure() is idempotent', () => {
    const handle = createAnnouncementsHandle({ announcements: [cfg('a')], storage: null })
    expect(handle.ensure()).toBe(handle.ensure())
  })

  it('fans engine notifications out to handle subscribers', () => {
    const handle = createAnnouncementsHandle({ announcements: [cfg('a')], storage: null })
    const listener = vi.fn()
    handle.subscribe(listener)
    const engine = handle.ensure()
    listener.mockClear()
    engine.boot()
    engine.show('a')
    expect(listener).toHaveBeenCalled()
    expect(handle.getState().activeAnnouncement).toBe('a')
  })

  it('release() defers, so a verb in the same tick takes the engine back', async () => {
    const handle = createAnnouncementsHandle({ announcements: [cfg('a')], storage: null })
    const engine = handle.ensure()
    handle.release()
    expect(handle.ensure()).toBe(engine) // taken back before the microtask ran

    handle.release()
    await Promise.resolve()
    await Promise.resolve()
    expect(handle.ensure(), 'a released engine must not be reused').not.toBe(engine)
  })
})
