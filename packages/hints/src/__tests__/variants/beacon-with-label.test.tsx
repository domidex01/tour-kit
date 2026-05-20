import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'

vi.mock('@tour-kit/core', async (orig) => ({
  ...(await orig<typeof import('@tour-kit/core')>()),
  useReducedMotion: vi.fn(() => false),
}))

import { useReducedMotion } from '@tour-kit/core'

import { HintHotspot } from '../../index'

const mockRect: DOMRect = {
  top: 100,
  left: 100,
  bottom: 200,
  right: 300,
  width: 200,
  height: 100,
  x: 100,
  y: 100,
  toJSON: () => ({}),
}

async function expectNoA11yViolations(ui: ReactElement, background: '#ffffff' | '#0a0a0a') {
  const { container } = render(<div style={{ background, padding: 40 }}>{ui}</div>)
  expect(await axe(container)).toHaveNoViolations()
}

describe('<HintHotspot variant="beacon-with-label">', () => {
  it('renders the label text visible to sighted users', () => {
    render(
      <HintHotspot
        variant="beacon-with-label"
        label="New"
        targetRect={mockRect}
        position="top-right"
      />
    )
    expect(screen.getByText('New')).toBeInTheDocument()
  })

  it('hides the visible label from screen readers via aria-hidden', () => {
    render(
      <HintHotspot
        variant="beacon-with-label"
        label="New"
        targetRect={mockRect}
        position="top-right"
      />
    )
    expect(screen.getByText('New')).toHaveAttribute('aria-hidden', 'true')
  })

  it('keeps aria-label="Show hint" on the button (single SR read)', () => {
    render(
      <HintHotspot
        variant="beacon-with-label"
        label="New"
        targetRect={mockRect}
        position="top-right"
      />
    )
    expect(screen.getByRole('button', { name: 'Show hint' })).toBeInTheDocument()
  })

  it('applies flex-row-reverse when side="left"', () => {
    render(
      <HintHotspot
        variant="beacon-with-label"
        label="New"
        side="left"
        targetRect={mockRect}
        position="top-right"
      />
    )
    expect(screen.getByRole('button').className).toMatch(/flex-row-reverse/)
  })

  it('omits flex-row-reverse for the default side (right)', () => {
    render(
      <HintHotspot
        variant="beacon-with-label"
        label="New"
        targetRect={mockRect}
        position="top-right"
      />
    )
    expect(screen.getByRole('button').className).not.toMatch(/flex-row-reverse/)
  })

  it('pins the ≥24×24 px hit-target class contract', () => {
    render(
      <HintHotspot
        variant="beacon-with-label"
        label="New"
        targetRect={mockRect}
        position="top-right"
      />
    )
    const button = screen.getByRole('button')
    expect(button.className).toMatch(/min-h-6/)
    expect(button.className).toMatch(/min-w-6/)
  })

  it('omits animate-tour-pulse from the className chain when useReducedMotion is true (tier-3 gate)', () => {
    ;(useReducedMotion as ReturnType<typeof vi.fn>).mockReturnValueOnce(true)
    render(
      <HintHotspot
        variant="beacon-with-label"
        label="New"
        targetRect={mockRect}
        position="top-right"
      />
    )
    expect(screen.getByRole('button').className).not.toMatch(/animate-tour-pulse/)
  })

  it('passes axe semantic scan on a light background', async () => {
    await expectNoA11yViolations(
      <HintHotspot
        variant="beacon-with-label"
        label="New"
        targetRect={mockRect}
        position="top-right"
      />,
      '#ffffff'
    )
  })

  it('passes axe semantic scan on a dark background', async () => {
    await expectNoA11yViolations(
      <HintHotspot
        variant="beacon-with-label"
        label="New"
        targetRect={mockRect}
        position="top-right"
      />,
      '#0a0a0a'
    )
  })
})
