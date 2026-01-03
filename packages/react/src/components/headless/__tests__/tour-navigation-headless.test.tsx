import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TourNavigationHeadless, type TourNavigationRenderProps } from '../tour-navigation'

describe('TourNavigationHeadless', () => {
  const defaultProps = {
    isFirstStep: false,
    isLastStep: false,
    onPrev: vi.fn(),
    onNext: vi.fn(),
  }

  describe('Default Rendering', () => {
    it('renders container div', () => {
      render(<TourNavigationHeadless {...defaultProps} />)

      // The container div should exist
      expect(document.querySelector('div')).toBeInTheDocument()
    })

    it('applies className to container', () => {
      const { container } = render(
        <TourNavigationHeadless {...defaultProps} className="custom-nav" />
      )

      expect(container.firstChild).toHaveClass('custom-nav')
    })

    it('applies style to container', () => {
      const { container } = render(
        <TourNavigationHeadless {...defaultProps} style={{ display: 'flex' }} />
      )

      expect(container.firstChild).toHaveStyle({ display: 'flex' })
    })

    it('renders Next button when not last step', () => {
      render(<TourNavigationHeadless {...defaultProps} isLastStep={false} />)

      expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument()
    })

    it('renders Finish button on last step', () => {
      render(<TourNavigationHeadless {...defaultProps} isLastStep={true} />)

      expect(screen.getByRole('button', { name: 'Finish' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()
    })

    it('hides Back button on first step', () => {
      render(<TourNavigationHeadless {...defaultProps} isFirstStep={true} />)

      expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()
    })

    it('shows Back button on non-first steps', () => {
      render(<TourNavigationHeadless {...defaultProps} isFirstStep={false} />)

      expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument()
    })

    it('shows Skip button when onSkip provided', () => {
      render(<TourNavigationHeadless {...defaultProps} onSkip={vi.fn()} />)

      expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument()
    })

    it('hides Skip button on last step', () => {
      render(<TourNavigationHeadless {...defaultProps} onSkip={vi.fn()} isLastStep={true} />)

      expect(screen.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument()
    })

    it('does not show Skip button without onSkip', () => {
      render(<TourNavigationHeadless {...defaultProps} />)

      expect(screen.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument()
    })

    it('renders children instead of default buttons', () => {
      render(
        <TourNavigationHeadless {...defaultProps}>
          <button type="button">Custom Button</button>
        </TourNavigationHeadless>
      )

      expect(screen.getByRole('button', { name: 'Custom Button' })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()
    })
  })

  describe('Render Prop Functionality', () => {
    it('calls render prop with TourNavigationRenderProps', () => {
      const renderFn = vi.fn(() => <div>Custom</div>)

      render(<TourNavigationHeadless {...defaultProps} render={renderFn} />)

      expect(renderFn).toHaveBeenCalledTimes(1)
    })

    it('render prop receives isFirstStep', () => {
      let receivedProps: TourNavigationRenderProps | undefined
      const renderFn = (props: TourNavigationRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }

      render(<TourNavigationHeadless {...defaultProps} isFirstStep={true} render={renderFn} />)

      expect(receivedProps?.isFirstStep).toBe(true)
    })

    it('render prop receives isLastStep', () => {
      let receivedProps: TourNavigationRenderProps | undefined
      const renderFn = (props: TourNavigationRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }

      render(<TourNavigationHeadless {...defaultProps} isLastStep={true} render={renderFn} />)

      expect(receivedProps?.isLastStep).toBe(true)
    })

    it('render prop receives onPrev handler', () => {
      let receivedProps: TourNavigationRenderProps | undefined
      const onPrev = vi.fn()
      const renderFn = (props: TourNavigationRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }

      render(<TourNavigationHeadless {...defaultProps} onPrev={onPrev} render={renderFn} />)

      expect(receivedProps?.onPrev).toBe(onPrev)
    })

    it('render prop receives onNext handler', () => {
      let receivedProps: TourNavigationRenderProps | undefined
      const onNext = vi.fn()
      const renderFn = (props: TourNavigationRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }

      render(<TourNavigationHeadless {...defaultProps} onNext={onNext} render={renderFn} />)

      expect(receivedProps?.onNext).toBe(onNext)
    })

    it('render prop receives onSkip handler', () => {
      let receivedProps: TourNavigationRenderProps | undefined
      const onSkip = vi.fn()
      const renderFn = (props: TourNavigationRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }

      render(<TourNavigationHeadless {...defaultProps} onSkip={onSkip} render={renderFn} />)

      expect(receivedProps?.onSkip).toBe(onSkip)
    })

    it('render prop receives all labels', () => {
      let receivedProps: TourNavigationRenderProps | undefined
      const renderFn = (props: TourNavigationRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }

      render(<TourNavigationHeadless {...defaultProps} render={renderFn} />)

      expect(receivedProps?.prevLabel).toBe('Back')
      expect(receivedProps?.nextLabel).toBe('Next')
      expect(receivedProps?.finishLabel).toBe('Finish')
      expect(receivedProps?.skipLabel).toBe('Skip')
    })

    it('render prop receives custom labels', () => {
      let receivedProps: TourNavigationRenderProps | undefined
      const renderFn = (props: TourNavigationRenderProps) => {
        receivedProps = props
        return <div>Custom</div>
      }

      render(
        <TourNavigationHeadless
          {...defaultProps}
          prevLabel="Previous"
          nextLabel="Continue"
          finishLabel="Done"
          skipLabel="Cancel"
          render={renderFn}
        />
      )

      expect(receivedProps?.prevLabel).toBe('Previous')
      expect(receivedProps?.nextLabel).toBe('Continue')
      expect(receivedProps?.finishLabel).toBe('Done')
      expect(receivedProps?.skipLabel).toBe('Cancel')
    })

    it('uses render prop output instead of default', () => {
      const renderFn = () => <div data-testid="custom-nav">Custom Navigation</div>

      render(<TourNavigationHeadless {...defaultProps} render={renderFn} />)

      expect(screen.getByTestId('custom-nav')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()
    })
  })

  describe('Label Customization', () => {
    it('uses default prevLabel "Back"', () => {
      render(<TourNavigationHeadless {...defaultProps} isFirstStep={false} />)

      expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument()
    })

    it('uses default nextLabel "Next"', () => {
      render(<TourNavigationHeadless {...defaultProps} isLastStep={false} />)

      expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument()
    })

    it('uses default finishLabel "Finish"', () => {
      render(<TourNavigationHeadless {...defaultProps} isLastStep={true} />)

      expect(screen.getByRole('button', { name: 'Finish' })).toBeInTheDocument()
    })

    it('uses default skipLabel "Skip"', () => {
      render(<TourNavigationHeadless {...defaultProps} onSkip={vi.fn()} />)

      expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument()
    })

    it('uses custom prevLabel', () => {
      render(<TourNavigationHeadless {...defaultProps} isFirstStep={false} prevLabel="Go Back" />)

      expect(screen.getByRole('button', { name: 'Go Back' })).toBeInTheDocument()
    })

    it('uses custom nextLabel', () => {
      render(<TourNavigationHeadless {...defaultProps} isLastStep={false} nextLabel="Continue" />)

      expect(screen.getByRole('button', { name: 'Continue' })).toBeInTheDocument()
    })

    it('uses custom finishLabel', () => {
      render(<TourNavigationHeadless {...defaultProps} isLastStep={true} finishLabel="Complete" />)

      expect(screen.getByRole('button', { name: 'Complete' })).toBeInTheDocument()
    })

    it('uses custom skipLabel', () => {
      render(<TourNavigationHeadless {...defaultProps} onSkip={vi.fn()} skipLabel="Cancel" />)

      expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    })
  })

  describe('Event Handling', () => {
    it('calls onPrev when Back button is clicked', async () => {
      const user = userEvent.setup()
      const onPrev = vi.fn()

      render(<TourNavigationHeadless {...defaultProps} isFirstStep={false} onPrev={onPrev} />)

      await user.click(screen.getByRole('button', { name: 'Back' }))

      expect(onPrev).toHaveBeenCalledTimes(1)
    })

    it('calls onNext when Next button is clicked', async () => {
      const user = userEvent.setup()
      const onNext = vi.fn()

      render(<TourNavigationHeadless {...defaultProps} isLastStep={false} onNext={onNext} />)

      await user.click(screen.getByRole('button', { name: 'Next' }))

      expect(onNext).toHaveBeenCalledTimes(1)
    })

    it('calls onNext when Finish button is clicked', async () => {
      const user = userEvent.setup()
      const onNext = vi.fn()

      render(<TourNavigationHeadless {...defaultProps} isLastStep={true} onNext={onNext} />)

      await user.click(screen.getByRole('button', { name: 'Finish' }))

      expect(onNext).toHaveBeenCalledTimes(1)
    })

    it('calls onSkip when Skip button is clicked', async () => {
      const user = userEvent.setup()
      const onSkip = vi.fn()

      render(<TourNavigationHeadless {...defaultProps} onSkip={onSkip} />)

      await user.click(screen.getByRole('button', { name: 'Skip' }))

      expect(onSkip).toHaveBeenCalledTimes(1)
    })
  })

  describe('Button States', () => {
    it('all buttons have type="button"', () => {
      render(<TourNavigationHeadless {...defaultProps} isFirstStep={false} onSkip={vi.fn()} />)

      const buttons = screen.getAllByRole('button')
      for (const button of buttons) {
        expect(button).toHaveAttribute('type', 'button')
      }
    })

    it('shows all buttons on middle step with onSkip', () => {
      render(
        <TourNavigationHeadless
          {...defaultProps}
          isFirstStep={false}
          isLastStep={false}
          onSkip={vi.fn()}
        />
      )

      expect(screen.getByRole('button', { name: 'Skip' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument()
    })

    it('shows only Next on first step without onSkip', () => {
      render(<TourNavigationHeadless {...defaultProps} isFirstStep={true} isLastStep={false} />)

      expect(screen.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument()
    })

    it('shows Back and Finish on last step', () => {
      render(<TourNavigationHeadless {...defaultProps} isFirstStep={false} isLastStep={true} />)

      expect(screen.queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Back' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Finish' })).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles single-step tour (first and last)', () => {
      render(<TourNavigationHeadless {...defaultProps} isFirstStep={true} isLastStep={true} />)

      expect(screen.queryByRole('button', { name: 'Back' })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Finish' })).toBeInTheDocument()
    })

    it('render prop overrides children', () => {
      render(
        <TourNavigationHeadless
          {...defaultProps}
          render={() => <div data-testid="render-output">Render</div>}
        >
          <div data-testid="children">Children</div>
        </TourNavigationHeadless>
      )

      expect(screen.getByTestId('render-output')).toBeInTheDocument()
      expect(screen.queryByTestId('children')).not.toBeInTheDocument()
    })

    it('children override default rendering', () => {
      render(
        <TourNavigationHeadless {...defaultProps}>
          <div data-testid="children">Custom Children</div>
        </TourNavigationHeadless>
      )

      expect(screen.getByTestId('children')).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Next' })).not.toBeInTheDocument()
    })
  })
})
