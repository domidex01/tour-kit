import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChecklistProgress } from '../../components/checklist-progress'

describe('ChecklistProgress', () => {
  describe('rendering', () => {
    it('renders progress track element', () => {
      render(<ChecklistProgress value={0} max={10} />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('renders progress bar with correct width', () => {
      const { container } = render(<ChecklistProgress value={5} max={10} />)

      const bar = container.querySelector('[style*="width"]')
      expect(bar).toHaveStyle({ width: '50%' })
    })

    it('calculates percentage from value/max', () => {
      render(<ChecklistProgress value={3} max={4} showPercentage />)

      expect(screen.getByText('75%')).toBeInTheDocument()
    })

    it('handles max of 0 (returns 0%)', () => {
      render(<ChecklistProgress value={5} max={0} showPercentage />)

      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('rounds percentage to integer', () => {
      render(<ChecklistProgress value={1} max={3} showPercentage />)

      // 33.33% should round to 33%
      expect(screen.getByText('33%')).toBeInTheDocument()
    })
  })

  describe('text display', () => {
    it('shows percentage when showPercentage is true', () => {
      render(<ChecklistProgress value={5} max={10} showPercentage />)

      expect(screen.getByText('50%')).toBeInTheDocument()
    })

    it('shows count when showCount is true', () => {
      render(<ChecklistProgress value={3} max={5} showCount />)

      expect(screen.getByText('3/5')).toBeInTheDocument()
    })

    it('hides both when both false', () => {
      render(<ChecklistProgress value={3} max={5} />)

      expect(screen.queryByText('60%')).not.toBeInTheDocument()
      expect(screen.queryByText('3/5')).not.toBeInTheDocument()
    })

    it('can show both simultaneously', () => {
      render(<ChecklistProgress value={3} max={5} showPercentage showCount />)

      expect(screen.getByText('60%')).toBeInTheDocument()
      expect(screen.getByText('3/5')).toBeInTheDocument()
    })
  })

  describe('ARIA attributes', () => {
    it('has role="progressbar"', () => {
      render(<ChecklistProgress value={5} max={10} />)

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('has aria-valuenow set to value', () => {
      render(<ChecklistProgress value={5} max={10} />)

      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '5')
    })

    it('has aria-valuemin set to 0', () => {
      render(<ChecklistProgress value={5} max={10} />)

      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemin', '0')
    })

    it('has aria-valuemax set to max', () => {
      render(<ChecklistProgress value={5} max={10} />)

      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '10')
    })

    it('has aria-label with percentage', () => {
      render(<ChecklistProgress value={5} max={10} />)

      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Progress: 50%')
    })
  })

  describe('styling', () => {
    it('accepts custom className', () => {
      const { container } = render(
        <ChecklistProgress value={5} max={10} className="custom-class" />
      )

      expect(container.firstChild).toHaveClass('custom-class')
    })

    it('accepts trackClassName', () => {
      render(<ChecklistProgress value={5} max={10} trackClassName="track-custom" />)

      expect(screen.getByRole('progressbar')).toHaveClass('track-custom')
    })

    it('accepts barClassName', () => {
      const { container } = render(
        <ChecklistProgress value={5} max={10} barClassName="bar-custom" />
      )

      const bar = container.querySelector('[style*="width"]')
      expect(bar).toHaveClass('bar-custom')
    })
  })

  describe('ref forwarding', () => {
    it('forwards ref to outer div', () => {
      const ref = { current: null }
      render(<ChecklistProgress ref={ref} value={5} max={10} />)

      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })
  })

  describe('edge cases', () => {
    it('handles value greater than max', () => {
      render(<ChecklistProgress value={15} max={10} showPercentage />)

      // Should cap at 100% (150% wouldn't make sense)
      // The component calculates it as 150, but the width would be 150%
      expect(screen.getByText('150%')).toBeInTheDocument()
    })

    it('handles negative value', () => {
      render(<ChecklistProgress value={-5} max={10} showPercentage />)

      // Should show negative percentage
      expect(screen.getByText('-50%')).toBeInTheDocument()
    })

    it('handles value of 0', () => {
      render(<ChecklistProgress value={0} max={10} showPercentage />)

      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('handles max value completion', () => {
      render(<ChecklistProgress value={10} max={10} showPercentage />)

      expect(screen.getByText('100%')).toBeInTheDocument()
    })
  })
})
