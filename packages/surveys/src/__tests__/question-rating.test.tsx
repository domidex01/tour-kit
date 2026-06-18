import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { QuestionRating } from '../components/question-rating'
import type { RatingScale } from '../types/question'

vi.mock('@tour-kit/license', () => ({
  LicenseGate: ({ children }: { children: React.ReactNode }) => children,
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

// ---------------------------------------------------------------------------
// Slice 3 — RatingScale.step honored (was hardcoded `const step = 1`)
// RED before question-rating.tsx reads `ratingScale?.step` and adds it to the
// useMemo deps. Today step:5 over 0..10 still renders 11 radios.
// ---------------------------------------------------------------------------

describe('step (RatingScale.step honored)', () => {
  const labelProps = { id: 'rating-step', label: 'Rate this feature' }

  it('step:5 over min 0 / max 10 → exactly 3 radios [0, 5, 10]', () => {
    render(<QuestionRating {...labelProps} ratingScale={{ min: 0, max: 10, step: 5 }} />)
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(3)
    expect(radios[0]).toHaveAttribute('aria-label', 'Rate 0 out of 10')
    expect(radios[1]).toHaveAttribute('aria-label', 'Rate 5 out of 10')
    expect(radios[2]).toHaveAttribute('aria-label', 'Rate 10 out of 10')
  })

  it('step:2 over min 0 / max 6 → [0, 2, 4, 6] (4 radios)', () => {
    render(<QuestionRating {...labelProps} ratingScale={{ min: 0, max: 6, step: 2 }} />)
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(4)
    expect(radios.map((r) => r.getAttribute('aria-label'))).toEqual([
      'Rate 0 out of 6',
      'Rate 2 out of 6',
      'Rate 4 out of 6',
      'Rate 6 out of 6',
    ])
  })

  it('no step on ratingScale → default 1 (no regression)', () => {
    render(<QuestionRating {...labelProps} ratingScale={{ min: 1, max: 5 }} />)
    expect(screen.getAllByRole('radio')).toHaveLength(5)
  })

  it('no ratingScale at all → default 0..10 step 1 (11 radios)', () => {
    render(<QuestionRating {...labelProps} />)
    expect(screen.getAllByRole('radio')).toHaveLength(11)
  })

  it('shape-freeze: RatingScale.step stays optional number — Studio contract', () => {
    // Compiled by vitest's esbuild; this case fails to TYPECHECK if `step` is
    // reshaped (made required, or typed string/object). Both literals must compile.
    const withStep: RatingScale = { min: 0, max: 10, step: 5 }
    const withoutStep: RatingScale = { min: 1, max: 5 } // step omitted is valid
    expect(withStep.step).toBe(5)
    expect(withoutStep.step).toBeUndefined()
    // @ts-expect-error — step must be a number, not a string (locks the shape)
    const _bad: RatingScale = { min: 0, max: 10, step: '5' }
    void _bad
  })

  it('axe: a stepped scale has no violations', async () => {
    const { container } = render(
      <QuestionRating {...labelProps} ratingScale={{ min: 0, max: 10, step: 5 }} />
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
