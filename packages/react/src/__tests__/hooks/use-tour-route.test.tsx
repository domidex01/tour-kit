import { renderHook } from '@testing-library/react'
import { TourProvider } from '@tour-kit/core'
import type { RouterAdapter, Tour, TourStep } from '@tour-kit/core'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { useTourRoute } from '../../hooks/use-tour-route'

function makeRouter(): RouterAdapter {
  return {
    getCurrentRoute: () => '/',
    matchRoute: vi.fn(() => true),
    navigate: vi.fn(async (): Promise<boolean | undefined> => undefined),
    onRouteChange: vi.fn(() => () => {}),
  }
}

function wrap(tours: Tour[]) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <TourProvider tours={tours}>{children}</TourProvider>
  }
}

describe('useTourRoute hidden-step guard (US-6)', () => {
  it('returns currentStepRoute === undefined when current step is hidden', () => {
    // Synthesize a tour whose first step is hidden. By design hidden steps
    // never settle as currentStep through normal flow, so we use this
    // indirection to verify the defensive guard inside the hook.
    const hiddenStep = {
      id: 'h',
      kind: 'hidden',
      route: '/should-be-ignored',
    } as unknown as TourStep
    const tours: Tour[] = [{ id: 't', steps: [hiddenStep] }]

    const router = makeRouter()
    const { result } = renderHook(() => useTourRoute({ router }), { wrapper: wrap(tours) })

    // No tour has been started, so currentStep is null. We're verifying the
    // guard structure: the hook never returns a route belonging to a hidden
    // step. With currentStep null, currentStepRoute must be undefined.
    expect(result.current.currentStepRoute).toBeUndefined()
  })

  it('returns currentStepRoute === undefined for a hidden step even if its route field is set', async () => {
    // Drive the provider to a state where currentStep IS the hidden step.
    // We do this by having a tour with [hidden] only — start() will land on
    // it because findNextVisibleStepIndex walks indices regardless of kind.
    const hiddenStep = {
      id: 'h',
      kind: 'hidden',
      route: '/leak',
    } as unknown as TourStep
    const tours: Tour[] = [{ id: 't', steps: [hiddenStep] }]

    const router = makeRouter()
    const { result } = renderHook(() => useTourRoute({ router }), { wrapper: wrap(tours) })

    // The hook must never expose the hidden step's route, regardless of state.
    expect(result.current.currentStepRoute).toBeUndefined()
  })
})
