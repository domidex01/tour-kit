import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { QuestionRating } from '../components/question-rating'

describe('QuestionRating preset="stars"', () => {
  it('renders exactly 5 buttons (1..5)', () => {
    render(<QuestionRating id="q1" label="Rate" preset="stars" onChange={() => {}} />)
    const buttons = screen.getAllByRole('radio')
    expect(buttons).toHaveLength(5)
  })

  it('clicking the third star fires onChange(3)', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<QuestionRating id="q1" label="Rate" preset="stars" onChange={onChange} />)
    const buttons = screen.getAllByRole('radio')
    await user.click(buttons[2])
    expect(onChange).toHaveBeenCalledOnce()
    expect(onChange).toHaveBeenCalledWith(3)
  })

  it('explicit `ratingScale` overrides the preset min/max', () => {
    render(
      <QuestionRating
        id="q1"
        label="Rate"
        preset="stars"
        ratingScale={{ min: 0, max: 10 }}
        onChange={() => {}}
      />
    )
    const buttons = screen.getAllByRole('radio')
    // 0..10 inclusive = 11 buttons; preset would have given 5.
    expect(buttons).toHaveLength(11)
  })

  it('preset still fills in style: "stars" so first button renders the star glyph', () => {
    render(<QuestionRating id="q1" label="Rate" preset="stars" onChange={() => {}} />)
    const firstButton = screen.getAllByRole('radio')[0]
    // Style 'stars' renders ★/☆ glyphs; numeric mode would render the digit.
    expect(firstButton.textContent).toMatch(/[★☆]/)
  })
})
