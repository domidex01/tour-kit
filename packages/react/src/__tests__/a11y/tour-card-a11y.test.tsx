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

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
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

    expect(await screen.findByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('has aria-label combining step counter and title', async () => {
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
    expect(dialog).toHaveAttribute('aria-label', 'Step 1 of 1: Title')
    expect(dialog).not.toHaveAttribute('aria-labelledby')
  })

  it('aria-label contains the step counter', async () => {
    const tourWithTwoSteps: Tour = {
      id: 'test',
      steps: [
        { id: 's1', target: '#target', title: 'Welcome', content: 'Start here' },
        { id: 's2', target: '#target', title: 'Next step', content: 'Keep going' },
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

    const dialog = await screen.findByRole('dialog')
    expect(dialog.getAttribute('aria-label')).toMatch(/^Step 1 of 2: Welcome$/)
  })

  // NOTE: "arrow svg has aria-hidden" is enforced by the Playwright
  // placement matrix at e2e/next/tour-card-placements.localhost.spec.ts.
  // jsdom can't run Floating UI's layout calculations, so <FloatingArrow>
  // never paints an svg here — the assertion has no signal in this suite.

  it('does not double-read step counter via aria-live', async () => {
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
    await screen.findByRole('dialog')

    const liveRegion = document.querySelector('[role="dialog"] [aria-live]')
    expect(liveRegion).toBeNull()
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

    expect(await screen.findByRole('button', { name: /close/i })).toBeInTheDocument()
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
    expect(await screen.findByRole('button', { name: /next/i })).toBeInTheDocument()

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

    const closeButton = await screen.findByRole('button', { name: /close/i })
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

    // Wait for tour to be active
    await screen.findByRole('dialog')

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

  it('restores focus to the invoking trigger when the tour is closed', async () => {
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

    const trigger = screen.getByText('Start')
    await user.click(trigger)
    await screen.findByRole('dialog')

    // Dismiss via the X (which calls skip()).
    await user.click(screen.getByRole('button', { name: /close/i }))

    expect(screen.queryByRole('dialog')).toBeNull()
    // WCAG 2.4.3 — focus returns to the trigger, not <body>.
    expect(trigger).toHaveFocus()
  })

  it('traps focus inside the dialog for modal steps', async () => {
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

    // Activating the trap moves focus into the dialog.
    expect(dialog.contains(document.activeElement)).toBe(true)

    // Tab many times — focus must never escape the dialog.
    for (let i = 0; i < 8; i++) {
      await user.tab()
      expect(dialog.contains(document.activeElement)).toBe(true)
    }
  })

  it('does not declare aria-modal or trap focus for interactive steps', async () => {
    const interactiveTour: Tour = {
      id: 'test',
      steps: [
        {
          id: 's1',
          target: '#target',
          title: 'Pick one',
          content: 'Choose a path',
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
        <TourCard />
        <Starter />
      </TourProvider>
    )

    await user.click(screen.getByText('Start'))
    const dialog = await screen.findByRole('dialog')

    // Interactive steps are non-modal: no aria-modal, background stays reachable.
    expect(dialog).not.toHaveAttribute('aria-modal')
    // The render root (background) must not be inerted for interactive steps.
    expect(document.querySelectorAll('[inert]').length).toBe(0)
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

    const heading = await screen.findByRole('heading', { level: 3 })
    expect(heading).toHaveTextContent('Title')
  })
})
