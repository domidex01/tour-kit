import { describe, expect, it } from 'vitest'
import { createFakeEngineContext } from './_helpers/fake-engine-context'
import { makeTour, visibleStep } from './_helpers/make-tour'

describe('TourEngineContext — refs and getters, not snapshots (US-5)', () => {
  it('getState reflects subsequent setState mutations', () => {
    const handle = createFakeEngineContext({ state: { currentStepIndex: 0 } })

    expect(handle.ctx.getState().currentStepIndex).toBe(0)
    handle.setState({ currentStepIndex: 4 })
    expect(handle.ctx.getState().currentStepIndex).toBe(4)
  })

  it('getCurrentTour returns the latest currentTour after setCurrentTour', () => {
    const handle = createFakeEngineContext({ currentTour: null })
    expect(handle.ctx.getCurrentTour()).toBeNull()

    const next = makeTour('t1', [visibleStep('a')])
    handle.setCurrentTour(next)
    expect(handle.ctx.getCurrentTour()).toBe(next)
  })

  it('getStepIdMap reflects setCurrentTour updates', () => {
    const handle = createFakeEngineContext({ currentTour: null })
    expect(handle.ctx.getStepIdMap().size).toBe(0)

    handle.setCurrentTour(makeTour('t1', [visibleStep('a'), visibleStep('b')]))
    expect(handle.ctx.getStepIdMap().get('a')).toBe(0)
    expect(handle.ctx.getStepIdMap().get('b')).toBe(1)
  })

  it('abortControllerRef.current.abort() flips signal.aborted on the same ref', () => {
    const handle = createFakeEngineContext()
    expect(handle.ctx.abortControllerRef.current?.signal.aborted).toBe(false)
    handle.abortController.abort()
    expect(handle.ctx.abortControllerRef.current?.signal.aborted).toBe(true)
  })
})
