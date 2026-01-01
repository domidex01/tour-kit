import { render, screen } from '@testing-library/react'
import { type Tour, TourProvider } from '@tour-kit/core'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { TourCardHeader } from './tour-card-header'

describe('TourCardHeader', () => {
  const testTour: Tour = {
    id: 'test',
    steps: [{ id: 's1', target: '#target', content: 'Step 1' }],
  }

  const wrapper = ({ children }: { children: ReactNode }) => (
    <TourProvider tours={[testTour]}>{children}</TourProvider>
  )

  beforeEach(() => {
    document.body.innerHTML = '<div id="target">Target</div>'
  })

  it('returns null when no title and showClose is false', () => {
    const { container } = render(<TourCardHeader titleId="test" showClose={false} />, { wrapper })

    expect(container.firstChild).toBeNull()
  })

  it('renders title with correct id', () => {
    render(<TourCardHeader title="Welcome" titleId="step-title" showClose={false} />, { wrapper })

    const title = screen.getByRole('heading', { level: 3 })
    expect(title).toHaveTextContent('Welcome')
    expect(title).toHaveAttribute('id', 'step-title')
  })

  it('renders close button by default', () => {
    render(<TourCardHeader title="Welcome" titleId="test" />, { wrapper })

    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
  })

  it('hides close button when showClose is false', () => {
    render(<TourCardHeader title="Welcome" titleId="test" showClose={false} />, { wrapper })

    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument()
  })

  it('renders close button without title', () => {
    render(<TourCardHeader titleId="test" showClose={true} />, { wrapper })

    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('renders title without close', () => {
    render(<TourCardHeader title="Only Title" titleId="test" showClose={false} />, { wrapper })

    expect(screen.getByText('Only Title')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument()
  })

  it('renders ReactNode as title', () => {
    render(
      <TourCardHeader
        title={<span data-testid="custom-title">Custom Title</span>}
        titleId="test"
        showClose={false}
      />,
      { wrapper }
    )

    expect(screen.getByTestId('custom-title')).toBeInTheDocument()
  })

  it('applies className', () => {
    const { container } = render(
      <TourCardHeader title="Title" titleId="test" className="custom-header" />,
      { wrapper }
    )

    expect(container.firstChild).toHaveClass('custom-header')
  })
})
