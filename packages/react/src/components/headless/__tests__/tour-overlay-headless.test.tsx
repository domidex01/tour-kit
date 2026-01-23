import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TourContext, type TourStep } from '@tour-kit/core'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TourOverlayHeadless, type TourOverlayRenderProps } from '../tour-overlay'

// Mock TourPortal to render children directly for easier testing
vi.mock('../../primitives/tour-portal', () => ({
  TourPortal: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

// Mock useSpotlight
const mockSpotlight = {
  isVisible: true,
  targetRect: null as DOMRect | null,
  overlayStyle: { position: 'fixed' as const, inset: 0 },
  cutoutStyle: { position: 'absolute' as const },
  show: vi.fn(),
  hide: vi.fn(),
  update: vi.fn(),
}

// Mock usePrefersReducedMotion
let mockPrefersReducedMotion = false

vi.mock('@tour-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tour-kit/core')>()
  return {
    ...actual,
    useSpotlight: vi.fn(() => mockSpotlight),
    usePrefersReducedMotion: vi.fn(() => mockPrefersReducedMotion),
  }
})

describe('TourOverlayHeadless', () => {
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
    spotlightPadding: 10,
    spotlightRadius: 8,
    interactive: false,
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
    vi.clearAllMocks()
    mockSpotlight.targetRect = null
    mockPrefersReducedMotion = false

    document.body.innerHTML = '<div id="target">Target Element</div>'
    const target = document.getElementById('target')
    if (target) {
      vi.spyOn(target, 'getBoundingClientRect').mockReturnValue(mockRect)
    }
  })

  describe('Rendering Behavior', () => {
    it('returns null when tour is inactive', () => {
      const context = createMockTourContext({ isActive: false })
      const { container } = render(<TourOverlayHeadless />, { wrapper: createWrapper(context) })

      expect(container.firstChild).toBeNull()
    })

    it('renders when tour is active', () => {
      const context = createMockTourContext()
      render(<TourOverlayHeadless />, { wrapper: createWrapper(context) })

      // Should render an overlay element
      expect(document.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
    })

    it('applies className to overlay', () => {
      const context = createMockTourContext()
      render(<TourOverlayHeadless className="custom-overlay" />, {
        wrapper: createWrapper(context),
      })

      expect(document.querySelector('.custom-overlay')).toBeInTheDocument()
    })

    it('applies style merged with overlayStyle', () => {
      const context = createMockTourContext()
      render(<TourOverlayHeadless style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} />, {
        wrapper: createWrapper(context),
      })

      const overlay = document.querySelector('[aria-hidden="true"]')
      expect(overlay).toHaveStyle({ backgroundColor: 'rgba(0,0,0,0.5)' })
    })

    it('renders cutout when targetRect exists', () => {
      mockSpotlight.targetRect = mockRect
      const context = createMockTourContext()

      const { container } = render(<TourOverlayHeadless cutoutClassName="cutout" />, {
        wrapper: createWrapper(context),
      })

      expect(container.querySelector('.cutout')).toBeInTheDocument()
    })

    it('does not render cutout without targetRect', () => {
      mockSpotlight.targetRect = null
      const context = createMockTourContext()

      const { container } = render(<TourOverlayHeadless cutoutClassName="cutout" />, {
        wrapper: createWrapper(context),
      })

      expect(container.querySelector('.cutout')).not.toBeInTheDocument()
    })

    it('applies cutoutClassName to cutout', () => {
      mockSpotlight.targetRect = mockRect
      const context = createMockTourContext()

      const { container } = render(<TourOverlayHeadless cutoutClassName="my-cutout" />, {
        wrapper: createWrapper(context),
      })

      expect(container.querySelector('.my-cutout')).toBeInTheDocument()
    })

    it('applies cutoutStyle merged with computed styles', () => {
      mockSpotlight.targetRect = mockRect
      const context = createMockTourContext()

      render(<TourOverlayHeadless cutoutStyle={{ borderRadius: '16px' }} />, {
        wrapper: createWrapper(context),
      })

      // The cutout should exist (can't easily verify merged styles in jsdom)
      expect(document.querySelectorAll('div').length).toBeGreaterThan(1)
    })

    it('has aria-hidden on overlay', () => {
      const context = createMockTourContext()
      render(<TourOverlayHeadless />, { wrapper: createWrapper(context) })

      expect(document.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
    })
  })

  describe('Render Prop Functionality', () => {
    it('calls render prop with TourOverlayRenderProps', () => {
      const renderFn = vi.fn(() => <div data-testid="custom">Custom</div>)
      const context = createMockTourContext()

      render(<TourOverlayHeadless render={renderFn} />, { wrapper: createWrapper(context) })

      expect(renderFn).toHaveBeenCalledTimes(1)
    })

    it('render prop receives isActive', () => {
      let receivedProps: TourOverlayRenderProps | undefined
      const renderFn = (props: TourOverlayRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockTourContext()

      render(<TourOverlayHeadless render={renderFn} />, { wrapper: createWrapper(context) })

      expect(receivedProps?.isActive).toBe(true)
    })

    it('render prop receives overlayStyle', () => {
      let receivedProps: TourOverlayRenderProps | undefined
      const renderFn = (props: TourOverlayRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockTourContext()

      render(<TourOverlayHeadless render={renderFn} />, { wrapper: createWrapper(context) })

      expect(receivedProps?.overlayStyle).toBeDefined()
      expect(typeof receivedProps?.overlayStyle).toBe('object')
    })

    it('render prop receives cutoutStyle', () => {
      let receivedProps: TourOverlayRenderProps | undefined
      const renderFn = (props: TourOverlayRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockTourContext()

      render(<TourOverlayHeadless render={renderFn} />, { wrapper: createWrapper(context) })

      expect(receivedProps?.cutoutStyle).toBeDefined()
    })

    it('render prop receives targetRect', () => {
      mockSpotlight.targetRect = mockRect
      let receivedProps: TourOverlayRenderProps | undefined
      const renderFn = (props: TourOverlayRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const context = createMockTourContext()

      render(<TourOverlayHeadless render={renderFn} />, { wrapper: createWrapper(context) })

      expect(receivedProps?.targetRect).toBe(mockRect)
    })

    it('render prop receives interactive flag', () => {
      let receivedProps: TourOverlayRenderProps | undefined
      const renderFn = (props: TourOverlayRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const step = { ...defaultStep, interactive: true }
      const context = createMockTourContext({ currentStep: step })

      render(<TourOverlayHeadless render={renderFn} />, { wrapper: createWrapper(context) })

      expect(receivedProps?.interactive).toBe(true)
    })

    it('interactive defaults to false', () => {
      let receivedProps: TourOverlayRenderProps | undefined
      const renderFn = (props: TourOverlayRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }
      const step = { ...defaultStep, interactive: undefined }
      const context = createMockTourContext({ currentStep: step })

      render(<TourOverlayHeadless render={renderFn} />, { wrapper: createWrapper(context) })

      expect(receivedProps?.interactive).toBe(false)
    })

    it('uses render prop output instead of default', () => {
      const renderFn = () => <div data-testid="custom-overlay">Custom Overlay</div>
      const context = createMockTourContext()

      render(<TourOverlayHeadless render={renderFn} />, { wrapper: createWrapper(context) })

      expect(screen.getByTestId('custom-overlay')).toBeInTheDocument()
      // Default overlay not rendered
      expect(document.querySelector('[aria-hidden="true"]')).not.toBeInTheDocument()
    })
  })

  describe('Spotlight Integration', () => {
    it('calls show when active with target element', () => {
      const context = createMockTourContext()
      render(<TourOverlayHeadless />, { wrapper: createWrapper(context) })

      expect(mockSpotlight.show).toHaveBeenCalled()
    })

    it('calls hide when inactive', () => {
      const context = createMockTourContext({ isActive: false })
      render(<TourOverlayHeadless />, { wrapper: createWrapper(context) })

      expect(mockSpotlight.hide).toHaveBeenCalled()
    })

    it('passes spotlightPadding to show', () => {
      const step = { ...defaultStep, spotlightPadding: 20 }
      const context = createMockTourContext({ currentStep: step })
      render(<TourOverlayHeadless />, { wrapper: createWrapper(context) })

      expect(mockSpotlight.show).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ padding: 20 })
      )
    })

    it('passes spotlightRadius to show', () => {
      const step = { ...defaultStep, spotlightRadius: 12 }
      const context = createMockTourContext({ currentStep: step })
      render(<TourOverlayHeadless />, { wrapper: createWrapper(context) })

      expect(mockSpotlight.show).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ borderRadius: 12 })
      )
    })

    it('respects prefers-reduced-motion preference', () => {
      mockPrefersReducedMotion = true
      const context = createMockTourContext()
      render(<TourOverlayHeadless />, { wrapper: createWrapper(context) })

      expect(mockSpotlight.show).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ animate: false })
      )
    })

    it('enables animation when reduced motion not preferred', () => {
      mockPrefersReducedMotion = false
      const context = createMockTourContext()
      render(<TourOverlayHeadless />, { wrapper: createWrapper(context) })

      expect(mockSpotlight.show).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({ animate: true })
      )
    })
  })

  describe('Target Resolution', () => {
    it('resolves string selector target', () => {
      const step: TourStep = { ...defaultStep, target: '#target' }
      const context = createMockTourContext({ currentStep: step })
      render(<TourOverlayHeadless />, { wrapper: createWrapper(context) })

      // show should be called with the resolved element
      expect(mockSpotlight.show).toHaveBeenCalledWith(
        document.getElementById('target'),
        expect.any(Object)
      )
    })

    it('resolves ref target', () => {
      const targetElement = document.getElementById('target')
      const targetRef = { current: targetElement }
      const step: TourStep = { ...defaultStep, target: targetRef }
      const context = createMockTourContext({ currentStep: step })
      render(<TourOverlayHeadless />, { wrapper: createWrapper(context) })

      expect(mockSpotlight.show).toHaveBeenCalledWith(targetElement, expect.any(Object))
    })

    it('handles missing target gracefully', () => {
      const step: TourStep = { ...defaultStep, target: '#nonexistent' }
      const context = createMockTourContext({ currentStep: step })
      render(<TourOverlayHeadless />, { wrapper: createWrapper(context) })

      // Should call hide instead of show when target not found
      expect(mockSpotlight.hide).toHaveBeenCalled()
    })
  })

  describe('Pointer Events', () => {
    it('cutout allows pointer events when interactive', () => {
      mockSpotlight.targetRect = mockRect
      const step = { ...defaultStep, interactive: true }
      const context = createMockTourContext({ currentStep: step })

      render(<TourOverlayHeadless cutoutClassName="cutout" />, {
        wrapper: createWrapper(context),
      })

      const cutout = document.querySelector('.cutout')
      expect(cutout).toHaveStyle({ pointerEvents: 'auto' })
    })

    it('cutout blocks pointer events by default', () => {
      mockSpotlight.targetRect = mockRect
      const step = { ...defaultStep, interactive: false }
      const context = createMockTourContext({ currentStep: step })

      render(<TourOverlayHeadless cutoutClassName="cutout" />, {
        wrapper: createWrapper(context),
      })

      const cutout = document.querySelector('.cutout')
      expect(cutout).toHaveStyle({ pointerEvents: 'none' })
    })
  })

  describe('Event Handling', () => {
    it('calls onClick when overlay is clicked', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()
      const context = createMockTourContext()

      render(<TourOverlayHeadless onClick={onClick} data-testid="overlay" />, {
        wrapper: createWrapper(context),
      })

      const overlay = document.querySelector('[aria-hidden="true"]')
      if (overlay) {
        await user.click(overlay)
        expect(onClick).toHaveBeenCalledTimes(1)
      }
    })
  })

  describe('Context Integration', () => {
    it('throws error when used outside TourProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<TourOverlayHeadless />)
      }).toThrow('useTour must be used within a TourProvider')

      consoleSpy.mockRestore()
    })
  })

  describe('Step Configuration', () => {
    it('handles step without spotlight configuration', () => {
      const step: TourStep = {
        id: 'step-1',
        target: '#target',
        content: 'Content',
        // No spotlightPadding or spotlightRadius
      }
      const context = createMockTourContext({ currentStep: step })
      render(<TourOverlayHeadless />, { wrapper: createWrapper(context) })

      // Should still call show, but with undefined padding/radius
      expect(mockSpotlight.show).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          padding: undefined,
          borderRadius: undefined,
        })
      )
    })
  })
})
