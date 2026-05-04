import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { QuestionRating } from '../components/question-rating'

describe('QuestionRating preset="thumbs"', () => {
  it('renders exactly 3 buttons', () => {
    render(<QuestionRating preset="thumbs" onChange={() => {}} />)
    const buttons = screen.getAllByRole('radio')
    expect(buttons).toHaveLength(3)
  })

  it('renders 👎 / 😐 / 👍 in low-to-high order', () => {
    render(<QuestionRating preset="thumbs" onChange={() => {}} />)
    const buttons = screen.getAllByRole('radio')
    expect(buttons[0].textContent).toContain('\u{1F44E}') // 👎
    expect(buttons[1].textContent).toContain('\u{1F610}') // 😐
    expect(buttons[2].textContent).toContain('\u{1F44D}') // 👍
  })

  it('clicking the third thumb fires onChange(3)', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<QuestionRating preset="thumbs" onChange={onChange} />)
    const buttons = screen.getAllByRole('radio')
    await user.click(buttons[2])
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith(3)
  })
})
