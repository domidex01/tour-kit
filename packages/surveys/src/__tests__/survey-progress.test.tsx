import { render, screen } from '@testing-library/react'
import { axe } from 'vitest-axe'
import { describe, expect, it } from 'vitest'
import { SurveyProgress } from '../components/survey-progress'

describe('SurveyProgress', () => {
  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------

  it('should have no axe violations', async () => {
    const { container } = render(<SurveyProgress current={2} total={5} />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should render a progressbar with correct aria attributes', () => {
    render(<SurveyProgress current={3} total={10} />)
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-valuenow', '3')
    expect(progressbar).toHaveAttribute('aria-valuemin', '1')
    expect(progressbar).toHaveAttribute('aria-valuemax', '10')
    expect(progressbar).toHaveAttribute('aria-label', 'Survey progress')
  })

  it('should have aria-live on the text element', () => {
    render(<SurveyProgress current={1} total={5} />)
    const text = screen.getByText('Question 1 of 5')
    expect(text).toHaveAttribute('aria-live', 'polite')
  })

  // -------------------------------------------------------------------------
  // Returns null
  // -------------------------------------------------------------------------

  it('should return null when total <= 1', () => {
    const { container } = render(<SurveyProgress current={1} total={1} />)
    expect(container.innerHTML).toBe('')
  })

  it('should return null when total is 0', () => {
    const { container } = render(<SurveyProgress current={0} total={0} />)
    expect(container.innerHTML).toBe('')
  })

  // -------------------------------------------------------------------------
  // Text mode
  // -------------------------------------------------------------------------

  it('should show only text in text mode', () => {
    render(<SurveyProgress current={2} total={5} mode="text" />)
    expect(screen.getByText('Question 2 of 5')).toBeInTheDocument()
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
  })

  it('should show only bar in bar mode', () => {
    render(<SurveyProgress current={2} total={5} mode="bar" />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
    expect(screen.queryByText('Question 2 of 5')).not.toBeInTheDocument()
  })

  // -------------------------------------------------------------------------
  // Label template
  // -------------------------------------------------------------------------

  it('should use custom labelTemplate', () => {
    render(
      <SurveyProgress
        current={3}
        total={8}
        labelTemplate="Step {current}/{total}"
      />
    )
    expect(screen.getByText('Step 3/8')).toBeInTheDocument()
  })
})
