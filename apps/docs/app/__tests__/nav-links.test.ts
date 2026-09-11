import { baseOptions } from '@/lib/layout.shared'
import { describe, expect, it } from 'vitest'

/**
 * An `icon` link renders its glyph and nothing else — Fumadocs drops `text`
 * for that item type — and the glyphs are `aria-hidden`. So the only thing
 * standing between an icon link and a nameless link (WCAG 2.4.4 / 4.1.2, and
 * the Lighthouse 100 this site claims) is `label`, which is optional in the
 * type and easy to leave off. Discord and npm shipped without it.
 */
describe('the navbar link set', () => {
  const links = baseOptions().links ?? []

  it('gives every icon link an accessible name', () => {
    const nameless = links
      .filter((item) => item.type === 'icon')
      .filter((item) => !('label' in item) || !item.label)

    expect(nameless).toEqual([])
  })

  it('has icon links to find in the first place', () => {
    // Guard against the filter above passing because the shape changed.
    expect(links.filter((item) => item.type === 'icon').length).toBeGreaterThan(0)
  })
})
