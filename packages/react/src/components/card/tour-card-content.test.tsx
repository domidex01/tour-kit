import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TourCardContent } from './tour-card-content'

describe('TourCardContent', () => {
  it('renders string content', () => {
    render(<TourCardContent content="Step description" />)

    expect(screen.getByText('Step description')).toBeInTheDocument()
  })

  it('renders ReactNode content', () => {
    render(<TourCardContent content={<div data-testid="custom">Custom Content</div>} />)

    expect(screen.getByTestId('custom')).toBeInTheDocument()
  })

  it('renders complex ReactNode content', () => {
    render(
      <TourCardContent
        content={
          <div>
            <p data-testid="para">Paragraph</p>
            <button type="button" data-testid="btn">
              Click me
            </button>
          </div>
        }
      />
    )

    expect(screen.getByTestId('para')).toBeInTheDocument()
    expect(screen.getByTestId('btn')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<TourCardContent content="Text" className="custom-class" />)

    expect(container.firstChild).toHaveClass('custom-class')
  })

  it('has default styling classes', () => {
    const { container } = render(<TourCardContent content="Text" />)

    expect(container.firstChild).toHaveClass('py-3', 'text-sm', 'text-muted-foreground')
  })
})
