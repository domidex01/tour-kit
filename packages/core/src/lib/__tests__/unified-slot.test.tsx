import { fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { type RenderProp, UnifiedSlot } from '../unified-slot'

describe('UnifiedSlot', () => {
  describe('Element Children (Radix UI style)', () => {
    it('clones element with merged props', () => {
      render(
        <UnifiedSlot data-testid="slot" className="slot-class">
          <button type="button" className="child-class">
            Click me
          </button>
        </UnifiedSlot>
      )

      const button = screen.getByRole('button')
      expect(button).toHaveClass('child-class')
      expect(button).toHaveAttribute('data-testid', 'slot')
    })

    it('child props take precedence over slot props for plain keys', () => {
      render(
        <UnifiedSlot data-value="slot-value">
          <button type="button" data-value="child-value">
            Click me
          </button>
        </UnifiedSlot>
      )

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-value', 'child-value')
    })

    it('concatenates className from slot and child', () => {
      render(
        <UnifiedSlot className="slot-cls">
          <button type="button" className="child-cls" data-testid="child">
            Click
          </button>
        </UnifiedSlot>
      )

      const btn = screen.getByTestId('child')
      expect(btn).toHaveClass('slot-cls')
      expect(btn).toHaveClass('child-cls')
    })

    it('merges style so child wins on collision but slot-only keys survive', () => {
      render(
        <UnifiedSlot style={{ top: 10, left: 20, color: 'red' }}>
          <button type="button" data-testid="child" style={{ color: 'blue' }}>
            Click
          </button>
        </UnifiedSlot>
      )

      const btn = screen.getByTestId('child')
      expect(btn.style.top).toBe('10px')
      expect(btn.style.left).toBe('20px')
      expect(btn.style.color).toBe('blue')
    })

    it('composes on* handlers so both fire (child first, then slot)', () => {
      const order: string[] = []
      const slotClick = vi.fn(() => order.push('slot'))
      const childClick = vi.fn(() => order.push('child'))

      render(
        <UnifiedSlot onClick={slotClick}>
          <button type="button" data-testid="child" onClick={childClick}>
            Click
          </button>
        </UnifiedSlot>
      )

      fireEvent.click(screen.getByTestId('child'))
      expect(childClick).toHaveBeenCalledTimes(1)
      expect(slotClick).toHaveBeenCalledTimes(1)
      expect(order).toEqual(['child', 'slot'])
    })

    it('passes slot on* handler through when child has none', () => {
      const slotClick = vi.fn()

      render(
        <UnifiedSlot onClick={slotClick}>
          <button type="button" data-testid="child">
            Click
          </button>
        </UnifiedSlot>
      )

      fireEvent.click(screen.getByTestId('child'))
      expect(slotClick).toHaveBeenCalledTimes(1)
    })

    it('merges refs from both slot and child', () => {
      const slotRef = vi.fn()
      const childRef = vi.fn()

      const ChildWithRef = React.forwardRef<HTMLButtonElement>((_, ref) => (
        <button ref={ref} type="button">
          Click me
        </button>
      ))
      ChildWithRef.displayName = 'ChildWithRef'

      render(
        <UnifiedSlot ref={slotRef}>
          <ChildWithRef ref={childRef} />
        </UnifiedSlot>
      )

      expect(slotRef).toHaveBeenCalled()
      expect(childRef).toHaveBeenCalled()
      expect(slotRef.mock.calls[0][0]).toBe(childRef.mock.calls[0][0])
    })

    it('handles object refs', () => {
      const slotRef = { current: null }
      const childRef = { current: null }

      const ChildWithRef = React.forwardRef<HTMLButtonElement>((_, ref) => (
        <button ref={ref} type="button">
          Click me
        </button>
      ))
      ChildWithRef.displayName = 'ChildWithRef'

      render(
        <UnifiedSlot ref={slotRef}>
          <ChildWithRef ref={childRef} />
        </UnifiedSlot>
      )

      expect(slotRef.current).toBeInstanceOf(HTMLButtonElement)
      expect(childRef.current).toBeInstanceOf(HTMLButtonElement)
      expect(slotRef.current).toBe(childRef.current)
    })

    it('handles slot ref without child ref', () => {
      const slotRef = vi.fn()

      render(
        <UnifiedSlot ref={slotRef}>
          <button type="button">Click me</button>
        </UnifiedSlot>
      )

      expect(slotRef).toHaveBeenCalled()
      expect(slotRef.mock.calls[0][0]).toBeInstanceOf(HTMLButtonElement)
    })

    it('handles child ref without slot ref', () => {
      const childRef = vi.fn()

      const ChildWithRef = React.forwardRef<HTMLButtonElement>((_, ref) => (
        <button ref={ref} type="button">
          Click me
        </button>
      ))
      ChildWithRef.displayName = 'ChildWithRef'

      render(
        <UnifiedSlot>
          <ChildWithRef ref={childRef} />
        </UnifiedSlot>
      )

      expect(childRef).toHaveBeenCalled()
    })
  })

  describe('Render Prop Children (Base UI style)', () => {
    it('calls render prop with props', () => {
      const renderProp = vi.fn((props: Record<string, unknown>) => (
        <button type="button" {...props}>
          Click me
        </button>
      )) as unknown as RenderProp

      render(
        <UnifiedSlot data-testid="slot" className="slot-class">
          {renderProp}
        </UnifiedSlot>
      )

      expect(renderProp).toHaveBeenCalledWith(
        expect.objectContaining({
          'data-testid': 'slot',
          className: 'slot-class',
        })
      )
    })

    it('render prop can access all slot props', () => {
      const renderFn: RenderProp = (props) => (
        <button type="button" {...props}>
          Click me
        </button>
      )

      render(
        <UnifiedSlot data-testid="slot" aria-label="Test label" disabled>
          {renderFn}
        </UnifiedSlot>
      )

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-testid', 'slot')
      expect(button).toHaveAttribute('aria-label', 'Test label')
      expect(button).toHaveAttribute('disabled')
    })

    it('forwards ref into the merged props object passed to the function', () => {
      const fn = vi.fn(
        (p: Record<string, unknown>) => <span data-testid="rp" {...p} />
      ) as unknown as RenderProp
      const parentRef = vi.fn()

      render(<UnifiedSlot ref={parentRef}>{fn}</UnifiedSlot>)

      const merged = (fn as unknown as ReturnType<typeof vi.fn>).mock.calls[0][0]
      expect(merged).toHaveProperty('ref')
    })
  })

  describe('Fallback Behavior', () => {
    it('renders text children wrapped in fragment', () => {
      render(
        <UnifiedSlot>
          <span>Text content</span>
        </UnifiedSlot>
      )

      expect(screen.getByText('Text content')).toBeInTheDocument()
    })

    it('renders null children as empty fragment', () => {
      const { container } = render(<UnifiedSlot>{null}</UnifiedSlot>)
      expect(container.firstChild).toBeNull()
    })
  })

  describe('Type Safety', () => {
    it('passes additional props to element children', () => {
      render(
        <UnifiedSlot data-custom="custom-value" aria-describedby="desc">
          <button type="button">Click me</button>
        </UnifiedSlot>
      )

      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('data-custom', 'custom-value')
      expect(button).toHaveAttribute('aria-describedby', 'desc')
    })

    it('passes additional props to render prop', () => {
      const renderFn: RenderProp = (props) => <div data-testid="child" {...props} />

      render(<UnifiedSlot data-custom="custom-value">{renderFn}</UnifiedSlot>)

      const div = screen.getByTestId('child')
      expect(div).toHaveAttribute('data-custom', 'custom-value')
    })
  })

  describe('TestReactRefShapes — load-bearing regression for the React 18 ref drop', () => {
    it('merges refs when ref is on element.ref (React 18 prop shape)', () => {
      const childRef = vi.fn()
      const parentRef = vi.fn()
      render(
        <UnifiedSlot ref={parentRef}>
          <div data-testid="x" ref={childRef} />
        </UnifiedSlot>
      )
      expect(childRef).toHaveBeenCalledWith(expect.any(HTMLDivElement))
      expect(parentRef).toHaveBeenCalledWith(expect.any(HTMLDivElement))
    })

    it('merges refs when ref is on props.ref (React 19 prop shape)', () => {
      const childRef = vi.fn()
      const parentRef = vi.fn()
      // Synthesise the React 19 shape: ref attached via the props object.
      const synth = React.createElement('div', { 'data-testid': 'y', ref: childRef })
      render(<UnifiedSlot ref={parentRef}>{synth}</UnifiedSlot>)
      expect(childRef).toHaveBeenCalledWith(expect.any(HTMLDivElement))
      expect(parentRef).toHaveBeenCalledWith(expect.any(HTMLDivElement))
    })
  })
})
