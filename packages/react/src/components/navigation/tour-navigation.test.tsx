import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TourNavigation } from './tour-navigation'

describe('TourNavigation', () => {
  const defaultProps = {
    isFirstStep: false,
    isLastStep: false,
    onPrev: vi.fn(),
    onNext: vi.fn(),
  }

  it('renders next button', () => {
    render(<TourNavigation {...defaultProps} />)

    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
  })

  it('renders back button when not first step', () => {
    render(<TourNavigation {...defaultProps} isFirstStep={false} />)

    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
  })

  it('hides back button on first step', () => {
    render(<TourNavigation {...defaultProps} isFirstStep={true} />)

    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument()
  })

  it('shows skip button when onSkip provided', () => {
    render(<TourNavigation {...defaultProps} onSkip={vi.fn()} />)

    expect(screen.getByRole('button', { name: /skip/i })).toBeInTheDocument()
  })

  it('hides skip on last step', () => {
    render(<TourNavigation {...defaultProps} onSkip={vi.fn()} isLastStep={true} />)

    expect(screen.queryByRole('button', { name: /skip/i })).not.toBeInTheDocument()
  })

  it('shows "Finish" on last step', () => {
    render(<TourNavigation {...defaultProps} isLastStep={true} />)

    expect(screen.getByRole('button', { name: /finish/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^next$/i })).not.toBeInTheDocument()
  })

  it('shows "Next" on non-last step', () => {
    render(<TourNavigation {...defaultProps} isLastStep={false} />)

    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /finish/i })).not.toBeInTheDocument()
  })

  it('calls onNext when next is clicked', async () => {
    const onNext = vi.fn()
    const user = userEvent.setup()

    render(<TourNavigation {...defaultProps} onNext={onNext} />)

    await user.click(screen.getByRole('button', { name: /next/i }))

    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('calls onPrev when back is clicked', async () => {
    const onPrev = vi.fn()
    const user = userEvent.setup()

    render(<TourNavigation {...defaultProps} onPrev={onPrev} />)

    await user.click(screen.getByRole('button', { name: /back/i }))

    expect(onPrev).toHaveBeenCalledTimes(1)
  })

  it('calls onSkip when skip is clicked', async () => {
    const onSkip = vi.fn()
    const user = userEvent.setup()

    render(<TourNavigation {...defaultProps} onSkip={onSkip} />)

    await user.click(screen.getByRole('button', { name: /skip/i }))

    expect(onSkip).toHaveBeenCalledTimes(1)
  })

  it('uses custom labels', () => {
    render(
      <TourNavigation
        {...defaultProps}
        prevLabel="Previous"
        nextLabel="Continue"
        finishLabel="Done"
        skipLabel="Exit"
        isLastStep={false}
        onSkip={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: 'Previous' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Exit' })).toBeInTheDocument()
  })

  it('uses custom finish label on last step', () => {
    render(<TourNavigation {...defaultProps} finishLabel="Complete Tour" isLastStep={true} />)

    expect(screen.getByRole('button', { name: 'Complete Tour' })).toBeInTheDocument()
  })

  it('applies className', () => {
    const { container } = render(<TourNavigation {...defaultProps} className="custom-nav" />)

    expect(container.firstChild).toHaveClass('custom-nav')
  })
})
