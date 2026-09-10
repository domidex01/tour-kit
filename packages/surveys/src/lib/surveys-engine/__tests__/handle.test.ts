/**
 * v3 Phase 3, Task 3.9 — the handle composes core's generic `createHandle`.
 */
import { describe, expect, it, vi } from 'vitest'
import { createFakeStorage } from '../../../__tests__/helpers/fake-storage'
import { createSurveysHandle } from '../create-surveys-handle'
import type { EngineSurveyConfig } from '../types'

const cfg = (id: string): EngineSurveyConfig => ({ id, type: 'nps', displayMode: 'modal' })

describe('createSurveysHandle', () => {
  it('serves the seeded snapshot BEFORE any verb constructs the engine', () => {
    const storage = createFakeStorage({ 'tour-kit:surveys:state': '{}' })
    const getItem = vi.spyOn(storage, 'getItem')
    const handle = createSurveysHandle({ surveys: [cfg('a')], storage })
    expect([...handle.getState().surveys.keys()]).toEqual(['a'])
    expect(getItem).not.toHaveBeenCalled()
  })

  it('hands the engine the SAME seed object it served, so nobody renders twice', () => {
    const handle = createSurveysHandle({ surveys: [cfg('a')], storage: null })
    const before = handle.getState()
    expect(handle.ensure().getState()).toBe(before)
  })

  it('constructs once — ensure() is idempotent', () => {
    const handle = createSurveysHandle({ surveys: [cfg('a')], storage: null })
    expect(handle.ensure()).toBe(handle.ensure())
  })

  it('fans engine notifications out to handle subscribers', async () => {
    const handle = createSurveysHandle({ surveys: [cfg('a')], storage: null })
    const listener = vi.fn()
    handle.subscribe(listener)
    const engine = handle.ensure()
    await engine.boot()
    listener.mockClear()
    engine.show('a')
    expect(listener).toHaveBeenCalled()
    expect(handle.getState().activeSurvey).toBe('a')
  })

  it('release() defers, so a verb in the same tick takes the engine back', async () => {
    const handle = createSurveysHandle({ surveys: [cfg('a')], storage: null })
    const engine = handle.ensure()
    handle.release()
    expect(handle.ensure()).toBe(engine)

    handle.release()
    await Promise.resolve()
    await Promise.resolve()
    expect(handle.ensure(), 'a released engine must not be reused').not.toBe(engine)
  })

  it('an empty survey list serves the shared frozen constant', () => {
    const a = createSurveysHandle({ storage: null })
    const b = createSurveysHandle({ storage: null })
    expect(a.getState()).toBe(b.getState())
  })
})
