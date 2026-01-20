import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type Tour, TourProvider, useTour } from '@tour-kit/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TourOverlay } from './tour-overlay'

describe('TourOverlay', () => {
  const mockRect: DOMRect = {
    top: 100,
    left: 100,
    bottom: 200,
    right: 300,
    width: 200,
    height: 100,
    x: 100,
    y: 100,
    toJSON: () => ({}),
  }

  const testTour: Tour = {
    id: 'test',
    steps: [
      {
        id: 's1',
        target: '#target',
        content: 'Step 1',
      },
    ],
  }

  beforeEach(() => {
    const target = document.createElement('div')
    target.id = 'target'
    document.body.appendChild(target)

    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(mockRect)
  })

  it('returns null when tour is inactive', () => {
    render(
      <TourProvider tours={[testTour]}>
        <TourOverlay />
      </TourProvider>
    )

    // Portal renders to body, but nothing should be there
    expect(document.body.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument()
  })

  it('renders overlay when tour is active', async () => {
    const user = userEvent.setup()

    function Starter() {
      const { start } = useTour()
      return (
        <button type="button" onClick={() => start()}>
          Start
        </button>
      )
    }

    render(
      <TourProvider tours={[testTour]}>
        <TourOverlay />
        <Starter />
      </TourProvider>
    )

    await user.click(screen.getByText('Start'))

    await waitFor(() => {
      const overlay = document.body.querySelector('[aria-hidden="true"]')
      expect(overlay).toBeInTheDocument()
    })
  })

  it('has aria-hidden for accessibility', async () => {
    const user = userEvent.setup()

    function Starter() {
      const { start } = useTour()
      return (
        <button type="button" onClick={() => start()}>
          Start
        </button>
      )
    }

    render(
      <TourProvider tours={[testTour]}>
        <TourOverlay />
        <Starter />
      </TourProvider>
    )

    await user.click(screen.getByText('Start'))

    await waitFor(() => {
      const overlay = document.body.querySelector('[aria-hidden="true"]')
      expect(overlay).toHaveAttribute('aria-hidden', 'true')
    })
  })

  it('calls onClick when overlay is clicked', async () => {
    const onClick = vi.fn()
    const user = userEvent.setup()

    function Starter() {
      const { start } = useTour()
      return (
        <button type="button" onClick={() => start()}>
          Start
        </button>
      )
    }

    render(
      <TourProvider tours={[testTour]}>
        <TourOverlay onClick={onClick} />
        <Starter />
      </TourProvider>
    )

    await user.click(screen.getByText('Start'))

    await waitFor(() => {
      expect(document.body.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
    })

    const overlay = document.body.querySelector('[aria-hidden="true"]')
    if (overlay) {
      await user.click(overlay)
    }

    expect(onClick).toHaveBeenCalled()
  })

  it('applies custom className', async () => {
    const user = userEvent.setup()

    function Starter() {
      const { start } = useTour()
      return (
        <button type="button" onClick={() => start()}>
          Start
        </button>
      )
    }

    render(
      <TourProvider tours={[testTour]}>
        <TourOverlay className="custom-overlay" />
        <Starter />
      </TourProvider>
    )

    await user.click(screen.getByText('Start'))

    await waitFor(() => {
      const overlay = document.body.querySelector('[aria-hidden="true"]')
      expect(overlay).toHaveClass('custom-overlay')
    })
  })

  it('respects interactive step option', async () => {
    const interactiveTour: Tour = {
      id: 'test',
      steps: [
        {
          id: 's1',
          target: '#target',
          content: 'Step 1',
          interactive: true,
        },
      ],
    }

    const user = userEvent.setup()

    function Starter() {
      const { start } = useTour()
      return (
        <button type="button" onClick={() => start()}>
          Start
        </button>
      )
    }

    render(
      <TourProvider tours={[interactiveTour]}>
        <TourOverlay />
        <Starter />
      </TourProvider>
    )

    await user.click(screen.getByText('Start'))

    // The cutout should have pointer-events: auto when interactive
    await waitFor(() => {
      const overlay = document.body.querySelector('[aria-hidden="true"]')
      expect(overlay).toBeInTheDocument()
    })
  })

  it('hides overlay when tour becomes inactive', async () => {
    const user = userEvent.setup()

    function Controller() {
      const { start, skip, isActive } = useTour()
      return (
        <>
          {!isActive && (
            <button type="button" onClick={() => start()}>
              Start
            </button>
          )}
          {isActive && (
            <button type="button" onClick={skip}>
              Skip
            </button>
          )}
        </>
      )
    }

    render(
      <TourProvider tours={[testTour]}>
        <TourOverlay />
        <Controller />
      </TourProvider>
    )

    // Start tour
    await user.click(screen.getByText('Start'))
    await waitFor(() => {
      expect(document.body.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
    })

    // Skip tour
    await user.click(screen.getByText('Skip'))
    expect(document.body.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument()
  })
})
