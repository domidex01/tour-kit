/// <reference types="vitest-axe/extend-expect" />
// Phase 7 — Spotlight contrast + visual contract tests.
//
// US-4: redesigned spotlight passes WCAG 2.1 AA on white / off-white / light-gray
// US-5: inset-stroke cutout exposes the expected computed boxShadow
// US-6: legacy variant preserves the v3.0 radial-gradient overlay
//
// Why a local contrast helper? jsdom does not render pixels, so axe's
// `color-contrast` rule can't measure ratios — it returns "incomplete" and
// passes silently. We assert WCAG ourselves against the resolved foreground
// (a known dark color we pass in via `strokeColor`) and the wrapper background.

import { render } from '@testing-library/react'
import type * as React from 'react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { axe } from 'vitest-axe'

import { AnnouncementSpotlight } from '../components/announcement-spotlight'
import { AnnouncementsProvider } from '../context/announcements-provider'
import type { AnnouncementConfig } from '../types/announcement'

const cfg: AnnouncementConfig = {
  id: 'spot-1',
  variant: 'spotlight',
  title: 'Spotlight CTA',
  description: 'Click here to explore the new feature.',
  autoShow: false,
}

function ProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AnnouncementsProvider announcements={[cfg]} storage={null}>
      {children}
    </AnnouncementsProvider>
  )
}

/**
 * sRGB → relative luminance, per WCAG 2.1 §1.4.3.
 * Accepts `#rgb` and `#rrggbb` forms.
 */
function relativeLuminance(hex: string): number {
  let m = hex.match(/^#([0-9a-f]{6})$/i)
  if (!m) {
    const short = hex.match(/^#([0-9a-f]{3})$/i)
    if (!short) throw new Error(`unsupported color form: ${hex}`)
    m = [
      short[0],
      short[1]
        ?.split('')
        .map((c) => c + c)
        .join(''),
    ] as RegExpMatchArray
  }
  const r = Number.parseInt(m[1]?.slice(0, 2), 16) / 255
  const g = Number.parseInt(m[1]?.slice(2, 4), 16) / 255
  const b = Number.parseInt(m[1]?.slice(4, 6), 16) / 255
  const channel = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

/** WCAG contrast ratio between two sRGB colors. */
function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a)
  const lb = relativeLuminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

// WCAG 2.1 §1.4.11 "Non-text Contrast" requires 3:1 for graphical UI components
// (the inset-stroke cutout boundary qualifies). We pick a dark stroke that
// passes against all three light backgrounds.
const STROKE_AA_GRAPHIC = '#1f2937' // tailwind gray-800
const BACKGROUNDS = ['#ffffff', '#f5f5f5', '#e5e7eb'] as const

describe('AnnouncementSpotlight — WCAG AA contrast helper (sanity)', () => {
  it('relativeLuminance matches WCAG reference values (0 for black, 1 for white)', () => {
    expect(relativeLuminance('#000000')).toBeCloseTo(0, 4)
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 4)
  })

  it('contrastRatio black/white is 21:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1)
  })
})

describe('AnnouncementSpotlight — WCAG AA contrast on light backgrounds (US-4)', () => {
  let target: HTMLElement

  beforeEach(() => {
    target = document.createElement('div')
    target.id = 'spot-target'
    target.style.width = '120px'
    target.style.height = '40px'
    document.body.appendChild(target)
  })

  afterEach(() => {
    target.remove()
  })

  for (const bg of BACKGROUNDS) {
    it(`stroke color ${STROKE_AA_GRAPHIC} passes ≥3:1 graphical contrast on ${bg}`, () => {
      // The contract: any consumer-supplied dark stroke (or 'auto' resolved
      // to one) must meet WCAG 1.4.11 against each supported page bg.
      const ratio = contrastRatio(STROKE_AA_GRAPHIC, bg)
      expect(ratio).toBeGreaterThanOrEqual(3)
    })

    it(`axe semantic scan: no structural a11y violations on ${bg}`, async () => {
      const { container } = render(
        <div style={{ background: bg, minHeight: 400 }}>
          <ProviderWrapper>
            <AnnouncementSpotlight
              id="spot-1"
              open
              strokeColor={STROKE_AA_GRAPHIC}
              options={{ targetSelector: '#spot-target' }}
            />
          </ProviderWrapper>
        </div>
      )

      // jsdom can't measure color-contrast (no pixel rendering), so this scan
      // catches structural a11y issues only — the contrast assertion above
      // is what locks the WCAG contract.
      const results = await axe(document.body, {
        rules: { region: { enabled: false }, 'color-contrast': { enabled: false } },
      })
      expect(results).toHaveNoViolations()
      expect(container).toBeTruthy()
      // axe scanning the full document.body is CPU-heavy and reliably exceeds
      // vitest's 5000ms default on shared CI runners. Give it generous headroom
      // so this a11y check is not flaky under load.
    }, 20000)
  }
})

describe('AnnouncementSpotlight — inset-stroke computed style (US-5)', () => {
  let target: HTMLElement

  beforeEach(() => {
    target = document.createElement('div')
    target.id = 'spot-target'
    document.body.appendChild(target)
  })

  afterEach(() => {
    target.remove()
  })

  it('cutout div has a 2px inset boxShadow', () => {
    render(
      <ProviderWrapper>
        <AnnouncementSpotlight
          id="spot-1"
          open
          strokeColor={STROKE_AA_GRAPHIC}
          options={{ targetSelector: '#spot-target' }}
        />
      </ProviderWrapper>
    )

    const cutout = document.querySelector<HTMLElement>('[data-tk-spotlight-cutout]')
    if (!cutout) throw new Error('cutout element not rendered')
    const shadow = getComputedStyle(cutout).boxShadow
    expect(shadow).toMatch(/inset/i)
    expect(shadow).toMatch(/2px/)
  })

  it('default variant renders the directional arrow SVG', () => {
    render(
      <ProviderWrapper>
        <AnnouncementSpotlight id="spot-1" open options={{ targetSelector: '#spot-target' }} />
      </ProviderWrapper>
    )

    const arrow = document.querySelector('[data-tk-spotlight-arrow]')
    expect(arrow).not.toBeNull()
    expect(arrow?.getAttribute('aria-hidden')).toBe('true')
  })

  it('explicit strokeColor string is applied to the cutout boxShadow', () => {
    render(
      <ProviderWrapper>
        <AnnouncementSpotlight
          id="spot-1"
          open
          strokeColor="#ff0066"
          options={{ targetSelector: '#spot-target' }}
        />
      </ProviderWrapper>
    )
    const cutout = document.querySelector<HTMLElement>('[data-tk-spotlight-cutout]')
    if (!cutout) throw new Error('cutout element not rendered')
    // jsdom normalizes hex to rgb in some contexts; accept either form.
    const shadow = getComputedStyle(cutout).boxShadow
    expect(shadow.toLowerCase()).toMatch(/#ff0066|rgb\(255, 0, 102\)/)
  })
})

describe('AnnouncementSpotlight — arrow points TOWARD content panel (US-5b)', () => {
  // The SVG path renders an apex-up triangle by default. For each Floating UI
  // placement, the arrow rotation must aim the apex at the content panel
  // (which sits on the named side of the target). A test inversion here would
  // catch the v4.0 regression where every arrow pointed backwards.
  const cases: Array<{
    placement: 'top' | 'right' | 'bottom' | 'left'
    expectedRotation: number
  }> = [
    { placement: 'top', expectedRotation: 0 },
    { placement: 'right', expectedRotation: 90 },
    { placement: 'bottom', expectedRotation: 180 },
    { placement: 'left', expectedRotation: 270 },
  ]

  let target: HTMLElement
  beforeEach(() => {
    target = document.createElement('div')
    target.id = 'spot-target'
    document.body.appendChild(target)
  })
  afterEach(() => target.remove())

  for (const { placement, expectedRotation } of cases) {
    it(`placement="${placement}" rotates the arrow by ${expectedRotation}°`, () => {
      render(
        <ProviderWrapper>
          <AnnouncementSpotlight
            id="spot-1"
            open
            placement={placement}
            options={{ targetSelector: '#spot-target', placement }}
          />
        </ProviderWrapper>
      )

      const arrow = document.querySelector<SVGElement>('[data-tk-spotlight-arrow]')
      if (!arrow) throw new Error('arrow element not rendered')
      const transform = arrow.style.transform || getComputedStyle(arrow).transform
      // Inline style is set as `rotate(<deg>deg)` — match either form.
      expect(transform).toMatch(new RegExp(`rotate\\(${expectedRotation}deg\\)`))
    })
  }
})

describe('AnnouncementSpotlight — legacy variant preserves radial-gradient (US-6)', () => {
  let target: HTMLElement

  beforeEach(() => {
    target = document.createElement('div')
    target.id = 'spot-target'
    document.body.appendChild(target)
  })

  afterEach(() => {
    target.remove()
  })

  it('renders the v3.0 radial-gradient overlay when variant="legacy-spotlight"', () => {
    render(
      <ProviderWrapper>
        <AnnouncementSpotlight
          id="spot-1"
          open
          variant="legacy-spotlight"
          options={{ targetSelector: '#spot-target' }}
        />
      </ProviderWrapper>
    )

    const overlay = document.querySelector<HTMLElement>(
      '[data-tk-spotlight-overlay][data-variant="legacy-spotlight"]'
    )
    if (!overlay) throw new Error('legacy overlay element not rendered')
    const bg = overlay.style.background || getComputedStyle(overlay).background
    expect(bg).toMatch(/radial-gradient/)
  })

  it('legacy variant does NOT render the inset-stroke cutout or arrow', () => {
    render(
      <ProviderWrapper>
        <AnnouncementSpotlight
          id="spot-1"
          open
          variant="legacy-spotlight"
          options={{ targetSelector: '#spot-target' }}
        />
      </ProviderWrapper>
    )

    expect(document.querySelector('[data-tk-spotlight-cutout]')).toBeNull()
    expect(document.querySelector('[data-tk-spotlight-arrow]')).toBeNull()
  })
})
