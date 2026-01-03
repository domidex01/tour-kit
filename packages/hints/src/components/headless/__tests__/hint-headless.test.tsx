import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HintsContext } from '../../../context/hints-context'
import type { HintState, HintsContextValue } from '../../../types'
import { HintHeadless, type HintHeadlessRenderProps } from '../hint'

// Mock useElementPosition
const mockElementPosition = {
  element: null as HTMLElement | null,
  rect: null as DOMRect | null,
  update: vi.fn(),
}

vi.mock('@tour-kit/core', () => ({
  useElementPosition: vi.fn(() => mockElementPosition),
}))

describe('HintHeadless', () => {
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

  const createMockHintsContext = (
    overrides: Partial<HintsContextValue> = {}
  ): HintsContextValue => {
    const defaultHints = new Map<string, HintState>([
      ['test-hint', { id: 'test-hint', isOpen: false, isDismissed: false }],
    ])

    return {
      hints: overrides.hints ?? defaultHints,
      activeHint: overrides.activeHint ?? null,
      registerHint: vi.fn(),
      unregisterHint: vi.fn(),
      showHint: vi.fn(),
      hideHint: vi.fn(),
      dismissHint: vi.fn(),
      resetHint: vi.fn(),
      resetAllHints: vi.fn(),
      ...overrides,
    }
  }

  const createWrapper = (contextValue: HintsContextValue) => {
    return function Wrapper({ children }: { children: ReactNode }) {
      return <HintsContext.Provider value={contextValue}>{children}</HintsContext.Provider>
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()

    document.body.innerHTML = '<div id="target">Target Element</div>'
    const target = document.getElementById('target')

    mockElementPosition.element = target
    mockElementPosition.rect = mockRect

    if (target) {
      vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(mockRect)
    }
  })

  describe('Rendering Behavior', () => {
    it('returns null when hint is dismissed', () => {
      const hints = new Map<string, HintState>([
        ['test-hint', { id: 'test-hint', isOpen: false, isDismissed: true }],
      ])
      const context = createMockHintsContext({ hints })

      const { container } = render(
        <HintHeadless id="test-hint" target="#target" content="Help" />,
        {
          wrapper: createWrapper(context),
        }
      )

      expect(container.firstChild).toBeNull()
    })

    it('returns null when target element not found', () => {
      mockElementPosition.element = null
      mockElementPosition.rect = null
      const context = createMockHintsContext()

      const { container } = render(
        <HintHeadless id="test-hint" target="#nonexistent" content="Help" />,
        {
          wrapper: createWrapper(context),
        }
      )

      expect(container.firstChild).toBeNull()
    })

    it('returns null when no targetRect', () => {
      mockElementPosition.rect = null
      const context = createMockHintsContext()

      const { container } = render(
        <HintHeadless id="test-hint" target="#target" content="Help" />,
        {
          wrapper: createWrapper(context),
        }
      )

      expect(container.firstChild).toBeNull()
    })

    it('renders hotspot button when target exists', () => {
      const context = createMockHintsContext()

      render(<HintHeadless id="test-hint" target="#target" content="Help" />, {
        wrapper: createWrapper(context),
      })

      expect(screen.getByRole('button', { name: /show hint/i })).toBeInTheDocument()
    })

    it('applies className to hotspot button', () => {
      const context = createMockHintsContext()

      render(
        <HintHeadless id="test-hint" target="#target" content="Help" className="custom-hotspot" />,
        {
          wrapper: createWrapper(context),
        }
      )

      expect(screen.getByRole('button')).toHaveClass('custom-hotspot')
    })

    it('has aria-label on hotspot button', () => {
      const context = createMockHintsContext()

      render(<HintHeadless id="test-hint" target="#target" content="Help" />, {
        wrapper: createWrapper(context),
      })

      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Show hint')
    })

    it('has aria-expanded attribute', () => {
      const context = createMockHintsContext()

      render(<HintHeadless id="test-hint" target="#target" content="Help" />, {
        wrapper: createWrapper(context),
      })

      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded')
    })

    it('aria-expanded reflects isOpen state - closed', () => {
      const context = createMockHintsContext()

      render(<HintHeadless id="test-hint" target="#target" content="Help" />, {
        wrapper: createWrapper(context),
      })

      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false')
    })

    it('aria-expanded reflects isOpen state - open', () => {
      const hints = new Map<string, HintState>([
        ['test-hint', { id: 'test-hint', isOpen: true, isDismissed: false }],
      ])
      const context = createMockHintsContext({ hints })

      render(<HintHeadless id="test-hint" target="#target" content="Help" />, {
        wrapper: createWrapper(context),
      })

      expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true')
    })

    it('renders children when isOpen is true', () => {
      const hints = new Map<string, HintState>([
        ['test-hint', { id: 'test-hint', isOpen: true, isDismissed: false }],
      ])
      const context = createMockHintsContext({ hints })

      render(
        <HintHeadless id="test-hint" target="#target" content="Help">
          <div data-testid="tooltip">Tooltip Content</div>
        </HintHeadless>,
        { wrapper: createWrapper(context) }
      )

      expect(screen.getByTestId('tooltip')).toBeInTheDocument()
    })
  })

  describe('Render Prop Functionality', () => {
    it('calls render prop with HintHeadlessRenderProps', () => {
      const renderFn = vi.fn(() => <div>Custom</div>)
      const context = createMockHintsContext()

      render(<HintHeadless id="test-hint" target="#target" content="Help" render={renderFn} />, {
        wrapper: createWrapper(context),
      })

      expect(renderFn).toHaveBeenCalledTimes(1)
    })

    it('render prop receives isOpen', () => {
      let receivedProps: HintHeadlessRenderProps | undefined
      const renderFn = (props: HintHeadlessRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockHintsContext()

      render(<HintHeadless id="test-hint" target="#target" content="Help" render={renderFn} />, {
        wrapper: createWrapper(context),
      })

      expect(receivedProps?.isOpen).toBe(false)
    })

    it('render prop receives isDismissed', () => {
      let receivedProps: HintHeadlessRenderProps | undefined
      const renderFn = (props: HintHeadlessRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockHintsContext()

      render(<HintHeadless id="test-hint" target="#target" content="Help" render={renderFn} />, {
        wrapper: createWrapper(context),
      })

      expect(receivedProps?.isDismissed).toBe(false)
    })

    it('render prop receives show function', () => {
      let receivedProps: HintHeadlessRenderProps | undefined
      const renderFn = (props: HintHeadlessRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockHintsContext()

      render(<HintHeadless id="test-hint" target="#target" content="Help" render={renderFn} />, {
        wrapper: createWrapper(context),
      })

      expect(typeof receivedProps?.show).toBe('function')
    })

    it('render prop receives hide function', () => {
      let receivedProps: HintHeadlessRenderProps | undefined
      const renderFn = (props: HintHeadlessRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockHintsContext()

      render(<HintHeadless id="test-hint" target="#target" content="Help" render={renderFn} />, {
        wrapper: createWrapper(context),
      })

      expect(typeof receivedProps?.hide).toBe('function')
    })

    it('render prop receives dismiss function', () => {
      let receivedProps: HintHeadlessRenderProps | undefined
      const renderFn = (props: HintHeadlessRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockHintsContext()

      render(<HintHeadless id="test-hint" target="#target" content="Help" render={renderFn} />, {
        wrapper: createWrapper(context),
      })

      expect(typeof receivedProps?.dismiss).toBe('function')
    })

    it('render prop receives targetElement', () => {
      let receivedProps: HintHeadlessRenderProps | undefined
      const renderFn = (props: HintHeadlessRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockHintsContext()

      render(<HintHeadless id="test-hint" target="#target" content="Help" render={renderFn} />, {
        wrapper: createWrapper(context),
      })

      expect(receivedProps?.targetElement).toBe(mockElementPosition.element)
    })

    it('render prop receives targetRect', () => {
      let receivedProps: HintHeadlessRenderProps | undefined
      const renderFn = (props: HintHeadlessRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockHintsContext()

      render(<HintHeadless id="test-hint" target="#target" content="Help" render={renderFn} />, {
        wrapper: createWrapper(context),
      })

      expect(receivedProps?.targetRect).toBe(mockRect)
    })

    it('render prop receives hotspotRef', () => {
      let receivedProps: HintHeadlessRenderProps | undefined
      const renderFn = (props: HintHeadlessRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockHintsContext()

      render(<HintHeadless id="test-hint" target="#target" content="Help" render={renderFn} />, {
        wrapper: createWrapper(context),
      })

      expect(receivedProps?.hotspotRef).toBeDefined()
    })

    it('render prop receives position', () => {
      let receivedProps: HintHeadlessRenderProps | undefined
      const renderFn = (props: HintHeadlessRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockHintsContext()

      render(
        <HintHeadless
          id="test-hint"
          target="#target"
          content="Help"
          position="bottom-left"
          render={renderFn}
        />,
        { wrapper: createWrapper(context) }
      )

      expect(receivedProps?.position).toBe('bottom-left')
    })

    it('render prop receives tooltipPlacement', () => {
      let receivedProps: HintHeadlessRenderProps | undefined
      const renderFn = (props: HintHeadlessRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockHintsContext()

      render(
        <HintHeadless
          id="test-hint"
          target="#target"
          content="Help"
          tooltipPlacement="right"
          render={renderFn}
        />,
        { wrapper: createWrapper(context) }
      )

      expect(receivedProps?.tooltipPlacement).toBe('right')
    })

    it('render prop receives pulse', () => {
      let receivedProps: HintHeadlessRenderProps | undefined
      const renderFn = (props: HintHeadlessRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockHintsContext()

      render(
        <HintHeadless
          id="test-hint"
          target="#target"
          content="Help"
          pulse={false}
          render={renderFn}
        />,
        { wrapper: createWrapper(context) }
      )

      expect(receivedProps?.pulse).toBe(false)
    })

    it('render prop receives content', () => {
      let receivedProps: HintHeadlessRenderProps | undefined
      const renderFn = (props: HintHeadlessRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockHintsContext()

      render(
        <HintHeadless id="test-hint" target="#target" content="Custom Content" render={renderFn} />,
        { wrapper: createWrapper(context) }
      )

      expect(receivedProps?.content).toBe('Custom Content')
    })

    it('uses render prop output instead of default', () => {
      const renderFn = () => <div data-testid="custom-hint">Custom Hint</div>
      const context = createMockHintsContext()

      render(<HintHeadless id="test-hint" target="#target" content="Help" render={renderFn} />, {
        wrapper: createWrapper(context),
      })

      expect(screen.getByTestId('custom-hint')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /show hint/i })).not.toBeInTheDocument()
    })
  })

  describe('Hint State Management', () => {
    it('calls showHint on hotspot click when closed', async () => {
      const user = userEvent.setup()
      const showHint = vi.fn()
      const context = createMockHintsContext({ showHint })

      render(<HintHeadless id="test-hint" target="#target" content="Help" />, {
        wrapper: createWrapper(context),
      })

      await user.click(screen.getByRole('button'))

      expect(showHint).toHaveBeenCalledWith('test-hint')
    })

    it('calls hideHint on hotspot click when open', async () => {
      const user = userEvent.setup()
      const hideHint = vi.fn()
      const hints = new Map<string, HintState>([
        ['test-hint', { id: 'test-hint', isOpen: true, isDismissed: false }],
      ])
      const context = createMockHintsContext({ hints, hideHint })

      render(<HintHeadless id="test-hint" target="#target" content="Help" />, {
        wrapper: createWrapper(context),
      })

      await user.click(screen.getByRole('button'))

      expect(hideHint).toHaveBeenCalledWith('test-hint')
    })

    it('calls onClick callback on hotspot click', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()
      const context = createMockHintsContext()

      render(<HintHeadless id="test-hint" target="#target" content="Help" onClick={onClick} />, {
        wrapper: createWrapper(context),
      })

      await user.click(screen.getByRole('button'))

      expect(onClick).toHaveBeenCalled()
    })

    it('calls onShow when opening hint', async () => {
      const user = userEvent.setup()
      const onShow = vi.fn()
      const context = createMockHintsContext()

      render(<HintHeadless id="test-hint" target="#target" content="Help" onShow={onShow} />, {
        wrapper: createWrapper(context),
      })

      await user.click(screen.getByRole('button'))

      expect(onShow).toHaveBeenCalled()
    })

    it('does not call onShow when closing hint', async () => {
      const user = userEvent.setup()
      const onShow = vi.fn()
      const hints = new Map<string, HintState>([
        ['test-hint', { id: 'test-hint', isOpen: true, isDismissed: false }],
      ])
      const context = createMockHintsContext({ hints })

      render(<HintHeadless id="test-hint" target="#target" content="Help" onShow={onShow} />, {
        wrapper: createWrapper(context),
      })

      await user.click(screen.getByRole('button'))

      expect(onShow).not.toHaveBeenCalled()
    })
  })

  describe('AutoShow Behavior', () => {
    it('shows automatically when autoShow=true', async () => {
      const showHint = vi.fn()
      const context = createMockHintsContext({ showHint })

      render(<HintHeadless id="test-hint" target="#target" content="Help" autoShow />, {
        wrapper: createWrapper(context),
      })

      await waitFor(() => {
        expect(showHint).toHaveBeenCalledWith('test-hint')
      })
    })

    it('calls onShow on autoShow', async () => {
      const onShow = vi.fn()
      const context = createMockHintsContext()

      render(
        <HintHeadless id="test-hint" target="#target" content="Help" autoShow onShow={onShow} />,
        {
          wrapper: createWrapper(context),
        }
      )

      await waitFor(() => {
        expect(onShow).toHaveBeenCalled()
      })
    })

    it('does not autoShow when already dismissed', async () => {
      const showHint = vi.fn()
      const hints = new Map<string, HintState>([
        ['test-hint', { id: 'test-hint', isOpen: false, isDismissed: true }],
      ])
      const context = createMockHintsContext({ hints, showHint })

      render(<HintHeadless id="test-hint" target="#target" content="Help" autoShow />, {
        wrapper: createWrapper(context),
      })

      // Wait a bit to ensure autoShow doesn't trigger
      await new Promise((resolve) => setTimeout(resolve, 50))

      expect(showHint).not.toHaveBeenCalled()
    })
  })

  describe('Dismiss Behavior', () => {
    it('calls dismissHint when persist=true', async () => {
      const dismissHint = vi.fn()
      const hints = new Map<string, HintState>([
        ['test-hint', { id: 'test-hint', isOpen: true, isDismissed: false }],
      ])
      const context = createMockHintsContext({ hints, dismissHint })

      let receivedDismiss: (() => void) | undefined
      const renderFn = (props: HintHeadlessRenderProps) => {
        receivedDismiss = props.dismiss
        return (
          <button type="button" onClick={props.dismiss}>
            Dismiss
          </button>
        )
      }

      render(
        <HintHeadless id="test-hint" target="#target" content="Help" persist render={renderFn} />,
        {
          wrapper: createWrapper(context),
        }
      )

      receivedDismiss?.()

      expect(dismissHint).toHaveBeenCalledWith('test-hint')
    })

    it('calls hideHint when persist=false', async () => {
      const hideHint = vi.fn()
      const hints = new Map<string, HintState>([
        ['test-hint', { id: 'test-hint', isOpen: true, isDismissed: false }],
      ])
      const context = createMockHintsContext({ hints, hideHint })

      let receivedDismiss: (() => void) | undefined
      const renderFn = (props: HintHeadlessRenderProps) => {
        receivedDismiss = props.dismiss
        return (
          <button type="button" onClick={props.dismiss}>
            Dismiss
          </button>
        )
      }

      render(
        <HintHeadless
          id="test-hint"
          target="#target"
          content="Help"
          persist={false}
          render={renderFn}
        />,
        {
          wrapper: createWrapper(context),
        }
      )

      receivedDismiss?.()

      expect(hideHint).toHaveBeenCalledWith('test-hint')
    })

    it('calls onDismiss callback', async () => {
      const onDismiss = vi.fn()
      const hints = new Map<string, HintState>([
        ['test-hint', { id: 'test-hint', isOpen: true, isDismissed: false }],
      ])
      const context = createMockHintsContext({ hints })

      let receivedDismiss: (() => void) | undefined
      const renderFn = (props: HintHeadlessRenderProps) => {
        receivedDismiss = props.dismiss
        return (
          <button type="button" onClick={props.dismiss}>
            Dismiss
          </button>
        )
      }

      render(
        <HintHeadless
          id="test-hint"
          target="#target"
          content="Help"
          onDismiss={onDismiss}
          render={renderFn}
        />,
        {
          wrapper: createWrapper(context),
        }
      )

      receivedDismiss?.()

      expect(onDismiss).toHaveBeenCalled()
    })
  })

  describe('Configuration Props', () => {
    it('uses default position (top-right)', () => {
      let receivedProps: HintHeadlessRenderProps | undefined
      const renderFn = (props: HintHeadlessRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockHintsContext()

      render(<HintHeadless id="test-hint" target="#target" content="Help" render={renderFn} />, {
        wrapper: createWrapper(context),
      })

      expect(receivedProps?.position).toBe('top-right')
    })

    it('uses custom position', () => {
      let receivedProps: HintHeadlessRenderProps | undefined
      const renderFn = (props: HintHeadlessRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockHintsContext()

      render(
        <HintHeadless
          id="test-hint"
          target="#target"
          content="Help"
          position="bottom-left"
          render={renderFn}
        />,
        { wrapper: createWrapper(context) }
      )

      expect(receivedProps?.position).toBe('bottom-left')
    })

    it('uses default tooltipPlacement (bottom)', () => {
      let receivedProps: HintHeadlessRenderProps | undefined
      const renderFn = (props: HintHeadlessRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockHintsContext()

      render(<HintHeadless id="test-hint" target="#target" content="Help" render={renderFn} />, {
        wrapper: createWrapper(context),
      })

      expect(receivedProps?.tooltipPlacement).toBe('bottom')
    })

    it('uses custom tooltipPlacement', () => {
      let receivedProps: HintHeadlessRenderProps | undefined
      const renderFn = (props: HintHeadlessRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockHintsContext()

      render(
        <HintHeadless
          id="test-hint"
          target="#target"
          content="Help"
          tooltipPlacement="right"
          render={renderFn}
        />,
        { wrapper: createWrapper(context) }
      )

      expect(receivedProps?.tooltipPlacement).toBe('right')
    })

    it('uses default pulse (true)', () => {
      let receivedProps: HintHeadlessRenderProps | undefined
      const renderFn = (props: HintHeadlessRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockHintsContext()

      render(<HintHeadless id="test-hint" target="#target" content="Help" render={renderFn} />, {
        wrapper: createWrapper(context),
      })

      expect(receivedProps?.pulse).toBe(true)
    })

    it('uses pulse=false when specified', () => {
      let receivedProps: HintHeadlessRenderProps | undefined
      const renderFn = (props: HintHeadlessRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockHintsContext()

      render(
        <HintHeadless
          id="test-hint"
          target="#target"
          content="Help"
          pulse={false}
          render={renderFn}
        />,
        { wrapper: createWrapper(context) }
      )

      expect(receivedProps?.pulse).toBe(false)
    })
  })

  describe('Context Integration', () => {
    it('throws error when used outside HintsProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<HintHeadless id="test-hint" target="#target" content="Help" />)
      }).toThrow('useHintsContext must be used within a HintsProvider')

      consoleSpy.mockRestore()
    })

    it('registers hint on mount', () => {
      const registerHint = vi.fn()
      const context = createMockHintsContext({ registerHint })

      render(<HintHeadless id="test-hint" target="#target" content="Help" />, {
        wrapper: createWrapper(context),
      })

      expect(registerHint).toHaveBeenCalledWith('test-hint')
    })

    it('unregisters hint on unmount', () => {
      const unregisterHint = vi.fn()
      const context = createMockHintsContext({ unregisterHint })

      const { unmount } = render(<HintHeadless id="test-hint" target="#target" content="Help" />, {
        wrapper: createWrapper(context),
      })

      unmount()

      expect(unregisterHint).toHaveBeenCalledWith('test-hint')
    })
  })
})
