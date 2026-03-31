import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LicenseWatermark } from '../components/license-watermark'

describe('LicenseWatermark', () => {
  it('renders visible UNLICENSED text', () => {
    render(<LicenseWatermark />)

    expect(screen.getByText('UNLICENSED')).toBeInTheDocument()
  })

  it('overlay has position: fixed and max z-index via inline styles', () => {
    render(<LicenseWatermark />)

    const overlay = screen.getByText('UNLICENSED').closest('div')
    expect(overlay).not.toBeNull()

    const style = overlay?.style
    expect(style.position).toBe('fixed')
    expect(style.zIndex).toBe('2147483647')
    expect(style.pointerEvents).toBe('none')
  })

  it('uses inline styles only, no className on overlay', () => {
    render(<LicenseWatermark />)

    const overlay = screen.getByText('UNLICENSED').closest('div')
    expect(overlay?.className).toBe('')
  })

  it('text element has userSelect: none', () => {
    render(<LicenseWatermark />)

    const text = screen.getByText('UNLICENSED')
    expect(text.style.userSelect).toBe('none')
  })
})
