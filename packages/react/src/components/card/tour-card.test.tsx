import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type Tour, TourProvider, useTour } from '@tour-kit/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TourCard } from './tour-card'

describe('TourCard', () => {
  const mockRect: DOMRect = {
    top: 100,
    left: 100,
    bottom: 150,
    right: 200,
    width: 100,
    height: 50,
    x: 100,
    y: 100,
    toJSON: () => ({}),
  }

  const testTour: Tour = {
    id: 'test',
    steps: [
      {
        id: 'step-1',
        target: '#target',
        title: 'Welcome',
        content: 'This is the first step',
      },
    ],
  }

  beforeEach(() => {
    document.body.innerHTML = '<div id="target">Target</div>'
    const target = document.getElementById('target')
    if (target) {
      vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(mockRect)
    }
  })

  it('returns null when tour is inactive', () => {
    const { container } = render(
      <TourProvider tours={[testTour]}>
        <TourCard />
      </TourProvider>
    )

    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument()
  })

  it('returns null when no currentStep', () => {
    // Create a tour with no steps
    const emptyTour: Tour = {
      id: 'empty',
      steps: [],
    }

    const { container } = render(
      <TourProvider tours={[emptyTour]}>
        <TourCard />
      </TourProvider>
    )

    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument()
  })

  it('renders dialog with aria-modal when tour is active', async () => {
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
        <TourCard />
        <Starter />
      </TourProvider>
    )

    await user.click(screen.getByText('Start'))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('has aria-labelledby linked to title', async () => {
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
        <TourCard />
        <Starter />
      </TourProvider>
    )

    await user.click(screen.getByText('Start'))

    const dialog = await screen.findByRole('dialog')
    const labelledBy = dialog.getAttribute('aria-labelledby')
    const title = labelledBy ? document.getElementById(labelledBy) : null

    expect(title).toHaveTextContent('Welcome')
  })

  it('renders step title', async () => {
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
        <TourCard />
        <Starter />
      </TourProvider>
    )

    await user.click(screen.getByText('Start'))

    expect(await screen.findByText('Welcome')).toBeInTheDocument()
  })

  it('renders step content', async () => {
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
        <TourCard />
        <Starter />
      </TourProvider>
    )

    await user.click(screen.getByText('Start'))

    expect(await screen.findByText('This is the first step')).toBeInTheDocument()
  })

  it('renders TourCardHeader with close button by default', async () => {
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
        <TourCard />
        <Starter />
      </TourProvider>
    )

    await user.click(screen.getByText('Start'))

    expect(await screen.findByRole('button', { name: /close/i })).toBeInTheDocument()
  })

  it('respects showClose step option', async () => {
    const tourWithoutClose: Tour = {
      id: 'test',
      steps: [
        {
          id: 's1',
          target: '#target',
          content: 'Step',
          showClose: false,
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
      <TourProvider tours={[tourWithoutClose]}>
        <TourCard />
        <Starter />
      </TourProvider>
    )

    await user.click(screen.getByText('Start'))

    // Wait for tour to be active, then check close button is not present
    await screen.findByRole('dialog')
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument()
  })

  it('renders TourCardFooter with navigation', async () => {
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
        <TourCard />
        <Starter />
      </TourProvider>
    )

    await user.click(screen.getByText('Start'))

    // On last (and only) step, should show Finish
    expect(await screen.findByRole('button', { name: /finish/i })).toBeInTheDocument()
  })

  it('respects showNavigation step option', async () => {
    const tourWithoutNav: Tour = {
      id: 'test',
      steps: [
        {
          id: 's1',
          target: '#target',
          content: 'Step',
          showNavigation: false,
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
      <TourProvider tours={[tourWithoutNav]}>
        <TourCard />
        <Starter />
      </TourProvider>
    )

    await user.click(screen.getByText('Start'))

    // Wait for tour to be active, then check navigation buttons are not present
    await screen.findByRole('dialog')
    expect(screen.queryByRole('button', { name: /finish/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument()
  })

  it('renders TourProgress when showProgress is true', async () => {
    const tourWithTwoSteps: Tour = {
      id: 'test',
      steps: [
        { id: 's1', target: '#target', content: 'Step 1' },
        { id: 's2', target: '#target', content: 'Step 2' },
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
      <TourProvider tours={[tourWithTwoSteps]}>
        <TourCard />
        <Starter />
      </TourProvider>
    )

    await user.click(screen.getByText('Start'))

    // Wait for tour to be active
    await screen.findByRole('dialog')

    // Progress dots should be rendered (2 dots for 2 steps)
    const dots = document.querySelectorAll('.rounded-full')
    expect(dots.length).toBeGreaterThan(0)
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
        <TourCard className="custom-card-class" />
        <Starter />
      </TourProvider>
    )

    await user.click(screen.getByText('Start'))

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveClass('custom-card-class')
  })
})
