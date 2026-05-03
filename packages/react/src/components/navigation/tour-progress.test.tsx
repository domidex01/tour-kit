/// <reference types="vitest-axe/extend-expect" />
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'
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
      expect(dots[0]).toHaveClass('bg-muted')
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

  describe('narrow variant', () => {
    it('exposes role=progressbar with correct aria values', () => {
      render(<TourProgress current={2} total={4} variant="narrow" />)
      const bar = screen.getByRole('progressbar')
      expect(bar.getAttribute('aria-valuenow')).toBe('2')
      expect(bar.getAttribute('aria-valuemin')).toBe('0')
      expect(bar.getAttribute('aria-valuemax')).toBe('4')
    })

    it('renders inner fill at correct width percentage', () => {
      const { container } = render(<TourProgress current={2} total={4} variant="narrow" />)
      const fill = container.querySelector('.bg-primary') as HTMLElement
      expect(fill.style.width).toBe('50%')
    })
  })

  describe('chain variant', () => {
    it('exposes role=progressbar with correct aria values', () => {
      render(<TourProgress current={2} total={4} variant="chain" />)
      const bar = screen.getByRole('progressbar')
      expect(bar.getAttribute('aria-valuenow')).toBe('2')
      expect(bar.getAttribute('aria-valuemin')).toBe('0')
      expect(bar.getAttribute('aria-valuemax')).toBe('4')
    })

    it('renders one segment per step with correct status attrs', () => {
      const { container } = render(<TourProgress current={2} total={4} variant="chain" />)
      const segments = container.querySelectorAll<HTMLElement>('[data-status]')
      expect(segments).toHaveLength(4)
      expect(segments[0]?.getAttribute('data-status')).toBe('completed')
      expect(segments[1]?.getAttribute('data-status')).toBe('active')
      expect(segments[2]?.getAttribute('data-status')).toBe('pending')
      expect(segments[3]?.getAttribute('data-status')).toBe('pending')
    })
  })

  describe('numbered variant', () => {
    it('exposes role=progressbar with correct aria values', () => {
      render(<TourProgress current={3} total={7} variant="numbered" />)
      const bar = screen.getByRole('progressbar')
      expect(bar.getAttribute('aria-valuenow')).toBe('3')
      expect(bar.getAttribute('aria-valuemin')).toBe('0')
      expect(bar.getAttribute('aria-valuemax')).toBe('7')
    })

    it('renders the current and total numbers', () => {
      render(<TourProgress current={3} total={7} variant="numbered" />)
      const bar = screen.getByRole('progressbar')
      expect(bar.textContent).toContain('3')
      expect(bar.textContent).toContain('7')
    })
  })

  describe('none variant', () => {
    it('renders null', () => {
      const { container } = render(<TourProgress current={2} total={4} variant="none" />)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('a11y (vitest-axe)', () => {
    it.each(['narrow', 'chain', 'numbered'] as const)(
      'variant=%s reports zero axe violations',
      async (variant) => {
        const { container } = render(<TourProgress current={2} total={4} variant={variant} />)
        const results = await axe(container)
        expect(results).toHaveNoViolations()
      }
    )
  })
})
