import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTourContext } from '../../context/tour-context'
import { TourProvider } from '../../context/tour-provider'
import type { BranchContext, BranchTarget, Tour, TourStep } from '../../types'

// Helper to create a wrapper with TourProvider
function createWrapper(tours: Tour[]) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <TourProvider tours={tours}>{children}</TourProvider>
  }
}

// Helper to create a basic step
function createStep(id: string, overrides: Partial<TourStep> = {}): TourStep {
  return {
    id,
    target: `#${id}`,
    content: `Content for ${id}`,
    ...overrides,
  }
}

describe('TourProvider branching logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('onNext branching', () => {
    it('navigates to static step ID target', async () => {
      const tours: Tour[] = [
        {
          id: 'test-tour',
          steps: [
            createStep('step-1', { onNext: 'step-3' }),
            createStep('step-2'),
            createStep('step-3'),
          ],
        },
      ]

      const { result } = renderHook(() => useTourContext(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start('test-tour')
      })

      expect(result.current.currentStepIndex).toBe(0)
      expect(result.current.currentStep?.id).toBe('step-1')

      await act(async () => {
        await result.current.next()
      })

      expect(result.current.currentStepIndex).toBe(2)
      expect(result.current.currentStep?.id).toBe('step-3')
    })

    it('navigates to numeric index target', async () => {
      const tours: Tour[] = [
        {
          id: 'test-tour',
          steps: [createStep('step-1', { onNext: 2 }), createStep('step-2'), createStep('step-3')],
        },
      ]

      const { result } = renderHook(() => useTourContext(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start('test-tour')
      })

      await act(async () => {
        await result.current.next()
      })

      expect(result.current.currentStepIndex).toBe(2)
    })

    it('completes tour with "complete" target', async () => {
      const tours: Tour[] = [
        {
          id: 'test-tour',
          steps: [createStep('step-1', { onNext: 'complete' }), createStep('step-2')],
        },
      ]

      const { result } = renderHook(() => useTourContext(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start('test-tour')
      })

      await act(async () => {
        await result.current.next()
      })

      expect(result.current.isActive).toBe(false)
      expect(result.current.completedTours).toContain('test-tour')
    })

    it('skips tour with "skip" target', async () => {
      const tours: Tour[] = [
        {
          id: 'test-tour',
          steps: [createStep('step-1', { onNext: 'skip' }), createStep('step-2')],
        },
      ]

      const { result } = renderHook(() => useTourContext(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start('test-tour')
      })

      await act(async () => {
        await result.current.next()
      })

      expect(result.current.isActive).toBe(false)
      expect(result.current.skippedTours).toContain('test-tour')
    })

    it('restarts tour with "restart" target', async () => {
      const tours: Tour[] = [
        {
          id: 'test-tour',
          steps: [
            createStep('step-1'),
            createStep('step-2', { onNext: 'restart' }),
            createStep('step-3'),
          ],
        },
      ]

      const { result } = renderHook(() => useTourContext(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start('test-tour')
      })

      await act(async () => {
        await result.current.next() // Go to step-2
      })

      expect(result.current.currentStepIndex).toBe(1)

      await act(async () => {
        await result.current.next() // Trigger restart
      })

      expect(result.current.currentStepIndex).toBe(0)
      expect(result.current.currentStep?.id).toBe('step-1')
    })

    it('stays on current step with null target', async () => {
      const tours: Tour[] = [
        {
          id: 'test-tour',
          steps: [createStep('step-1', { onNext: null }), createStep('step-2')],
        },
      ]

      const { result } = renderHook(() => useTourContext(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start('test-tour')
      })

      await act(async () => {
        await result.current.next()
      })

      expect(result.current.currentStepIndex).toBe(0)
      expect(result.current.currentStep?.id).toBe('step-1')
    })

    it('handles async resolver', async () => {
      const asyncResolver = vi.fn().mockResolvedValue('step-3')

      const tours: Tour[] = [
        {
          id: 'test-tour',
          steps: [
            createStep('step-1', { onNext: asyncResolver }),
            createStep('step-2'),
            createStep('step-3'),
          ],
        },
      ]

      const { result } = renderHook(() => useTourContext(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start('test-tour')
      })

      await act(async () => {
        await result.current.next()
      })

      expect(asyncResolver).toHaveBeenCalled()
      expect(result.current.currentStep?.id).toBe('step-3')
    })

    it('resolver receives correct context', async () => {
      let capturedContext: BranchContext | undefined

      const resolver = (ctx: BranchContext): BranchTarget => {
        capturedContext = ctx
        return 'next'
      }

      const tours: Tour[] = [
        {
          id: 'test-tour',
          steps: [createStep('step-1', { onNext: resolver }), createStep('step-2')],
        },
      ]

      const { result } = renderHook(() => useTourContext(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start('test-tour')
      })

      act(() => {
        result.current.setData('testKey', 'testValue')
      })

      await act(async () => {
        await result.current.next()
      })

      expect(capturedContext).toBeDefined()
      expect(capturedContext?.tourId).toBe('test-tour')
      expect(capturedContext?.isActive).toBe(true)
      expect(capturedContext?.data.testKey).toBe('testValue')
      expect(typeof capturedContext?.setData).toBe('function')
    })

    it('resolver can modify data', async () => {
      const resolver = (ctx: BranchContext): BranchTarget => {
        ctx.setData('pathChosen', 'developer')
        return 'step-2'
      }

      const tours: Tour[] = [
        {
          id: 'test-tour',
          steps: [createStep('step-1', { onNext: resolver }), createStep('step-2')],
        },
      ]

      const { result } = renderHook(() => useTourContext(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start('test-tour')
      })

      await act(async () => {
        await result.current.next()
      })

      await waitFor(() => {
        expect(result.current.data.pathChosen).toBe('developer')
      })
    })
  })

  describe('onPrev branching', () => {
    it('navigates to custom step on prev', async () => {
      const tours: Tour[] = [
        {
          id: 'test-tour',
          steps: [
            createStep('step-1'),
            createStep('step-2'),
            createStep('step-3', { onPrev: 'step-1' }),
          ],
        },
      ]

      const { result } = renderHook(() => useTourContext(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start('test-tour', 2)
      })

      await act(async () => {
        await result.current.prev()
      })

      expect(result.current.currentStep?.id).toBe('step-1')
    })

    it('disables back navigation with null target', async () => {
      const tours: Tour[] = [
        {
          id: 'test-tour',
          steps: [createStep('step-1'), createStep('step-2', { onPrev: null })],
        },
      ]

      const { result } = renderHook(() => useTourContext(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start('test-tour', 1)
      })

      await act(async () => {
        await result.current.prev()
      })

      // Should still be on step-2
      expect(result.current.currentStepIndex).toBe(1)
      expect(result.current.currentStep?.id).toBe('step-2')
    })
  })

  describe('onAction branching', () => {
    it('triggers named action', async () => {
      const tours: Tour[] = [
        {
          id: 'test-tour',
          steps: [
            createStep('role-select', {
              onAction: {
                developer: 'dev-intro',
                designer: 'design-intro',
              },
            }),
            createStep('dev-intro'),
            createStep('design-intro'),
          ],
        },
      ]

      const { result } = renderHook(() => useTourContext(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start('test-tour')
      })

      await act(async () => {
        await result.current.triggerBranchAction('developer')
      })

      expect(result.current.currentStep?.id).toBe('dev-intro')
    })

    it('action with payload accessible in resolver', async () => {
      let capturedPayload: unknown = null

      const resolver = (ctx: BranchContext): BranchTarget => {
        capturedPayload = ctx.actionPayload
        return 'step-2'
      }

      const tours: Tour[] = [
        {
          id: 'test-tour',
          steps: [
            createStep('step-1', {
              onAction: { customAction: resolver },
            }),
            createStep('step-2'),
          ],
        },
      ]

      const { result } = renderHook(() => useTourContext(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start('test-tour')
      })

      await act(async () => {
        await result.current.triggerBranchAction('customAction', { extra: 'data' })
      })

      expect(capturedPayload).toEqual({ extra: 'data' })
    })

    it('calls onBranchAction callback', async () => {
      const onBranchAction = vi.fn()

      const tours: Tour[] = [
        {
          id: 'test-tour',
          steps: [
            createStep('step-1', {
              onAction: { testAction: 'step-2' },
            }),
            createStep('step-2'),
          ],
          onBranchAction,
        },
      ]

      const { result } = renderHook(() => useTourContext(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start('test-tour')
      })

      await act(async () => {
        await result.current.triggerBranchAction('testAction')
      })

      expect(onBranchAction).toHaveBeenCalledWith('step-1', 'testAction', 'step-2')
    })
  })

  describe('visit tracking', () => {
    it('tracks visited steps', async () => {
      const tours: Tour[] = [
        {
          id: 'test-tour',
          steps: [createStep('step-1'), createStep('step-2'), createStep('step-3')],
        },
      ]

      const { result } = renderHook(() => useTourContext(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start('test-tour')
      })

      expect(result.current.visitedSteps).toContain('step-1')

      await act(async () => {
        await result.current.next()
      })

      expect(result.current.visitedSteps).toContain('step-1')
      expect(result.current.visitedSteps).toContain('step-2')
    })

    it('tracks visit count per step', async () => {
      const tours: Tour[] = [
        {
          id: 'test-tour',
          steps: [
            createStep('step-1', { onNext: 'step-2' }),
            createStep('step-2', { onNext: 'step-1' }),
          ],
        },
      ]

      const { result } = renderHook(() => useTourContext(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start('test-tour')
      })

      expect(result.current.stepVisitCount.get('step-1')).toBe(1)

      await act(async () => {
        await result.current.next() // Go to step-2
      })

      await act(async () => {
        await result.current.next() // Go back to step-1
      })

      expect(result.current.stepVisitCount.get('step-1')).toBe(2)
    })

    it('clears visit tracking on restart', async () => {
      const tours: Tour[] = [
        {
          id: 'test-tour',
          steps: [createStep('step-1'), createStep('step-2', { onNext: 'restart' })],
        },
      ]

      const { result } = renderHook(() => useTourContext(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start('test-tour')
      })

      await act(async () => {
        await result.current.next() // Go to step-2
      })

      expect(result.current.visitedSteps.length).toBe(2)

      await act(async () => {
        await result.current.next() // Trigger restart
      })

      // Visit tracking should be cleared and only contain step-1
      expect(result.current.visitedSteps).toEqual(['step-1'])
    })
  })

  describe('goToStep action', () => {
    it('navigates to step by ID', async () => {
      const tours: Tour[] = [
        {
          id: 'test-tour',
          steps: [createStep('intro'), createStep('features'), createStep('outro')],
        },
      ]

      const { result } = renderHook(() => useTourContext(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start('test-tour')
      })

      await act(async () => {
        await result.current.goToStep('outro')
      })

      expect(result.current.currentStep?.id).toBe('outro')
    })
  })

  describe('startTour action', () => {
    it('starts a different tour', async () => {
      const tours: Tour[] = [
        {
          id: 'tour-1',
          steps: [createStep('tour1-step1')],
        },
        {
          id: 'tour-2',
          steps: [createStep('tour2-step1'), createStep('tour2-step2')],
        },
      ]

      const { result } = renderHook(() => useTourContext(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start('tour-1')
      })

      expect(result.current.tourId).toBe('tour-1')

      await act(async () => {
        await result.current.startTour('tour-2')
      })

      expect(result.current.tourId).toBe('tour-2')
      expect(result.current.currentStep?.id).toBe('tour2-step1')
    })

    it('starts tour at specific step', async () => {
      const tours: Tour[] = [
        {
          id: 'tour-1',
          steps: [createStep('step1'), createStep('step2'), createStep('step3')],
        },
      ]

      const { result } = renderHook(() => useTourContext(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.startTour('tour-1', 'step3')
      })

      expect(result.current.currentStep?.id).toBe('step3')
    })
  })

  describe('branch + when interaction', () => {
    it('applies when filter after branch resolution', async () => {
      const tours: Tour[] = [
        {
          id: 'test-tour',
          steps: [
            createStep('step-1', { onNext: 'step-2' }),
            createStep('step-2', { when: () => false }), // Should be skipped
            createStep('step-3'),
          ],
        },
      ]

      const { result } = renderHook(() => useTourContext(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start('test-tour')
      })

      await act(async () => {
        await result.current.next()
      })

      // Should skip step-2 and go to step-3
      expect(result.current.currentStep?.id).toBe('step-3')
    })
  })

  // Regression coverage for issue #6: every completion path must fire onComplete
  // (and onSkip) at most once per tour activation, regardless of how it's reached.
  describe('terminal-callback idempotency', () => {
    it('fires onComplete exactly once when reached via "complete" branch target', async () => {
      const onComplete = vi.fn()
      const tours: Tour[] = [
        {
          id: 'test-tour',
          onComplete,
          steps: [createStep('step-1', { onNext: 'complete' }), createStep('step-2')],
        },
      ]

      const { result } = renderHook(() => useTourContext(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start('test-tour')
      })
      await act(async () => {
        await result.current.next()
      })

      expect(onComplete).toHaveBeenCalledTimes(1)
      expect(result.current.isActive).toBe(false)
    })

    it('fires onSkip exactly once when reached via "skip" branch target', async () => {
      const onSkip = vi.fn()
      const tours: Tour[] = [
        {
          id: 'test-tour',
          onSkip,
          steps: [createStep('step-1', { onNext: 'skip' }), createStep('step-2')],
        },
      ]

      const { result } = renderHook(() => useTourContext(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start('test-tour')
      })
      await act(async () => {
        await result.current.next()
      })

      expect(onSkip).toHaveBeenCalledTimes(1)
      expect(result.current.isActive).toBe(false)
    })

    it('fires onComplete exactly once when no visible step remains after a branch jump', async () => {
      const onComplete = vi.fn()
      const tours: Tour[] = [
        {
          id: 'test-tour',
          onComplete,
          steps: [
            // jump forward by id; but step-2 is hidden by `when`, leaving no visible step
            createStep('step-1', { onNext: 'step-2' }),
            createStep('step-2', { when: () => false }),
          ],
        },
      ]

      const { result } = renderHook(() => useTourContext(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start('test-tour')
      })
      await act(async () => {
        await result.current.next()
      })

      expect(onComplete).toHaveBeenCalledTimes(1)
      expect(result.current.isActive).toBe(false)
    })

    it('fires onComplete exactly once when complete() is called twice synchronously', async () => {
      const onComplete = vi.fn()
      const tours: Tour[] = [
        {
          id: 'test-tour',
          onComplete,
          steps: [createStep('step-1'), createStep('step-2')],
        },
      ]

      const { result } = renderHook(() => useTourContext(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start('test-tour')
      })

      // Two synchronous calls inside the same commit phase — would re-fire
      // onComplete without the ref guard because state.isActive is closure-stale.
      await act(async () => {
        result.current.complete()
        result.current.complete()
      })

      expect(onComplete).toHaveBeenCalledTimes(1)
      expect(result.current.isActive).toBe(false)
    })

    it('re-arms onComplete after restart so it can fire again on a new activation', async () => {
      const onComplete = vi.fn()
      const tours: Tour[] = [
        {
          id: 'test-tour',
          onComplete,
          steps: [createStep('step-1')],
        },
      ]

      const { result } = renderHook(() => useTourContext(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start('test-tour')
      })
      await act(async () => {
        result.current.complete()
      })
      await act(async () => {
        await result.current.start('test-tour')
      })
      await act(async () => {
        result.current.complete()
      })

      expect(onComplete).toHaveBeenCalledTimes(2)
    })
  })
})
