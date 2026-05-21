/// <reference types="vitest-axe/extend-expect" />
// Phase 7 — Spotlight contrast + visual contract tests.
//
// US-4: redesigned spotlight passes WCAG 2.1 AA on white / off-white / light-gray
// US-5: inset-stroke cutout exposes the expected computed boxShadow
// US-6: legacy variant preserves the v3.0 radial-gradient overlay

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

const BACKGROUNDS = ['#ffffff', '#f5f5f5', '#e5e7eb'] as const

describe('AnnouncementSpotlight — WCAG AA contrast on light backgrounds', () => {
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
    it(`axe scan: no color-contrast violations on background ${bg}`, async () => {
      const { container } = render(
        <div style={{ background: bg, minHeight: 400 }}>
          <ProviderWrapper>
            <AnnouncementSpotlight
              id="spot-1"
              open
              strokeColor="auto"
              options={{ targetSelector: '#spot-target' }}
            />
          </ProviderWrapper>
        </div>
      )

      // Scope axe to the rendered surface; the spotlight portals to body, so
      // hand axe the document body to include both the wrapper background and
      // the portaled overlay/cutout/content.
      const results = await axe(document.body, {
        // The spotlight is dialog-shaped content rendered outside of a
        // landmark — that's by design (it sits above the page chrome). Skip
        // the `region` rule so it doesn't drown the contrast signal.
        rules: { region: { enabled: false } },
      })
      expect(results).toHaveNoViolations()
      expect(container).toBeTruthy()
    })
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
          strokeColor="auto"
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
