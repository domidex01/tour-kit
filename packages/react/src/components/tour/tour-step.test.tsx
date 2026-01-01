import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TourStep } from './tour-step'

describe('TourStep', () => {
  it('renders null (marker component)', () => {
    const { container } = render(<TourStep id="test" target="#target" content="Content" />)

    expect(container.firstChild).toBeNull()
  })

  it('has correct displayName', () => {
    expect(TourStep.displayName).toBe('TourStep')
  })

  it('accepts all TourStep props', () => {
    // This test verifies TypeScript compilation with all props
    const { container } = render(
      <TourStep
        id="test"
        target="#target"
        content="Content"
        title="Title"
        placement="top"
        showClose={true}
        showNavigation={true}
        showProgress={true}
        interactive={false}
      />
    )

    expect(container.firstChild).toBeNull()
  })
})
