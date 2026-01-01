import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TourProgress } from './tour-progress'

describe('TourProgress', () => {
  describe('text variant', () => {
    it('renders current of total', () => {
      render(<TourProgress current={2} total={5} variant="text" />)

      expect(screen.getByText('2 of 5')).toBeInTheDocument()
    })

    it('renders with different values', () => {
      render(<TourProgress current={1} total={10} variant="text" />)

      expect(screen.getByText('1 of 10')).toBeInTheDocument()
    })
  })

  describe('dots variant (default)', () => {
    it('renders correct number of dots', () => {
      const { container } = render(<TourProgress current={2} total={5} />)

      const dots = container.querySelectorAll('.rounded-full')
      expect(dots).toHaveLength(5)
    })

    it('highlights current dot', () => {
      const { container } = render(<TourProgress current={2} total={5} />)

      const dots = container.querySelectorAll('.rounded-full')
      // 2nd dot (index 1) should have primary color
      expect(dots[1]).toHaveClass('bg-primary')
      expect(dots[0]).toHaveClass('bg-secondary')
    })

    it('renders single dot for single step', () => {
      const { container } = render(<TourProgress current={1} total={1} />)

      const dots = container.querySelectorAll('.rounded-full')
      expect(dots).toHaveLength(1)
      expect(dots[0]).toHaveClass('bg-primary')
    })

    it('is default variant', () => {
      const { container: withVariant } = render(
        <TourProgress current={1} total={3} variant="dots" />
      )
      const { container: withoutVariant } = render(<TourProgress current={1} total={3} />)

      // Both should have dots
      expect(withVariant.querySelectorAll('.rounded-full').length).toBe(3)
      expect(withoutVariant.querySelectorAll('.rounded-full').length).toBe(3)
    })
  })

  describe('bar variant', () => {
    it('renders progress bar', () => {
      const { container } = render(<TourProgress current={2} total={5} variant="bar" />)

      const bar = container.querySelector('.bg-primary')
      expect(bar).toBeInTheDocument()
    })

    it('has correct width percentage', () => {
      const { container } = render(<TourProgress current={2} total={5} variant="bar" />)

      const bar = container.querySelector('.bg-primary') as HTMLElement
      expect(bar.style.width).toBe('40%')
    })

    it('shows 100% on last step', () => {
      const { container } = render(<TourProgress current={5} total={5} variant="bar" />)

      const bar = container.querySelector('.bg-primary') as HTMLElement
      expect(bar.style.width).toBe('100%')
    })

    it('shows 0% on first step when no progress', () => {
      const { container } = render(<TourProgress current={0} total={5} variant="bar" />)

      const bar = container.querySelector('.bg-primary') as HTMLElement
      expect(bar.style.width).toBe('0%')
    })
  })

  it('applies custom className', () => {
    const { container } = render(<TourProgress current={1} total={3} className="custom-class" />)

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('applies className to text variant', () => {
    render(<TourProgress current={1} total={3} variant="text" className="text-custom" />)

    expect(screen.getByText('1 of 3')).toHaveClass('text-custom')
  })

  it('applies className to bar variant', () => {
    const { container } = render(
      <TourProgress current={1} total={3} variant="bar" className="bar-custom" />
    )

    expect(container.firstChild).toHaveClass('bar-custom')
  })
})
