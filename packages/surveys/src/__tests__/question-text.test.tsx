import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { describe, expect, it, vi } from 'vitest'
import { QuestionText } from '../components/question-text'

vi.mock('@tour-kit/license', () => ({
  ProGate: ({ children }: { children: React.ReactNode }) => children,
  useLicenseGate: () => ({ isAllowed: true, isLoading: false }),
}))

describe('QuestionText', () => {
  const defaultProps = {
    id: 'text-test',
    label: 'Your feedback',
  }

  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------

  it('should have no axe violations for text mode', async () => {
    const { container } = render(<QuestionText {...defaultProps} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should have no axe violations for textarea mode', async () => {
    const { container } = render(<QuestionText {...defaultProps} mode="textarea" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should set aria-label on the input', () => {
    render(<QuestionText {...defaultProps} />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('aria-label', 'Your feedback')
  })

  it('should set aria-required when isRequired is true', () => {
    render(<QuestionText {...defaultProps} isRequired />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('aria-required', 'true')
  })

  it('should set aria-describedby when showCharacterCount is true', () => {
    render(<QuestionText {...defaultProps} showCharacterCount />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('aria-describedby', 'text-test-char-count')
  })

  // -------------------------------------------------------------------------
  // Text mode
  // -------------------------------------------------------------------------

  it('should render an input element in text mode', () => {
    render(<QuestionText {...defaultProps} mode="text" />)
    const input = screen.getByRole('textbox')
    expect(input.tagName).toBe('INPUT')
  })

  it('should render a textarea element in textarea mode', () => {
    render(<QuestionText {...defaultProps} mode="textarea" />)
    const textarea = screen.getByRole('textbox')
    expect(textarea.tagName).toBe('TEXTAREA')
  })

  it('should default to text mode', () => {
    render(<QuestionText {...defaultProps} />)
    const input = screen.getByRole('textbox')
    expect(input.tagName).toBe('INPUT')
  })

  // -------------------------------------------------------------------------
  // Character count
  // -------------------------------------------------------------------------

  it('should show character count when showCharacterCount is true', () => {
    render(<QuestionText {...defaultProps} showCharacterCount maxLength={100} />)
    expect(screen.getByText('0 / 100')).toBeInTheDocument()
  })

  it('should update character count as user types', async () => {
    const user = userEvent.setup()
    render(<QuestionText {...defaultProps} showCharacterCount maxLength={100} />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'Hello')

    expect(screen.getByText('5 / 100')).toBeInTheDocument()
  })

  it('should have aria-live on the character count element', () => {
    render(<QuestionText {...defaultProps} showCharacterCount />)
    const charCount = document.getElementById('text-test-char-count')
    expect(charCount).toHaveAttribute('aria-live', 'polite')
  })

  it('should not show character count when showCharacterCount is false', () => {
    render(<QuestionText {...defaultProps} />)
    const charCount = document.getElementById('text-test-char-count')
    expect(charCount).toBeNull()
  })

  // -------------------------------------------------------------------------
  // Controlled / Uncontrolled
  // -------------------------------------------------------------------------

  it('should work in controlled mode', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<QuestionText {...defaultProps} value="initial" onChange={onChange} />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('initial')

    await user.type(input, 'x')
    expect(onChange).toHaveBeenCalledWith('initialx')
  })

  it('should work in uncontrolled mode', async () => {
    const user = userEvent.setup()
    render(<QuestionText {...defaultProps} />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('')

    await user.type(input, 'hello')
    expect(input).toHaveValue('hello')
  })

  // -------------------------------------------------------------------------
  // Placeholder and maxLength
  // -------------------------------------------------------------------------

  it('should render placeholder text', () => {
    render(<QuestionText {...defaultProps} placeholder="Type here..." />)
    expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument()
  })

  it('should enforce maxLength on the input', () => {
    render(<QuestionText {...defaultProps} maxLength={10} />)
    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('maxlength', '10')
  })
})
