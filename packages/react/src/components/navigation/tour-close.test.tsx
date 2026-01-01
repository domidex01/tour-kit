import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { type Tour, TourProvider, useTour } from '@tour-kit/core'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TourClose } from './tour-close'

describe('TourClose', () => {
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
    steps: [{ id: 's1', target: '#target', content: 'Step 1' }],
  }

  const wrapper = ({ children }: { children: ReactNode }) => (
    <TourProvider tours={[testTour]}>{children}</TourProvider>
  )

  beforeEach(() => {
    document.body.innerHTML = '<div id="target">Target</div>'
    const target = document.getElementById('target')
    if (target) {
      vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(mockRect)
    }
  })

  it('renders button with accessible label', () => {
    render(<TourClose />, { wrapper })

    expect(screen.getByRole('button', { name: 'Close tour' })).toBeInTheDocument()
  })

  it('uses custom aria-label', () => {
    render(<TourClose aria-label="Dismiss" />, { wrapper })

    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeInTheDocument()
  })

  it('calls skip when clicked', async () => {
    const user = userEvent.setup()

    function TestWrapper({ children }: { children: ReactNode }) {
      return (
        <TourProvider tours={[testTour]}>
          <Controller />
          {children}
        </TourProvider>
      )
    }

    function Controller() {
      const { start, isActive } = useTour()
      return (
        <>
          <button type="button" onClick={() => start()}>
            Start
          </button>
          <span data-testid="active">{String(isActive)}</span>
        </>
      )
    }

    render(<TourClose />, { wrapper: TestWrapper })

    // Start tour
    await user.click(screen.getByText('Start'))
    expect(screen.getByTestId('active')).toHaveTextContent('true')

    // Click close
    await user.click(screen.getByRole('button', { name: 'Close tour' }))
    expect(screen.getByTestId('active')).toHaveTextContent('false')
  })

  it('renders close icon', () => {
    render(<TourClose />, { wrapper })

    const button = screen.getByRole('button', { name: 'Close tour' })
    expect(button.querySelector('svg')).toBeInTheDocument()
  })

  it('icon has aria-hidden', () => {
    render(<TourClose />, { wrapper })

    const button = screen.getByRole('button', { name: 'Close tour' })
    const svg = button.querySelector('svg')
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  it('applies className', () => {
    render(<TourClose className="custom-close" />, { wrapper })

    const button = screen.getByRole('button', { name: 'Close tour' })
    expect(button).toHaveClass('custom-close')
  })
})
