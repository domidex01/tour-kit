import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TourContext } from '@tour-kit/core'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { TourCloseHeadless } from '../tour-close'

describe('TourCloseHeadless', () => {
  const createMockTourContext = (overrides = {}) => ({
    tourId: 'test-tour',
    isActive: true,
    isLoading: false,
    isTransitioning: false,
    currentStep: { id: 'step-1', target: '#target', content: 'Content' },
    currentStepIndex: 0,
    totalSteps: 3,
    tour: null,
    data: {},
    completedTours: [] as string[],
    skippedTours: [] as string[],
    start: vi.fn(),
    next: vi.fn(),
    prev: vi.fn(),
    goTo: vi.fn(),
    skip: vi.fn(),
    complete: vi.fn(),
    stop: vi.fn(),
    setDontShowAgain: vi.fn(),
    reset: vi.fn(),
    setData: vi.fn(),
    ...overrides,
  })

  const createWrapper = (contextValue: ReturnType<typeof createMockTourContext>) => {
    return function Wrapper({ children }: { children: ReactNode }) {
      return <TourContext.Provider value={contextValue}>{children}</TourContext.Provider>
    }
  }

  describe('Rendering', () => {
    it('renders a button element', () => {
      const context = createMockTourContext()
      render(<TourCloseHeadless />, { wrapper: createWrapper(context) })

      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('renders with type="button"', () => {
      const context = createMockTourContext()
      render(<TourCloseHeadless />, { wrapper: createWrapper(context) })

      expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
    })

    it('renders default close icon when no children', () => {
      const context = createMockTourContext()
      render(<TourCloseHeadless />, { wrapper: createWrapper(context) })

      const button = screen.getByRole('button')
      const svg = button.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('renders custom children instead of default icon', () => {
      const context = createMockTourContext()
      render(<TourCloseHeadless>Close</TourCloseHeadless>, { wrapper: createWrapper(context) })

      expect(screen.getByText('Close')).toBeInTheDocument()
      expect(screen.getByRole('button').querySelector('svg')).not.toBeInTheDocument()
    })

    it('applies className to button', () => {
      const context = createMockTourContext()
      render(<TourCloseHeadless className="custom-close" />, { wrapper: createWrapper(context) })

      expect(screen.getByRole('button')).toHaveClass('custom-close')
    })

    it('applies style to button', () => {
      const context = createMockTourContext()
      render(<TourCloseHeadless style={{ backgroundColor: 'red' }} />, {
        wrapper: createWrapper(context),
      })

      const button = screen.getByRole('button')
      expect(button.style.backgroundColor).toBe('red')
    })

    it('has default aria-label "Close tour"', () => {
      const context = createMockTourContext()
      render(<TourCloseHeadless />, { wrapper: createWrapper(context) })

      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Close tour')
    })

    it('uses custom aria-label when provided', () => {
      const context = createMockTourContext()
      render(<TourCloseHeadless aria-label="Exit tour" />, { wrapper: createWrapper(context) })

      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Exit tour')
    })
  })

  describe('Event Handling', () => {
    it('calls skip from context when clicked', async () => {
      const user = userEvent.setup()
      const skipFn = vi.fn()
      const context = createMockTourContext({ skip: skipFn })

      render(<TourCloseHeadless />, { wrapper: createWrapper(context) })

      await user.click(screen.getByRole('button'))

      expect(skipFn).toHaveBeenCalledTimes(1)
    })

    it('calls custom onClick before skip', async () => {
      const user = userEvent.setup()
      const callOrder: string[] = []
      const onClick = vi.fn(() => callOrder.push('onClick'))
      const skipFn = vi.fn(() => callOrder.push('skip'))
      const context = createMockTourContext({ skip: skipFn })

      render(<TourCloseHeadless onClick={onClick} />, { wrapper: createWrapper(context) })

      await user.click(screen.getByRole('button'))

      expect(callOrder).toEqual(['onClick', 'skip'])
    })

    it('calls both onClick and skip on click', async () => {
      const user = userEvent.setup()
      const onClick = vi.fn()
      const skipFn = vi.fn()
      const context = createMockTourContext({ skip: skipFn })

      render(<TourCloseHeadless onClick={onClick} />, { wrapper: createWrapper(context) })

      await user.click(screen.getByRole('button'))

      expect(onClick).toHaveBeenCalledTimes(1)
      expect(skipFn).toHaveBeenCalledTimes(1)
    })

    it('works without custom onClick', async () => {
      const user = userEvent.setup()
      const skipFn = vi.fn()
      const context = createMockTourContext({ skip: skipFn })

      render(<TourCloseHeadless />, { wrapper: createWrapper(context) })

      await user.click(screen.getByRole('button'))

      expect(skipFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('Context Integration', () => {
    it('throws error when used outside TourProvider', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        render(<TourCloseHeadless />)
      }).toThrow('useTour must be used within a TourProvider')

      consoleSpy.mockRestore()
    })

    it('uses skip function from context', async () => {
      const user = userEvent.setup()
      const skipFn = vi.fn()
      const context = createMockTourContext({ skip: skipFn })

      render(<TourCloseHeadless />, { wrapper: createWrapper(context) })

      await user.click(screen.getByRole('button'))

      expect(skipFn).toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('default icon has aria-hidden="true"', () => {
      const context = createMockTourContext()
      render(<TourCloseHeadless />, { wrapper: createWrapper(context) })

      const svg = screen.getByRole('button').querySelector('svg')
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    })

    it('button is focusable', () => {
      const context = createMockTourContext()
      render(<TourCloseHeadless />, { wrapper: createWrapper(context) })

      const button = screen.getByRole('button')
      button.focus()
      expect(document.activeElement).toBe(button)
    })

    it('has accessible name via aria-label', () => {
      const context = createMockTourContext()
      render(<TourCloseHeadless />, { wrapper: createWrapper(context) })

      expect(screen.getByRole('button', { name: 'Close tour' })).toBeInTheDocument()
    })

    it('can be activated with Enter key', async () => {
      const user = userEvent.setup()
      const skipFn = vi.fn()
      const context = createMockTourContext({ skip: skipFn })

      render(<TourCloseHeadless />, { wrapper: createWrapper(context) })

      const button = screen.getByRole('button')
      button.focus()
      await user.keyboard('{Enter}')

      expect(skipFn).toHaveBeenCalled()
    })

    it('can be activated with Space key', async () => {
      const user = userEvent.setup()
      const skipFn = vi.fn()
      const context = createMockTourContext({ skip: skipFn })

      render(<TourCloseHeadless />, { wrapper: createWrapper(context) })

      const button = screen.getByRole('button')
      button.focus()
      await user.keyboard(' ')

      expect(skipFn).toHaveBeenCalled()
    })
  })

  describe('Icon Rendering', () => {
    it('default icon has correct dimensions', () => {
      const context = createMockTourContext()
      render(<TourCloseHeadless />, { wrapper: createWrapper(context) })

      const svg = screen.getByRole('button').querySelector('svg')
      expect(svg).toHaveAttribute('width', '16')
      expect(svg).toHaveAttribute('height', '16')
    })

    it('default icon has correct viewBox', () => {
      const context = createMockTourContext()
      render(<TourCloseHeadless />, { wrapper: createWrapper(context) })

      const svg = screen.getByRole('button').querySelector('svg')
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
    })

    it('default icon uses currentColor for stroke', () => {
      const context = createMockTourContext()
      render(<TourCloseHeadless />, { wrapper: createWrapper(context) })

      const svg = screen.getByRole('button').querySelector('svg')
      expect(svg).toHaveAttribute('stroke', 'currentColor')
    })
  })
})
