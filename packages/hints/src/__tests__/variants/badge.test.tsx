import { render, screen } from '@testing-library/react'
import type * as React from 'react'
import type { ReactElement } from 'react'
import { describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'

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

describe('<HintHotspot variant="badge">', () => {
  it('renders a button with the default aria-label on minimal props', () => {
    render(<HintHotspot variant="badge" targetRect={mockRect} position="top-right" />)
    expect(screen.getByRole('button', { name: 'Show hint' })).toBeInTheDocument()
  })

  it('pins the ≥24×24 px hit-target class contract', () => {
    render(<HintHotspot variant="badge" targetRect={mockRect} position="top-right" />)
    const button = screen.getByRole('button')
    // min-h-6 / min-w-6 = 24px floor; h-6 / w-6 = 24px box.
    expect(button.className).toMatch(/min-h-6/)
    expect(button.className).toMatch(/min-w-6/)
    expect(button.className).toMatch(/\bh-6\b/)
    expect(button.className).toMatch(/\bw-6\b/)
  })

  it('renders the count value when provided', () => {
    render(<HintHotspot variant="badge" count={3} targetRect={mockRect} position="top-right" />)
    expect(screen.getByRole('button').textContent).toBe('3')
  })

  it('clamps counts above 99 to "99+"', () => {
    render(<HintHotspot variant="badge" count={150} targetRect={mockRect} position="top-right" />)
    expect(screen.getByRole('button').textContent).toBe('99+')
  })

  it('renders no visible text node when count is omitted', () => {
    render(<HintHotspot variant="badge" targetRect={mockRect} position="top-right" />)
    const button = screen.getByRole('button')
    // sr-only "Show hint" fallback is still allowed; numeric content is not.
    expect(button.textContent).not.toMatch(/\d/)
  })

  it('passes axe semantic scan on a light background', async () => {
    await expectNoA11yViolations(
      <HintHotspot variant="badge" count={3} targetRect={mockRect} position="top-right" />,
      '#ffffff'
    )
  })

  it('passes axe semantic scan on a dark background', async () => {
    await expectNoA11yViolations(
      <HintHotspot variant="badge" count={3} targetRect={mockRect} position="top-right" />,
      '#0a0a0a'
    )
  })

  it('does not leak cva extras (pulse/size/color/zIndex) onto the button as DOM attributes', () => {
    // Forced through `as` because the discriminated union forbids these at the type
    // layer when variant is set — this test pins the runtime defense in case a
    // consumer reaches it via `as unknown as` or a wider intersection.
    const leakyProps = {
      variant: 'badge',
      count: 3,
      targetRect: mockRect,
      position: 'top-right',
      pulse: false,
      size: 'lg',
      color: 'destructive',
      zIndex: 'high',
    } as unknown as React.ComponentProps<typeof HintHotspot>
    render(<HintHotspot {...leakyProps} />)
    const button = screen.getByRole('button')
    for (const attr of ['pulse', 'size', 'color', 'zindex', 'zIndex']) {
      expect(button.hasAttribute(attr)).toBe(false)
    }
  })
})
