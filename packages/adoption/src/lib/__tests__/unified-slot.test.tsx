import { fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { UILibraryProvider, useUILibrary } from '../ui-library-context'
import { UnifiedSlot } from '../unified-slot'

describe('UnifiedSlot', () => {
  describe('render-prop children (Base UI style)', () => {
    it('invokes the render prop with the slot props', () => {
      const renderChild = vi.fn((props: Record<string, unknown>) => (
        <button type="button" data-testid="child" {...props}>
          click
        </button>
      ))

      render(
        <UnifiedSlot data-slot="value" aria-label="hello">
          {renderChild}
        </UnifiedSlot>
      )

      expect(renderChild).toHaveBeenCalledTimes(1)
      const passed = renderChild.mock.calls[0]?.[0] as Record<string, unknown>
      expect(passed['data-slot']).toBe('value')
      expect(passed['aria-label']).toBe('hello')
      expect(screen.getByTestId('child')).toHaveAttribute('data-slot', 'value')
    })
  })

  describe('element-cloning children (Radix style)', () => {
    it('passes arbitrary slot props through to the cloned child', () => {
      render(
        <UnifiedSlot data-slot="value">
          <button type="button" data-testid="child" />
        </UnifiedSlot>
      )

      expect(screen.getByTestId('child')).toHaveAttribute('data-slot', 'value')
    })

    it('child props override slot props for non-special keys (Radix semantics)', () => {
      render(
        <UnifiedSlot data-value="slot-value">
          <button type="button" data-testid="child" data-value="child-value" />
        </UnifiedSlot>
      )

      expect(screen.getByTestId('child')).toHaveAttribute('data-value', 'child-value')
    })

    it('concatenates className from slot and child', () => {
      render(
        <UnifiedSlot className="parent-cls">
          <button type="button" data-testid="child" className="child-cls" />
        </UnifiedSlot>
      )

      const btn = screen.getByTestId('child')
      expect(btn).toHaveClass('parent-cls')
      expect(btn).toHaveClass('child-cls')
    })

    it('keeps slot className when child has none', () => {
      render(
        <UnifiedSlot className="parent-cls">
          <button type="button" data-testid="child" />
        </UnifiedSlot>
      )

      expect(screen.getByTestId('child')).toHaveClass('parent-cls')
    })

    it('merges style so child wins on collision but slot keys survive', () => {
      render(
        <UnifiedSlot style={{ top: 10, left: 20, color: 'red' }}>
          <button type="button" data-testid="child" style={{ color: 'blue' }} />
        </UnifiedSlot>
      )

      const btn = screen.getByTestId('child')
      expect(btn.style.top).toBe('10px')
      expect(btn.style.left).toBe('20px')
      expect(btn.style.color).toBe('blue')
    })

    it('composes on* handlers so both fire, child first then slot', () => {
      const order: string[] = []
      const slotClick = vi.fn(() => order.push('slot'))
      const childClick = vi.fn(() => order.push('child'))

      render(
        <UnifiedSlot onClick={slotClick}>
          <button type="button" data-testid="child" onClick={childClick} />
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
          <button type="button" data-testid="child" />
        </UnifiedSlot>
      )

      fireEvent.click(screen.getByTestId('child'))
      expect(slotClick).toHaveBeenCalledTimes(1)
    })

    it('forwards refs to both slot ref and child ref', () => {
      const slotRef = vi.fn()
      const childRef = React.createRef<HTMLButtonElement>()

      render(
        <UnifiedSlot ref={slotRef}>
          <button type="button" data-testid="child" ref={childRef} />
        </UnifiedSlot>
      )

      expect(slotRef).toHaveBeenCalled()
      expect(slotRef.mock.calls[0]?.[0]).toBeInstanceOf(HTMLButtonElement)
      expect(childRef.current).toBeInstanceOf(HTMLButtonElement)
    })
  })

  describe('fallback (non-element children)', () => {
    it('renders raw text children wrapped in a fragment', () => {
      render(<UnifiedSlot>{'just text'}</UnifiedSlot>)
      expect(screen.getByText('just text')).toBeInTheDocument()
    })
  })
})

describe('useUILibrary', () => {
  function Probe() {
    const lib = useUILibrary()
    return <span data-testid="probe">{lib}</span>
  }

  it("defaults to 'radix-ui' when no provider is present", () => {
    render(<Probe />)
    expect(screen.getByTestId('probe')).toHaveTextContent('radix-ui')
  })

  it("returns 'base-ui' when provider is set to base-ui", () => {
    render(
      <UILibraryProvider library="base-ui">
        <Probe />
      </UILibraryProvider>
    )
    expect(screen.getByTestId('probe')).toHaveTextContent('base-ui')
  })
})
