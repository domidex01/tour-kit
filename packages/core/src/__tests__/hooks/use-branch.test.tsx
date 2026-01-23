import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { TourProvider } from '../../context/tour-provider'
import { useTourContext } from '../../context/tour-context'
import { useBranch } from '../../hooks/use-branch'
import type { Tour, TourStep, BranchContext, BranchTarget } from '../../types'

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

// Combined hook for testing
function useCombinedHooks() {
  const branch = useBranch()
  const tour = useTourContext()
  return { branch, tour }
}

describe('useBranch', () => {
  describe('availableActions', () => {
    it('returns empty array when no onAction defined', async () => {
      const tours: Tour[] = [
        {
          id: 'test-tour',
          steps: [createStep('step-1')],
        },
      ]

      const { result } = renderHook(() => useCombinedHooks(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.tour.start('test-tour')
      })

      expect(result.current.branch.availableActions).toEqual([])
    })

    it('returns action IDs when onAction is defined', async () => {
      const tours: Tour[] = [
        {
          id: 'test-tour',
          steps: [
            createStep('step-1', {
              onAction: {
                developer: 'dev-path',
                designer: 'design-path',
                manager: 'manager-path',
              },
            }),
          ],
        },
      ]

      const { result } = renderHook(() => useCombinedHooks(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.tour.start('test-tour')
      })

      expect(result.current.branch.availableActions).toContain('developer')
      expect(result.current.branch.availableActions).toContain('designer')
      expect(result.current.branch.availableActions).toContain('manager')
    })
  })

  describe('hasAction', () => {
    it('returns false when no currentStep', () => {
      const tours: Tour[] = [
        {
          id: 'test-tour',
          steps: [createStep('step-1')],
        },
      ]

      const { result } = renderHook(() => useBranch(), {
        wrapper: createWrapper(tours),
      })

      expect(result.current.hasAction('someAction')).toBe(false)
    })

    it('returns true when action exists', async () => {
      const tours: Tour[] = [
        {
          id: 'test-tour',
          steps: [
            createStep('step-1', {
              onAction: { testAction: 'step-2' },
            }),
          ],
        },
      ]

      const { result } = renderHook(() => useCombinedHooks(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.tour.start('test-tour')
      })

      expect(result.current.branch.hasAction('testAction')).toBe(true)
      expect(result.current.branch.hasAction('nonExistent')).toBe(false)
    })
  })

  describe('triggerAction', () => {
    it('calls context triggerBranchAction', async () => {
      const tours: Tour[] = [
        {
          id: 'test-tour',
          steps: [
            createStep('step-1', {
              onAction: {
                testAction: 'step-2',
              },
            }),
            createStep('step-2'),
          ],
        },
      ]

      const { result } = renderHook(() => useCombinedHooks(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.tour.start('test-tour')
      })

      expect(result.current.branch.hasAction('testAction')).toBe(true)
      expect(result.current.branch.availableActions).toContain('testAction')

      await act(async () => {
        await result.current.branch.triggerAction('testAction')
      })

      expect(result.current.tour.currentStep?.id).toBe('step-2')
    })

    it('triggers action with payload', async () => {
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
              onAction: {
                customAction: resolver,
              },
            }),
            createStep('step-2'),
          ],
        },
      ]

      const { result } = renderHook(() => useCombinedHooks(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.tour.start('test-tour')
      })

      await act(async () => {
        await result.current.branch.triggerAction('customAction', { key: 'value' })
      })

      expect(capturedPayload).toEqual({ key: 'value' })
    })
  })

  describe('previewAction', () => {
    it('resolves target without navigating', async () => {
      const tours: Tour[] = [
        {
          id: 'test-tour',
          steps: [
            createStep('step-1', {
              onAction: {
                previewMe: 'step-3',
              },
            }),
            createStep('step-2'),
            createStep('step-3'),
          ],
        },
      ]

      const { result } = renderHook(() => useCombinedHooks(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.tour.start('test-tour')
      })

      let preview: unknown
      await act(async () => {
        preview = await result.current.branch.previewAction('previewMe')
      })

      // Should return the target without navigating
      expect(preview).toBe('step-3')
      // Should still be on step-1
      expect(result.current.tour.currentStep?.id).toBe('step-1')
    })

    it('returns "next" for unknown action', async () => {
      const tours: Tour[] = [
        {
          id: 'test-tour',
          steps: [createStep('step-1')],
        },
      ]

      const { result } = renderHook(() => useCombinedHooks(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.tour.start('test-tour')
      })

      let preview: unknown
      await act(async () => {
        preview = await result.current.branch.previewAction('unknownAction')
      })

      expect(preview).toBe('next')
    })

    it('resolves async resolver without navigating', async () => {
      const asyncResolver = vi.fn().mockResolvedValue('async-target')

      const tours: Tour[] = [
        {
          id: 'test-tour',
          steps: [
            createStep('step-1', {
              onAction: {
                asyncAction: asyncResolver,
              },
            }),
            createStep('step-2'),
          ],
        },
      ]

      const { result } = renderHook(() => useCombinedHooks(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.tour.start('test-tour')
      })

      let preview: unknown
      await act(async () => {
        preview = await result.current.branch.previewAction('asyncAction')
      })

      expect(preview).toBe('async-target')
      expect(result.current.tour.currentStep?.id).toBe('step-1')
    })
  })

  describe('useCallback stability', () => {
    it('maintains stable references for callbacks', async () => {
      const tours: Tour[] = [
        {
          id: 'test-tour',
          steps: [
            createStep('step-1', {
              onAction: { action1: 'step-2' },
            }),
          ],
        },
      ]

      const { result, rerender } = renderHook(() => useBranch(), {
        wrapper: createWrapper(tours),
      })

      const initialTriggerAction = result.current.triggerAction
      const initialHasAction = result.current.hasAction
      const initialPreviewAction = result.current.previewAction

      rerender()

      // Callbacks should be stable across renders (memoized)
      expect(result.current.triggerAction).toBe(initialTriggerAction)
      expect(result.current.hasAction).toBe(initialHasAction)
      expect(result.current.previewAction).toBe(initialPreviewAction)
    })
  })
})
