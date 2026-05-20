import { act, render, renderHook, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { TourProvider } from '../../context/tour-provider'
import type { Tour } from '../../types'
import { tourRegistry } from '../tour-registry'
import { useTourActions } from '../use-tour-actions'
import { resetTourRegistry } from './test-helpers'

const welcomeTour: Tour = {
  id: 'welcome',
  steps: [
    { id: 'hero', target: '#hero', content: 'Welcome to the app' },
    { id: 'cta', target: '#cta', content: 'Start here' },
  ],
}

beforeEach(() => {
  resetTourRegistry()
  document.body.innerHTML = '<div id="hero"></div><div id="cta"></div>'
})

afterEach(() => {
  resetTourRegistry()
  document.body.innerHTML = ''
})

describe('useTourActions — unknown id returns frozen no-op', () => {
  it('returns a frozen object with isActive=false and no-op methods', () => {
    const { result } = renderHook(() => useTourActions('does-not-exist'))
    expect(result.current.isActive).toBe(false)
    expect(result.current.currentStepId).toBeNull()
    expect(result.current.progress).toBe(0)
    expect(Object.isFrozen(result.current)).toBe(true)
  })

  it('calling no-op methods does not throw', () => {
    const { result } = renderHook(() => useTourActions('missing'))
    expect(() => result.current.start()).not.toThrow()
    expect(() => result.current.stop()).not.toThrow()
    expect(() => result.current.restart()).not.toThrow()
    expect(() => result.current.next()).not.toThrow()
    expect(() => result.current.prev()).not.toThrow()
    expect(() => result.current.goToStep('any')).not.toThrow()
  })

  it('returns the same frozen instance across re-renders (module-level allocation)', () => {
    const { result, rerender } = renderHook(() => useTourActions('still-missing'))
    const first = result.current
    rerender()
    const second = result.current
    expect(first).toBe(second)
  })
})

describe('useTourActions — sibling subtree integration', () => {
  function SiblingButton({ tourId }: { tourId: string }) {
    const { start, isActive } = useTourActions(tourId)
    return (
      <div>
        <button type="button" onClick={start} data-testid="start-btn">
          Start
        </button>
        <span data-testid="status">{isActive ? 'active' : 'idle'}</span>
      </div>
    )
  }

  it('clicking a sibling button flips the registered tour from idle → active', async () => {
    render(
      <>
        <TourProvider tours={[welcomeTour]}>{null}</TourProvider>
        <SiblingButton tourId="welcome" />
      </>
    )

    // Wait for the registration effect to commit.
    await act(async () => {
      await Promise.resolve()
    })

    expect(screen.getByTestId('status').textContent).toBe('idle')

    await act(async () => {
      screen.getByTestId('start-btn').click()
    })

    // `start` is async inside the provider (await findNextVisibleStepIndex →
    // dispatch). waitFor flushes pending microtasks and the state-mirror
    // effect that propagates the new state to the registry.
    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('active')
    })
  })

  it('state mirror surfaces currentStepId and progress for the active tour', async () => {
    function StateProbe({ tourId }: { tourId: string }) {
      const { currentStepId, progress, isActive } = useTourActions(tourId)
      return (
        <div>
          <span data-testid="step">{currentStepId ?? 'none'}</span>
          <span data-testid="progress">{progress.toFixed(2)}</span>
          <span data-testid="active">{isActive ? '1' : '0'}</span>
        </div>
      )
    }

    function StartButton({ tourId }: { tourId: string }) {
      const { start } = useTourActions(tourId)
      return (
        <button type="button" onClick={start} data-testid="start">
          Start
        </button>
      )
    }

    render(
      <>
        <TourProvider tours={[welcomeTour]}>{null}</TourProvider>
        <StateProbe tourId="welcome" />
        <StartButton tourId="welcome" />
      </>
    )

    await act(async () => {
      await Promise.resolve()
    })
    expect(screen.getByTestId('active').textContent).toBe('0')
    expect(screen.getByTestId('step').textContent).toBe('none')

    await act(async () => {
      screen.getByTestId('start').click()
    })
    await waitFor(() => {
      expect(screen.getByTestId('active').textContent).toBe('1')
    })
    expect(screen.getByTestId('step').textContent).toBe('hero')
    // 2 steps total, on step 1 → progress = 1/2 = 0.50
    expect(screen.getByTestId('progress').textContent).toBe('0.50')
  })
})

describe('useTourActions — unmount returns to frozen no-op', () => {
  it('after the provider unmounts, the sibling consumer falls back to the frozen no-op', async () => {
    function Probe({ tourId }: { tourId: string }) {
      const actions = useTourActions(tourId)
      return <span data-testid="frozen">{Object.isFrozen(actions) ? 'yes' : 'no'}</span>
    }

    const { unmount } = render(<TourProvider tours={[welcomeTour]}>{null}</TourProvider>)
    const { rerender } = render(<Probe tourId="welcome" />)
    await act(async () => {
      await Promise.resolve()
    })

    // While the provider is mounted, the consumer reads the live entry — NOT the frozen no-op.
    expect(screen.getByTestId('frozen').textContent).toBe('no')

    unmount()
    rerender(<Probe tourId="welcome" />)
    await act(async () => {
      await Promise.resolve()
    })

    // After the provider unmounts, the registry slot is cleared and the
    // consumer falls back to the module-level frozen no-op.
    expect(tourRegistry.get('welcome')).toBeNull()
    expect(screen.getByTestId('frozen').textContent).toBe('yes')
  })
})
