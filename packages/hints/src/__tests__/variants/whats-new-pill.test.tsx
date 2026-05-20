import { fireEvent, render, screen } from '@testing-library/react'
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

describe('<HintHotspot variant="what-s-new-pill">', () => {
  it('renders a button labelled with the supplied label', () => {
    render(
      <HintHotspot
        variant="what-s-new-pill"
        label="What's new"
        targetRect={mockRect}
        position="top-right"
      />
    )
    expect(screen.getByRole('button', { name: "What's new" })).toBeInTheDocument()
  })

  it('renders the sparkle icon with aria-hidden="true"', () => {
    render(
      <HintHotspot
        variant="what-s-new-pill"
        label="What's new"
        targetRect={mockRect}
        position="top-right"
      />
    )
    const svg = screen.getByRole('button').querySelector('svg')
    expect(svg).not.toBeNull()
    expect(svg).toHaveAttribute('aria-hidden', 'true')
  })

  it('adds motion-safe transition + opacity-0 class after first pointerdown (default motion)', () => {
    render(
      <HintHotspot
        variant="what-s-new-pill"
        label="What's new"
        targetRect={mockRect}
        position="top-right"
      />
    )
    const button = screen.getByRole('button', { name: "What's new" })
    expect(button.className).toMatch(/motion-safe:transition-opacity/)
    expect(button.className).toMatch(/opacity-100/)
    fireEvent.pointerDown(button)
    expect(button.className).toMatch(/opacity-0/)
  })

  it('returns null after first pointerdown when useReducedMotion is true (load-bearing tier-3 gate)', () => {
    ;(useReducedMotion as ReturnType<typeof vi.fn>).mockReturnValue(true)
    render(
      <HintHotspot
        variant="what-s-new-pill"
        label="What's new"
        targetRect={mockRect}
        position="top-right"
      />
    )
    const button = screen.getByRole('button', { name: "What's new" })
    fireEvent.pointerDown(button)
    expect(screen.queryByRole('button', { name: "What's new" })).toBeNull()
    ;(useReducedMotion as ReturnType<typeof vi.fn>).mockReturnValue(false)
  })

  it('pins the ≥24×24 px hit-target class contract', () => {
    render(
      <HintHotspot
        variant="what-s-new-pill"
        label="What's new"
        targetRect={mockRect}
        position="top-right"
      />
    )
    const button = screen.getByRole('button')
    expect(button.className).toMatch(/min-h-6/)
    expect(button.className).toMatch(/min-w-6/)
  })

  it('passes axe semantic scan on a light background', async () => {
    await expectNoA11yViolations(
      <HintHotspot
        variant="what-s-new-pill"
        label="What's new"
        targetRect={mockRect}
        position="top-right"
      />,
      '#ffffff'
    )
  })

  it('passes axe semantic scan on a dark background', async () => {
    await expectNoA11yViolations(
      <HintHotspot
        variant="what-s-new-pill"
        label="What's new"
        targetRect={mockRect}
        position="top-right"
      />,
      '#0a0a0a'
    )
  })
})
