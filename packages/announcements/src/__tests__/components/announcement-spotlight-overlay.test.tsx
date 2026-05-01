import { fireEvent, render, screen } from '@testing-library/react'
import * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AnnouncementSpotlight } from '../../components/announcement-spotlight'
import { AnnouncementsProvider } from '../../context/announcements-provider'
import type { AnnouncementConfig } from '../../types/announcement'

const cfg: AnnouncementConfig = {
  id: 'spot-1',
  variant: 'spotlight',
  title: 'Spot',
  autoShow: false,
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <AnnouncementsProvider announcements={[cfg]} storage={null}>
      {children}
    </AnnouncementsProvider>
  )
}

describe('AnnouncementSpotlight overlay', () => {
  let target: HTMLElement

  beforeEach(() => {
    target = document.createElement('div')
    target.id = 'spot-target'
    document.body.appendChild(target)
  })

  afterEach(() => {
    target.remove()
  })

  it('renders the overlay as a button with closeOnOverlayClick=true', () => {
    render(
      <Wrapper>
        <AnnouncementSpotlight
          id="spot-1"
          open
          options={{ targetSelector: '#spot-target', closeOnOverlayClick: true }}
        />
      </Wrapper>
    )

    const overlay = screen.getByRole('button', { name: /close spotlight/i })
    expect(overlay.tagName).toBe('BUTTON')
    expect(overlay.getAttribute('type')).toBe('button')
  })

  it('dismisses on click when closeOnOverlayClick=true', () => {
    const onOpenChange = vi.fn()
    render(
      <Wrapper>
        <AnnouncementSpotlight
          id="spot-1"
          open
          onOpenChange={onOpenChange}
          options={{ targetSelector: '#spot-target', closeOnOverlayClick: true }}
        />
      </Wrapper>
    )

    fireEvent.click(screen.getByRole('button', { name: /close spotlight/i }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('dismisses on Enter key (native button activation) when closeOnOverlayClick=true', () => {
    const onOpenChange = vi.fn()
    render(
      <Wrapper>
        <AnnouncementSpotlight
          id="spot-1"
          open
          onOpenChange={onOpenChange}
          options={{ targetSelector: '#spot-target', closeOnOverlayClick: true }}
        />
      </Wrapper>
    )

    const overlay = screen.getByRole('button', { name: /close spotlight/i })
    // jsdom does not fire click on Enter automatically — call .click() to
    // mirror native button keyboard activation.
    overlay.focus()
    overlay.click()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('renders the overlay as an inert aria-hidden div with closeOnOverlayClick=false', () => {
    const { container } = render(
      <Wrapper>
        <AnnouncementSpotlight
          id="spot-1"
          open
          options={{ targetSelector: '#spot-target', closeOnOverlayClick: false }}
        />
      </Wrapper>
    )

    expect(screen.queryByRole('button', { name: /close spotlight/i })).toBeNull()
    const overlay = container.ownerDocument.querySelector('div[aria-hidden="true"]')
    expect(overlay).not.toBeNull()
    expect(overlay?.getAttribute('tabindex')).toBeNull()
    expect(overlay?.getAttribute('role')).toBeNull()
  })

  it('renders no overlay element when showOverlay=false', () => {
    render(
      <Wrapper>
        <AnnouncementSpotlight
          id="spot-1"
          open
          options={{ targetSelector: '#spot-target', showOverlay: false }}
        />
      </Wrapper>
    )

    expect(screen.queryByRole('button', { name: /close spotlight/i })).toBeNull()
    expect(document.querySelector('div[aria-hidden="true"]')).toBeNull()
  })
})
