import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { describe, expect, it, vi } from 'vitest'
import { QuestionRating } from '../components/question-rating'

vi.mock('@tour-kit/license', () => ({
  ProGate: ({ children }: { children: React.ReactNode }) => children,
  useLicenseGate: () => ({ isAllowed: true, isLoading: false }),
}))

describe('QuestionRating', () => {
  const defaultProps = {
    id: 'rating-test',
    label: 'Rate this feature',
  }

  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------

  it('should have no axe violations', async () => {
    const { container } = render(<QuestionRating {...defaultProps} min={1} max={5} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should render a radiogroup with the correct aria-label', () => {
    render(<QuestionRating {...defaultProps} />)
    const group = screen.getByRole('radiogroup')
    expect(group).toHaveAttribute('aria-label', 'Rate this feature')
  })

  it('should set aria-required on the radiogroup', () => {
    render(<QuestionRating {...defaultProps} isRequired />)
    const group = screen.getByRole('radiogroup')
    expect(group).toHaveAttribute('aria-required', 'true')
  })

  it('should render radio options with aria-checked', () => {
    render(<QuestionRating {...defaultProps} min={1} max={3} value={2} />)
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(3)
    expect(radios[0]).toHaveAttribute('aria-checked', 'false')
    expect(radios[1]).toHaveAttribute('aria-checked', 'true')
    expect(radios[2]).toHaveAttribute('aria-checked', 'false')
  })

  it('should use roving tabindex — only focused option has tabIndex=0', () => {
    render(<QuestionRating {...defaultProps} min={1} max={3} />)
    const radios = screen.getAllByRole('radio')
    expect(radios[0]).toHaveAttribute('tabindex', '0')
    expect(radios[1]).toHaveAttribute('tabindex', '-1')
    expect(radios[2]).toHaveAttribute('tabindex', '-1')
  })

  it('should have aria-label on each option describing the rating', () => {
    render(<QuestionRating {...defaultProps} min={1} max={5} />)
    const radios = screen.getAllByRole('radio')
    expect(radios[0]).toHaveAttribute('aria-label', 'Rate 1 out of 5')
    expect(radios[4]).toHaveAttribute('aria-label', 'Rate 5 out of 5')
  })

  // -------------------------------------------------------------------------
  // Keyboard navigation
  // -------------------------------------------------------------------------

  it('should move focus with ArrowRight and wrap around', async () => {
    const user = userEvent.setup()
    render(<QuestionRating {...defaultProps} min={1} max={3} />)
    const radios = screen.getAllByRole('radio')

    await user.tab() // focus first
    expect(radios[0]).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    expect(radios[1]).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    expect(radios[2]).toHaveFocus()

    // Wrap to beginning
    await user.keyboard('{ArrowRight}')
    expect(radios[0]).toHaveFocus()
  })

  it('should move focus with ArrowLeft and wrap around', async () => {
    const user = userEvent.setup()
    render(<QuestionRating {...defaultProps} min={1} max={3} />)
    const radios = screen.getAllByRole('radio')

    await user.tab()
    expect(radios[0]).toHaveFocus()

    // Wrap to end
    await user.keyboard('{ArrowLeft}')
    expect(radios[2]).toHaveFocus()
  })

  it('should jump to first with Home and last with End', async () => {
    const user = userEvent.setup()
    render(<QuestionRating {...defaultProps} min={1} max={5} />)
    const radios = screen.getAllByRole('radio')

    await user.tab()
    await user.keyboard('{ArrowRight}')
    await user.keyboard('{ArrowRight}')
    expect(radios[2]).toHaveFocus()

    await user.keyboard('{Home}')
    expect(radios[0]).toHaveFocus()

    await user.keyboard('{End}')
    expect(radios[4]).toHaveFocus()
  })

  it('should select with Space key', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<QuestionRating {...defaultProps} min={1} max={3} onChange={onChange} />)
    const radios = screen.getAllByRole('radio')

    await user.tab()
    await user.keyboard('{ArrowRight}')
    await user.keyboard(' ')

    expect(onChange).toHaveBeenCalledWith(2)
    expect(radios[1]).toHaveAttribute('aria-checked', 'true')
  })

  it('should select with Enter key', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<QuestionRating {...defaultProps} min={1} max={3} onChange={onChange} />)

    await user.tab()
    await user.keyboard('{Enter}')

    expect(onChange).toHaveBeenCalledWith(1)
  })

  // -------------------------------------------------------------------------
  // Controlled / Uncontrolled
  // -------------------------------------------------------------------------

  it('should work in controlled mode', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(
      <QuestionRating {...defaultProps} min={1} max={3} value={1} onChange={onChange} />
    )

    const radios = screen.getAllByRole('radio')
    expect(radios[0]).toHaveAttribute('aria-checked', 'true')

    await user.click(radios[2])
    expect(onChange).toHaveBeenCalledWith(3)

    // Value doesn't change until parent re-renders with new value
    expect(radios[0]).toHaveAttribute('aria-checked', 'true')

    rerender(<QuestionRating {...defaultProps} min={1} max={3} value={3} onChange={onChange} />)
    expect(radios[2]).toHaveAttribute('aria-checked', 'true')
  })

  it('should work in uncontrolled mode', async () => {
    const user = userEvent.setup()
    render(<QuestionRating {...defaultProps} min={1} max={3} />)

    const radios = screen.getAllByRole('radio')
    expect(radios[0]).toHaveAttribute('aria-checked', 'false')

    await user.click(radios[1])
    expect(radios[1]).toHaveAttribute('aria-checked', 'true')
  })

  // -------------------------------------------------------------------------
  // Click selection
  // -------------------------------------------------------------------------

  it('should select on click and call onChange', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<QuestionRating {...defaultProps} min={1} max={5} onChange={onChange} />)

    const radios = screen.getAllByRole('radio')
    await user.click(radios[3])

    expect(onChange).toHaveBeenCalledWith(4)
  })

  // -------------------------------------------------------------------------
  // Visual styles
  // -------------------------------------------------------------------------

  it('should render sr-only text for stars style', () => {
    render(<QuestionRating {...defaultProps} min={1} max={3} style="stars" />)
    const srOnlyElements = document.querySelectorAll('.sr-only')
    expect(srOnlyElements.length).toBe(3)
  })

  it('should render sr-only text for emoji style', () => {
    render(<QuestionRating {...defaultProps} min={1} max={3} style="emoji" />)
    const srOnlyElements = document.querySelectorAll('.sr-only')
    expect(srOnlyElements.length).toBe(3)
  })

  // -------------------------------------------------------------------------
  // Labels
  // -------------------------------------------------------------------------

  it('should render low and high labels when provided', () => {
    render(<QuestionRating {...defaultProps} lowLabel="Not likely" highLabel="Very likely" />)
    expect(screen.getByText('Not likely')).toBeInTheDocument()
    expect(screen.getByText('Very likely')).toBeInTheDocument()
  })

  it('should render default scale from 0 to 10', () => {
    render(<QuestionRating {...defaultProps} />)
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(11)
  })

  it('should ensure all buttons have type="button"', () => {
    render(<QuestionRating {...defaultProps} min={1} max={3} />)
    const buttons = document.querySelectorAll('button')
    for (const button of buttons) {
      expect(button).toHaveAttribute('type', 'button')
    }
  })
})
