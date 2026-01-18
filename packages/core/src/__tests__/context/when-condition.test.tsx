import { act, renderHook } from '@testing-library/react'
import type * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { TourProvider } from '../../context/tour-provider'
import { useTour } from '../../hooks/use-tour'
import type { Tour } from '../../types'

function createWrapper(tours: Tour[]) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <TourProvider tours={tours}>{children}</TourProvider>
  }
}

describe('when condition', () => {
  describe('next() navigation', () => {
    it('skips step when when returns false', async () => {
      const tours: Tour[] = [
        {
          id: 'test',
          steps: [
            { id: 's1', target: '#t1', content: 'Step 1' },
            { id: 's2', target: '#t2', content: 'Step 2', when: () => false },
            { id: 's3', target: '#t3', content: 'Step 3' },
          ],
        },
      ]

      const { result } = renderHook(() => useTour(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start()
      })
      expect(result.current.currentStep?.id).toBe('s1')

      await act(async () => {
        await result.current.next()
      })

      // Should skip s2 and go to s3
      expect(result.current.currentStep?.id).toBe('s3')
    })

    it('handles async when condition', async () => {
      const asyncWhen = vi
        .fn()
        .mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(false), 10)))

      const tours: Tour[] = [
        {
          id: 'test',
          steps: [
            { id: 's1', target: '#t1', content: 'Step 1' },
            { id: 's2', target: '#t2', content: 'Step 2', when: asyncWhen },
            { id: 's3', target: '#t3', content: 'Step 3' },
          ],
        },
      ]

      const { result } = renderHook(() => useTour(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start()
      })

      await act(async () => {
        await result.current.next()
      })

      expect(asyncWhen).toHaveBeenCalled()
      expect(result.current.currentStep?.id).toBe('s3')
    })

    it('completes tour when all remaining steps have when returning false', async () => {
      const tours: Tour[] = [
        {
          id: 'test',
          steps: [
            { id: 's1', target: '#t1', content: 'Step 1' },
            { id: 's2', target: '#t2', content: 'Step 2', when: () => false },
            { id: 's3', target: '#t3', content: 'Step 3', when: () => false },
          ],
        },
      ]

      const { result } = renderHook(() => useTour(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start()
      })

      await act(async () => {
        await result.current.next()
      })

      // Tour should complete because no visible steps remain
      expect(result.current.isActive).toBe(false)
    })

    it('skips multiple consecutive steps with when returning false', async () => {
      const tours: Tour[] = [
        {
          id: 'test',
          steps: [
            { id: 's1', target: '#t1', content: 'Step 1' },
            { id: 's2', target: '#t2', content: 'Step 2', when: () => false },
            { id: 's3', target: '#t3', content: 'Step 3', when: () => false },
            { id: 's4', target: '#t4', content: 'Step 4' },
          ],
        },
      ]

      const { result } = renderHook(() => useTour(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start()
      })

      await act(async () => {
        await result.current.next()
      })

      // Should skip s2 and s3, go to s4
      expect(result.current.currentStep?.id).toBe('s4')
    })
  })

  describe('prev() navigation', () => {
    it('skips step when when returns false in backward navigation', async () => {
      const tours: Tour[] = [
        {
          id: 'test',
          steps: [
            { id: 's1', target: '#t1', content: 'Step 1' },
            { id: 's2', target: '#t2', content: 'Step 2', when: () => false },
            { id: 's3', target: '#t3', content: 'Step 3' },
          ],
        },
      ]

      const { result } = renderHook(() => useTour(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start()
      })

      // Go to step 3 directly
      await act(async () => {
        await result.current.goTo(2)
      })
      expect(result.current.currentStep?.id).toBe('s3')

      // Go back - should skip s2 and go to s1
      await act(async () => {
        await result.current.prev()
      })
      expect(result.current.currentStep?.id).toBe('s1')
    })

    it('stays on current step when no previous visible step exists', async () => {
      const tours: Tour[] = [
        {
          id: 'test',
          steps: [
            { id: 's1', target: '#t1', content: 'Step 1', when: () => false },
            { id: 's2', target: '#t2', content: 'Step 2' },
          ],
        },
      ]

      const { result } = renderHook(() => useTour(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start()
      })

      // Should start on s2 because s1 has when returning false
      expect(result.current.currentStep?.id).toBe('s2')

      // Try to go back - should stay on s2
      await act(async () => {
        await result.current.prev()
      })
      expect(result.current.currentStep?.id).toBe('s2')
    })
  })

  describe('start() with when', () => {
    it('skips initial step if when returns false', async () => {
      const tours: Tour[] = [
        {
          id: 'test',
          steps: [
            { id: 's1', target: '#t1', content: 'Step 1', when: () => false },
            { id: 's2', target: '#t2', content: 'Step 2' },
          ],
        },
      ]

      const { result } = renderHook(() => useTour(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start()
      })

      // Should start on s2 because s1 has when returning false
      expect(result.current.currentStep?.id).toBe('s2')
    })

    it('does not start tour when all steps have when returning false', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const tours: Tour[] = [
        {
          id: 'test',
          steps: [
            { id: 's1', target: '#t1', content: 'Step 1', when: () => false },
            { id: 's2', target: '#t2', content: 'Step 2', when: () => false },
          ],
        },
      ]

      const { result } = renderHook(() => useTour(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start()
      })

      // Tour should not be active
      expect(result.current.isActive).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('has no visible steps'))

      consoleSpy.mockRestore()
    })
  })

  describe('goTo() with when', () => {
    it('finds nearest visible step when target step has when returning false', async () => {
      const tours: Tour[] = [
        {
          id: 'test',
          steps: [
            { id: 's1', target: '#t1', content: 'Step 1' },
            { id: 's2', target: '#t2', content: 'Step 2', when: () => false },
            { id: 's3', target: '#t3', content: 'Step 3' },
          ],
        },
      ]

      const { result } = renderHook(() => useTour(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start()
      })

      // Try to go to s2 (which has when returning false)
      await act(async () => {
        await result.current.goTo(1)
      })

      // Should go to s3 (next visible step)
      expect(result.current.currentStep?.id).toBe('s3')
    })

    it('goes to target step when when returns true', async () => {
      const tours: Tour[] = [
        {
          id: 'test',
          steps: [
            { id: 's1', target: '#t1', content: 'Step 1' },
            { id: 's2', target: '#t2', content: 'Step 2', when: () => true },
            { id: 's3', target: '#t3', content: 'Step 3' },
          ],
        },
      ]

      const { result } = renderHook(() => useTour(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start()
      })

      await act(async () => {
        await result.current.goTo(1)
      })

      expect(result.current.currentStep?.id).toBe('s2')
    })
  })

  describe('when context', () => {
    it('evaluates when with correct context', async () => {
      const whenFn = vi.fn().mockReturnValue(true)

      const tours: Tour[] = [
        {
          id: 'test',
          steps: [
            { id: 's1', target: '#t1', content: 'Step 1' },
            { id: 's2', target: '#t2', content: 'Step 2', when: whenFn },
          ],
        },
      ]

      const { result } = renderHook(() => useTour(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start()
      })

      await act(async () => {
        await result.current.next()
      })

      expect(whenFn).toHaveBeenCalledWith(
        expect.objectContaining({
          tourId: 'test',
          isActive: true,
          tour: expect.objectContaining({ id: 'test' }),
          data: expect.any(Object),
        })
      )
    })
  })

  describe('error handling', () => {
    it('handles when condition that throws error (skips step)', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      const tours: Tour[] = [
        {
          id: 'test',
          steps: [
            { id: 's1', target: '#t1', content: 'Step 1' },
            {
              id: 's2',
              target: '#t2',
              content: 'Step 2',
              when: () => {
                throw new Error('Test error')
              },
            },
            { id: 's3', target: '#t3', content: 'Step 3' },
          ],
        },
      ]

      const { result } = renderHook(() => useTour(), {
        wrapper: createWrapper(tours),
      })

      await act(async () => {
        await result.current.start()
      })

      await act(async () => {
        await result.current.next()
      })

      // Should skip erroring step
      expect(result.current.currentStep?.id).toBe('s3')
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error evaluating when condition'),
        expect.any(Error)
      )

      consoleSpy.mockRestore()
    })
  })
})
