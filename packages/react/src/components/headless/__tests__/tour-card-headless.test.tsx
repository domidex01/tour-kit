import { render, screen } from '@testing-library/react'
import { TourContext, type TourStep } from '@tour-kit/core'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TourCardHeadless, type TourCardRenderProps } from '../tour-card'

// Mock TourPortal to render children directly for easier testing
vi.mock('../../primitives/tour-portal', () => ({
  TourPortal: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

// Mock useFocusTrap
vi.mock('@tour-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tour-kit/core')>()
  return {
    ...actual,
    useFocusTrap: vi.fn(() => ({
      containerRef: { current: null },
      activate: vi.fn(),
      deactivate: vi.fn(),
    })),
  }
})

// Mock @floating-ui/react for consistent test behavior
vi.mock('@floating-ui/react', () => ({
  useFloating: vi.fn(() => ({
    refs: {
      setFloating: vi.fn(),
      setReference: vi.fn(),
    },
    floatingStyles: { position: 'absolute', top: 0, left: 0 },
    context: {},
  })),
  offset: vi.fn(() => ({})),
  flip: vi.fn(() => ({})),
  shift: vi.fn(() => ({})),
  arrow: vi.fn(() => ({})),
  autoUpdate: vi.fn(),
}))

describe('TourCardHeadless', () => {
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

  const defaultStep: TourStep = {
    id: 'step-1',
    target: '#target',
    content: 'Step content',
    placement: 'bottom',
  }

  const createMockTourContext = (overrides = {}) => ({
    tourId: 'test-tour',
    isActive: true,
    isLoading: false,
    isTransitioning: false,
    currentStep: defaultStep,
    currentStepIndex: 0,
    totalSteps: 3,
    tour: null,
    data: {},
    completedTours: [] as string[],
    skippedTours: [] as string[],
    visitedSteps: [] as string[],
    stepVisitCount: new Map<string, number>(),
    previousStepId: null as string | null,
    start: vi.fn(),
    next: vi.fn(),
    prev: vi.fn(),
    goTo: vi.fn(),
    goToStep: vi.fn(),
    skip: vi.fn(),
    complete: vi.fn(),
    stop: vi.fn(),
    setDontShowAgain: vi.fn(),
    reset: vi.fn(),
    setData: vi.fn(),
    startTour: vi.fn(),
    triggerBranchAction: vi.fn(),
    ...overrides,
  })

  const createWrapper = (contextValue: ReturnType<typeof createMockTourContext>) => {
    return function Wrapper({ children }: { children: ReactNode }) {
      return <TourContext.Provider value={contextValue}>{children}</TourContext.Provider>
    }
  }

  beforeEach(() => {
    document.body.innerHTML = '<div id="target">Target Element</div>'
    const target = document.getElementById('target')
    if (target) {
      vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(mockRect)
    }
  })

  describe('Rendering Behavior', () => {
    it('returns null when tour is inactive', () => {
      const context = createMockTourContext({ isActive: false })
      const { container } = render(<TourCardHeadless />, { wrapper: createWrapper(context) })

      expect(container.firstChild).toBeNull()
    })

    it('returns null when there is no current step', () => {
      const context = createMockTourContext({ currentStep: null })
      const { container } = render(<TourCardHeadless />, { wrapper: createWrapper(context) })

      expect(container.firstChild).toBeNull()
    })

    it('renders when tour is active with a current step', () => {
      const context = createMockTourContext()
      render(<TourCardHeadless>Step content</TourCardHeadless>, { wrapper: createWrapper(context) })

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('renders with role="dialog" by default', () => {
      const context = createMockTourContext()
      render(<TourCardHeadless>Content</TourCardHeadless>, { wrapper: createWrapper(context) })

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('renders with aria-modal="true"', () => {
      const context = createMockTourContext()
      render(<TourCardHeadless>Content</TourCardHeadless>, { wrapper: createWrapper(context) })

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
    })

    it('renders with aria-labelledby referencing step id', () => {
      const context = createMockTourContext()
      render(<TourCardHeadless>Content</TourCardHeadless>, { wrapper: createWrapper(context) })

      expect(screen.getByRole('dialog')).toHaveAttribute(
        'aria-labelledby',
        'tour-step-title-step-1'
      )
    })

    it('applies custom className', () => {
      const context = createMockTourContext()
      render(<TourCardHeadless className="custom-card">Content</TourCardHeadless>, {
        wrapper: createWrapper(context),
      })

      expect(screen.getByRole('dialog')).toHaveClass('custom-card')
    })

    it('applies custom style merged with floating styles', () => {
      const context = createMockTourContext()
      render(<TourCardHeadless style={{ backgroundColor: 'red' }}>Content</TourCardHeadless>, {
        wrapper: createWrapper(context),
      })

      const dialog = screen.getByRole('dialog')
      expect(dialog.style.backgroundColor).toBe('red')
    })

    it('renders children as content', () => {
      const context = createMockTourContext()
      render(
        <TourCardHeadless>
          <div data-testid="child">Child Content</div>
        </TourCardHeadless>,
        { wrapper: createWrapper(context) }
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
    })
  })

  describe('Render Prop Functionality', () => {
    it('calls render prop with TourCardRenderProps', () => {
      const renderFn = vi.fn(() => <div data-testid="custom">Custom</div>)
      const context = createMockTourContext()

      render(<TourCardHeadless render={renderFn} />, { wrapper: createWrapper(context) })

      expect(renderFn).toHaveBeenCalledTimes(1)
    })

    it('render prop receives isActive', () => {
      let receivedProps: TourCardRenderProps | undefined
      const renderFn = (props: TourCardRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockTourContext()

      render(<TourCardHeadless render={renderFn} />, { wrapper: createWrapper(context) })

      expect(receivedProps?.isActive).toBe(true)
    })

    it('render prop receives currentStep', () => {
      let receivedProps: TourCardRenderProps | undefined
      const renderFn = (props: TourCardRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockTourContext()

      render(<TourCardHeadless render={renderFn} />, { wrapper: createWrapper(context) })

      expect(receivedProps?.currentStep).toEqual(defaultStep)
    })

    it('render prop receives currentStepIndex', () => {
      let receivedProps: TourCardRenderProps | undefined
      const renderFn = (props: TourCardRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockTourContext({ currentStepIndex: 2 })

      render(<TourCardHeadless render={renderFn} />, { wrapper: createWrapper(context) })

      expect(receivedProps?.currentStepIndex).toBe(2)
    })

    it('render prop receives totalSteps', () => {
      let receivedProps: TourCardRenderProps | undefined
      const renderFn = (props: TourCardRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockTourContext({ totalSteps: 5 })

      render(<TourCardHeadless render={renderFn} />, { wrapper: createWrapper(context) })

      expect(receivedProps?.totalSteps).toBe(5)
    })

    it('render prop receives isFirstStep correctly', () => {
      let receivedProps: TourCardRenderProps | undefined
      const renderFn = (props: TourCardRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockTourContext({ currentStepIndex: 0, totalSteps: 3 })

      render(<TourCardHeadless render={renderFn} />, { wrapper: createWrapper(context) })

      expect(receivedProps?.isFirstStep).toBe(true)
    })

    it('render prop receives isLastStep correctly', () => {
      let receivedProps: TourCardRenderProps | undefined
      const renderFn = (props: TourCardRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockTourContext({ currentStepIndex: 2, totalSteps: 3 })

      render(<TourCardHeadless render={renderFn} />, { wrapper: createWrapper(context) })

      expect(receivedProps?.isLastStep).toBe(true)
    })

    it('render prop receives navigation functions', () => {
      let receivedProps: TourCardRenderProps | undefined
      const renderFn = (props: TourCardRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockTourContext()

      render(<TourCardHeadless render={renderFn} />, { wrapper: createWrapper(context) })

      expect(typeof receivedProps?.next).toBe('function')
      expect(typeof receivedProps?.prev).toBe('function')
      expect(typeof receivedProps?.skip).toBe('function')
    })

    it('render prop receives floatingStyles', () => {
      let receivedProps: TourCardRenderProps | undefined
      const renderFn = (props: TourCardRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockTourContext()

      render(<TourCardHeadless render={renderFn} />, { wrapper: createWrapper(context) })

      expect(receivedProps?.floatingStyles).toBeDefined()
      expect(typeof receivedProps?.floatingStyles).toBe('object')
    })

    it('render prop receives refs with setFloating', () => {
      let receivedProps: TourCardRenderProps | undefined
      const renderFn = (props: TourCardRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockTourContext()

      render(<TourCardHeadless render={renderFn} />, { wrapper: createWrapper(context) })

      expect(typeof receivedProps?.refs.setFloating).toBe('function')
    })

    it('render prop receives arrowRef', () => {
      let receivedProps: TourCardRenderProps | undefined
      const renderFn = (props: TourCardRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockTourContext()

      render(<TourCardHeadless render={renderFn} />, { wrapper: createWrapper(context) })

      expect(receivedProps?.arrowRef).toBeDefined()
      expect(receivedProps?.arrowRef.current).toBeNull() // Initially null before attach
    })

    it('render prop receives context from floating-ui', () => {
      let receivedProps: TourCardRenderProps | undefined
      const renderFn = (props: TourCardRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockTourContext()

      render(<TourCardHeadless render={renderFn} />, { wrapper: createWrapper(context) })

      expect(receivedProps?.context).toBeDefined()
    })

    it('uses render prop output instead of default rendering', () => {
      const renderFn = () => <div data-testid="custom-render">Custom Output</div>
      const context = createMockTourContext()

      render(<TourCardHeadless render={renderFn}>Default Children</TourCardHeadless>, {
        wrapper: createWrapper(context),
      })

      expect(screen.getByTestId('custom-render')).toBeInTheDocument()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('Context Integration', () => {
    it('throws error when used outside TourProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<TourCardHeadless>Content</TourCardHeadless>)
      }).toThrow('useTour must be used within a TourProvider')

      consoleSpy.mockRestore()
    })

    it('uses navigation functions from context', () => {
      const nextFn = vi.fn()
      const prevFn = vi.fn()
      const skipFn = vi.fn()

      let receivedProps: TourCardRenderProps | undefined
      const renderFn = (props: TourCardRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }

      const context = createMockTourContext({
        next: nextFn,
        prev: prevFn,
        skip: skipFn,
      })

      render(<TourCardHeadless render={renderFn} />, { wrapper: createWrapper(context) })

      receivedProps?.next()
      receivedProps?.prev()
      receivedProps?.skip()

      expect(nextFn).toHaveBeenCalled()
      expect(prevFn).toHaveBeenCalled()
      expect(skipFn).toHaveBeenCalled()
    })
  })

  describe('Target Resolution', () => {
    it('resolves target from string selector', () => {
      const step: TourStep = {
        id: 'step-1',
        target: '#target',
        content: 'Content',
      }
      const context = createMockTourContext({ currentStep: step })

      render(<TourCardHeadless>Content</TourCardHeadless>, { wrapper: createWrapper(context) })

      // Component should render (target found)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('resolves target from ref object', () => {
      const targetRef = { current: document.getElementById('target') }
      const step: TourStep = {
        id: 'step-1',
        target: targetRef,
        content: 'Content',
      }
      const context = createMockTourContext({ currentStep: step })

      render(<TourCardHeadless>Content</TourCardHeadless>, { wrapper: createWrapper(context) })

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('handles missing target gracefully', () => {
      const step: TourStep = {
        id: 'step-1',
        target: '#nonexistent',
        content: 'Content',
      }
      const context = createMockTourContext({ currentStep: step })

      render(<TourCardHeadless>Content</TourCardHeadless>, { wrapper: createWrapper(context) })

      // Should still render, but positioning would be off
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
  })

  describe('Step Position Properties', () => {
    it('correctly identifies first step', () => {
      let receivedProps: TourCardRenderProps | undefined
      const renderFn = (props: TourCardRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockTourContext({ currentStepIndex: 0, totalSteps: 5 })

      render(<TourCardHeadless render={renderFn} />, { wrapper: createWrapper(context) })

      expect(receivedProps?.isFirstStep).toBe(true)
      expect(receivedProps?.isLastStep).toBe(false)
    })

    it('correctly identifies last step', () => {
      let receivedProps: TourCardRenderProps | undefined
      const renderFn = (props: TourCardRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockTourContext({ currentStepIndex: 4, totalSteps: 5 })

      render(<TourCardHeadless render={renderFn} />, { wrapper: createWrapper(context) })

      expect(receivedProps?.isFirstStep).toBe(false)
      expect(receivedProps?.isLastStep).toBe(true)
    })

    it('correctly identifies middle step', () => {
      let receivedProps: TourCardRenderProps | undefined
      const renderFn = (props: TourCardRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockTourContext({ currentStepIndex: 2, totalSteps: 5 })

      render(<TourCardHeadless render={renderFn} />, { wrapper: createWrapper(context) })

      expect(receivedProps?.isFirstStep).toBe(false)
      expect(receivedProps?.isLastStep).toBe(false)
    })
  })
})
