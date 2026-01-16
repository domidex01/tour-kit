import { render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { UnifiedSlot, type RenderProp } from '../unified-slot'

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

    it('child props take precedence over slot props', () => {
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

      render(
        <UnifiedSlot data-custom="custom-value">
          {renderFn}
        </UnifiedSlot>
      )

      const div = screen.getByTestId('child')
      expect(div).toHaveAttribute('data-custom', 'custom-value')
    })
  })
})
