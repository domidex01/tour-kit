import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TourCardFooter } from './tour-card-footer'

describe('TourCardFooter', () => {
  const defaultProps = {
    currentStep: 2,
    totalSteps: 5,
    showNavigation: true,
    showProgress: true,
    isFirstStep: false,
    isLastStep: false,
    onPrev: vi.fn(),
    onNext: vi.fn(),
    onSkip: vi.fn(),
  }

  it('renders progress indicator with dots by default', () => {
    const { container } = render(<TourCardFooter {...defaultProps} />)

    // Should have 5 dots for 5 steps
    const dots = container.querySelectorAll('.rounded-full')
    expect(dots).toHaveLength(5)
  })

  it('hides progress when showProgress is false', () => {
    const { container } = render(<TourCardFooter {...defaultProps} showProgress={false} />)

    const dots = container.querySelectorAll('.rounded-full')
    expect(dots).toHaveLength(0)
  })

  it('renders navigation buttons', () => {
    render(<TourCardFooter {...defaultProps} />)

    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument()
  })

  it('hides navigation when showNavigation is false', () => {
    render(<TourCardFooter {...defaultProps} showNavigation={false} />)

    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument()
  })

  it('calls onNext when next is clicked', async () => {
    const onNext = vi.fn()
    const user = userEvent.setup()

    render(<TourCardFooter {...defaultProps} onNext={onNext} />)

    await user.click(screen.getByRole('button', { name: /next/i }))

    expect(onNext).toHaveBeenCalled()
  })

  it('calls onPrev when back is clicked', async () => {
    const onPrev = vi.fn()
    const user = userEvent.setup()

    render(<TourCardFooter {...defaultProps} onPrev={onPrev} />)

    await user.click(screen.getByRole('button', { name: /back/i }))

    expect(onPrev).toHaveBeenCalled()
  })

  it('calls onSkip when skip is clicked', async () => {
    const onSkip = vi.fn()
    const user = userEvent.setup()

    render(<TourCardFooter {...defaultProps} onSkip={onSkip} />)

    await user.click(screen.getByRole('button', { name: /skip/i }))

    expect(onSkip).toHaveBeenCalled()
  })

  it('shows Finish on last step', () => {
    render(<TourCardFooter {...defaultProps} isLastStep={true} />)

    expect(screen.getByRole('button', { name: /finish/i })).toBeInTheDocument()
  })

  it('hides Back on first step', () => {
    render(<TourCardFooter {...defaultProps} isFirstStep={true} />)

    expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument()
  })

  it('applies className', () => {
    const { container } = render(<TourCardFooter {...defaultProps} className="custom-footer" />)

    expect(container.firstChild).toHaveClass('custom-footer')
  })

  it('shows both progress and navigation by default', () => {
    const { container } = render(<TourCardFooter {...defaultProps} />)

    // Progress dots
    const dots = container.querySelectorAll('.rounded-full')
    expect(dots.length).toBeGreaterThan(0)

    // Navigation buttons
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
  })

  it('shows only navigation when showProgress is false', () => {
    const { container } = render(<TourCardFooter {...defaultProps} showProgress={false} />)

    const dots = container.querySelectorAll('.rounded-full')
    expect(dots).toHaveLength(0)
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
  })

  it('shows only progress when showNavigation is false', () => {
    const { container } = render(<TourCardFooter {...defaultProps} showNavigation={false} />)

    const dots = container.querySelectorAll('.rounded-full')
    expect(dots.length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument()
  })
})
