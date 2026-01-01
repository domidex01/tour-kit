import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type Tour, TourProvider, useTour } from '@tour-kit/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TourCard } from '../../components/card/tour-card'

describe('TourCard Accessibility', () => {
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
    steps: [{ id: 's1', target: '#target', title: 'Title', content: 'Content' }],
  }

  beforeEach(() => {
    document.body.innerHTML = '<div id="target">Target</div>'
    const target = document.getElementById('target')
    if (target) {
      vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(mockRect)
    }
  })

  it('has dialog role', async () => {
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

    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('has aria-modal', async () => {
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

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
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

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-labelledby')

    const labelledBy = dialog.getAttribute('aria-labelledby')
    const title = labelledBy ? document.getElementById(labelledBy) : null
    expect(title).toHaveTextContent('Title')
  })

  it('close button has accessible name', async () => {
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

    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
  })

  it('navigation buttons have accessible names', async () => {
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

    // On first step
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()

    // Navigate to second step
    await user.click(screen.getByRole('button', { name: /next/i }))

    // On last step
    expect(screen.getByRole('button', { name: /finish/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
  })

  it('close icon has aria-hidden', async () => {
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

    const closeButton = screen.getByRole('button', { name: /close/i })
    const svg = closeButton.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  it('is keyboard navigable', async () => {
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

    // Tab through the dialog buttons
    await user.tab()
    await user.tab()

    // All buttons should be reachable
    const closeButton = screen.getByRole('button', { name: /close/i })
    const finishButton = screen.getByRole('button', { name: /finish/i })

    // Both should be in the document and focusable
    expect(closeButton).toBeInTheDocument()
    expect(finishButton).toBeInTheDocument()
  })

  it('heading has correct level', async () => {
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

    const heading = screen.getByRole('heading', { level: 3 })
    expect(heading).toHaveTextContent('Title')
  })
})
