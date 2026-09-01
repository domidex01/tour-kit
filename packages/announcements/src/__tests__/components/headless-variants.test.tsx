import { fireEvent, render, screen } from '@testing-library/react'
import type * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { HeadlessBanner } from '../../components/headless/headless-banner'
import { HeadlessModal } from '../../components/headless/headless-modal'
import { HeadlessSlideout } from '../../components/headless/headless-slideout'
import { HeadlessSpotlight } from '../../components/headless/headless-spotlight'
import { AnnouncementsProvider } from '../../context/announcements-provider'
import type { AnnouncementConfig } from '../../types/announcement'

function renderWith(ui: React.ReactNode, announcements: AnnouncementConfig[]) {
  return render(
    <AnnouncementsProvider announcements={announcements} storage={null}>
      {ui}
    </AnnouncementsProvider>
  )
}

describe('HeadlessBanner', () => {
  const cfg: AnnouncementConfig = {
    id: 'b1',
    variant: 'banner',
    title: 'Banner title',
    autoShow: false,
    bannerOptions: { intent: 'warning', position: 'bottom' },
  }

  it('passes open/state/config + merged options to the render prop', () => {
    const seen: { open?: boolean; intent?: string; position?: string; role?: string } = {}
    renderWith(
      <HeadlessBanner id="b1" open options={{ intent: 'info' }}>
        {(props) => {
          seen.open = props.open
          seen.intent = props.options.intent
          seen.position = props.options.position
          seen.role = props.bannerProps.role
          return <div data-testid="banner">{String(props.config?.title)}</div>
        }}
      </HeadlessBanner>,
      [cfg]
    )

    expect(seen.open).toBe(true)
    // config.bannerOptions wins over the inline `options` prop
    expect(seen.intent).toBe('warning')
    expect(seen.position).toBe('bottom')
    expect(seen.role).toBe('alert')
    expect(screen.getByTestId('banner')).toHaveTextContent('Banner title')
  })

  it('dismiss() from the render prop dismisses the announcement and notifies onOpenChange', () => {
    const onOpenChange = vi.fn()
    renderWith(
      <HeadlessBanner id="b1" open onOpenChange={onOpenChange}>
        {(props) => (
          <button type="button" onClick={() => props.dismiss()}>
            close
          </button>
        )}
      </HeadlessBanner>,
      [cfg]
    )

    fireEvent.click(screen.getByText('close'))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('uncontrolled open reflects announcement visibility (closed by default)', () => {
    renderWith(
      <HeadlessBanner id="b1">
        {(props) => <div data-testid="banner-state">{props.open ? 'open' : 'closed'}</div>}
      </HeadlessBanner>,
      [cfg]
    )
    expect(screen.getByTestId('banner-state')).toHaveTextContent('closed')
  })
})

describe('HeadlessModal', () => {
  const cfg: AnnouncementConfig = {
    id: 'm1',
    variant: 'modal',
    title: 'Modal title',
    autoShow: false,
    modalOptions: { closeOnEscape: true, closeOnOverlayClick: true },
  }

  it('exposes contentProps/overlayProps and complete/close/dismiss handlers', () => {
    const seen: Record<string, unknown> = {}
    renderWith(
      <HeadlessModal id="m1" open>
        {(props) => {
          seen.role = props.contentProps.role
          seen.ariaModal = props.contentProps['aria-modal']
          seen.labelledBy = props.contentProps['aria-labelledby']
          return <div data-testid="modal">{String(props.config?.title)}</div>
        }}
      </HeadlessModal>,
      [cfg]
    )

    expect(seen.role).toBe('dialog')
    expect(seen.ariaModal).toBe(true)
    expect(seen.labelledBy).toBe('m1-title')
    expect(screen.getByTestId('modal')).toHaveTextContent('Modal title')
  })

  it('Escape key on contentProps dismisses when closeOnEscape is set', () => {
    const onOpenChange = vi.fn()
    renderWith(
      <HeadlessModal id="m1" open onOpenChange={onOpenChange}>
        {(props) => (
          // biome-ignore lint/a11y/useKeyWithClickEvents: test harness
          <div data-testid="modal-content" onKeyDown={props.contentProps.onKeyDown} tabIndex={-1}>
            content
          </div>
        )}
      </HeadlessModal>,
      [cfg]
    )

    fireEvent.keyDown(screen.getByTestId('modal-content'), { key: 'Escape' })
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('overlayProps.onClick dismisses (overlay_click) when closeOnOverlayClick is set', () => {
    const onOpenChange = vi.fn()
    renderWith(
      <HeadlessModal id="m1" open onOpenChange={onOpenChange}>
        {(props) => (
          // biome-ignore lint/a11y/useKeyWithClickEvents: test harness
          <div data-testid="overlay" onClick={props.overlayProps.onClick} />
        )}
      </HeadlessModal>,
      [cfg]
    )

    fireEvent.click(screen.getByTestId('overlay'))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('complete() triggers onOpenChange(false)', () => {
    const onOpenChange = vi.fn()
    renderWith(
      <HeadlessModal id="m1" open onOpenChange={onOpenChange}>
        {(props) => (
          <button type="button" onClick={props.complete}>
            done
          </button>
        )}
      </HeadlessModal>,
      [cfg]
    )

    fireEvent.click(screen.getByText('done'))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('controlled close() does not hide but still calls onOpenChange', () => {
    const onOpenChange = vi.fn()
    renderWith(
      <HeadlessModal id="m1" open onOpenChange={onOpenChange}>
        {(props) => (
          <button type="button" onClick={props.close}>
            x
          </button>
        )}
      </HeadlessModal>,
      [cfg]
    )

    fireEvent.click(screen.getByText('x'))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

describe('HeadlessSlideout', () => {
  const cfg: AnnouncementConfig = {
    id: 's1',
    variant: 'slideout',
    title: 'Slideout title',
    autoShow: false,
    slideoutOptions: { position: 'left', closeOnEscape: false },
  }

  it('merges options (config wins) and surfaces dialog content props', () => {
    const seen: Record<string, unknown> = {}
    renderWith(
      <HeadlessSlideout id="s1" open options={{ position: 'right' }}>
        {(props) => {
          seen.position = props.options.position
          seen.role = props.contentProps.role
          return <div data-testid="slideout">{String(props.config?.title)}</div>
        }}
      </HeadlessSlideout>,
      [cfg]
    )

    expect(seen.position).toBe('left')
    expect(seen.role).toBe('dialog')
    expect(screen.getByTestId('slideout')).toHaveTextContent('Slideout title')
  })

  it('Escape does NOT dismiss when closeOnEscape is false', () => {
    const onOpenChange = vi.fn()
    renderWith(
      <HeadlessSlideout id="s1" open onOpenChange={onOpenChange}>
        {(props) => (
          // biome-ignore lint/a11y/useKeyWithClickEvents: test harness
          <div
            data-testid="slideout-content"
            onKeyDown={props.contentProps.onKeyDown}
            tabIndex={-1}
          >
            content
          </div>
        )}
      </HeadlessSlideout>,
      [cfg]
    )

    fireEvent.keyDown(screen.getByTestId('slideout-content'), { key: 'Escape' })
    expect(onOpenChange).not.toHaveBeenCalled()
  })

  it('dismiss() with explicit reason notifies onOpenChange', () => {
    const onOpenChange = vi.fn()
    renderWith(
      <HeadlessSlideout id="s1" open onOpenChange={onOpenChange}>
        {(props) => (
          <button type="button" onClick={() => props.dismiss('secondary_action')}>
            no thanks
          </button>
        )}
      </HeadlessSlideout>,
      [cfg]
    )

    fireEvent.click(screen.getByText('no thanks'))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('close() and complete() both notify onOpenChange', () => {
    const onOpenChange = vi.fn()
    renderWith(
      <HeadlessSlideout id="s1" open onOpenChange={onOpenChange}>
        {(props) => (
          <>
            <button type="button" onClick={props.close}>
              close
            </button>
            <button type="button" onClick={props.complete}>
              complete
            </button>
          </>
        )}
      </HeadlessSlideout>,
      [cfg]
    )

    fireEvent.click(screen.getByText('close'))
    fireEvent.click(screen.getByText('complete'))
    expect(onOpenChange).toHaveBeenCalledTimes(2)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('overlayProps.onClick dismisses (overlay_click) when closeOnOverlayClick is set', () => {
    const onOpenChange = vi.fn()
    const cfgOverlay: AnnouncementConfig = {
      id: 's2',
      variant: 'slideout',
      title: 'Overlay slideout',
      autoShow: false,
      slideoutOptions: { closeOnOverlayClick: true },
    }
    renderWith(
      <HeadlessSlideout id="s2" open onOpenChange={onOpenChange}>
        {(props) => (
          // biome-ignore lint/a11y/useKeyWithClickEvents: test harness
          <div data-testid="s2-overlay" onClick={props.overlayProps.onClick} />
        )}
      </HeadlessSlideout>,
      [cfgOverlay]
    )

    fireEvent.click(screen.getByTestId('s2-overlay'))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

describe('HeadlessSpotlight', () => {
  const cfg: AnnouncementConfig = {
    id: 'sp1',
    variant: 'spotlight',
    title: 'Spotlight title',
    autoShow: false,
    spotlightOptions: { targetSelector: '#sp-target', offset: 16 },
  }

  let target: HTMLElement
  beforeEach(() => {
    target = document.createElement('div')
    target.id = 'sp-target'
    document.body.appendChild(target)
  })
  afterEach(() => {
    target.remove()
  })

  it('resolves the target element and exposes floating props + merged options', () => {
    const seen: Record<string, unknown> = {}
    renderWith(
      <HeadlessSpotlight id="sp1" open>
        {(props) => {
          seen.target = props.targetElement
          seen.offset = props.options.offset
          seen.role = props.contentProps.role
          seen.hasSetFloating = typeof props.setFloating === 'function'
          return <div data-testid="spotlight">{String(props.config?.title)}</div>
        }}
      </HeadlessSpotlight>,
      [cfg]
    )

    expect(seen.target).toBe(target)
    expect(seen.offset).toBe(16)
    expect(seen.role).toBe('dialog')
    expect(seen.hasSetFloating).toBe(true)
    expect(screen.getByTestId('spotlight')).toHaveTextContent('Spotlight title')
  })

  it('overlayProps.onClick dismisses on overlay click', () => {
    const onOpenChange = vi.fn()
    renderWith(
      <HeadlessSpotlight id="sp1" open onOpenChange={onOpenChange}>
        {(props) => (
          // biome-ignore lint/a11y/useKeyWithClickEvents: test harness
          <div data-testid="sp-overlay" onClick={props.overlayProps.onClick} />
        )}
      </HeadlessSpotlight>,
      [cfg]
    )

    fireEvent.click(screen.getByTestId('sp-overlay'))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('complete() and close() both notify onOpenChange', () => {
    const onOpenChange = vi.fn()
    renderWith(
      <HeadlessSpotlight id="sp1" open onOpenChange={onOpenChange}>
        {(props) => (
          <>
            <button type="button" onClick={props.complete}>
              complete
            </button>
            <button type="button" onClick={props.close}>
              close
            </button>
          </>
        )}
      </HeadlessSpotlight>,
      [cfg]
    )

    fireEvent.click(screen.getByText('complete'))
    fireEvent.click(screen.getByText('close'))
    expect(onOpenChange).toHaveBeenCalledTimes(2)
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
