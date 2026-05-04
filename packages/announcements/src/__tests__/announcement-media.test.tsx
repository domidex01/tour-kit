import { waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AnnouncementBanner } from '../components/announcement-banner'
import { AnnouncementModal } from '../components/announcement-modal'
import { AnnouncementSlideout } from '../components/announcement-slideout'
import { AnnouncementSpotlight } from '../components/announcement-spotlight'
import { AnnouncementToast } from '../components/announcement-toast'
import { AnnouncementsProvider } from '../context/announcements-provider'
import type { AnnouncementConfig, AnnouncementVariant } from '../types/announcement'
import { renderWithProviders } from './render-with-providers'

const SPOTLIGHT_TARGET_ID = '__spotlight-target__'

interface VariantSpec {
  name: AnnouncementVariant
  Component: React.ComponentType<{ id: string }>
}

const VARIANTS: ReadonlyArray<VariantSpec> = [
  { name: 'modal', Component: AnnouncementModal },
  { name: 'banner', Component: AnnouncementBanner },
  { name: 'toast', Component: AnnouncementToast },
  { name: 'slideout', Component: AnnouncementSlideout },
  { name: 'spotlight', Component: AnnouncementSpotlight },
]

function makeConfig(
  variant: AnnouncementVariant,
  overrides: Partial<AnnouncementConfig> = {}
): AnnouncementConfig {
  const base: AnnouncementConfig = {
    id: `announcement-${variant}-media`,
    variant,
    title: 'Demo',
    description: 'With media',
    toastOptions: { autoDismiss: false, showProgress: false },
    spotlightOptions: { targetSelector: `#${SPOTLIGHT_TARGET_ID}` },
  }
  return { ...base, ...overrides }
}

beforeEach(() => {
  const target = document.createElement('div')
  target.id = SPOTLIGHT_TARGET_ID
  document.body.appendChild(target)
})

afterEach(() => {
  const target = document.getElementById(SPOTLIGHT_TARGET_ID)
  if (target) target.remove()
})

describe.each(VARIANTS)('$name renders MediaSlot', ({ name, Component }) => {
  it('renders a YouTube iframe when media.src is a YouTube URL', async () => {
    const config = makeConfig(name, {
      media: { src: 'https://youtu.be/dQw4w9WgXcQ', alt: 'demo' },
    })
    renderWithProviders(
      <AnnouncementsProvider announcements={[config]}>
        <Component id={config.id} />
      </AnnouncementsProvider>
    )

    await waitFor(() => {
      const slots = document.querySelectorAll('[data-slot="announcement-media"]')
      expect(slots.length).toBeGreaterThan(0)
    })
    expect(document.querySelector('iframe')).not.toBeNull()
  })

  it('renders a native video when media.type === "video"', async () => {
    const config = makeConfig(name, {
      media: { type: 'video', src: '/clip.mp4', alt: 'clip' },
    })
    renderWithProviders(
      <AnnouncementsProvider announcements={[config]}>
        <Component id={config.id} />
      </AnnouncementsProvider>
    )

    await waitFor(() => {
      expect(document.querySelector('video')).not.toBeNull()
    })
  })

  it('renders no media slot when media is omitted', async () => {
    const config = makeConfig(name)
    renderWithProviders(
      <AnnouncementsProvider announcements={[config]}>
        <Component id={config.id} />
      </AnnouncementsProvider>
    )

    // wait for the announcement to render so absence is observable
    await waitFor(() => {
      // Ensure announcement rendered by looking for the title
      expect(document.body.textContent).toContain('Demo')
    })
    expect(document.querySelector('[data-slot="announcement-media"]')).toBeNull()
  })
})
