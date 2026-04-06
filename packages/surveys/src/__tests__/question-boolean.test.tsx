import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { describe, expect, it, vi } from 'vitest'
import { QuestionBoolean } from '../components/question-boolean'

vi.mock('@tour-kit/license', () => ({
  ProGate: ({ children }: { children: React.ReactNode }) => children,
  useLicenseGate: () => ({ isAllowed: true, isLoading: false }),
}))

describe('QuestionBoolean', () => {
  const defaultProps = {
    id: 'bool-test',
    label: 'Would you recommend us?',
  }

  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------

  it('should have no axe violations', async () => {
    const { container } = render(<QuestionBoolean {...defaultProps} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should render a radiogroup with the correct aria-label', () => {
    render(<QuestionBoolean {...defaultProps} />)
    const group = screen.getByRole('radiogroup')
    expect(group).toHaveAttribute('aria-label', 'Would you recommend us?')
  })

  it('should render two radio options', () => {
    render(<QuestionBoolean {...defaultProps} />)
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(2)
  })

  it('should set aria-required on the group', () => {
    render(<QuestionBoolean {...defaultProps} isRequired />)
    const group = screen.getByRole('radiogroup')
    expect(group).toHaveAttribute('aria-required', 'true')
  })

  it('should set aria-checked correctly', () => {
    render(<QuestionBoolean {...defaultProps} value={true} />)
    const radios = screen.getAllByRole('radio')
    expect(radios[0]).toHaveAttribute('aria-checked', 'true')
    expect(radios[1]).toHaveAttribute('aria-checked', 'false')
  })

  it('should use roving tabindex', () => {
    render(<QuestionBoolean {...defaultProps} />)
    const radios = screen.getAllByRole('radio')
    expect(radios[0]).toHaveAttribute('tabindex', '0')
    expect(radios[1]).toHaveAttribute('tabindex', '-1')
  })

  // -------------------------------------------------------------------------
  // Keyboard navigation
  // -------------------------------------------------------------------------

  it('should toggle with ArrowRight and ArrowLeft', async () => {
    const user = userEvent.setup()
    render(<QuestionBoolean {...defaultProps} />)
    const radios = screen.getAllByRole('radio')

    await user.tab()
    expect(radios[0]).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    expect(radios[1]).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    expect(radios[0]).toHaveFocus()
  })

  it('should select with Space key', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<QuestionBoolean {...defaultProps} onChange={onChange} />)

    await user.tab()
    await user.keyboard(' ')

    expect(onChange).toHaveBeenCalledWith(true)
  })

  it('should select with Enter key', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<QuestionBoolean {...defaultProps} onChange={onChange} />)

    await user.tab()
    await user.keyboard('{ArrowRight}')
    await user.keyboard('{Enter}')

    expect(onChange).toHaveBeenCalledWith(false)
  })

  // -------------------------------------------------------------------------
  // Custom labels
  // -------------------------------------------------------------------------

  it('should render custom yes/no labels', () => {
    render(
      <QuestionBoolean {...defaultProps} yesLabel="Absolutely" noLabel="Not really" />
    )
    expect(screen.getByText('Absolutely')).toBeInTheDocument()
    expect(screen.getByText('Not really')).toBeInTheDocument()
  })

  it('should render default Yes/No labels', () => {
    render(<QuestionBoolean {...defaultProps} />)
    expect(screen.getByText('Yes')).toBeInTheDocument()
    expect(screen.getByText('No')).toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Controlled / Uncontrolled
  // -------------------------------------------------------------------------

  it('should work in controlled mode', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(
      <QuestionBoolean {...defaultProps} value={false} onChange={onChange} />
    )

    const radios = screen.getAllByRole('radio')
    expect(radios[1]).toHaveAttribute('aria-checked', 'true')

    await user.click(radios[0])
    expect(onChange).toHaveBeenCalledWith(true)

    rerender(<QuestionBoolean {...defaultProps} value={true} onChange={onChange} />)
    expect(radios[0]).toHaveAttribute('aria-checked', 'true')
  })

  it('should work in uncontrolled mode', async () => {
    const user = userEvent.setup()
    render(<QuestionBoolean {...defaultProps} />)

    const radios = screen.getAllByRole('radio')
    await user.click(radios[1])
    expect(radios[1]).toHaveAttribute('aria-checked', 'true')
  })

  it('should ensure all buttons have type="button"', () => {
    render(<QuestionBoolean {...defaultProps} />)
    const buttons = document.querySelectorAll('button')
    for (const button of buttons) {
      expect(button).toHaveAttribute('type', 'button')
    }
  })
})
