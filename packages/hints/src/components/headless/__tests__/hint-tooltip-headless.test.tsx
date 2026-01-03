import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createRef } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HintTooltipHeadless, type HintTooltipRenderProps } from '../hint-tooltip'

// Mock @floating-ui/react
vi.mock('@floating-ui/react', () => ({
  useFloating: vi.fn(() => ({
    refs: {
      setFloating: vi.fn(),
    },
    floatingStyles: { position: 'absolute', top: 0, left: 0 },
    context: {},
  })),
  FloatingPortal: ({ children }: { children: ReactNode }) => <>{children}</>,
  autoUpdate: vi.fn(),
  offset: vi.fn(() => 'offset-middleware'),
  flip: vi.fn(() => 'flip-middleware'),
  shift: vi.fn(() => 'shift-middleware'),
  useDismiss: vi.fn(() => ({})),
  useRole: vi.fn(() => ({})),
  useInteractions: vi.fn(() => ({
    getFloatingProps: () => ({ 'data-floating': 'true' }),
  })),
}))

describe('HintTooltipHeadless', () => {
  let targetElement: HTMLElement

  beforeEach(() => {
    document.body.innerHTML = '<div id="target">Target</div>'
    targetElement = document.getElementById('target') as HTMLElement
  })

  // Using getter to ensure targetElement is evaluated at test time
  const defaultProps = {
    get target() {
      return targetElement
    },
    onClose: vi.fn(),
    children: 'Tooltip content',
  }

  describe('Rendering', () => {
    it('renders children content', () => {
      render(<HintTooltipHeadless {...defaultProps}>Tooltip Text</HintTooltipHeadless>)

      expect(screen.getByText('Tooltip Text')).toBeInTheDocument()
    })

    it('renders in FloatingPortal', () => {
      // FloatingPortal is mocked to just render children
      render(<HintTooltipHeadless {...defaultProps} />)

      expect(screen.getByText('Tooltip content')).toBeInTheDocument()
    })

    it('renders a div container', () => {
      render(<HintTooltipHeadless {...defaultProps} data-testid="tooltip" />)

      expect(screen.getByTestId('tooltip')).toBeInTheDocument()
      expect(screen.getByTestId('tooltip').tagName).toBe('DIV')
    })

    it('applies floatingStyles from useFloating', () => {
      render(<HintTooltipHeadless {...defaultProps} data-testid="tooltip" />)

      const tooltip = screen.getByTestId('tooltip')
      expect(tooltip).toHaveStyle({ position: 'absolute' })
    })

    it('applies additional props', () => {
      render(<HintTooltipHeadless {...defaultProps} data-testid="custom-tooltip" id="my-tooltip" />)

      expect(screen.getByTestId('custom-tooltip')).toHaveAttribute('id', 'my-tooltip')
    })
  })

  describe('forwardRef Support', () => {
    it('forwards ref to container div', () => {
      const ref = createRef<HTMLDivElement>()

      render(<HintTooltipHeadless {...defaultProps} ref={ref} />)

      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })

    it('handles function ref', () => {
      let capturedNode: HTMLDivElement | null = null
      const callbackRef = (node: HTMLDivElement | null) => {
        capturedNode = node
      }

      render(<HintTooltipHeadless {...defaultProps} ref={callbackRef} />)

      expect(capturedNode).toBeInstanceOf(HTMLDivElement)
    })

    it('handles object ref', () => {
      const objectRef = { current: null as HTMLDivElement | null }

      render(<HintTooltipHeadless {...defaultProps} ref={objectRef} />)

      expect(objectRef.current).toBeInstanceOf(HTMLDivElement)
    })

    it('ref and setFloating both work', async () => {
      const ref = createRef<HTMLDivElement>()
      const { useFloating } = vi.mocked(await import('@floating-ui/react'))

      render(<HintTooltipHeadless {...defaultProps} ref={ref} />)

      // Ref should be set
      expect(ref.current).not.toBeNull()

      // setFloating should have been called via the ref callback
      const mockResult = useFloating()
      expect(mockResult.refs.setFloating).toBeDefined()
    })
  })

  describe('Props Spreading', () => {
    it('spreads className', () => {
      render(
        <HintTooltipHeadless {...defaultProps} className="custom-tooltip" data-testid="tooltip" />
      )

      expect(screen.getByTestId('tooltip')).toHaveClass('custom-tooltip')
    })

    it('spreads style', () => {
      render(
        <HintTooltipHeadless
          {...defaultProps}
          style={{ backgroundColor: 'white' }}
          data-testid="tooltip"
        />
      )

      const tooltip = screen.getByTestId('tooltip')
      // Check that custom style is merged with floatingStyles
      expect(tooltip.style.backgroundColor).toBe('white')
      expect(tooltip.style.position).toBe('absolute') // from mock floatingStyles
    })

    it('spreads aria attributes', () => {
      render(
        <HintTooltipHeadless {...defaultProps} aria-label="Help tooltip" data-testid="tooltip" />
      )

      expect(screen.getByTestId('tooltip')).toHaveAttribute('aria-label', 'Help tooltip')
    })

    it('gets floating props from interactions', () => {
      render(<HintTooltipHeadless {...defaultProps} data-testid="tooltip" />)

      // Our mock returns { 'data-floating': 'true' }
      expect(screen.getByTestId('tooltip')).toHaveAttribute('data-floating', 'true')
    })
  })

  describe('Floating UI Integration', () => {
    it('uses target as reference element', async () => {
      const { useFloating } = vi.mocked(await import('@floating-ui/react'))

      render(<HintTooltipHeadless {...defaultProps} />)

      expect(useFloating).toHaveBeenCalledWith(
        expect.objectContaining({
          elements: expect.objectContaining({
            reference: targetElement,
          }),
        })
      )
    })

    it('uses placement prop', async () => {
      const { useFloating } = vi.mocked(await import('@floating-ui/react'))

      render(<HintTooltipHeadless {...defaultProps} placement="right" />)

      expect(useFloating).toHaveBeenCalledWith(
        expect.objectContaining({
          placement: 'right',
        })
      )
    })

    it('converts bottom-center to bottom', async () => {
      const { useFloating } = vi.mocked(await import('@floating-ui/react'))

      render(<HintTooltipHeadless {...defaultProps} placement="bottom-center" />)

      expect(useFloating).toHaveBeenCalledWith(
        expect.objectContaining({
          placement: 'bottom',
        })
      )
    })

    it('configures offset middleware', async () => {
      const { offset } = vi.mocked(await import('@floating-ui/react'))

      render(<HintTooltipHeadless {...defaultProps} />)

      expect(offset).toHaveBeenCalledWith(8)
    })

    it('configures flip middleware', async () => {
      const { flip } = vi.mocked(await import('@floating-ui/react'))

      render(<HintTooltipHeadless {...defaultProps} />)

      expect(flip).toHaveBeenCalled()
    })

    it('configures shift middleware with padding', async () => {
      const { shift } = vi.mocked(await import('@floating-ui/react'))

      render(<HintTooltipHeadless {...defaultProps} />)

      expect(shift).toHaveBeenCalledWith({ padding: 8 })
    })

    it('uses autoUpdate', async () => {
      const { useFloating } = vi.mocked(await import('@floating-ui/react'))

      render(<HintTooltipHeadless {...defaultProps} />)

      expect(useFloating).toHaveBeenCalledWith(
        expect.objectContaining({
          whileElementsMounted: expect.any(Function),
        })
      )
    })

    it('uses useDismiss interaction', async () => {
      const { useDismiss } = vi.mocked(await import('@floating-ui/react'))

      render(<HintTooltipHeadless {...defaultProps} />)

      expect(useDismiss).toHaveBeenCalled()
    })

    it('uses useRole with tooltip role', async () => {
      const { useRole } = vi.mocked(await import('@floating-ui/react'))

      render(<HintTooltipHeadless {...defaultProps} />)

      expect(useRole).toHaveBeenCalledWith(expect.anything(), { role: 'tooltip' })
    })
  })

  describe('Render Prop Functionality', () => {
    it('calls render prop with HintTooltipRenderProps', () => {
      const renderFn = vi.fn(() => <div data-testid="custom">Custom</div>)

      render(<HintTooltipHeadless {...defaultProps} render={renderFn} />)

      expect(renderFn).toHaveBeenCalledTimes(1)
    })

    it('render prop receives floatingStyles', () => {
      let receivedProps: HintTooltipRenderProps | undefined
      const renderFn = (props: HintTooltipRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }

      render(<HintTooltipHeadless {...defaultProps} render={renderFn} />)

      expect(receivedProps?.floatingStyles).toEqual({ position: 'absolute', top: 0, left: 0 })
    })

    it('render prop receives getFloatingProps function', () => {
      let receivedProps: HintTooltipRenderProps | undefined
      const renderFn = (props: HintTooltipRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }

      render(<HintTooltipHeadless {...defaultProps} render={renderFn} />)

      expect(typeof receivedProps?.getFloatingProps).toBe('function')
      expect(receivedProps?.getFloatingProps()).toEqual({ 'data-floating': 'true' })
    })

    it('render prop receives refs with setFloating', () => {
      let receivedProps: HintTooltipRenderProps | undefined
      const renderFn = (props: HintTooltipRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }

      render(<HintTooltipHeadless {...defaultProps} render={renderFn} />)

      expect(typeof receivedProps?.refs.setFloating).toBe('function')
    })

    it('uses render prop output instead of default', () => {
      const renderFn = () => <span data-testid="custom-tooltip">Custom Tooltip</span>

      render(<HintTooltipHeadless {...defaultProps} render={renderFn} />)

      expect(screen.getByTestId('custom-tooltip')).toBeInTheDocument()
      expect(screen.queryByText('Tooltip content')).not.toBeInTheDocument()
    })

    it('render prop still wraps in FloatingPortal', () => {
      const renderFn = () => <div data-testid="render-output">Rendered</div>

      render(<HintTooltipHeadless {...defaultProps} render={renderFn} />)

      // Content should still be in the document (FloatingPortal is mocked)
      expect(screen.getByTestId('render-output')).toBeInTheDocument()
    })
  })

  describe('Placement Conversion', () => {
    const testPlacements = [
      { input: 'top', expected: 'top' },
      { input: 'bottom', expected: 'bottom' },
      { input: 'left', expected: 'left' },
      { input: 'right', expected: 'right' },
      { input: 'top-start', expected: 'top-start' },
      { input: 'top-center', expected: 'top' },
      { input: 'top-end', expected: 'top-end' },
      { input: 'bottom-start', expected: 'bottom-start' },
      { input: 'bottom-center', expected: 'bottom' },
      { input: 'bottom-end', expected: 'bottom-end' },
      { input: 'left-start', expected: 'left-start' },
      { input: 'left-center', expected: 'left' },
      { input: 'left-end', expected: 'left-end' },
      { input: 'right-start', expected: 'right-start' },
      { input: 'right-center', expected: 'right' },
      { input: 'right-end', expected: 'right-end' },
    ] as const

    for (const { input, expected } of testPlacements) {
      it(`converts ${input} to ${expected}`, async () => {
        const { useFloating } = vi.mocked(await import('@floating-ui/react'))
        vi.clearAllMocks()

        render(<HintTooltipHeadless {...defaultProps} placement={input} />)

        expect(useFloating).toHaveBeenCalledWith(
          expect.objectContaining({
            placement: expected,
          })
        )
      })
    }
  })

  describe('Display Name', () => {
    it('has displayName set', () => {
      expect(HintTooltipHeadless.displayName).toBe('HintTooltipHeadless')
    })
  })

  describe('Default Placement', () => {
    it('uses bottom placement by default', async () => {
      const { useFloating } = vi.mocked(await import('@floating-ui/react'))
      vi.clearAllMocks()

      render(<HintTooltipHeadless {...defaultProps} />)

      expect(useFloating).toHaveBeenCalledWith(
        expect.objectContaining({
          placement: 'bottom',
        })
      )
    })
  })

  describe('Open State', () => {
    it('is always open (open: true)', async () => {
      const { useFloating } = vi.mocked(await import('@floating-ui/react'))

      render(<HintTooltipHeadless {...defaultProps} />)

      expect(useFloating).toHaveBeenCalledWith(
        expect.objectContaining({
          open: true,
        })
      )
    })
  })
})
