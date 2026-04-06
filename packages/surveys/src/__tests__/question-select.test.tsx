import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe } from 'vitest-axe'
import { describe, expect, it, vi } from 'vitest'
import { QuestionSelect } from '../components/question-select'

vi.mock('@tour-kit/license', () => ({
  ProGate: ({ children }: { children: React.ReactNode }) => children,
  useLicenseGate: () => ({ isAllowed: true, isLoading: false }),
}))

const testOptions = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
  { value: 'c', label: 'Option C' },
]

const optionsWithDisabled = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B', disabled: true },
  { value: 'c', label: 'Option C' },
]

describe('QuestionSelect', () => {
  const defaultProps = {
    id: 'select-test',
    label: 'Choose an option',
    options: testOptions,
  }

  // -------------------------------------------------------------------------
  // Single-select accessibility
  // -------------------------------------------------------------------------

  it('should have no axe violations in single-select mode', async () => {
    const { container } = render(<QuestionSelect {...defaultProps} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should render a radiogroup for single-select', () => {
    render(<QuestionSelect {...defaultProps} />)
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
  })

  it('should render radio options for single-select', () => {
    render(<QuestionSelect {...defaultProps} />)
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(3)
  })

  it('should set aria-label on the radiogroup', () => {
    render(<QuestionSelect {...defaultProps} />)
    const group = screen.getByRole('radiogroup')
    expect(group).toHaveAttribute('aria-label', 'Choose an option')
  })

  it('should set aria-required on the group', () => {
    render(<QuestionSelect {...defaultProps} isRequired />)
    const group = screen.getByRole('radiogroup')
    expect(group).toHaveAttribute('aria-required', 'true')
  })

  it('should set aria-checked on the selected radio', () => {
    render(<QuestionSelect {...defaultProps} value="b" />)
    const radios = screen.getAllByRole('radio')
    expect(radios[0]).toHaveAttribute('aria-checked', 'false')
    expect(radios[1]).toHaveAttribute('aria-checked', 'true')
    expect(radios[2]).toHaveAttribute('aria-checked', 'false')
  })

  // -------------------------------------------------------------------------
  // Multi-select accessibility
  // -------------------------------------------------------------------------

  it('should have no axe violations in multi-select mode', async () => {
    const { container } = render(<QuestionSelect {...defaultProps} mode="multi" />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should render a group role for multi-select', () => {
    render(<QuestionSelect {...defaultProps} mode="multi" />)
    expect(screen.getByRole('group')).toBeInTheDocument()
  })

  it('should render checkbox options for multi-select', () => {
    render(<QuestionSelect {...defaultProps} mode="multi" />)
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(3)
  })

  it('should set aria-checked on selected checkboxes', () => {
    render(<QuestionSelect {...defaultProps} mode="multi" value={['a', 'c']} />)
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes[0]).toHaveAttribute('aria-checked', 'true')
    expect(checkboxes[1]).toHaveAttribute('aria-checked', 'false')
    expect(checkboxes[2]).toHaveAttribute('aria-checked', 'true')
  })

  // -------------------------------------------------------------------------
  // Single-select keyboard navigation
  // -------------------------------------------------------------------------

  it('should navigate with ArrowDown in single mode and select', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<QuestionSelect {...defaultProps} onChange={onChange} />)

    const radios = screen.getAllByRole('radio')
    await user.tab()
    expect(radios[0]).toHaveFocus()

    await user.keyboard('{ArrowDown}')
    expect(radios[1]).toHaveFocus()
    expect(onChange).toHaveBeenCalledWith('b')
  })

  it('should wrap around with ArrowDown in single mode', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<QuestionSelect {...defaultProps} onChange={onChange} />)

    const radios = screen.getAllByRole('radio')
    await user.tab()

    await user.keyboard('{ArrowDown}')
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{ArrowDown}')
    expect(radios[0]).toHaveFocus()
    expect(onChange).toHaveBeenLastCalledWith('a')
  })

  it('should navigate with ArrowUp in single mode', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<QuestionSelect {...defaultProps} onChange={onChange} />)

    const radios = screen.getAllByRole('radio')
    await user.tab()

    // Wrap to end
    await user.keyboard('{ArrowUp}')
    expect(radios[2]).toHaveFocus()
    expect(onChange).toHaveBeenCalledWith('c')
  })

  // -------------------------------------------------------------------------
  // Multi-select keyboard navigation
  // -------------------------------------------------------------------------

  it('should toggle with Space in multi mode', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<QuestionSelect {...defaultProps} mode="multi" onChange={onChange} />)

    const checkboxes = screen.getAllByRole('checkbox')
    await user.tab()
    expect(checkboxes[0]).toHaveFocus()

    await user.keyboard(' ')
    expect(onChange).toHaveBeenCalledWith(['a'])

    // Tab to next checkbox and toggle
    await user.tab()
    expect(checkboxes[1]).toHaveFocus()
    await user.keyboard(' ')
    expect(onChange).toHaveBeenCalledWith(['a', 'b'])
  })

  // -------------------------------------------------------------------------
  // Disabled options
  // -------------------------------------------------------------------------

  it('should set aria-disabled on disabled options', () => {
    render(<QuestionSelect {...defaultProps} options={optionsWithDisabled} />)
    const radios = screen.getAllByRole('radio')
    expect(radios[1]).toHaveAttribute('aria-disabled', 'true')
  })

  it('should skip disabled options in keyboard navigation', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<QuestionSelect {...defaultProps} options={optionsWithDisabled} onChange={onChange} />)

    const enabledRadios = screen.getAllByRole('radio').filter(
      (r) => r.getAttribute('aria-disabled') !== 'true'
    )
    await user.tab()
    expect(enabledRadios[0]).toHaveFocus()

    await user.keyboard('{ArrowDown}')
    // Should skip disabled B and land on C
    expect(onChange).toHaveBeenCalledWith('c')
  })

  // -------------------------------------------------------------------------
  // Controlled / Uncontrolled
  // -------------------------------------------------------------------------

  it('should work in controlled single-select mode', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()
    const { rerender } = render(
      <QuestionSelect {...defaultProps} value="a" onChange={onChange} />
    )

    const radios = screen.getAllByRole('radio')
    expect(radios[0]).toHaveAttribute('aria-checked', 'true')

    await user.click(radios[2])
    expect(onChange).toHaveBeenCalledWith('c')

    rerender(<QuestionSelect {...defaultProps} value="c" onChange={onChange} />)
    expect(radios[2]).toHaveAttribute('aria-checked', 'true')
  })

  it('should work in uncontrolled single-select mode', async () => {
    const user = userEvent.setup()
    render(<QuestionSelect {...defaultProps} />)

    const radios = screen.getAllByRole('radio')
    await user.click(radios[1])
    expect(radios[1]).toHaveAttribute('aria-checked', 'true')
  })

  it('should work in uncontrolled multi-select mode', async () => {
    const user = userEvent.setup()
    render(<QuestionSelect {...defaultProps} mode="multi" />)

    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])
    expect(checkboxes[0]).toHaveAttribute('aria-checked', 'true')

    await user.click(checkboxes[2])
    expect(checkboxes[0]).toHaveAttribute('aria-checked', 'true')
    expect(checkboxes[2]).toHaveAttribute('aria-checked', 'true')

    // Deselect
    await user.click(checkboxes[0])
    expect(checkboxes[0]).toHaveAttribute('aria-checked', 'false')
  })
})
