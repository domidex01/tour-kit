import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { HintHotspotHeadless, type HintHotspotRenderProps } from '../hint-hotspot'

describe('HintHotspotHeadless', () => {
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

  const defaultProps = {
    targetRect: mockRect,
    position: 'top-right' as const,
  }

  describe('Rendering', () => {
    it('renders a button element', () => {
      render(<HintHotspotHeadless {...defaultProps} />)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('has type="button"', () => {
      render(<HintHotspotHeadless {...defaultProps} />)

      expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
    })

    it('has aria-label="Show hint"', () => {
      render(<HintHotspotHeadless {...defaultProps} />)

      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Show hint')
    })

    it('has aria-expanded attribute', () => {
      render(<HintHotspotHeadless {...defaultProps} />)

      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded')
    })

    it('aria-expanded is false by default', () => {
      render(<HintHotspotHeadless {...defaultProps} />)

      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false')
    })

    it('aria-expanded is true when isOpen=true', () => {
      render(<HintHotspotHeadless {...defaultProps} isOpen={true} />)

      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
    })

    it('applies className', () => {
      render(<HintHotspotHeadless {...defaultProps} className="custom-hotspot" />)

      expect(screen.getByRole('button')).toHaveClass('custom-hotspot')
    })

    it('applies style merged with position styles', () => {
      render(<HintHotspotHeadless {...defaultProps} style={{ backgroundColor: 'red' }} />)

      const button = screen.getByRole('button')
      // Check that both custom style and base styles are applied
      expect(button.style.backgroundColor).toBe('red')
      expect(button.style.position).toBe('fixed')
    })

    it('has position:fixed', () => {
      render(<HintHotspotHeadless {...defaultProps} />)

      expect(screen.getByRole('button')).toHaveStyle({ position: 'fixed' })
    })
  })

  describe('forwardRef Support', () => {
    it('forwards ref to button element', () => {
      const ref = createRef<HTMLButtonElement>()

      render(<HintHotspotHeadless {...defaultProps} ref={ref} />)

      expect(ref.current).toBeInstanceOf(HTMLButtonElement)
      expect(ref.current).toBe(screen.getByRole('button'))
    })

    it('ref is available after mount', () => {
      const ref = createRef<HTMLButtonElement>()

      render(<HintHotspotHeadless {...defaultProps} ref={ref} />)

      expect(ref.current).not.toBeNull()
    })

    it('ref remains valid after rerender', () => {
      const ref = createRef<HTMLButtonElement>()

      const { rerender } = render(<HintHotspotHeadless {...defaultProps} ref={ref} />)

      const initialRef = ref.current

      rerender(<HintHotspotHeadless {...defaultProps} ref={ref} isOpen={true} />)

      expect(ref.current).toBe(initialRef)
    })
  })

  describe('Props Spreading', () => {
    it('spreads data-testid attribute', () => {
      render(<HintHotspotHeadless {...defaultProps} data-testid="custom-hotspot" />)

      expect(screen.getByTestId('custom-hotspot')).toBeInTheDocument()
    })

    it('spreads onClick handler', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()

      render(<HintHotspotHeadless {...defaultProps} onClick={onClick} />)

      await user.click(screen.getByRole('button'))

      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('spreads onKeyDown handler', async () => {
      const user = userEvent.setup()
      const onKeyDown = vi.fn()

      render(<HintHotspotHeadless {...defaultProps} onKeyDown={onKeyDown} />)

      const button = screen.getByRole('button')
      button.focus()
      await user.keyboard('{Enter}')

      expect(onKeyDown).toHaveBeenCalled()
    })

    it('spreads aria attributes', () => {
      render(<HintHotspotHeadless {...defaultProps} aria-describedby="description" />)

      expect(screen.getByRole('button')).toHaveAttribute('aria-describedby', 'description')
    })
  })

  describe('Position Calculation', () => {
    const offset = 4

    it('calculates top-left position correctly', () => {
      render(<HintHotspotHeadless {...defaultProps} position="top-left" />)

      const button = screen.getByRole('button')
      expect(button).toHaveStyle({
        top: `${mockRect.top - offset}px`,
        left: `${mockRect.left - offset}px`,
      })
    })

    it('calculates top-right position correctly', () => {
      render(<HintHotspotHeadless {...defaultProps} position="top-right" />)

      const button = screen.getByRole('button')
      expect(button).toHaveStyle({
        top: `${mockRect.top - offset}px`,
        left: `${mockRect.right - offset}px`,
      })
    })

    it('calculates bottom-left position correctly', () => {
      render(<HintHotspotHeadless {...defaultProps} position="bottom-left" />)

      const button = screen.getByRole('button')
      expect(button).toHaveStyle({
        top: `${mockRect.bottom - offset}px`,
        left: `${mockRect.left - offset}px`,
      })
    })

    it('calculates bottom-right position correctly', () => {
      render(<HintHotspotHeadless {...defaultProps} position="bottom-right" />)

      const button = screen.getByRole('button')
      expect(button).toHaveStyle({
        top: `${mockRect.bottom - offset}px`,
        left: `${mockRect.right - offset}px`,
      })
    })

    it('calculates center position correctly', () => {
      render(<HintHotspotHeadless {...defaultProps} position="center" />)

      const button = screen.getByRole('button')
      const expectedTop = mockRect.top + mockRect.height / 2 - 6
      const expectedLeft = mockRect.left + mockRect.width / 2 - 6

      expect(button).toHaveStyle({
        top: `${expectedTop}px`,
        left: `${expectedLeft}px`,
      })
    })

    it('uses offset of 4px for corner positions', () => {
      const positions = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const

      for (const position of positions) {
        const { unmount } = render(<HintHotspotHeadless {...defaultProps} position={position} />)
        const button = screen.getByRole('button')

        // All corner positions use the same 4px offset
        const style = button.style
        const top = Number.parseInt(style.top, 10)
        const left = Number.parseInt(style.left, 10)

        // Verify the offset is applied (values should be 4px offset from rect edges)
        // Corner positions use 4px offset from rect edges
        expect(top === mockRect.top - 4 || top === mockRect.bottom - 4).toBe(true)
        expect(left === mockRect.left - 4 || left === mockRect.right - 4).toBe(true)

        unmount()
      }
    })
  })

  describe('Render Prop Functionality', () => {
    it('calls render prop with HintHotspotRenderProps', () => {
      const renderFn = vi.fn(() => <div data-testid="custom">Custom</div>)

      render(<HintHotspotHeadless {...defaultProps} render={renderFn} />)

      expect(renderFn).toHaveBeenCalledTimes(1)
    })

    it('render prop receives position coordinates', () => {
      let receivedProps: HintHotspotRenderProps | undefined
      const renderFn = (props: HintHotspotRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }

      render(<HintHotspotHeadless {...defaultProps} position="top-right" render={renderFn} />)

      expect(receivedProps?.position).toEqual({
        top: mockRect.top - 4,
        left: mockRect.right - 4,
      })
    })

    it('render prop receives isOpen state', () => {
      let receivedProps: HintHotspotRenderProps | undefined
      const renderFn = (props: HintHotspotRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }

      render(<HintHotspotHeadless {...defaultProps} isOpen={true} render={renderFn} />)

      expect(receivedProps?.isOpen).toBe(true)
    })

    it('render prop receives targetRect', () => {
      let receivedProps: HintHotspotRenderProps | undefined
      const renderFn = (props: HintHotspotRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }

      render(<HintHotspotHeadless {...defaultProps} render={renderFn} />)

      expect(receivedProps?.targetRect).toBe(mockRect)
    })

    it('uses render prop output instead of default button', () => {
      const renderFn = () => <div data-testid="custom-hotspot">Custom Hotspot</div>

      render(<HintHotspotHeadless {...defaultProps} render={renderFn} />)

      expect(screen.getByTestId('custom-hotspot')).toBeInTheDocument()
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('does not render default button when render prop provided', () => {
      const renderFn = () => <span>Custom</span>

      render(<HintHotspotHeadless {...defaultProps} render={renderFn} />)

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('Display Name', () => {
    it('has displayName set', () => {
      expect(HintHotspotHeadless.displayName).toBe('HintHotspotHeadless')
    })
  })

  describe('Edge Cases', () => {
    it('handles zero-size targetRect', () => {
      const zeroRect: DOMRect = {
        top: 0,
        left: 0,
        bottom: 0,
        right: 0,
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }

      render(<HintHotspotHeadless targetRect={zeroRect} position="top-right" />)

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('handles large targetRect values', () => {
      const largeRect: DOMRect = {
        top: 10000,
        left: 10000,
        bottom: 10500,
        right: 10500,
        width: 500,
        height: 500,
        x: 10000,
        y: 10000,
        toJSON: () => ({}),
      }

      render(<HintHotspotHeadless targetRect={largeRect} position="center" />)

      const button = screen.getByRole('button')
      expect(button).toHaveStyle({
        top: `${10000 + 500 / 2 - 6}px`,
        left: `${10000 + 500 / 2 - 6}px`,
      })
    })

    it('handles negative targetRect values', () => {
      const negativeRect: DOMRect = {
        top: -100,
        left: -100,
        bottom: -50,
        right: -50,
        width: 50,
        height: 50,
        x: -100,
        y: -100,
        toJSON: () => ({}),
      }

      render(<HintHotspotHeadless targetRect={negativeRect} position="top-left" />)

      const button = screen.getByRole('button')
      expect(button).toHaveStyle({
        top: `${-100 - 4}px`,
        left: `${-100 - 4}px`,
      })
    })
  })

  describe('Accessibility', () => {
    it('button is focusable', () => {
      render(<HintHotspotHeadless {...defaultProps} />)

      const button = screen.getByRole('button')
      button.focus()
      expect(document.activeElement).toBe(button)
    })

    it('can be activated with Enter key', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()

      render(<HintHotspotHeadless {...defaultProps} onClick={onClick} />)

      const button = screen.getByRole('button')
      button.focus()
      await user.keyboard('{Enter}')

      expect(onClick).toHaveBeenCalled()
    })

    it('can be activated with Space key', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()

      render(<HintHotspotHeadless {...defaultProps} onClick={onClick} />)

      const button = screen.getByRole('button')
      button.focus()
      await user.keyboard(' ')

      expect(onClick).toHaveBeenCalled()
    })
  })
})
