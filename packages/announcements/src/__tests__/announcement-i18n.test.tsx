import { render, screen, waitFor } from '@testing-library/react'
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
    id: `announcement-${variant}`,
    variant,
    title: 'Default title',
    description: 'Default description',
    // Disable toast auto-dismiss so the timer never fires during the test
    toastOptions: { autoDismiss: false, showProgress: false },
    spotlightOptions: { targetSelector: `#${SPOTLIGHT_TARGET_ID}` },
  }
  return { ...base, ...overrides }
}

beforeEach(() => {
  // Spotlight queries `document.querySelector(targetSelector)` for its anchor.
  const target = document.createElement('div')
  target.id = SPOTLIGHT_TARGET_ID
  document.body.appendChild(target)
})

afterEach(() => {
  const target = document.getElementById(SPOTLIGHT_TARGET_ID)
  if (target) target.remove()
})

describe.each(VARIANTS)('$name i18n', ({ name, Component }) => {
  it('interpolates {{user.name}} from userContext into a string title', async () => {
    const config = makeConfig(name, { title: 'Hi {{user.name | there}}' })
    renderWithProviders(
      <AnnouncementsProvider announcements={[config]}>
        <Component id={config.id} />
      </AnnouncementsProvider>,
      { userContext: { user: { name: 'Domi' } } }
    )

    await waitFor(() => {
      expect(screen.getByText(/Hi Domi/)).toBeInTheDocument()
    })
  })

  it('resolves an i18n key title via the messages dictionary', async () => {
    const config = makeConfig(name, { title: { key: 'announcement.welcome.title' } })
    renderWithProviders(
      <AnnouncementsProvider announcements={[config]}>
        <Component id={config.id} />
      </AnnouncementsProvider>,
      { messages: { 'announcement.welcome.title': 'Hello there' } }
    )

    await waitFor(() => {
      expect(screen.getByText('Hello there')).toBeInTheDocument()
    })
  })

  it('interpolates the description with userContext vars', async () => {
    const config = makeConfig(name, {
      title: 'Title',
      description: 'Welcome {{user.name | friend}}',
    })
    renderWithProviders(
      <AnnouncementsProvider announcements={[config]}>
        <Component id={config.id} />
      </AnnouncementsProvider>,
      { userContext: { user: { name: 'Ada' } } }
    )

    await waitFor(() => {
      expect(screen.getByText(/Welcome Ada/)).toBeInTheDocument()
    })
  })

  it('falls back to the literal string when no LocaleProvider is mounted', async () => {
    // Render WITHOUT renderWithProviders — bare render, no LocaleProvider/SegmentationProvider
    // in scope. interpolate() with no vars + no `{{x}}` tokens returns the input unchanged.
    const config = makeConfig(name, {
      title: 'Plain title',
      description: 'Plain description',
    })
    render(
      <AnnouncementsProvider announcements={[config]}>
        <Component id={config.id} />
      </AnnouncementsProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Plain title')).toBeInTheDocument()
    })
  })
})

// ReactNode descriptions only render losslessly in modal / slideout / spotlight
// (banner / toast wrap description in <span> / <div> which collapse JSX
// children when given a fragment, so they render but without preserving tag
// structure as cleanly). Mirror the test plan's narrower scope here.
describe('description ReactNode passthrough', () => {
  it.each([
    { name: 'modal' as const, Component: AnnouncementModal },
    { name: 'slideout' as const, Component: AnnouncementSlideout },
    { name: 'spotlight' as const, Component: AnnouncementSpotlight },
  ])('$name renders ReactNode descriptions unchanged', async ({ name, Component }) => {
    const config = makeConfig(name, {
      title: 'Title',
      description: <strong data-testid="rn-body">Body</strong>,
    })
    renderWithProviders(
      <AnnouncementsProvider announcements={[config]}>
        <Component id={config.id} />
      </AnnouncementsProvider>
    )

    await waitFor(() => {
      const node = screen.getByTestId('rn-body')
      expect(node.tagName).toBe('STRONG')
      expect(node).toHaveTextContent('Body')
    })
  })
})
