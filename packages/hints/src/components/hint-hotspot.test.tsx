import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { HintHotspot } from './hint-hotspot'

describe('HintHotspot', () => {
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

  const defaultProps = {
    targetRect: mockRect,
    position: 'top-right' as const,
    onClick: vi.fn(),
  }

  it('renders button with aria-label', () => {
    render(<HintHotspot {...defaultProps} />)

    expect(screen.getByRole('button', { name: 'Show hint' })).toBeInTheDocument()
  })

  it('has aria-expanded reflecting isOpen state', () => {
    const { rerender } = render(<HintHotspot {...defaultProps} isOpen={false} />)

    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false')

    rerender(<HintHotspot {...defaultProps} isOpen={true} />)

    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
  })

  it('positions at top-right corner', () => {
    render(<HintHotspot {...defaultProps} position="top-right" />)

    const button = screen.getByRole('button')
    // top-right: top = rect.top - offset (4), left = rect.right - offset (4)
    expect(button).toHaveStyle({ top: '96px', left: '296px' })
  })

  it('positions at top-left corner', () => {
    render(<HintHotspot {...defaultProps} position="top-left" />)

    const button = screen.getByRole('button')
    // top-left: top = rect.top - offset, left = rect.left - offset
    expect(button).toHaveStyle({ top: '96px', left: '96px' })
  })

  it('positions at bottom-right corner', () => {
    render(<HintHotspot {...defaultProps} position="bottom-right" />)

    const button = screen.getByRole('button')
    // bottom-right: top = rect.bottom - offset, left = rect.right - offset
    expect(button).toHaveStyle({ top: '196px', left: '296px' })
  })

  it('positions at bottom-left corner', () => {
    render(<HintHotspot {...defaultProps} position="bottom-left" />)

    const button = screen.getByRole('button')
    // bottom-left: top = rect.bottom - offset, left = rect.left - offset
    expect(button).toHaveStyle({ top: '196px', left: '96px' })
  })

  it('positions at center', () => {
    render(<HintHotspot {...defaultProps} position="center" />)

    const button = screen.getByRole('button')
    // center: top = rect.top + height/2 - 6, left = rect.left + width/2 - 6
    // top = 100 + 50 - 6 = 144, left = 100 + 100 - 6 = 194
    expect(button).toHaveStyle({ top: '144px', left: '194px' })
  })

  it('has pulse animation class when enabled and closed', () => {
    render(<HintHotspot {...defaultProps} pulse={true} isOpen={false} />)

    const button = screen.getByRole('button')
    expect(button).toHaveClass('animate-tour-pulse')
  })

  it('has no pulse animation class when open', () => {
    render(<HintHotspot {...defaultProps} pulse={true} isOpen={true} />)

    const button = screen.getByRole('button')
    expect(button).not.toHaveClass('animate-tour-pulse')
  })

  it('has no pulse animation class when disabled', () => {
    render(<HintHotspot {...defaultProps} pulse={false} isOpen={false} />)

    const button = screen.getByRole('button')
    expect(button).not.toHaveClass('animate-tour-pulse')
  })

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()

    render(<HintHotspot {...defaultProps} onClick={onClick} />)

    await user.click(screen.getByRole('button'))

    expect(onClick).toHaveBeenCalled()
  })

  it('forwards ref to button', () => {
    const ref = createRef<HTMLButtonElement>()

    render(<HintHotspot {...defaultProps} ref={ref} />)

    expect(ref.current).toBeInstanceOf(HTMLButtonElement)
  })

  it('applies custom className', () => {
    render(<HintHotspot {...defaultProps} className="custom-hotspot" />)

    expect(screen.getByRole('button')).toHaveClass('custom-hotspot')
  })

  it('has fixed positioning class', () => {
    render(<HintHotspot {...defaultProps} />)

    const button = screen.getByRole('button')
    expect(button).toHaveClass('fixed')
  })

  it('has z-index class by default', () => {
    render(<HintHotspot {...defaultProps} />)

    const button = screen.getByRole('button')
    expect(button).toHaveClass('z-50')
  })

  it('has high z-index class when specified', () => {
    render(<HintHotspot {...defaultProps} zIndex="high" />)

    const button = screen.getByRole('button')
    expect(button).toHaveClass('z-[9999]')
  })

  it('has size classes by default', () => {
    render(<HintHotspot {...defaultProps} />)

    const button = screen.getByRole('button')
    // Default size is 'default' which gives h-3 w-3
    expect(button).toHaveClass('h-3', 'w-3')
  })

  it('has button type', () => {
    render(<HintHotspot {...defaultProps} />)

    const button = screen.getByRole('button')
    expect(button).toHaveAttribute('type', 'button')
  })

  it('defaults to top-right when unknown position is provided', () => {
    // @ts-expect-error - Testing invalid position fallback
    render(<HintHotspot {...defaultProps} position="invalid-position" />)

    const button = screen.getByRole('button')
    // Should fallback to top-right positioning
    expect(button).toHaveStyle({ top: '96px', left: '296px' })
  })
})
