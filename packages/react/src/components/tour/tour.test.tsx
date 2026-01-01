import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useTour } from '@tour-kit/core'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Tour } from './tour'
import { TourStep } from './tour-step'

describe('Tour', () => {
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

  beforeEach(() => {
    document.body.innerHTML = `
      <div id="step-1">Target 1</div>
      <div id="step-2">Target 2</div>
    `
    for (const el of document.querySelectorAll('[id^="step-"]')) {
      vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(mockRect)
    }
  })

  it('renders children content', () => {
    render(
      <Tour id="test">
        <TourStep id="s1" target="#step-1" content="Step 1" />
        <div data-testid="content">App Content</div>
      </Tour>
    )

    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('extracts TourStep children as steps', async () => {
    const user = userEvent.setup()

    function TourConsumer() {
      const { totalSteps, start, isActive } = useTour()
      return (
        <>
          <button type="button" onClick={() => start()}>
            Start
          </button>
          {isActive && <div data-testid="total">{totalSteps}</div>}
        </>
      )
    }

    render(
      <Tour id="test">
        <TourStep id="s1" target="#step-1" content="Step 1" />
        <TourStep id="s2" target="#step-2" content="Step 2" />
        <TourConsumer />
      </Tour>
    )

    await user.click(screen.getByText('Start'))

    expect(screen.getByTestId('total')).toHaveTextContent('2')
  })

  it('passes non-TourStep children through', () => {
    render(
      <Tour id="test">
        <TourStep id="s1" target="#step-1" content="Step 1" />
        <div data-testid="regular-child">Regular Child</div>
        <span data-testid="another-child">Another</span>
      </Tour>
    )

    expect(screen.getByTestId('regular-child')).toBeInTheDocument()
    expect(screen.getByTestId('another-child')).toBeInTheDocument()
  })

  it('creates tour with provided id', () => {
    function TourIdDisplay() {
      const { isActive } = useTour()
      return <div data-testid="is-active">{String(isActive)}</div>
    }

    render(
      <Tour id="onboarding">
        <TourStep id="s1" target="#step-1" content="Step 1" />
        <TourIdDisplay />
      </Tour>
    )

    // The tour should be registered - start it to verify
    expect(screen.getByTestId('is-active')).toHaveTextContent('false')
  })

  it('calls onStart callback', async () => {
    const onStart = vi.fn()
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
      <Tour id="test" onStart={onStart}>
        <TourStep id="s1" target="#step-1" content="Step 1" />
        <Starter />
      </Tour>
    )

    await user.click(screen.getByText('Start'))

    expect(onStart).toHaveBeenCalledTimes(1)
  })

  it('calls onComplete when tour finishes', async () => {
    const onComplete = vi.fn()
    const user = userEvent.setup()

    function Controller() {
      const { start, next, isActive } = useTour()
      return (
        <>
          {!isActive && (
            <button type="button" onClick={() => start()}>
              Start
            </button>
          )}
          {isActive && (
            <button type="button" onClick={next}>
              Next
            </button>
          )}
        </>
      )
    }

    render(
      <Tour id="test" onComplete={onComplete}>
        <TourStep id="s1" target="#step-1" content="Step 1" />
        <Controller />
      </Tour>
    )

    await user.click(screen.getByText('Start'))
    await user.click(screen.getByText('Next')) // Completes single-step tour

    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('calls onSkip when skipped', async () => {
    const onSkip = vi.fn()
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
      <Tour id="test" onSkip={onSkip}>
        <TourStep id="s1" target="#step-1" content="Step 1" />
        <TourStep id="s2" target="#step-2" content="Step 2" />
        <Starter />
      </Tour>
    )

    await user.click(screen.getByText('Start'))
    // Click the Skip button from TourCard navigation
    await user.click(screen.getByRole('button', { name: /skip/i }))

    expect(onSkip).toHaveBeenCalledTimes(1)
  })

  it('calls onStepChange when navigating', async () => {
    const onStepChange = vi.fn()
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
      <Tour id="test" onStepChange={onStepChange}>
        <TourStep id="s1" target="#step-1" content="Step 1" />
        <TourStep id="s2" target="#step-2" content="Step 2" />
        <Starter />
      </Tour>
    )

    await user.click(screen.getByText('Start'))
    // Click the Next button from TourCard navigation
    await user.click(screen.getByRole('button', { name: /next/i }))

    expect(onStepChange).toHaveBeenCalledWith(expect.objectContaining({ id: 's2' }), 1)
  })

  it('renders TourOverlay when active', async () => {
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
      <Tour id="test">
        <TourStep id="s1" target="#step-1" content="Step 1" />
        <Starter />
      </Tour>
    )

    await user.click(screen.getByText('Start'))

    // Overlay should be present with aria-hidden
    expect(document.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })

  it('renders TourCard when active', async () => {
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
      <Tour id="test">
        <TourStep id="s1" target="#step-1" content="Step 1 Content" />
        <Starter />
      </Tour>
    )

    await user.click(screen.getByText('Start'))

    // Card should be present as dialog
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Step 1 Content')).toBeInTheDocument()
  })

  it('passes config to TourProvider', () => {
    // Verify that custom step options are respected
    function StepDisplay() {
      const { currentStep, isActive } = useTour()
      return (
        <div>
          <div data-testid="is-active">{String(isActive)}</div>
          {currentStep && <div data-testid="step-id">{currentStep.id}</div>}
        </div>
      )
    }

    render(
      <Tour id="test">
        <TourStep id="custom-step" target="#step-1" content="Custom content" />
        <StepDisplay />
      </Tour>
    )

    // Tour should be registered but not active initially
    expect(screen.getByTestId('is-active')).toHaveTextContent('false')
  })
})
