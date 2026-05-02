import { act, render, renderHook, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useTourContext } from '../../context/tour-context'
import { TourProvider } from '../../context/tour-provider'
import type { BranchContext, BranchTarget, Tour, TourCallbackContext, TourStep } from '../../types'

function createWrapper(tours: Tour[]) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <TourProvider tours={tours}>{children}</TourProvider>
  }
}

function visible(id: string, overrides: Partial<TourStep> = {}): TourStep {
  return { id, target: `#${id}`, content: `Content ${id}`, ...overrides }
}

// Cast helper: hidden steps deliberately omit required UI fields, so we
// build them via a partial cast rather than fighting TourStep's shape.
function hidden(id: string, extras: Partial<TourStep> = {}): TourStep {
  return { id, kind: 'hidden', ...extras } as unknown as TourStep
}

describe('TourProvider hidden-step integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // US-1: hidden auto-advances; onEnter fires; no UI mounts during the chain.
  it('auto-advances past a hidden step and fires onEnter (US-1)', async () => {
    const onEnter = vi.fn(async () => {})
    const tours: Tour[] = [
      {
        id: 't',
        steps: [visible('a'), hidden('h', { onEnter }), visible('b')],
      },
    ]

    const { result } = renderHook(() => useTourContext(), {
      wrapper: createWrapper(tours),
    })

    await act(async () => {
      await result.current.start('t')
    })

    expect(result.current.currentStepIndex).toBe(0)
    expect(result.current.currentStep?.id).toBe('a')
    expect(onEnter).not.toHaveBeenCalled()

    await act(async () => {
      await result.current.next()
    })

    expect(onEnter).toHaveBeenCalledTimes(1)
    expect(result.current.currentStepIndex).toBe(2)
    expect(result.current.currentStep?.id).toBe('b')
    expect(result.current.currentStep?.kind).not.toBe('hidden')

    // Defensive UI assertions — bare provider doesn't render dialog/tooltip,
    // but we verify nothing leaked into the DOM during transition.
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  // US-1 (extension): onNext branch from hidden lands at named step + setData persists.
  it("hidden step's onNext can setData and route to a named step (US-1)", async () => {
    const tours: Tour[] = [
      {
        id: 't',
        steps: [
          visible('a'),
          hidden('fork', {
            onEnter: async () => {},
            onNext: ((ctx: BranchContext): BranchTarget => {
              ctx.setData('branch', 'A')
              return 'step-x'
            }) as unknown as TourStep['onNext'],
          }),
          visible('step-y'),
          visible('step-x'),
        ],
      },
    ]

    const { result } = renderHook(() => useTourContext(), {
      wrapper: createWrapper(tours),
    })

    await act(async () => {
      await result.current.start('t')
    })

    await act(async () => {
      await result.current.next()
    })

    expect(result.current.currentStep?.id).toBe('step-x')
    expect(result.current.data.branch).toBe('A')
  })

  // US-3: two consecutive hidden steps both run onEnter, in order.
  it('runs onEnter for two consecutive hidden steps in order (US-3)', async () => {
    const enter1 = vi.fn(async () => {})
    const enter2 = vi.fn(async () => {})

    const tours: Tour[] = [
      {
        id: 't',
        steps: [
          visible('a'),
          hidden('h1', { onEnter: enter1 }),
          hidden('h2', { onEnter: enter2 }),
          visible('b'),
        ],
      },
    ]

    const { result } = renderHook(() => useTourContext(), {
      wrapper: createWrapper(tours),
    })

    await act(async () => {
      await result.current.start('t')
    })

    await act(async () => {
      await result.current.next()
    })

    expect(enter1).toHaveBeenCalledTimes(1)
    expect(enter2).toHaveBeenCalledTimes(1)

    const order1 = enter1.mock.invocationCallOrder[0]
    const order2 = enter2.mock.invocationCallOrder[0]
    expect(order1).toBeDefined()
    expect(order2).toBeDefined()
    expect(order1).toBeLessThan(order2 as number)

    expect(result.current.currentStepIndex).toBe(3)
    expect(result.current.currentStep?.id).toBe('b')
  })

  // US-2: malformed hidden step throws synchronously at provider mount.
  it('throws TourValidationError at mount when hidden step has UI fields (US-2)', () => {
    const malformed: Tour = {
      id: 'bad',
      // biome-ignore lint/suspicious/noExplicitAny: deliberately invalid step for validator
      steps: [{ id: 'broken', kind: 'hidden', target: '#nope' } as any],
    }

    // React surfaces synchronous render-time throws to the calling render().
    // Suppress the noisy console.error from React's error boundary path.
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    try {
      expect(() =>
        render(
          <TourProvider tours={[malformed]}>
            <div />
          </TourProvider>
        )
      ).toThrow(/INVALID_HIDDEN_STEP|broken/)
    } finally {
      spy.mockRestore()
    }
  })

  // US-4: hidden step that branches to itself triggers loop guard at 50.
  it('throws HIDDEN_STEP_LOOP after 50 chained hidden iterations (US-4)', async () => {
    // Self-referential hidden: onNext returns its own id.
    const tours: Tour[] = [
      {
        id: 't',
        steps: [
          visible('a'),
          hidden('loop', {
            onEnter: async () => {},
            onNext: 'loop' as unknown as TourStep['onNext'],
          }),
        ],
      },
    ]

    const { result } = renderHook(() => useTourContext(), {
      wrapper: createWrapper(tours),
    })

    await act(async () => {
      await result.current.start('t')
    })

    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    let caught: unknown
    try {
      await act(async () => {
        await result.current.next()
      })
    } catch (err) {
      caught = err
    } finally {
      spy.mockRestore()
    }

    // Import locally to avoid coupling test setup to the public re-export path.
    const { TourValidationError } = await import('../../lib/validate-tour')
    expect(caught).toBeInstanceOf(TourValidationError)
    expect((caught as InstanceType<typeof TourValidationError>).code).toBe('HIDDEN_STEP_LOOP')
    expect((caught as InstanceType<typeof TourValidationError>).stepId).toBe('loop')
  })

  // US-1 (no leak): onEnter receives a callback context with the hidden step's identity.
  it('onEnter receives a context with currentStep pointing at the hidden step', async () => {
    let captured: TourCallbackContext | undefined
    const tours: Tour[] = [
      {
        id: 't',
        steps: [
          visible('a'),
          hidden('h', {
            onEnter: (ctx) => {
              captured = ctx
            },
          }),
          visible('b'),
        ],
      },
    ]

    const { result } = renderHook(() => useTourContext(), {
      wrapper: createWrapper(tours),
    })

    await act(async () => {
      await result.current.start('t')
    })
    await act(async () => {
      await result.current.next()
    })

    expect(captured).toBeDefined()
    expect(captured?.currentStep?.id).toBe('h')
    expect(captured?.currentStep?.kind).toBe('hidden')
  })
})
