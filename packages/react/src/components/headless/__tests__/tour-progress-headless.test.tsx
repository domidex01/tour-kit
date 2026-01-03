import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { TourProgressHeadless, type TourProgressRenderProps } from '../tour-progress'

describe('TourProgressHeadless', () => {
  const defaultProps = {
    current: 2,
    total: 5,
  }

  describe('Dots Variant (Default)', () => {
    it('renders container div', () => {
      const { container } = render(<TourProgressHeadless {...defaultProps} />)

      expect(container.querySelector('div')).toBeInTheDocument()
    })

    it('renders correct number of dots', () => {
      const { container } = render(<TourProgressHeadless {...defaultProps} total={5} />)

      // Select only elements with data-active attribute (the dots)
      const dots = container.querySelectorAll('[data-active]')
      expect(dots.length).toBe(5)
    })

    it('marks current dot as active', () => {
      const { container } = render(<TourProgressHeadless current={3} total={5} />)

      const dots = container.querySelectorAll('[data-active]')
      // Dots are 0-indexed in the array, but current is 1-indexed
      // current=3 means the third dot (index 2) should be active
      expect(dots[2]).toHaveAttribute('data-active', 'true')
    })

    it('marks other dots as not active', () => {
      const { container } = render(<TourProgressHeadless current={3} total={5} />)

      const dots = container.querySelectorAll('[data-active]')
      expect(dots[0]).toHaveAttribute('data-active', 'false')
      expect(dots[1]).toHaveAttribute('data-active', 'false')
      expect(dots[3]).toHaveAttribute('data-active', 'false')
      expect(dots[4]).toHaveAttribute('data-active', 'false')
    })

    it('applies className to container', () => {
      const { container } = render(
        <TourProgressHeadless {...defaultProps} className="custom-progress" />
      )

      expect(container.firstChild).toHaveClass('custom-progress')
    })

    it('applies style to container', () => {
      const { container } = render(
        <TourProgressHeadless {...defaultProps} style={{ gap: '8px' }} />
      )

      expect(container.firstChild).toHaveStyle({ gap: '8px' })
    })

    it('renders first dot as active on first step', () => {
      const { container } = render(<TourProgressHeadless current={1} total={5} />)

      const dots = container.querySelectorAll('[data-active]')
      expect(dots[0]).toHaveAttribute('data-active', 'true')
    })

    it('renders last dot as active on last step', () => {
      const { container } = render(<TourProgressHeadless current={5} total={5} />)

      const dots = container.querySelectorAll('[data-active]')
      expect(dots[4]).toHaveAttribute('data-active', 'true')
    })
  })

  describe('Bar Variant', () => {
    it('renders container div', () => {
      const { container } = render(<TourProgressHeadless {...defaultProps} variant="bar" />)

      expect(container.querySelector('div')).toBeInTheDocument()
    })

    it('renders inner progress div', () => {
      const { container } = render(<TourProgressHeadless {...defaultProps} variant="bar" />)

      // Get the inner progress div (child of component container)
      const innerDiv = (container.firstChild as HTMLElement)?.querySelector('div')
      expect(innerDiv).toBeInTheDocument()
    })

    it('sets correct width percentage', () => {
      const { container } = render(<TourProgressHeadless current={2} total={4} variant="bar" />)

      const innerDiv = (container.firstChild as HTMLElement)?.querySelector('div')
      // 2/4 = 50%
      expect(innerDiv).toHaveStyle({ width: '50%' })
    })

    it('shows 100% width on last step', () => {
      const { container } = render(<TourProgressHeadless current={5} total={5} variant="bar" />)

      const innerDiv = (container.firstChild as HTMLElement)?.querySelector('div')
      expect(innerDiv).toHaveStyle({ width: '100%' })
    })

    it('shows 20% width on first step of 5', () => {
      const { container } = render(<TourProgressHeadless current={1} total={5} variant="bar" />)

      const innerDiv = (container.firstChild as HTMLElement)?.querySelector('div')
      expect(innerDiv).toHaveStyle({ width: '20%' })
    })

    it('applies className to container', () => {
      const { container } = render(
        <TourProgressHeadless {...defaultProps} variant="bar" className="bar-container" />
      )

      expect(container.firstChild).toHaveClass('bar-container')
    })

    it('applies style to container', () => {
      const { container } = render(
        <TourProgressHeadless {...defaultProps} variant="bar" style={{ height: '4px' }} />
      )

      expect(container.firstChild).toHaveStyle({ height: '4px' })
    })
  })

  describe('Text Variant', () => {
    it('renders span element', () => {
      render(<TourProgressHeadless {...defaultProps} variant="text" />)

      expect(document.querySelector('span')).toBeInTheDocument()
    })

    it('shows correct text format', () => {
      render(<TourProgressHeadless current={2} total={5} variant="text" />)

      expect(screen.getByText('2 of 5')).toBeInTheDocument()
    })

    it('updates text on step change', () => {
      const { rerender } = render(<TourProgressHeadless current={1} total={5} variant="text" />)

      expect(screen.getByText('1 of 5')).toBeInTheDocument()

      rerender(<TourProgressHeadless current={3} total={5} variant="text" />)

      expect(screen.getByText('3 of 5')).toBeInTheDocument()
    })

    it('applies className to span', () => {
      render(<TourProgressHeadless {...defaultProps} variant="text" className="text-progress" />)

      expect(document.querySelector('span')).toHaveClass('text-progress')
    })

    it('applies style to span', () => {
      render(<TourProgressHeadless {...defaultProps} variant="text" style={{ fontSize: '14px' }} />)

      expect(document.querySelector('span')).toHaveStyle({ fontSize: '14px' })
    })
  })

  describe('Render Prop Functionality', () => {
    it('calls render prop with TourProgressRenderProps', () => {
      const renderFn = vi.fn(() => <div>Custom</div>)

      render(<TourProgressHeadless {...defaultProps} render={renderFn} />)

      expect(renderFn).toHaveBeenCalledTimes(1)
    })

    it('render prop receives current', () => {
      let receivedProps: TourProgressRenderProps | undefined
      const renderFn = (props: TourProgressRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }

      render(<TourProgressHeadless current={3} total={5} render={renderFn} />)

      expect(receivedProps?.current).toBe(3)
    })

    it('render prop receives total', () => {
      let receivedProps: TourProgressRenderProps | undefined
      const renderFn = (props: TourProgressRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }

      render(<TourProgressHeadless current={2} total={10} render={renderFn} />)

      expect(receivedProps?.total).toBe(10)
    })

    it('render prop receives correctly calculated percentage', () => {
      let receivedProps: TourProgressRenderProps | undefined
      const renderFn = (props: TourProgressRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }

      render(<TourProgressHeadless current={3} total={10} render={renderFn} />)

      expect(receivedProps?.percentage).toBe(30)
    })

    it('percentage is 50 when current=2 and total=4', () => {
      let receivedProps: TourProgressRenderProps | undefined
      const renderFn = (props: TourProgressRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }

      render(<TourProgressHeadless current={2} total={4} render={renderFn} />)

      expect(receivedProps?.percentage).toBe(50)
    })

    it('percentage is 100 on last step', () => {
      let receivedProps: TourProgressRenderProps | undefined
      const renderFn = (props: TourProgressRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }

      render(<TourProgressHeadless current={5} total={5} render={renderFn} />)

      expect(receivedProps?.percentage).toBe(100)
    })

    it('uses render prop output instead of default', () => {
      const renderFn = () => <div data-testid="custom-progress">Custom Progress</div>

      render(<TourProgressHeadless {...defaultProps} render={renderFn} />)

      expect(screen.getByTestId('custom-progress')).toBeInTheDocument()
    })

    it('render prop overrides variant prop', () => {
      const renderFn = () => <div data-testid="render-output">Custom</div>

      render(<TourProgressHeadless {...defaultProps} variant="text" render={renderFn} />)

      expect(screen.getByTestId('render-output')).toBeInTheDocument()
      expect(screen.queryByText('2 of 5')).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles single step tour (total=1)', () => {
      const { container } = render(<TourProgressHeadless current={1} total={1} />)

      const dots = container.querySelectorAll('[data-active]')
      expect(dots.length).toBe(1)
      expect(dots[0]).toHaveAttribute('data-active', 'true')
    })

    it('percentage calculation handles decimals', () => {
      let receivedProps: TourProgressRenderProps | undefined
      const renderFn = (props: TourProgressRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }

      render(<TourProgressHeadless current={1} total={3} render={renderFn} />)

      // 1/3 = 33.333...%
      expect(receivedProps?.percentage).toBeCloseTo(33.333, 2)
    })

    it('first step percentage is 20% for 5 steps', () => {
      let receivedProps: TourProgressRenderProps | undefined
      const renderFn = (props: TourProgressRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }

      render(<TourProgressHeadless current={1} total={5} render={renderFn} />)

      expect(receivedProps?.percentage).toBe(20)
    })

    it('handles large number of steps', () => {
      const { container } = render(<TourProgressHeadless current={50} total={100} />)

      const dots = container.querySelectorAll('[data-active]')
      expect(dots.length).toBe(100)
    })

    it('bar variant handles fractional percentages', () => {
      const { container } = render(<TourProgressHeadless current={1} total={3} variant="bar" />)

      const innerDiv = (container.firstChild as HTMLElement)?.querySelector('div')
      // 1/3 = 33.333...%
      expect(innerDiv?.style.width).toMatch(/33\.333/)
    })
  })

  describe('Variant Selection', () => {
    it('defaults to dots variant', () => {
      const { container } = render(<TourProgressHeadless {...defaultProps} />)

      // Dots variant creates elements with data-active attribute
      const dots = container.querySelectorAll('[data-active]')
      expect(dots.length).toBe(5) // total is 5
    })

    it('switches to bar variant', () => {
      const { container } = render(<TourProgressHeadless {...defaultProps} variant="bar" />)

      // Bar variant creates a single child div with width style
      const innerDiv = (container.firstChild as HTMLElement)?.querySelector('div')
      expect(innerDiv).toHaveStyle({ width: '40%' }) // 2/5 = 40%
    })

    it('switches to text variant', () => {
      render(<TourProgressHeadless {...defaultProps} variant="text" />)

      // Text variant creates a span with text content
      expect(screen.getByText('2 of 5')).toBeInTheDocument()
    })
  })
})
